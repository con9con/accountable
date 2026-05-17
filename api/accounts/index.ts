import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../_auth.js';
import { accounts, balanceHistory } from '../../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { userId, db } = auth;

  // GET /api/accounts — list all accounts with balance history
  if (req.method === 'GET') {
    const rows = await db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
      with: { balanceHistory: true },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
    return res.json(rows);
  }

  // POST /api/accounts — create account
  if (req.method === 'POST') {
    const body = req.body as {
      id: string; type: string; name: string; issuer?: string;
      totalDue: number; minimumDue: number; interestRate: number;
      dueDate?: string; originalBalance?: number; notes?: string;
    };

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    await db.insert(accounts).values({
      id: body.id,
      userId,
      type: body.type,
      name: body.name,
      issuer: body.issuer ?? null,
      totalDue: String(body.totalDue),
      minimumDue: String(body.minimumDue),
      interestRate: String(body.interestRate),
      dueDate: body.dueDate ?? null,
      originalBalance: String(body.originalBalance ?? body.totalDue),
      notes: body.notes ?? null,
    });

    await db.insert(balanceHistory).values({
      id: crypto.randomUUID(),
      accountId: body.id,
      date: today,
      balance: String(body.totalDue),
    });

    const created = await db.query.accounts.findFirst({
      where: eq(accounts.id, body.id),
      with: { balanceHistory: true },
    });
    return res.status(201).json(created);
  }

  res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[accounts]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
