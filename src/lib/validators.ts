import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['credit_card', 'car_loan', 'personal_loan']),
  totalDue: z.coerce.number().min(0, 'Must be 0 or greater'),
  minimumDue: z.coerce.number().min(0, 'Must be 0 or greater'),
  interestRate: z.coerce.number().min(0).max(100, 'Must be between 0 and 100'),
  dueDate: z.string().optional(),
  originalBalance: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export const paymentSchema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
