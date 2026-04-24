export type Wallet = {
  userId: string;
  availableBalance: number;
  heldBalance: number;
  currency: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  orderId: string | null;
  escrowHoldId: string | null;
  type: string;
  direction: 'in' | 'out' | 'hold' | 'release';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};
