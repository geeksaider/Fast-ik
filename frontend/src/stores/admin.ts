import { defineStore } from 'pinia';
import {
  decideAdminInterview,
  getAdminAuditLog,
  getAdminDisputes,
  getAdminInterviews,
  getAdminModerationJobs,
  getAdminOverview,
  getAdminUsers,
  moderateAdminJob,
  resolveAdminDispute,
  updateAdminUserStatus,
  type AdminActionItem,
  type AdminDisputeItem,
  type AdminInterviewItem,
  type AdminModerationJobItem,
  type AdminOverview,
  type AdminPermission,
  type AdminUserItem,
} from '../lib/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    overview: null as AdminOverview | null,
    users: [] as AdminUserItem[],
    disputes: [] as AdminDisputeItem[],
    jobs: [] as AdminModerationJobItem[],
    interviews: [] as AdminInterviewItem[],
    actions: [] as AdminActionItem[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  getters: {
    permissions: (state) => state.overview?.permissions ?? ([] as AdminPermission[]),
    can: (state) => (permission: AdminPermission) =>
      Boolean(state.overview?.permissions.includes(permission)),
  },
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.overview = await getAdminOverview(token);
        const permissions = this.overview.permissions;

        const tasks: Promise<unknown>[] = [];

        if (permissions.includes('users')) {
          tasks.push(this.loadUsers(token));
        }

        if (permissions.includes('disputes')) {
          tasks.push(this.loadDisputes(token));
        }

        if (permissions.includes('moderation')) {
          tasks.push(this.loadModerationJobs(token));
        }

        if (permissions.includes('interviews')) {
          tasks.push(this.loadInterviews(token));
        }

        if (permissions.includes('auditLog')) {
          tasks.push(this.loadAuditLog(token));
        }

        await Promise.allSettled(tasks);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить админку';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadUsers(token: string) {
      const response = await getAdminUsers(token);
      this.users = response.users;
    },
    async loadDisputes(token: string) {
      const response = await getAdminDisputes(token);
      this.disputes = response.disputes;
    },
    async loadModerationJobs(token: string) {
      const response = await getAdminModerationJobs(token);
      this.jobs = response.jobs;
    },
    async loadInterviews(token: string) {
      const response = await getAdminInterviews(token);
      this.interviews = response.interviews;
    },
    async loadAuditLog(token: string) {
      const response = await getAdminAuditLog(token);
      this.actions = response.actions;
    },
    async resolveDispute(
      token: string,
      id: string,
      action: 'refund_customer' | 'pay_performer',
      note: string,
    ) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await resolveAdminDispute(token, id, { action, note });
        this.disputes = response.disputes;
        this.overview = await getAdminOverview(token);

        if (this.can('auditLog')) {
          await this.loadAuditLog(token);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось закрыть спор';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async moderateJob(token: string, id: string, action: 'approve' | 'reject', note?: string) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await moderateAdminJob(token, id, { action, note });
        this.jobs = this.jobs.map((job) => (job.id === id ? response.job : job));
        this.overview = await getAdminOverview(token);

        if (this.can('auditLog')) {
          await this.loadAuditLog(token);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось применить модерацию';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async updateUserStatus(token: string, id: string, status: 'active' | 'blocked', note?: string) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await updateAdminUserStatus(token, id, { status, note });
        this.users = this.users.map((user) =>
          user.id === id
            ? {
                ...user,
                status: response.user.status,
                updatedAt: response.user.updatedAt,
              }
            : user,
        );
        this.overview = await getAdminOverview(token);

        if (this.can('auditLog')) {
          await this.loadAuditLog(token);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось изменить статус';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async decideInterview(token: string, id: string, status: 'passed' | 'failed', note: string) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await decideAdminInterview(token, id, { status, note });
        this.interviews = response.interviews;
        this.overview = await getAdminOverview(token);

        if (this.can('auditLog')) {
          await this.loadAuditLog(token);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось сохранить HR-решение';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
