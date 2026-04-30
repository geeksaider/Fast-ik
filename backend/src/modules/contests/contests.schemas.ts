import { z } from 'zod';

const tagSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Zа-яА-Я0-9\-\s]+$/u)
  .transform((value) => value.toLowerCase().replaceAll(' ', '-'));

export const contestListQuerySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

export const contestCreateSchema = z.object({
  categoryId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  requiredLevelCode: z
    .enum(['newcomer', 'builder', 'verified', 'reliable', 'pro', 'elite'])
    .default('builder'),
  title: z.string().trim().min(8).max(140),
  brief: z.string().trim().min(30).max(5000),
  prizeAmount: z.number().int().min(0).max(50_000_000),
  deadlineAt: z
    .string()
    .date()
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  tags: z.array(tagSchema).max(8).optional().default([]),
});

export const contestSubmissionCreateSchema = z.object({
  pitch: z.string().trim().min(30).max(3000),
  previewUrl: z
    .string()
    .trim()
    .url()
    .max(600)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const selectContestSubmissionParamsSchema = z.object({
  contestId: z.string().uuid(),
  submissionId: z.string().uuid(),
});

export type ContestListQuery = z.infer<typeof contestListQuerySchema>;
export type ContestCreateInput = z.infer<typeof contestCreateSchema>;
export type ContestSubmissionCreateInput = z.infer<typeof contestSubmissionCreateSchema>;
