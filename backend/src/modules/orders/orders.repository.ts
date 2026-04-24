import type { AuthUser } from '../auth/auth.types.js';
import { pool } from '../../db/pool.js';
import type { OrderDetail, OrderListItem, OrderStatusHistoryItem } from './orders.types.js';

export class EscrowBalanceError extends Error {
  constructor() {
    super('Недостаточно средств на моковом балансе заказчика');
  }
}

const managerRoles = new Set(['admin', 'super_admin', 'moderator', 'support']);

const orderSelect = `
  select
    orders.id,
    orders.job_id as "jobId",
    orders.application_id as "applicationId",
    orders.customer_id as "customerId",
    customer.display_name as "customerName",
    orders.performer_id as "performerId",
    performer.display_name as "performerName",
    orders.title,
    orders.amount,
    orders.status,
    orders.work_result as "workResult",
    escrow_holds.status as "escrowStatus",
    orders.created_at as "createdAt",
    orders.updated_at as "updatedAt",
    orders.submitted_at as "submittedAt",
    orders.completed_at as "completedAt",
    orders.cancelled_at as "cancelledAt",
    orders.disputed_at as "disputedAt"
  from orders
  join users customer on customer.id = orders.customer_id
  join users performer on performer.id = orders.performer_id
  left join escrow_holds on escrow_holds.order_id = orders.id
`;

const canSeeAll = (user: AuthUser) => managerRoles.has(user.role);

export const listOrders = async (user: AuthUser) => {
  const result = await pool.query<OrderListItem>(
    `${orderSelect}
     where $2::boolean = true
        or orders.customer_id = $1
        or orders.performer_id = $1
     order by orders.created_at desc
     limit 80`,
    [user.id, canSeeAll(user)],
  );

  return result.rows;
};

export const getOrderById = async (id: string) => {
  const result = await pool.query<OrderListItem>(`${orderSelect} where orders.id = $1`, [id]);

  return result.rows[0] ?? null;
};

export const listOrderHistory = async (orderId: string) => {
  const result = await pool.query<OrderStatusHistoryItem>(
    `select
       order_status_history.id,
       order_status_history.order_id as "orderId",
       order_status_history.status,
       order_status_history.actor_id as "actorId",
       users.display_name as "actorName",
       order_status_history.note,
       order_status_history.created_at as "createdAt"
     from order_status_history
     left join users on users.id = order_status_history.actor_id
     where order_status_history.order_id = $1
     order by order_status_history.created_at asc`,
    [orderId],
  );

  return result.rows;
};

export const getOrderDetail = async (id: string): Promise<OrderDetail | null> => {
  const order = await getOrderById(id);

  if (!order) {
    return null;
  }

  return {
    ...order,
    statusHistory: await listOrderHistory(id),
  };
};

