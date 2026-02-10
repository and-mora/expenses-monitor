import { z } from 'zod';
import type { Tag } from '@/types/api';

export const paymentSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required').max(100),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().min(1, 'Category is required').max(50, 'Category name is too long'),
  accountingDate: z.date({ message: 'Date is required' }),
  description: z.string().max(500).optional(),
  wallet: z.string().min(1, 'Wallet is required'),
  isExpense: z.boolean(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export interface PaymentSubmitData {
  merchantName: string;
  amountInCents: number;
  categoryId: string;
  accountingDate: string;
  description?: string;
  wallet: string;
  tags?: Tag[];
}
