import { defineStore } from 'pinia';
import {
  applyToMarketplaceJob,
  createJob,
  getMarketplaceCategories,
  getMarketplaceJob,
  getMarketplaceJobs,
  invitePerformerToMarketplaceJob,
  selectJobApplication,
  type ApplicationCreatePayload,
  type JobCreatePayload,
  type JobDetail,
  type JobInviteCreatePayload,
  type JobListItem,
  type MarketplaceCategory,
} from '../lib/api';

export const useMarketplaceStore = defineStore('marketplace', {
  state: () => ({
    categories: [] as MarketplaceCategory[],
    jobs: [] as JobListItem[],
    currentJob: null as JobDetail | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  actions: {
    async loadCategories() {
      const response = await getMarketplaceCategories();
      this.categories = response.categories;
    },
    async loadJobs(
      params: { category?: string; search?: string; mine?: boolean } = {},
      token?: string | null,
    ) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getMarketplaceJobs(params, token);
        this.jobs = response.jobs;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить заказы';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadJob(id: string, token?: string | null) {
      this.isLoading = true;
      this.error = null;

      try {
        this.currentJob = await getMarketplaceJob(id, token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить заказ';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async create(token: string, payload: JobCreatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentJob = await createJob(token, payload);
        return this.currentJob;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось создать заказ';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async apply(token: string, jobId: string, payload: ApplicationCreatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentJob = await applyToMarketplaceJob(token, jobId, payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отправить отклик';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async invitePerformer(token: string, jobId: string, payload: JobInviteCreatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentJob = await invitePerformerToMarketplaceJob(token, jobId, payload);
        this.jobs = this.jobs.map((job) =>
          job.id === this.currentJob?.id ? { ...job, updatedAt: this.currentJob.updatedAt } : job,
        );
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отправить приглашение';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async selectApplication(token: string, jobId: string, applicationId: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentJob = await selectJobApplication(token, jobId, applicationId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось выбрать исполнителя';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