export const selectApplicationAndCreateOrder = async (input: {
  jobId: string;
  applicationId: string;
  actorId: string;
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const jobResult = await client.query<{
      id: string;
      customerId: string;
      title: string;
      status: string;
      budgetMin: number | null;
      budgetMax: number | null;
    }>(
      `select
         id,
         customer_id as "customerId",
         title,
         status,
         budget_min as "budgetMin",
         budget_max as "budgetMax"
       from jobs
       where id = $1
       for update`,
      [input.jobId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new Error('JOB_NOT_FOUND');
    }

    const applicationResult = await client.query<{
      id: string;
      performerId: string;
      price: number | null;
      status: string;
    }>(
      `select
         id,
         performer_id as "performerId",
         price,
         status
       from job_applications
       where id = $1 and job_id = $2
       for update`,
      [input.applicationId, input.jobId],
    );
    const application = applicationResult.rows[0];

    if (!application) {
      throw new Error('APPLICATION_NOT_FOUND');
    }

    const amount = application.price ?? job.budgetMax ?? job.budgetMin ?? 0;

    await client.query(
      `insert into wallets (user_id, available_balance, held_balance)
       values ($1, 0, 0)
       on conflict (user_id) do nothing`,
      [job.customerId],
    );

    await client.query(
      `insert into wallets (user_id, available_balance, held_balance)
       values ($1, 0, 0)
       on conflict (user_id) do nothing`,
      [application.performerId],
    );

    const walletResult = await client.query<{ availableBalance: number; heldBalance: number }>(
      `select
         available_balance as "availableBalance",
         held_balance as "heldBalance"
       from wallets
       where user_id = $1
       for update`,
      [job.customerId],
    );
    const wallet = walletResult.rows[0];

    if (!wallet || wallet.availableBalance < amount) {
      throw new EscrowBalanceError();
    }

    const orderResult = await client.query<{ id: string }>(
      `insert into orders (job_id, application_id, customer_id, performer_id, title, amount, status)
       values ($1, $2, $3, $4, $5, $6, 'in_progress')
       returning id`,
      [
        input.jobId,
        input.applicationId,
        job.customerId,
        application.performerId,
        job.title,
        amount,
      ],
    );
    const orderId = orderResult.rows[0]?.id;

    const escrowResult = await client.query<{ id: string }>(
      `insert into escrow_holds (order_id, job_id, application_id, customer_id, performer_id, amount, status)
       values ($1, $2, $3, $4, $5, $6, 'held')
       returning id`,
      [orderId, input.jobId, input.applicationId, job.customerId, application.performerId, amount],
    );
    const escrowHoldId = escrowResult.rows[0]?.id;

    const updatedWallet = await client.query<{ availableBalance: number }>(
      `update wallets
       set available_balance = available_balance - $2,
           held_balance = held_balance + $2,
           updated_at = now()
       where user_id = $1
       returning available_balance as "availableBalance"`,
      [job.customerId, amount],
    );

    await client.query(
      `insert into transactions (
         user_id,
         order_id,
         escrow_hold_id,
         type,
         direction,
         amount,
         balance_after,
         description
       )
       values ($1, $2, $3, 'escrow_hold', 'hold', $4, $5, 'Средства зарезервированы в гаранте Fastik')`,
      [job.customerId, orderId, escrowHoldId, amount, updatedWallet.rows[0].availableBalance],
    );

    await client.query(
      `insert into order_status_history (order_id, status, actor_id, note)
       values ($1, 'in_progress', $2, 'Исполнитель выбран, средства зарезервированы в гаранте')`,
      [orderId, input.actorId],
    );

    await client.query(
      `update job_applications
       set status = case when id = $2 then 'accepted' else 'rejected' end,
           updated_at = now()
       where job_id = $1`,
      [input.jobId, input.applicationId],
    );

    await client.query(
      `update jobs
       set selected_application_id = $2,
           status = 'in_progress',
           updated_at = now()
       where id = $1`,
      [input.jobId, input.applicationId],
    );

    await client.query('commit');

    return orderId;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const submitOrder = async (orderId: string, actorId: string, workResult: string) => {
  await pool.query(
    `update orders
     set status = 'submitted',
         work_result = $2,
         submitted_at = now(),
         updated_at = now()
     where id = $1`,
    [orderId, workResult],
  );

  await pool.query(
    `insert into order_status_history (order_id, status, actor_id, note)
     values ($1, 'submitted', $2, 'Исполнитель отправил результат на проверку')`,
    [orderId, actorId],
  );
};

export const completeOrder = async (orderId: string, actorId: string) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const orderResult = await client.query<{
      customerId: string;
      performerId: string;
      amount: number;
    }>(
      `select customer_id as "customerId", performer_id as "performerId", amount
       from orders
       where id = $1
       for update`,
      [orderId],
    );
    const order = orderResult.rows[0];

    const escrowResult = await client.query<{ id: string; status: string }>(
      `select id, status
       from escrow_holds
       where order_id = $1
       for update`,
      [orderId],
    );
    const escrow = escrowResult.rows[0];

    if (!order || !escrow) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const customerWallet = await client.query<{ heldBalance: number }>(
      `select held_balance as "heldBalance" from wallets where user_id = $1 for update`,
      [order.customerId],
    );

    if ((customerWallet.rows[0]?.heldBalance ?? 0) < order.amount) {
      throw new Error('ESCROW_STATE_INVALID');
    }

    await client.query(
      `update orders
       set status = 'completed', completed_at = now(), updated_at = now()
       where id = $1`,
      [orderId],
    );

    await client.query(
      `update escrow_holds
       set status = 'released', released_at = now()
       where id = $1`,
      [escrow.id],
    );

    const updatedCustomerWallet = await client.query<{ availableBalance: number }>(
      `update wallets
       set held_balance = held_balance - $2,
           updated_at = now()
       where user_id = $1
       returning available_balance as "availableBalance"`,
      [order.customerId, order.amount],
    );

    const updatedPerformerWallet = await client.query<{ availableBalance: number }>(
      `update wallets
       set available_balance = available_balance + $2,
           updated_at = now()
       where user_id = $1
       returning available_balance as "availableBalance"`,
      [order.performerId, order.amount],
    );

    await client.query(
      `insert into transactions (user_id, order_id, escrow_hold_id, type, direction, amount, balance_after, description)
       values ($1, $2, $3, 'escrow_release', 'release', $4, $5, 'Заказ принят, удержание гаранта закрыто')`,
      [
        order.customerId,
        orderId,
        escrow.id,
        order.amount,
        updatedCustomerWallet.rows[0].availableBalance,
      ],
    );

    await client.query(
      `insert into transactions (user_id, order_id, escrow_hold_id, type, direction, amount, balance_after, description)
       values ($1, $2, $3, 'performer_payout', 'in', $4, $5, 'Выплата исполнителю после принятия заказа')`,
      [
        order.performerId,
        orderId,
        escrow.id,
        order.amount,
        updatedPerformerWallet.rows[0].availableBalance,
      ],
    );

    await client.query(
      `insert into order_status_history (order_id, status, actor_id, note)
       values ($1, 'completed', $2, 'Заказ принят, средства выплачены исполнителю')`,
      [orderId, actorId],
    );

    await client.query(
      `update jobs
       set status = 'completed', updated_at = now()
       where id = (select job_id from orders where id = $1)`,
      [orderId],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const disputeOrder = async (orderId: string, actorId: string, reason: string) => {
  await pool.query(
    `update orders
     set status = 'disputed', disputed_at = now(), updated_at = now()
     where id = $1`,
    [orderId],
  );

  await pool.query(
    `update escrow_holds
     set status = 'disputed', disputed_at = now()
     where order_id = $1`,
    [orderId],
  );

  await pool.query(
    `insert into order_status_history (order_id, status, actor_id, note)
     values ($1, 'disputed', $2, $3)`,
    [orderId, actorId, reason],
  );
};

export const refundOrder = async (orderId: string, actorId: string, reason: string | null) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const orderResult = await client.query<{
      customerId: string;
      amount: number;
    }>(
      `select customer_id as "customerId", amount
       from orders
       where id = $1
       for update`,
      [orderId],
    );
    const order = orderResult.rows[0];

    const escrowResult = await client.query<{ id: string; status: string }>(
      `select id, status
       from escrow_holds
       where order_id = $1
       for update`,
      [orderId],
    );
    const escrow = escrowResult.rows[0];

    if (!order || !escrow) {
      throw new Error('ORDER_NOT_FOUND');
    }

    await client.query(
      `update orders
       set status = 'cancelled', cancelled_at = now(), updated_at = now()
       where id = $1`,
      [orderId],
    );

    await client.query(
      `update escrow_holds
       set status = 'refunded', refunded_at = now()
       where id = $1`,
      [escrow.id],
    );

    const updatedWallet = await client.query<{ availableBalance: number }>(
      `update wallets
       set available_balance = available_balance + $2,
           held_balance = held_balance - $2,
           updated_at = now()
       where user_id = $1
       returning available_balance as "availableBalance"`,
      [order.customerId, order.amount],
    );

    await client.query(
      `insert into transactions (user_id, order_id, escrow_hold_id, type, direction, amount, balance_after, description)
       values ($1, $2, $3, 'escrow_refund', 'in', $4, $5, 'Средства возвращены заказчику из гаранта')`,
      [order.customerId, orderId, escrow.id, order.amount, updatedWallet.rows[0].availableBalance],
    );

    await client.query(
      `insert into order_status_history (order_id, status, actor_id, note)
       values ($1, 'cancelled', $2, $3)`,
      [orderId, actorId, reason ?? 'Заказ отменен, средства возвращены заказчику'],
    );

    await client.query(
      `update jobs
       set status = 'cancelled', updated_at = now()
       where id = (select job_id from orders where id = $1)`,
      [orderId],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
