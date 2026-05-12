import { defineStore } from 'pinia';
import {
  acceptPerformerInvite,
  declinePerformerInvite,
  getMyInvites,
  type PerformerInvite,
} from '../lib/api';

export const useInvitesStore = defineStore('invites', {
  state: () => ({
    invites: [] as PerformerInvite[],
    isLoading: false,
    pendingAction: null as string | null,
    error: null as string | null,
  }),
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.invites = await getMyInvites(token);
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Не удалось загрузить приглашения';
      } finally {
        this.isLoading = false;
      }
    },
    async accept(token: string, id: string) {
      this.pendingAction = id;
      this.error = null;

      try {
        await acceptPerformerInvite(token, id);
        this.invites = this.invites.filter((invite) => invite.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось принять приглашение';
        throw error;
      } finally {
        this.pendingAction = null;
      }
    },
    async decline(token: string, id: string) {
      this.pendingAction = id;
      this.error = null;

      try {
        await declinePerformerInvite(token, id);
        this.invites = this.invites.filter((invite) => invite.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отклонить приглашение';
        throw error;
      } finally {
        this.pendingAction = null;
      }
    },
  },
});
