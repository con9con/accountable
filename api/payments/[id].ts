import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../_auth.js';
import { payments, accounts } from '../../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { userId, db } = auth;

  const id = req.query.id as string;

  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.id, id), eq(payments.userId, userId)),
  });
  if (!payment) return res.status(404).json({ error: 'Not found' });

  // PATCH /api/payments/:id — edit amount, date, note
  if (req.method === 'PATCH') {
    const body = req.body as { amount?: number; date?: string; note?: string };

    if (body.amount !== undefined) {
      const oldAmount = Number(payment.amount);
      const newAmount = body.amount;
      const delta = oldAmount - newAmount; // positive = balance goes up (undoing overpayment)

      const account = await db.query.accounts.findFirst({ where: eq(accounts.id, payment.accountId) });
      if (account) {
        const newBalance = Math.max(0, Number(account.totalDue) + delta);
        await db.update(accounts).set({ totalDue: String(newBalance), updatedAt: new Date() }).where(eq(accounts.id, payment.accountId));
      }
    }

    await db.update(payments)
      .set({
        ...(body.amount !== undefined && { amount: String(body.amount) }),
        ...(body.date !== undefined && { date: body.date }),
        ...(body.note !== undefined && { note: body.note }),
      })
      .where(eq(payments.id, id));

    const updated = await db.query.payments.findFirst({ where: eq(payments.id, id) });
    return res.json(updated);
  }

  // DELETE /api/payments/:id
  if (req.method === 'DELETE') {
    await db.delete(payments).where(eq(payments.id, id));
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[payments/id]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
