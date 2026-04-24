const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4200/api';

export type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
};

export type AuthRole = 'customer' | 'performer' | 'support' | 'moderator' | 'admin' | 'super_admin';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: AuthRole;
  status?: 'active' | 'blocked';
  emailVerified?: boolean;
  lastLoginAt?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  role: 'customer' | 'performer';
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type BaseProfile = {
  userId: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  telegram: string | null;
  preferredLanguage: 'ru' | 'en';
};

export type CustomerProfile = {
  userId: string;
  companyName: string | null;
  companySite: string | null;
  companyDescription: string | null;
  projectBudgetMin: number | null;
  projectBudgetMax: number | null;
  moderationStatus: string;
};

export type PerformerProfile = {
  userId: string;
  headline: string | null;
  hourlyRate: number | null;
  availability: 'part_time' | 'full_time' | 'project';
  experienceYears: number | null;
  specialization: string | null;
  onboardingCompleted: boolean;
};

export type SkillOption = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export type UserSkill = SkillOption & {
  level: 'junior' | 'middle' | 'senior';
};

export type PortfolioItem = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  projectUrl: string | null;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingStep = {
  code: string;
  title: string;
  description: string;
  completed: boolean;
  xp: number;
};

export type ProfileProgress = {
  percentage: number;
  completedSteps: number;
  totalSteps: number;
  earnedXp: number;
  steps: OnboardingStep[];
};

export type ProfileSummary = {
  user: AuthUser;
  profile: BaseProfile | null;
  customerProfile: CustomerProfile | null;
  performerProfile: PerformerProfile | null;
  skills: UserSkill[];
  portfolio: PortfolioItem[];
  progress: ProfileProgress;
};

export type ProfileUpdatePayload = {
  bio?: string;
  city?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  telegram?: string;
  preferredLanguage?: 'ru' | 'en';
  customer?: {
    companyName?: string;
    companySite?: string;
    companyDescription?: string;
    projectBudgetMin?: number | null;
    projectBudgetMax?: number | null;
  };
  performer?: {
    headline?: string;
    hourlyRate?: number | null;
    availability?: 'part_time' | 'full_time' | 'project';
    experienceYears?: number | null;
    specialization?: string;
  };
};

export type PortfolioPayload = {
  title: string;
  description?: string;
  projectUrl?: string;
  coverUrl?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? 'Fastik API error', response.status);
  }

  return data as T;
};

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getHealth = async () => apiFetch<HealthStatus>('/health');

export const registerUser = async (payload: RegisterPayload) =>
  apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = async (payload: LoginPayload) =>
  apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCurrentUser = async (token: string) =>
  apiFetch<{ user: AuthUser }>('/auth/me', {
    headers: authHeaders(token),
  });

export const getMyProfile = async (token: string) =>
  apiFetch<ProfileSummary>('/profile/me', {
    headers: authHeaders(token),
  });

