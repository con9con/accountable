import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../_auth.js';
import { payments, accounts, balanceHistory } from '../../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { userId, db } = auth;

  // GET /api/payments — list all payments
  if (req.method === 'GET') {
    const rows = await db.query.payments.findMany({
      where: eq(payments.userId, userId),
      orderBy: (p, { desc }) => [desc(p.date), desc(p.createdAt)],
    });
    return res.json(rows);
  }

  // POST /api/payments — record a payment
  if (req.method === 'POST') {
    const body = req.body as {
      id: string; accountId: string; amount: number; date: string; note?: string;
    };

    // Verify account belongs to user
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, body.accountId),
    });
    if (!account || account.userId !== userId) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Insert payment
    await db.insert(payments).values({
      id: body.id,
      userId,
      accountId: body.accountId,
      amount: String(body.amount),
      date: body.date,
      note: body.note ?? null,
    });

    // Update account balance
    const newBalance = Math.max(0, Number(account.totalDue) - body.amount);

    // Advance due date by one month
    let newDueDate = account.dueDate;
    if (account.dueDate) {
      const d = new Date(account.dueDate + 'T00:00:00');
      d.setMonth(d.getMonth() + 1);
      newDueDate = d.toISOString().split('T')[0];
    }

    await db.update(accounts)
      .set({
        totalDue: String(newBalance),
        dueDate: newDueDate,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, body.accountId));

    // Record balance history
    await db.insert(balanceHistory).values({
      id: crypto.randomUUID(),
      accountId: body.accountId,
      date: body.date,
      balance: String(newBalance),
    });

    const created = await db.query.payments.findFirst({
      where: eq(payments.id, body.id),
    });
    return res.status(201).json(created);
  }

  res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[payments]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
