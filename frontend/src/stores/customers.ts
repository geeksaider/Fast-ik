import { defineStore } from 'pinia';
import {
  getPublicCustomerProfile,
  getPublicCustomers,
  type PublicCustomerListItem,
  type PublicCustomerProfile,
} from '../lib/api';

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    customers: [] as PublicCustomerListItem[],
    current: null as PublicCustomerProfile | null,
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async loadCustomers(params: { search?: string } = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getPublicCustomers(params);
        this.customers = response.customers;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить заказчиков';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async load(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.current = await getPublicCustomerProfile(id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось открыть заказчика';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
