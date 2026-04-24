export type PerformerLevelCode = 'newcomer' | 'builder' | 'verified' | 'reliable' | 'pro' | 'elite';

export type PerformerLevel = {
  id: number;
  code: PerformerLevelCode;
  title: string;
  description: string | null;
  requiredXp: number;
  sortOrder: number;
  accent: string;
  interviewRequired: boolean;
};

export type PerformerProgressRow = {
  userId: string;
  levelId: number;
  xp: number;
  completedOrders: number;
  rating: number | null;
  interviewRequired: boolean;
  interviewPassed: boolean;
  updatedAt: string;
};

export type XpEvent = {
  id: string;
  userId: string;
  type: string;
  sourceType: string | null;
  sourceId: string | null;
  dedupeKey: string;
  xp: number;
  title: string;
  description: string | null;
  createdAt: string;
};

export type LevelMetric = {
  code: string;
  title: string;
  value: number | boolean | null;
  target: number | boolean;
  completed: boolean;
};

export type LevelRequirement = {
  code: string;
  title: string;
  description: string;
  completed: boolean;
  currentValue: number | boolean | null;
  targetValue: number | boolean;
};

export type RoadmapLevel = PerformerLevel & {
  status: 'completed' | 'current' | 'locked';
  requirements: LevelRequirement[];
};

export type PerformerLevelSummary = {
  progress: PerformerProgressRow;
  currentLevel: PerformerLevel;
  nextLevel: PerformerLevel | null;
  xpToNext: number;
  nextLevelProgress: number;
  metrics: LevelMetric[];
  roadmap: RoadmapLevel[];
  events: XpEvent[];
};
