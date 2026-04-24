import { z } from 'zod';

const nullableNumber = (max: number) =>
  z
    .number()
    .int()
    .min(0)
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const tagSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Zа-яА-Я0-9\-\s]+$/u)
  .transform((value) => value.toLowerCase().replaceAll(' ', '-'));

export const jobListQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

export const jobCreateSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(6).max(140),
    description: z.string().trim().min(20).max(4000),
    budgetMin: nullableNumber(50_000_000),
    budgetMax: nullableNumber(50_000_000),
    deadlineAt: z
      .string()
      .date()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    tags: z.array(tagSchema).max(8).optional().default([]),
  })
  .refine((value) => !value.budgetMin || !value.budgetMax || value.budgetMin <= value.budgetMax, {
    path: ['budgetMax'],
    message: 'Максимальный бюджет не может быть меньше минимального',
  });

export const applicationCreateSchema = z.object({
  coverLetter: z.string().trim().min(20).max(2000),
  price: nullableNumber(50_000_000),
  deliveryDays: nullableNumber(365),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const selectApplicationParamsSchema = z.object({
  jobId: z.string().uuid(),
  applicationId: z.string().uuid(),
});

export type JobListQuery = z.infer<typeof jobListQuerySchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
