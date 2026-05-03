import type { BaseProfile, CustomerProfile } from '../profile/profile.types.js';

export type PublicCustomerUser = {
  id: string;
  displayName: string;
  status: string;
  createdAt: string;
};

export type PublicCustomerStats = {
  publishedJobsCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  contestsCount: number;
  reviewsGivenCount: number;
  totalEscrowHeld: number;
  totalSpentAmount: number;
};

export type PublicCustomerListItem = {
  user: PublicCustomerUser;
  profile: BaseProfile | null;
  customerProfile: CustomerProfile | null;
  stats: PublicCustomerStats;
};

export type PublicCustomerJob = {
  id: string;
  title: string;
  categoryName: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deadlineAt: string | null;
  status: string;
  applicationsCount: number;
  createdAt: string;
};

export type PublicCustomerContest = {
  id: string;
  title: string;
  categoryName: string | null;
  requiredLevelTitle: string;
  prizeAmount: number;
  deadlineAt: string | null;
  status: string;
  submissionsCount: number;
  createdAt: string;
};

export type PublicCustomerProfile = PublicCustomerListItem & {
  jobs: PublicCustomerJob[];
  contests: PublicCustomerContest[];
};
