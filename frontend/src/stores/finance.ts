import { defineStore } from 'pinia';
import { getFinanceSummary, topUpWallet, type Transaction, type Wallet } from '../lib/api';

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    wallet: null as Wallet | null,
    transactions: [] as Transaction[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getFinanceSummary(token);
        this.wallet = response.wallet;
        this.transactions = response.transactions;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить финансы';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async topUp(token: string, amount: number) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await topUpWallet(token, amount);
        this.wallet = response.wallet;
        this.transactions = response.transactions;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось пополнить баланс';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
