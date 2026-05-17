import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../_auth.js';
import { accounts, balanceHistory } from '../../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { userId, db } = auth;

  const id = req.query.id as string;

  // Verify ownership
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, userId)),
  });
  if (!account) return res.status(404).json({ error: 'Not found' });

  // PATCH /api/accounts/:id — update account
  if (req.method === 'PATCH') {
    const body = req.body as {
      name?: string; issuer?: string; totalDue?: number; minimumDue?: number;
      interestRate?: number; dueDate?: string; originalBalance?: number; notes?: string;
      type?: string;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.issuer !== undefined) updates.issuer = body.issuer;
    if (body.type !== undefined) updates.type = body.type;
    if (body.totalDue !== undefined) updates.totalDue = String(body.totalDue);
    if (body.minimumDue !== undefined) updates.minimumDue = String(body.minimumDue);
    if (body.interestRate !== undefined) updates.interestRate = String(body.interestRate);
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.originalBalance !== undefined) updates.originalBalance = String(body.originalBalance);
    if (body.notes !== undefined) updates.notes = body.notes;

    await db.update(accounts).set(updates).where(eq(accounts.id, id));

    // Record balance history entry when balance changes
    if (body.totalDue !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      await db.insert(balanceHistory).values({
        id: crypto.randomUUID(),
        accountId: id,
        date: today,
        balance: String(body.totalDue),
      });
    }

    const updated = await db.query.accounts.findFirst({
      where: eq(accounts.id, id),
      with: { balanceHistory: true },
    });
    return res.json(updated);
  }

  // DELETE /api/accounts/:id
  if (req.method === 'DELETE') {
    await db.delete(accounts).where(eq(accounts.id, id));
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[accounts/id]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
