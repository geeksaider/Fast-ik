import { defineStore } from 'pinia';
import {
  createContest,
  getContest,
  getContests,
  selectContestSubmission,
  submitContest,
  type ContestCreatePayload,
  type ContestDetail,
  type ContestListItem,
  type ContestSubmissionCreatePayload,
} from '../lib/api';

export const useContestsStore = defineStore('contests', {
  state: () => ({
    contests: [] as ContestListItem[],
    currentContest: null as ContestDetail | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  actions: {
    async loadContests(
      params: { category?: string; search?: string; mine?: boolean } = {},
      token?: string | null,
    ) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getContests(params, token);
        this.contests = response.contests;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить конкурсы';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadContest(id: string, token?: string | null) {
      this.isLoading = true;
      this.error = null;

      try {
        this.currentContest = await getContest(id, token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить конкурс';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async create(token: string, payload: ContestCreatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentContest = await createContest(token, payload);
        return this.currentContest;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось создать конкурс';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async submit(token: string, contestId: string, payload: ContestSubmissionCreatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentContest = await submitContest(token, contestId, payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отправить работу';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async selectWinner(token: string, contestId: string, submissionId: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentContest = await selectContestSubmission(token, contestId, submissionId);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось выбрать победителя';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
