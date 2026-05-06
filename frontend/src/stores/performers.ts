import { defineStore } from 'pinia';
import {
  getPublicPerformerProfile,
  getPublicPerformers,
  type PublicPerformerListItem,
  type PublicPerformerProfile,
} from '../lib/api';

export const usePerformersStore = defineStore('performers', {
  state: () => ({
    performers: [] as PublicPerformerListItem[],
    current: null as PublicPerformerProfile | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async loadAll(params: { search?: string } = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getPublicPerformers(params);
        this.performers = response.performers;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить исполнителей';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
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
