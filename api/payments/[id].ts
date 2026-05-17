import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../_auth.js';
import { payments } from '../../src/db/schema.js';

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
