import { defineStore } from 'pinia';
import { getHealth, type HealthStatus } from '../lib/api';

export const useSystemStore = defineStore('system', {
  state: () => ({
    health: null as HealthStatus | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async checkHealth() {
      this.isLoading = true;
      this.error = null;

      try {
        this.health = await getHealth();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown API error';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
