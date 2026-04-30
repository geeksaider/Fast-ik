import type { AuthUser } from '../auth/auth.types.js';
import type { EscrowStatus, OrderStatus } from '../orders/orders.types.js';
import type { JobStatus } from '../marketplace/marketplace.types.js';

export type AdminPermission =
  | 'overview'
  | 'users'
  | 'moderation'
  | 'disputes'
  | 'interviews'
  | 'auditLog';

export type AdminOverview = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    pendingJobs: number;
    openDisputes: number;
    interviewRequests: number;
    activeOrders: number;
    escrowHeldAmount: number;
  };
  permissions: AdminPermission[];
  recentActions: AdminActionItem[];
};

export type AdminUserItem = {
  id: string;
  email: string;
  displayName: string;
  role: AuthUser['role'];
  status: string;
  emailVerified: boolean;
  availableBalance: number;
  heldBalance: number;
  performerXp: number | null;
  performerLevelTitle: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type AdminDisputeItem = {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  performerId: string;
  performerName: string;
  title: string;
  amount: number;
  status: OrderStatus;
  escrowStatus: EscrowStatus | null;
  disputeReason: string | null;
  createdAt: string;
  disputedAt: string | null;
};

export type AdminModerationJobItem = {
  id: string;
  customerId: string;
  customerName: string;
  categoryName: string | null;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: JobStatus;
  moderationStatus: string;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminInterviewItem = {
  userId: string;
  email: string;
  displayName: string;
  status: string;
  headline: string | null;
  specialization: string | null;
  xp: number;
  completedOrders: number;
  rating: number | null;
  interviewRequired: boolean;
  interviewPassed: boolean;
  levelCode: string | null;
  levelTitle: string | null;
  eliteRequiredXp: number;
  latestInterviewStatus: 'passed' | 'failed' | null;
  latestInterviewNote: string | null;
  latestInterviewAt: string | null;
};

export type AdminActionItem = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: AuthUser['role'] | null;
  targetType: string;
  targetId: string | null;
  action: string;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ResolveDisputeResult = {
  orderId: string;
  performerId: string;
  title: string;
  action: 'refund_customer' | 'pay_performer';
};
