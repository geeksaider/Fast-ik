import { defineStore } from 'pinia';
import {
  acceptOrder,
  cancelOrder,
  disputeOrder,
  getOrder,
  getOrders,
  submitOrder,
  type OrderDetail,
  type OrderListItem,
} from '../lib/api';

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [] as OrderListItem[],
    currentOrder: null as OrderDetail | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  actions: {
    async load(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getOrders(token);
        this.orders = response.orders;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить заказы';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadOne(token: string, id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.currentOrder = await getOrder(token, id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить заказ';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async submit(token: string, id: string, workResult: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentOrder = await submitOrder(token, id, workResult);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось сдать работу';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async accept(token: string, id: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentOrder = await acceptOrder(token, id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось принять работу';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async dispute(token: string, id: string, reason: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentOrder = await disputeOrder(token, id, reason);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось открыть спор';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async cancel(token: string, id: string, reason: string) {
      this.isSaving = true;
      this.error = null;

      try {
        this.currentOrder = await cancelOrder(token, id, reason);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отменить заказ';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
