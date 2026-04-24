export type OrderStatus = 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'disputed';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';

export type OrderListItem = {
  id: string;
  jobId: string;
  applicationId: string;
  customerId: string;
  customerName: string;
  performerId: string;
  performerName: string;
  title: string;
  amount: number;
  conversationId: string | null;
  status: OrderStatus;
  workResult: string | null;
  escrowStatus: EscrowStatus | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  disputedAt: string | null;
};

export type OrderDetail = OrderListItem & {
  statusHistory: OrderStatusHistoryItem[];
};

export type OrderStatusHistoryItem = {
  id: string;
  orderId: string;
  status: OrderStatus;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
};
