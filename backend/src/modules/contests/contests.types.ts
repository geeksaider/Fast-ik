export type ContestStatus = 'open' | 'review' | 'completed' | 'cancelled';
export type ContestSubmissionStatus = 'submitted' | 'winner' | 'rejected';

export type ContestListItem = {
  id: string;
  customerId: string;
  customerName: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  requiredLevelId: number;
  requiredLevelCode: string;
  requiredLevelTitle: string;
  requiredLevelSortOrder: number;
  title: string;
  brief: string;
  prizeAmount: number;
  deadlineAt: string | null;
  status: ContestStatus;
  submissionsCount: number;
  winnerSubmissionId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ContestSubmission = {
  id: string;
  contestId: string;
  performerId: string;
  performerName: string;
  pitch: string;
  previewUrl: string | null;
  status: ContestSubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContestLevelGate = {
  allowed: boolean;
  requiredLevelTitle: string;
  requiredLevelSortOrder: number;
  performerLevelTitle: string | null;
  performerLevelSortOrder: number | null;
};

export type ContestDetail = ContestListItem & {
  submissions: ContestSubmission[];
  canSubmit: boolean;
  canManage: boolean;
  mySubmission: ContestSubmission | null;
  levelGate: ContestLevelGate | null;
};
