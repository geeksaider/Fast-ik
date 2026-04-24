import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMessage,
  ConversationParticipant,
  NotificationListItem,
  NotificationType,
} from './communication.types.js';

const managerRoles = new Set(['admin', 'super_admin', 'moderator', 'support']);

type QueryClient = Pick<PoolClient, 'query'>;

type NotificationInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string | null;
};

const conversationSelect = `
  select
    conversations.id,
    conversations.job_id as "jobId",
    conversations.order_id as "orderId",
    conversations.title,
    conversations.type,
    conversations.last_message_at as "lastMessageAt",
    conversations.created_at as "createdAt",
    conversations.updated_at as "updatedAt",
    last_message.body as "lastMessageBody",
    last_sender.display_name as "lastMessageSenderName",
    coalesce(count(unread_messages.id), 0)::int as "unreadCount"
  from conversations
  left join conversation_participants current_participant
    on current_participant.conversation_id = conversations.id
   and current_participant.user_id = $1
  left join lateral (
    select messages.body, messages.sender_id
    from messages
    where messages.conversation_id = conversations.id
    order by messages.created_at desc
    limit 1
  ) last_message on true
  left join users last_sender on last_sender.id = last_message.sender_id
  left join messages unread_messages
    on unread_messages.conversation_id = conversations.id
   and unread_messages.sender_id <> $1
   and current_participant.user_id is not null
   and unread_messages.created_at > coalesce(current_participant.last_read_at, current_participant.created_at)
`;

const conversationGroup = `
  group by
    conversations.id,
    last_message.body,
    last_sender.display_name
`;

