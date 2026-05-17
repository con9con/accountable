import { createClerkClient, verifyToken } from '@clerk/backend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../src/db/index.js';
import { users } from '../src/db/schema.js';

export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  let payload;
  try {
    payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      jwtKey: process.env.CLERK_JWT_KEY,
      authorizedParties: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://accountable-ten.vercel.app',
      ],
    });
  } catch (err) {
    console.error('[auth] verifyToken failed:', err);
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }

  const userId = payload.sub;

  const db = getDb();

  // Upsert user row — best effort, don't block on failure
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.getUser(userId);
    await db
      .insert(users)
      .values({
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error('[auth] user upsert failed (non-fatal):', err);
  }

  return { userId, db };
}
