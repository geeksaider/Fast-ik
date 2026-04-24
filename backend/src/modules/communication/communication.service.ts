import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  createMessage,
  createNotification,
  countUnreadNotifications,
  getConversationDetail,
  hasConversationAccess,
  listConversationParticipants,
  listConversations,
  listNotifications,
  markAllNotificationsRead,
  markConversationRead,
  markNotificationRead,
} from './communication.repository.js';
import type { SendMessageInput } from './communication.schemas.js';

const managerRoles = new Set(['admin', 'super_admin', 'moderator', 'support']);

const assertConversationAccess = async (user: AuthUser, conversationId: string) => {
  const hasAccess = await hasConversationAccess(conversationId, user.id, user.role);

  if (!hasAccess) {
    throw new HttpError(404, 'Диалог не найден');
  }
};

export const getConversations = async (user: AuthUser) => ({
  conversations: await listConversations(user.id, user.role),
});

export const getConversation = async (user: AuthUser, conversationId: string) => {
  await assertConversationAccess(user, conversationId);
  await markConversationRead(conversationId, user.id);

  const conversation = await getConversationDetail(conversationId, user.id);

  if (!conversation) {
    throw new HttpError(404, 'Диалог не найден');
  }

  return conversation;
};

export const sendMessage = async (
  user: AuthUser,
  conversationId: string,
  input: SendMessageInput,
) => {
  await assertConversationAccess(user, conversationId);

  const message = await createMessage(conversationId, user.id, input.body);
  const participants = await listConversationParticipants(conversationId);
  const conversation = await getConversationDetail(conversationId, user.id);

  await Promise.all(
    participants
      .filter((participant) => participant.userId !== user.id)
      .map((participant) =>
        createNotification({
          userId: participant.userId,
          actorId: user.id,
          type: 'message_received',
          title: 'Новое сообщение',
          body: `${user.displayName}: ${input.body.slice(0, 120)}`,
          linkUrl: `/messages/${conversationId}`,
        }),
      ),
  );

  return {
    message,
    conversation,
  };
};

export const getNotifications = async (user: AuthUser) => ({
  notifications: await listNotifications(user.id),
  unreadCount: await countUnreadNotifications(user.id),
});

export const readNotification = async (user: AuthUser, notificationId: string) => {
  const notification = await markNotificationRead(notificationId, user.id);

  if (!notification) {
    throw new HttpError(404, 'Уведомление не найдено');
  }

  return getNotifications(user);
};

export const readAllNotifications = async (user: AuthUser) => {
  await markAllNotificationsRead(user.id);

  return getNotifications(user);
};

export const canModerateConversations = (user: AuthUser) => managerRoles.has(user.role);
