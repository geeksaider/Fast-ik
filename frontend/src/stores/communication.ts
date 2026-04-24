import { defineStore } from 'pinia';
import {
  getConversation,
  getConversations,
  getNotifications,
  readAllNotifications as readAllNotificationsRequest,
  readNotification as readNotificationRequest,
  sendConversationMessage,
  type ConversationDetail,
  type ConversationListItem,
  type NotificationListItem,
} from '../lib/api';

export const useCommunicationStore = defineStore('communication', {
  state: () => ({
    conversations: [] as ConversationListItem[],
    currentConversation: null as ConversationDetail | null,
    notifications: [] as NotificationListItem[],
    unreadNotifications: 0,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  getters: {
    unreadMessages: (state) =>
      state.conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
  },
  actions: {
    async loadConversations(token: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await getConversations(token);
        this.conversations = response.conversations;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить диалоги';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loadConversation(token: string, id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        this.currentConversation = await getConversation(token, id);
        await this.loadConversations(token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить диалог';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async sendMessage(token: string, id: string, body: string) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await sendConversationMessage(token, id, body);
        this.currentConversation = response.conversation;
        await this.loadConversations(token);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось отправить сообщение';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
    async loadNotifications(token: string) {
      this.error = null;

      try {
        const response = await getNotifications(token);
        this.notifications = response.notifications;
        this.unreadNotifications = response.unreadCount;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось загрузить уведомления';
        throw error;
      }
    },
    async readNotification(token: string, id: string) {
      const response = await readNotificationRequest(token, id);
      this.notifications = response.notifications;
      this.unreadNotifications = response.unreadCount;
    },
    async readAllNotifications(token: string) {
      const response = await readAllNotificationsRequest(token);
      this.notifications = response.notifications;
      this.unreadNotifications = response.unreadCount;
    },
  },
});