export const createNotification = async (input: NotificationInput, client?: QueryClient) => {
  if (input.actorId && input.actorId === input.userId) {
    return null;
  }

  const db = client ?? pool;
  const result = await db.query<{ id: string }>(
    `insert into notifications (user_id, actor_id, type, title, body, link_url)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      input.userId,
      input.actorId ?? null,
      input.type,
      input.title,
      input.body,
      input.linkUrl ?? null,
    ],
  );

  return result.rows[0]?.id ?? null;
};

export const listConversations = async (userId: string, role: string) => {
  const canSeeAll = managerRoles.has(role);
  const result = await pool.query<ConversationListItem>(
    `${conversationSelect}
     where $2::boolean = true or current_participant.user_id is not null
     ${conversationGroup}
     order by coalesce(conversations.last_message_at, conversations.created_at) desc
     limit 80`,
    [userId, canSeeAll],
  );

  return result.rows;
};

export const getConversationListItem = async (conversationId: string, userId: string) => {
  const result = await pool.query<ConversationListItem>(
    `${conversationSelect}
     where conversations.id = $2
     ${conversationGroup}`,
    [userId, conversationId],
  );

  return result.rows[0] ?? null;
};

export const hasConversationAccess = async (
  conversationId: string,
  userId: string,
  role: string,
) => {
  if (managerRoles.has(role)) {
    const result = await pool.query<{ exists: boolean }>(
      'select exists(select 1 from conversations where id = $1) as exists',
      [conversationId],
    );

    return result.rows[0]?.exists ?? false;
  }

  const result = await pool.query<{ exists: boolean }>(
    `select exists(
       select 1 from conversation_participants
       where conversation_id = $1 and user_id = $2
     ) as exists`,
    [conversationId, userId],
  );

  return result.rows[0]?.exists ?? false;
};

export const listConversationParticipants = async (conversationId: string) => {
  const result = await pool.query<ConversationParticipant>(
    `select
       conversation_participants.user_id as "userId",
       users.display_name as "displayName",
       roles.code as role,
       conversation_participants.last_read_at as "lastReadAt"
     from conversation_participants
     join users on users.id = conversation_participants.user_id
     join roles on roles.id = users.role_id
     where conversation_participants.conversation_id = $1
     order by conversation_participants.created_at asc`,
    [conversationId],
  );

  return result.rows;
};

export const listConversationMessages = async (conversationId: string) => {
  const result = await pool.query<ConversationMessage>(
    `select
       messages.id,
       messages.conversation_id as "conversationId",
       messages.sender_id as "senderId",
       users.display_name as "senderName",
       roles.code as "senderRole",
       messages.body,
       messages.kind,
       messages.created_at as "createdAt"
     from messages
     join users on users.id = messages.sender_id
     join roles on roles.id = users.role_id
     where messages.conversation_id = $1
     order by messages.created_at asc
     limit 300`,
    [conversationId],
  );

  return result.rows;
};

export const markConversationRead = async (conversationId: string, userId: string) => {
  await pool.query(
    `update conversation_participants
     set last_read_at = now()
     where conversation_id = $1 and user_id = $2`,
    [conversationId, userId],
  );
};

export const getConversationDetail = async (
  conversationId: string,
  userId: string,
): Promise<ConversationDetail | null> => {
  const conversation = await getConversationListItem(conversationId, userId);

  if (!conversation) {
    return null;
  }

  return {
    ...conversation,
    participants: await listConversationParticipants(conversationId),
    messages: await listConversationMessages(conversationId),
  };
};

export const createMessage = async (conversationId: string, senderId: string, body: string) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<ConversationMessage>(
      `insert into messages (conversation_id, sender_id, body, kind)
       values ($1, $2, $3, 'text')
       returning
         id,
         conversation_id as "conversationId",
         sender_id as "senderId",
         body,
         kind,
         created_at as "createdAt"`,
      [conversationId, senderId, body],
    );

    await client.query(
      `update conversations
       set last_message_at = now(), updated_at = now()
       where id = $1`,
      [conversationId],
    );

    await client.query(
      `update conversation_participants
       set last_read_at = now()
       where conversation_id = $1 and user_id = $2`,
      [conversationId, senderId],
    );

    await client.query('commit');

    return result.rows[0];
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const ensureOrderConversation = async (
  input: {
    orderId: string;
    jobId: string;
    title: string;
    customerId: string;
    performerId: string;
    actorId: string;
  },
  client: QueryClient,
) => {
  const conversationResult = await client.query<{ id: string; created: boolean }>(
    `with inserted as (
       insert into conversations (job_id, order_id, title, type, last_message_at)
       values ($1, $2, $3, 'order', now())
       on conflict do nothing
       returning id, true as created
     )
     select id, created from inserted
     union all
     select id, false as created from conversations where order_id = $2
     limit 1`,
    [input.jobId, input.orderId, input.title],
  );
  const conversation = conversationResult.rows[0];

  if (!conversation) {
    throw new Error('CONVERSATION_NOT_CREATED');
  }

  await client.query(
    `insert into conversation_participants (conversation_id, user_id, last_read_at)
     values ($1, $2, now()), ($1, $3, null)
     on conflict (conversation_id, user_id) do nothing`,
    [conversation.id, input.customerId, input.performerId],
  );

  if (conversation.created) {
    await client.query(
      `insert into messages (conversation_id, sender_id, body, kind)
       values ($1, $2, $3, 'system')`,
      [
        conversation.id,
        input.actorId,
        'Fastik создал рабочий чат после выбора исполнителя. Файлами и деталями теперь можно обмениваться здесь.',
      ],
    );
  }

  return conversation.id;
};

export const listNotifications = async (userId: string) => {
  const result = await pool.query<NotificationListItem>(
    `select
       notifications.id,
       notifications.user_id as "userId",
       notifications.actor_id as "actorId",
       actor.display_name as "actorName",
       notifications.type,
       notifications.title,
       notifications.body,
       notifications.link_url as "linkUrl",
       notifications.read_at as "readAt",
       notifications.created_at as "createdAt"
     from notifications
     left join users actor on actor.id = notifications.actor_id
     where notifications.user_id = $1
     order by notifications.created_at desc
     limit 120`,
    [userId],
  );

  return result.rows;
};

export const countUnreadNotifications = async (userId: string) => {
  const result = await pool.query<{ count: number }>(
    `select count(*)::int as count
     from notifications
     where user_id = $1 and read_at is null`,
    [userId],
  );

  return result.rows[0]?.count ?? 0;
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
  const result = await pool.query<NotificationListItem>(
    `update notifications
     set read_at = coalesce(read_at, now())
     where id = $1 and user_id = $2
     returning
       id,
       user_id as "userId",
       actor_id as "actorId",
       null::text as "actorName",
       type,
       title,
       body,
       link_url as "linkUrl",
       read_at as "readAt",
       created_at as "createdAt"`,
    [notificationId, userId],
  );

  return result.rows[0] ?? null;
};

export const markAllNotificationsRead = async (userId: string) => {
  await pool.query(
    `update notifications
     set read_at = coalesce(read_at, now())
     where user_id = $1 and read_at is null`,
    [userId],
  );
};
