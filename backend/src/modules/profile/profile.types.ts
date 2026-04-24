import type { AuthUser } from '../auth/auth.types.js';

export type BaseProfile = {
  userId: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  telegram: string | null;
  preferredLanguage: string;
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
  availability: string;
  experienceYears: number | null;
  specialization: string | null;
  onboardingCompleted: boolean;
};

export type Skill = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export type UserSkill = Skill & {
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
