import type { AuthUser } from '../auth/auth.types.js';
import { getWallet, listTransactions, topUpWallet } from './finance.repository.js';
import type { TopUpInput } from './finance.schemas.js';

export const getFinanceSummary = async (user: AuthUser) => ({
  wallet: await getWallet(user.id),
  transactions: await listTransactions(user.id),
});

export const topUpBalance = async (user: AuthUser, input: TopUpInput) => {
  await topUpWallet(user.id, input.amount);

  return getFinanceSummary(user);
};
