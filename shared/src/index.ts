export const userRoles = [
  'guest',
  'customer',
  'performer',
  'support',
  'moderator',
  'admin',
  'super_admin',
] as const;

export type UserRole = (typeof userRoles)[number];

export const orderStatuses = [
  'draft',
  'published',
  'in_progress',
  'review',
  'completed',
  'cancelled',
  'disputed',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const performerLevelCodes = [
  'newcomer',
  'builder',
  'verified',
  'reliable',
  'pro',
  'elite',
] as const;

export type PerformerLevelCode = (typeof performerLevelCodes)[number];
