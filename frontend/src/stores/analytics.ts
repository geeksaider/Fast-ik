import { defineStore } from 'pinia';
import { getMyAnalytics, type AnalyticsSummary } from '../lib/api';

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    summary: null as AnalyticsSummary | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.summary = await getMyAnalytics(token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить аналитику';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
