import type { PerformerLevel, PerformerProgressRow } from '../levels/levels.types.js';
import type {
  BaseProfile,
  PerformerProfile,
  PortfolioItem,
  UserSkill,
} from '../profile/profile.types.js';

export type PublicPerformerUser = {
  id: string;
  displayName: string;
  status: string;
  createdAt: string;
};

export type PublicPerformerStats = {
  applicationsCount: number;
  selectedApplicationsCount: number;
  completedOrdersCount: number;
  reviewsCount: number;
  averageRating: number | null;
};

export type PublicPerformerReview = {
  id: string;
  orderId: string;
  orderTitle: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PublicPerformerProfile = {
  user: PublicPerformerUser;
  profile: BaseProfile | null;
  performerProfile: PerformerProfile | null;
  skills: UserSkill[];
  portfolio: PortfolioItem[];
  progress: PerformerProgressRow | null;
  currentLevel: PerformerLevel | null;
  stats: PublicPerformerStats;
  reviews: PublicPerformerReview[];
};

export type PublicPerformerListItem = {
  user: PublicPerformerUser;
  profile: BaseProfile | null;
  performerProfile: PerformerProfile | null;
  skills: UserSkill[];
  progress: PerformerProgressRow | null;
  currentLevel: PerformerLevel | null;
  stats: PublicPerformerStats;
};
