import { defineStore } from 'pinia';
import { getMyLevelRoadmap, type PerformerLevelSummary } from '../lib/api';

export const useLevelsStore = defineStore('levels', {
  state: () => ({
    summary: null as PerformerLevelSummary | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.summary = await getMyLevelRoadmap(token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить roadmap уровня';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
