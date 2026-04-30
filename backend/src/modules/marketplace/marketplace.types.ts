export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type JobStatus = 'published' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type JobInviteStatus = 'pending' | 'accepted' | 'declined';

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

export type JobInvite = {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  performerId: string;
  performerName: string;
  message: string;
  status: JobInviteStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobDetail = JobListItem & {
  applications: JobApplication[];
  invites: JobInvite[];
  canApply: boolean;
  canManage: boolean;
  myApplication: JobApplication | null;
  myInvite: JobInvite | null;
};
