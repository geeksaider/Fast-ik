import { z } from 'zod';

export const selfRegisterRoles = ['customer', 'performer'] as const;

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(160)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(100),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(selfRegisterRoles),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(160)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
