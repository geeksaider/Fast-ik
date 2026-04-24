import { pool } from '../../db/pool.js';
import type { Transaction, Wallet } from './finance.types.js';

export const ensureWallet = async (userId: string) => {
  const result = await pool.query<Wallet>(
    `insert into wallets (user_id, available_balance, held_balance)
     values ($1, 0, 0)
     on conflict (user_id) do update set updated_at = wallets.updated_at
     returning
       user_id as "userId",
       available_balance as "availableBalance",
       held_balance as "heldBalance",
       currency,
       updated_at as "updatedAt"`,
    [userId],
  );

  return result.rows[0];
};

export const getWallet = async (userId: string) => {
  await ensureWallet(userId);

  const result = await pool.query<Wallet>(
    `select
       user_id as "userId",
       available_balance as "availableBalance",
       held_balance as "heldBalance",
       currency,
       updated_at as "updatedAt"
     from wallets
     where user_id = $1`,
    [userId],
  );

  return result.rows[0];
};

export const topUpWallet = async (userId: string, amount: number) => {
  const client = await pool.connect();

  try {
    await client.query('begin');
    await client.query(
      `insert into wallets (user_id, available_balance, held_balance)
       values ($1, 0, 0)
       on conflict (user_id) do nothing`,
      [userId],
    );

    const wallet = await client.query<Wallet>(
      `update wallets
       set available_balance = available_balance + $2,
           updated_at = now()
       where user_id = $1
       returning
         user_id as "userId",
         available_balance as "availableBalance",
         held_balance as "heldBalance",
         currency,
         updated_at as "updatedAt"`,
      [userId, amount],
    );
    const updatedWallet = wallet.rows[0];

    await client.query(
      `insert into transactions (user_id, type, direction, amount, balance_after, description)
       values ($1, 'mock_top_up', 'in', $2, $3, 'Моковое пополнение баланса')`,
      [userId, amount, updatedWallet.availableBalance],
    );

    await client.query('commit');

    return updatedWallet;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listTransactions = async (userId: string) => {
  const result = await pool.query<Transaction>(
    `select
       id,
       user_id as "userId",
       order_id as "orderId",
       escrow_hold_id as "escrowHoldId",
       type,
       direction,
       amount,
       balance_after as "balanceAfter",
       description,
       created_at as "createdAt"
     from transactions
     where user_id = $1
     order by created_at desc
     limit 80`,
    [userId],
  );

  return result.rows;
};
