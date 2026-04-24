import { z } from 'zod';

export const topUpSchema = z.object({
  amount: z.number().int().min(100).max(5_000_000),
});

export type TopUpInput = z.infer<typeof topUpSchema>;