export const updateMyProfile = async (token: string, payload: ProfileUpdatePayload) =>
  apiFetch<ProfileSummary>('/profile/me', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export const getSkillOptions = async (token: string) =>
  apiFetch<{ skills: SkillOption[] }>('/profile/options/skills', {
    headers: authHeaders(token),
  });

export const updateMySkills = async (
  token: string,
  payload: { skills: Array<{ skillId: string; level: UserSkill['level'] }> },
) =>
  apiFetch<ProfileSummary>('/profile/me/skills', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export const createPortfolioItem = async (token: string, payload: PortfolioPayload) =>
  apiFetch<ProfileSummary>('/profile/me/portfolio', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export const deletePortfolioItem = async (token: string, id: string) =>
  apiFetch<ProfileSummary>(`/profile/me/portfolio/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type JobStatus = 'published' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type JobListItem = {
  id: string;
  customerId: string;
  customerName: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deadlineAt: string | null;
  status: JobStatus;
  moderationStatus: string;
  applicationsCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type JobApplication = {
  id: string;
  jobId: string;
  performerId: string;
  performerName: string;
  coverLetter: string;
  price: number | null;
  deliveryDays: number | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobDetail = JobListItem & {
  applications: JobApplication[];
  canApply: boolean;
  canManage: boolean;
  myApplication: JobApplication | null;
};

export type JobCreatePayload = {
  categoryId?: string | null;
  title: string;
  description: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  deadlineAt?: string | null;
  tags?: string[];
};

export type ApplicationCreatePayload = {
  coverLetter: string;
  price?: number | null;
  deliveryDays?: number | null;
};

export const getMarketplaceCategories = async () =>
  apiFetch<{ categories: MarketplaceCategory[] }>('/marketplace/categories');

export const getMarketplaceJobs = async (
  params: { category?: string; search?: string; mine?: boolean } = {},
) => {
  const query = new URLSearchParams();

  if (params.category) {
    query.set('category', params.category);
  }

  if (params.search) {
    query.set('search', params.search);
  }

  if (params.mine) {
    query.set('mine', 'true');
  }

  return apiFetch<{ jobs: JobListItem[] }>(`/marketplace/jobs${query.size ? `?${query}` : ''}`);
};

export const createJob = async (token: string, payload: JobCreatePayload) =>
  apiFetch<JobDetail>('/marketplace/jobs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export const getMarketplaceJob = async (id: string, token?: string | null) =>
  apiFetch<JobDetail>(`/marketplace/jobs/${id}`, {
    headers: token ? authHeaders(token) : undefined,
  });

export const applyToMarketplaceJob = async (
  token: string,
  id: string,
  payload: ApplicationCreatePayload,
) =>
  apiFetch<JobDetail>(`/marketplace/jobs/${id}/applications`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export const selectJobApplication = async (token: string, jobId: string, applicationId: string) =>
  apiFetch<JobDetail>(`/marketplace/jobs/${jobId}/applications/${applicationId}/select`, {
    method: 'POST',
    headers: authHeaders(token),
  });

export type Wallet = {
  userId: string;
  availableBalance: number;
  heldBalance: number;
  currency: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  orderId: string | null;
  escrowHoldId: string | null;
  type: string;
  direction: 'in' | 'out' | 'hold' | 'release';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};

export type OrderStatus = 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'disputed';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';

export type OrderListItem = {
  id: string;
  jobId: string;
  applicationId: string;
  customerId: string;
  customerName: string;
  performerId: string;
  performerName: string;
  title: string;
  amount: number;
  status: OrderStatus;
  workResult: string | null;
  escrowStatus: EscrowStatus | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  disputedAt: string | null;
};

export type OrderStatusHistoryItem = {
  id: string;
  orderId: string;
  status: OrderStatus;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
};

export type OrderDetail = OrderListItem & {
  statusHistory: OrderStatusHistoryItem[];
};

export const getFinanceSummary = async (token: string) =>
  apiFetch<{ wallet: Wallet; transactions: Transaction[] }>('/finance/me', {
    headers: authHeaders(token),
  });

export const topUpWallet = async (token: string, amount: number) =>
  apiFetch<{ wallet: Wallet; transactions: Transaction[] }>('/finance/top-up', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ amount }),
  });

export const getOrders = async (token: string) =>
  apiFetch<{ orders: OrderListItem[] }>('/orders', {
    headers: authHeaders(token),
  });

export const getOrder = async (token: string, id: string) =>
  apiFetch<OrderDetail>(`/orders/${id}`, {
    headers: authHeaders(token),
  });

export const submitOrder = async (token: string, id: string, workResult: string) =>
  apiFetch<OrderDetail>(`/orders/${id}/submit`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ workResult }),
  });

export const acceptOrder = async (token: string, id: string) =>
  apiFetch<OrderDetail>(`/orders/${id}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  });

export const disputeOrder = async (token: string, id: string, reason: string) =>
  apiFetch<OrderDetail>(`/orders/${id}/dispute`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });

export const cancelOrder = async (token: string, id: string, reason: string) =>
  apiFetch<OrderDetail>(`/orders/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });
