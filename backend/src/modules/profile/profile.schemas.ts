import { z } from 'zod';

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const nullableUrl = z
  .string()
  .trim()
  .url()
  .max(240)
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : null));

const nullableImageSource = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      if (value.length <= 240) {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }

      return value.length <= 2_000_000 && /^data:image\/(png|jpe?g|webp);base64,/i.test(value);
    },
    'Некорректное изображение',
  )
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : null));

const nullableNumber = (max: number) =>
  z
    .number()
    .int()
    .min(0)
    .max(max)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

export const profileUpdateSchema = z.object({
  bio: nullableText(700),
  city: nullableText(80),
  avatarUrl: nullableImageSource,
  websiteUrl: nullableUrl,
  telegram: nullableText(80),
  preferredLanguage: z.enum(['ru', 'en']).optional().default('ru'),
  customer: z
    .object({
      companyName: nullableText(120),
      companySite: nullableUrl,
      companyDescription: nullableText(700),
      projectBudgetMin: nullableNumber(10_000_000),
      projectBudgetMax: nullableNumber(10_000_000),
    })
    .optional(),
  performer: z
    .object({
      headline: nullableText(140),
      hourlyRate: nullableNumber(500_000),
      availability: z.enum(['part_time', 'full_time', 'project']).optional().default('part_time'),
      experienceYears: nullableNumber(60),
      specialization: nullableText(120),
    })
    .optional(),
});

export const skillLevelSchema = z.enum(['junior', 'middle', 'senior']);

export const replaceSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        level: skillLevelSchema.default('middle'),
      }),
    )
    .max(12),
});

export const portfolioCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: nullableText(900),
  projectUrl: nullableUrl,
  coverUrl: nullableUrl,
});

export const portfolioUpdateSchema = portfolioCreateSchema.partial();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>;
export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>;
export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
