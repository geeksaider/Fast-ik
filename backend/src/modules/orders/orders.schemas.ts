import { z } from 'zod';

export const orderIdParamSchema = z.object({ id: z.string().uuid() });

export const submitOrderSchema = z.object({
  workResult: z.string().trim().min(20).max(3000),
});

export const disputeOrderSchema = z.object({
  reason: z.string().trim().min(10).max(1200),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(5).max(1200).optional(),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
export type DisputeOrderInput = z.infer<typeof disputeOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
