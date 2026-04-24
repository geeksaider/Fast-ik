import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid() });

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
