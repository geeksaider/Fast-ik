import { defineStore } from 'pinia';
import {
  createPortfolioItem,
  deletePortfolioItem,
  getMyProfile,
  getSkillOptions,
  updateMyProfile,
  updateMySkills,
  type PortfolioPayload,
  type ProfileSummary,
  type ProfileUpdatePayload,
  type SkillOption,
  type UserSkill,
} from '../lib/api';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    summary: null as ProfileSummary | null,
    skillOptions: [] as SkillOption[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  getters: {
    selectedSkillIds: (state) => new Set(state.summary?.skills.map((skill) => skill.id) ?? []),
  },
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const [summary, options] = await Promise.all([getMyProfile(token), getSkillOptions(token)]);
        this.summary = summary;
        this.skillOptions = options.skills;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async saveProfile(token: string, payload: ProfileUpdatePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.summary = await updateMyProfile(token, payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось сохранить профиль';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async saveSkills(token: string, skills: Array<{ skillId: string; level: UserSkill['level'] }>) {
      this.isSaving = true;
      this.error = null;

      try {
        this.summary = await updateMySkills(token, { skills });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось сохранить навыки';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async addPortfolio(token: string, payload: PortfolioPayload) {
      this.isSaving = true;
      this.error = null;

      try {
        this.summary = await createPortfolioItem(token, payload);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось добавить проект';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async removePortfolio(token: string, id: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.summary = await deletePortfolioItem(token, id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось удалить проект';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
