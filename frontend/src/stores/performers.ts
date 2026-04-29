import { defineStore } from 'pinia';
import { getPublicPerformerProfile, type PublicPerformerProfile } from '../lib/api';

export const usePerformersStore = defineStore('performers', {
  state: () => ({
    current: null as PublicPerformerProfile | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.current = await getPublicPerformerProfile(id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось открыть профиль';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
