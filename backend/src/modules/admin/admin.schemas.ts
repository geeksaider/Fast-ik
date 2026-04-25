import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid() });

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'blocked']),
  note: z.string().trim().min(5).max(800).optional(),
});

export const moderateJobSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().trim().min(5).max(800).optional(),
});

export const resolveDisputeSchema = z.object({
  action: z.enum(['refund_customer', 'pay_performer']),
  note: z.string().trim().min(10).max(1200),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ModerateJobInput = z.infer<typeof moderateJobSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
