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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100),
});

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .email()
    .max(160)
    .transform((email) => email.toLowerCase()),
  currentPassword: z.string().min(1).max(100),
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1).max(100),
});

const notificationChannel = z.object({
  messages: z.boolean(),
  applications: z.boolean(),
  orders: z.boolean(),
  marketing: z.boolean().optional(),
});

export const notificationSettingsSchema = z.object({
  email: notificationChannel,
  inApp: notificationChannel.omit({ marketing: true }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
