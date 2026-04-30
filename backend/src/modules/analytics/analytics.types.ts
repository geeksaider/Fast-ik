import type { AuthUser } from '../auth/auth.types.js';

export type AnalyticsMetric = {
  label: string;
  value: number;
  displayValue: string;
  detail: string;
  tone: 'dark' | 'ember' | 'moss' | 'bolt' | 'paper';
};

export type AnalyticsBreakdownItem = {
  label: string;
  value: number;
  displayValue: string;
  amount?: number;
};

export type AnalyticsSummary = {
  role: AuthUser['role'];
  title: string;
  subtitle: string;
  generatedAt: string;
  metrics: AnalyticsMetric[];
  pipeline: AnalyticsBreakdownItem[];
  orderStatuses: AnalyticsBreakdownItem[];
  money: AnalyticsBreakdownItem[];
  activity: AnalyticsBreakdownItem[];
};
