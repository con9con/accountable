import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  issuer: text('issuer'),
  totalDue: numeric('total_due', { precision: 12, scale: 2 }).notNull(),
  minimumDue: numeric('minimum_due', { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric('interest_rate', { precision: 6, scale: 3 }).notNull(),
  dueDate: text('due_date'),
  originalBalance: numeric('original_balance', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const balanceHistory = pgTable('balance_history', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  payments: many(payments),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  payments: many(payments),
  balanceHistory: many(balanceHistory),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  account: one(accounts, { fields: [payments.accountId], references: [accounts.id] }),
}));

export const balanceHistoryRelations = relations(balanceHistory, ({ one }) => ({
  account: one(accounts, { fields: [balanceHistory.accountId], references: [accounts.id] }),
}));

export type DbUser = typeof users.$inferSelect;
export type DbAccount = typeof accounts.$inferSelect;
export type DbPayment = typeof payments.$inferSelect;
export type DbBalanceHistory = typeof balanceHistory.$inferSelect;
