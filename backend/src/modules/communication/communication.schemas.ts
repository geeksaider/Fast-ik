import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid() });

const attachmentSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  fileUrl: z.string().trim().min(1).max(350_000),
  mimeType: z.string().trim().min(1).max(120).nullable().optional(),
  sizeBytes: z.number().int().min(0).max(262_144),
});

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(4000).optional().default(''),
    attachments: z.array(attachmentSchema).max(3).optional().default([]),
  })
  .refine((value) => value.body.length > 0 || value.attachments.length > 0, {
    message: 'Сообщение или файл обязательны',
    path: ['body'],
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
