export type ConversationType = 'job' | 'order' | 'support';
export type MessageKind = 'text' | 'system';
export type NotificationType =
  | 'application_received'
  | 'application_selected'
  | 'order_submitted'
  | 'order_completed'
  | 'order_reviewed'
  | 'order_disputed'
  | 'order_cancelled'
  | 'message_received'
  | 'system';

export type ConversationListItem = {
  id: string;
  jobId: string | null;
  orderId: string | null;
  title: string;
  type: ConversationType;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageBody: string | null;
  lastMessageSenderName: string | null;
  unreadCount: number;
};

export type ConversationParticipant = {
  userId: string;
  displayName: string;
  role: string;
  lastReadAt: string | null;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  kind: MessageKind;
  createdAt: string;
};

export type ConversationDetail = ConversationListItem & {
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
};

export type NotificationListItem = {
  id: string;
  userId: string;
  actorId: string | null;
  actorName: string | null;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};
