import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { createNotification } from '../communication/communication.repository.js';
import type {
  AdminActionItem,
  AdminDisputeItem,
  AdminInterviewItem,
  AdminModerationJobItem,
  AdminOverview,
  AdminUserItem,
  ResolveDisputeResult,
} from './admin.types.js';

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

type Queryable = Pool | PoolClient;

type RecordActionInput = {
  actorId: string;
  targetType: string;
  targetId?: string | null;
  action: string;
  note?: string | null;
  metadata?: Record<string, unknown>;
};

const actionSelect = `
  select
    admin_actions.id,
    admin_actions.actor_id as "actorId",
    users.display_name as "actorName",
    roles.code as "actorRole",
    admin_actions.target_type as "targetType",
    admin_actions.target_id as "targetId",
    admin_actions.action,
    admin_actions.note,
    admin_actions.metadata,
    admin_actions.created_at as "createdAt"
  from admin_actions
  left join users on users.id = admin_actions.actor_id
  left join roles on roles.id = users.role_id
`;

export const recordAdminAction = async (input: RecordActionInput, queryable: Queryable = pool) => {
  await queryable.query(
    `insert into admin_actions (actor_id, target_type, target_id, action, note, metadata)
     values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      input.actorId,
      input.targetType,
      input.targetId ?? null,
      input.action,
      input.note ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
};

export const getAdminOverview = async (permissions: AdminOverview['permissions']) => {
  const [
    usersResult,
    jobsResult,
    disputesResult,
    interviewsResult,
    ordersResult,
    escrowResult,
    actionsResult,
  ] = await Promise.all([
    pool.query<{ total: string; active: string }>(
      `select
           count(*)::text as total,
           count(*) filter (where status = 'active')::text as active
         from users`,
    ),
    pool.query<{ pending: string }>(
      `select count(*)::text as pending
         from jobs
         where moderation_status = 'pending'`,
    ),
    pool.query<{ disputed: string }>(
      `select count(*)::text as disputed
         from orders
         where status = 'disputed'`,
    ),
    pool.query<{ requests: string }>(
      `select count(*)::text as requests
         from users
         join roles on roles.id = users.role_id
         join performer_progress on performer_progress.user_id = users.id
         where roles.code = 'performer'
           and users.status = 'active'
           and performer_progress.interview_required = true
           and performer_progress.interview_passed = false`,
    ),
    pool.query<{ active: string }>(
      `select count(*)::text as active
         from orders
         where status in ('in_progress', 'submitted', 'disputed')`,
    ),
    pool.query<{ held: string }>(
      `select coalesce(sum(amount), 0)::text as held
         from escrow_holds
         where status in ('held', 'disputed')`,
    ),
    pool.query<AdminActionItem>(`${actionSelect} order by admin_actions.created_at desc limit 6`),
  ]);

  return {
    stats: {
      totalUsers: toNumber(usersResult.rows[0]?.total),
      activeUsers: toNumber(usersResult.rows[0]?.active),
      pendingJobs: toNumber(jobsResult.rows[0]?.pending),
      openDisputes: toNumber(disputesResult.rows[0]?.disputed),
      interviewRequests: toNumber(interviewsResult.rows[0]?.requests),
      activeOrders: toNumber(ordersResult.rows[0]?.active),
      escrowHeldAmount: toNumber(escrowResult.rows[0]?.held),
    },
    permissions,
    recentActions: actionsResult.rows,
  } satisfies AdminOverview;
};

export const listAdminUsers = async () => {
  const result = await pool.query<AdminUserItem>(
    `select
       users.id,
       users.email,
       users.display_name as "displayName",
       roles.code as role,
       users.status,
       users.email_verified as "emailVerified",
       coalesce(wallets.available_balance, 0) as "availableBalance",
       coalesce(wallets.held_balance, 0) as "heldBalance",
       performer_progress.xp as "performerXp",
       performer_levels.title as "performerLevelTitle",
       users.created_at as "createdAt",
       users.updated_at as "updatedAt",
       users.last_login_at as "lastLoginAt"
     from users
     join roles on roles.id = users.role_id
     left join wallets on wallets.user_id = users.id
     left join performer_progress on performer_progress.user_id = users.id
     left join performer_levels on performer_levels.id = performer_progress.level_id
     order by users.created_at desc
     limit 120`,
  );

  return result.rows;
};

export const listAdminInterviews = async () => {
  const result = await pool.query<AdminInterviewItem>(
    `select
       users.id as "userId",
       users.email,
       users.display_name as "displayName",
       users.status,
       performer_profiles.headline,
       performer_profiles.specialization,
       coalesce(performer_progress.xp, 0)::int as xp,
       coalesce(performer_progress.completed_orders, 0)::int as "completedOrders",
       performer_progress.rating::float8 as rating,
       coalesce(performer_progress.interview_required, false) as "interviewRequired",
       coalesce(performer_progress.interview_passed, false) as "interviewPassed",
       current_level.code as "levelCode",
       current_level.title as "levelTitle",
       coalesce(elite_level.required_xp, 0)::int as "eliteRequiredXp",
       latest_interview.status as "latestInterviewStatus",
       latest_interview.note as "latestInterviewNote",
       latest_interview.created_at as "latestInterviewAt"
     from users
     join roles on roles.id = users.role_id and roles.code = 'performer'
     left join performer_profiles on performer_profiles.user_id = users.id
     left join performer_progress on performer_progress.user_id = users.id
     left join performer_levels current_level on current_level.id = performer_progress.level_id
     left join performer_levels elite_level on elite_level.code = 'elite'
     left join lateral (
       select status, note, created_at
       from performer_interviews
       where performer_interviews.performer_id = users.id
       order by created_at desc
       limit 1
     ) latest_interview on true
     order by
       coalesce(performer_progress.interview_required, false) desc,
       coalesce(performer_progress.interview_passed, false) asc,
       coalesce(performer_progress.xp, 0) desc,
       users.created_at desc
     limit 120`,
  );

  return result.rows;
};

export const decideAdminPerformerInterview = async (input: {
  actorId: string;
  performerId: string;
  status: 'passed' | 'failed';
  note: string;
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const performerResult = await client.query<{ id: string; displayName: string }>(
      `select users.id, users.display_name as "displayName"
       from users
       join roles on roles.id = users.role_id
       where users.id = $1
         and roles.code = 'performer'
       for update of users`,
      [input.performerId],
    );
    const performer = performerResult.rows[0];

    if (!performer) {
      throw new Error('PERFORMER_NOT_FOUND');
    }

    await client.query(
      `insert into performer_interviews (performer_id, reviewer_id, status, note)
       values ($1, $2, $3, $4)`,
      [input.performerId, input.actorId, input.status, input.note],
    );

    await client.query(
      `insert into performer_progress (
         user_id,
         level_id,
         xp,
         completed_orders,
         rating,
         interview_required,
         interview_passed,
         updated_at
       )
       select $1, performer_levels.id, 0, 0, null, false, $2, now()
       from performer_levels
       where performer_levels.code = 'newcomer'
       on conflict (user_id) do update set
         interview_passed = excluded.interview_passed,
         interview_required = false,
         updated_at = now()`,
      [input.performerId, input.status === 'passed'],
    );

    await recordAdminAction(
      {
        actorId: input.actorId,
        targetType: 'performer',
        targetId: input.performerId,
        action: 'performer_interview_decided',
        note: input.note,
        metadata: { status: input.status },
      },
      client,
    );

    await createNotification(
      {
        userId: input.performerId,
        actorId: input.actorId,
        type: input.status === 'passed' ? 'interview_passed' : 'interview_failed',
        title:
          input.status === 'passed'
            ? 'HR-интервью Fastik пройдено'
            : 'HR-интервью Fastik не зачтено',
        body:
          input.status === 'passed'
            ? `Решение платформы: интервью пройдено. ${input.note}`
            : `Платформа оставила комментарий для повторной попытки: ${input.note}`,
        linkUrl: '/level-roadmap',
      },
      client,
    );

    await client.query('commit');

    return { performerId: input.performerId, performerName: performer.displayName, input };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const updateAdminUserStatus = async (input: {
  actorId: string;
  userId: string;
  status: 'active' | 'blocked';
  note?: string | null;
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<AdminUserItem>(
      `update users
       set status = $2,
           updated_at = now()
       where id = $1
       returning
         users.id,
         users.email,
         users.display_name as "displayName",
         (select roles.code from roles where roles.id = users.role_id) as role,
         users.status,
         users.email_verified as "emailVerified",
         0 as "availableBalance",
         0 as "heldBalance",
         null::integer as "performerXp",
         null::text as "performerLevelTitle",
         users.created_at as "createdAt",
         users.updated_at as "updatedAt",
         users.last_login_at as "lastLoginAt"`,
      [input.userId, input.status],
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    await recordAdminAction(
      {
        actorId: input.actorId,
        targetType: 'user',
        targetId: input.userId,
        action: 'user_status_updated',
        note: input.note ?? `Статус пользователя изменен на ${input.status}`,
        metadata: { status: input.status },
      },
      client,
    );

    await client.query('commit');

    return user;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listAdminDisputes = async () => {
  const result = await pool.query<AdminDisputeItem>(
    `select
       orders.id,
       orders.job_id as "jobId",
       orders.customer_id as "customerId",
       customer.display_name as "customerName",
       orders.performer_id as "performerId",
       performer.display_name as "performerName",
       orders.title,
       orders.amount,
       orders.status,
       escrow_holds.status as "escrowStatus",
       latest_dispute.note as "disputeReason",
       orders.created_at as "createdAt",
       orders.disputed_at as "disputedAt"
     from orders
     join users customer on customer.id = orders.customer_id
     join users performer on performer.id = orders.performer_id
     left join escrow_holds on escrow_holds.order_id = orders.id
     left join lateral (
       select note
       from order_status_history
       where order_status_history.order_id = orders.id
         and order_status_history.status = 'disputed'
       order by order_status_history.created_at desc
       limit 1
     ) latest_dispute on true
     where orders.status = 'disputed'
     order by orders.disputed_at desc nulls last, orders.created_at desc
     limit 80`,
  );

  return result.rows;
};

export const listAdminModerationJobs = async () => {
  const result = await pool.query<AdminModerationJobItem>(
    `select
       jobs.id,
       jobs.customer_id as "customerId",
       users.display_name as "customerName",
       categories.name as "categoryName",
       jobs.title,
       jobs.description,
       jobs.budget_min as "budgetMin",
       jobs.budget_max as "budgetMax",
       jobs.status,
       jobs.moderation_status as "moderationStatus",
       jobs.applications_count as "applicationsCount",
       jobs.created_at as "createdAt",
       jobs.updated_at as "updatedAt"
     from jobs
     join users on users.id = jobs.customer_id
     left join categories on categories.id = jobs.category_id
     order by
       case jobs.moderation_status
         when 'pending' then 0
         when 'draft' then 1
         when 'rejected' then 2
         else 3
       end,
       jobs.created_at desc
     limit 120`,
  );

  return result.rows;
};

export const moderateAdminJob = async (input: {
  actorId: string;
  jobId: string;
  action: 'approve' | 'reject';
  note?: string | null;
}) => {
  const moderationStatus = input.action === 'approve' ? 'approved' : 'rejected';

  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<AdminModerationJobItem>(
      `update jobs
       set moderation_status = $2,
           status = case when $2 = 'rejected' and status = 'published' then 'cancelled' else status end,
           updated_at = now()
       where id = $1
       returning
         jobs.id,
         jobs.customer_id as "customerId",
         (select users.display_name from users where users.id = jobs.customer_id) as "customerName",
         (select categories.name from categories where categories.id = jobs.category_id) as "categoryName",
         jobs.title,
         jobs.description,
         jobs.budget_min as "budgetMin",
         jobs.budget_max as "budgetMax",
         jobs.status,
         jobs.moderation_status as "moderationStatus",
         jobs.applications_count as "applicationsCount",
         jobs.created_at as "createdAt",
         jobs.updated_at as "updatedAt"`,
      [input.jobId, moderationStatus],
    );

    const job = result.rows[0];

    if (!job) {
      throw new Error('JOB_NOT_FOUND');
    }

    await recordAdminAction(
      {
        actorId: input.actorId,
        targetType: 'job',
        targetId: input.jobId,
        action: 'job_moderated',
        note: input.note ?? `Модерация заказа: ${moderationStatus}`,
        metadata: { moderationStatus },
      },
      client,
    );

    await createNotification(
      {
        userId: job.customerId,
        actorId: input.actorId,
        type: 'system',
        title: moderationStatus === 'approved' ? 'Заказ прошел модерацию' : 'Заказ отклонен',
        body:
          input.note ??
          (moderationStatus === 'approved'
            ? `Заказ «${job.title}» доступен на бирже.`
            : `Заказ «${job.title}» снят с публикации после модерации.`),
        linkUrl: `/jobs/${job.id}`,
      },
      client,
    );

    await client.query('commit');

    return job;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const resolveAdminDispute = async (input: {
  actorId: string;
  orderId: string;
  action: 'refund_customer' | 'pay_performer';
  note: string;
}): Promise<ResolveDisputeResult> => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const orderResult = await client.query<{
      id: string;
      jobId: string;
      customerId: string;
      performerId: string;
      title: string;
      amount: number;
      status: string;
    }>(
      `select
         id,
         job_id as "jobId",
         customer_id as "customerId",
         performer_id as "performerId",
         title,
         amount,
         status
       from orders
       where id = $1
       for update`,
      [input.orderId],
    );
    const order = orderResult.rows[0];

    const escrowResult = await client.query<{ id: string; status: string }>(
      `select id, status
       from escrow_holds
       where order_id = $1
       for update`,
      [input.orderId],
    );
    const escrow = escrowResult.rows[0];

    if (!order || !escrow) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status !== 'disputed' || escrow.status !== 'disputed') {
      throw new Error('DISPUTE_ALREADY_RESOLVED');
    }

    const customerWallet = await client.query<{ heldBalance: number }>(
      `select held_balance as "heldBalance" from wallets where user_id = $1 for update`,
      [order.customerId],
    );

    if ((customerWallet.rows[0]?.heldBalance ?? 0) < order.amount) {
      throw new Error('ESCROW_STATE_INVALID');
    }

    if (input.action === 'refund_customer') {
      await client.query(
        `update orders
         set status = 'cancelled', cancelled_at = now(), updated_at = now()
         where id = $1`,
        [order.id],
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
         values ($1, $2, $3, 'escrow_refund', 'in', $4, $5, 'Спор решен: средства возвращены заказчику')`,
        [
          order.customerId,
          order.id,
          escrow.id,
          order.amount,
          updatedWallet.rows[0].availableBalance,
        ],
      );

      await client.query(
        `insert into order_status_history (order_id, status, actor_id, note)
         values ($1, 'cancelled', $2, $3)`,
        [order.id, input.actorId, `Спор решен в пользу заказчика. ${input.note}`],
      );

      await client.query(`update jobs set status = 'cancelled', updated_at = now() where id = $1`, [
        order.jobId,
      ]);
    } else {
      await client.query(
        `update orders
         set status = 'completed', completed_at = now(), updated_at = now()
         where id = $1`,
        [order.id],
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
         values ($1, $2, $3, 'escrow_release', 'release', $4, $5, 'Спор решен: удержание гаранта закрыто')`,
        [
          order.customerId,
          order.id,
          escrow.id,
          order.amount,
          updatedCustomerWallet.rows[0].availableBalance,
        ],
      );

      await client.query(
        `insert into transactions (user_id, order_id, escrow_hold_id, type, direction, amount, balance_after, description)
         values ($1, $2, $3, 'performer_payout', 'in', $4, $5, 'Спор решен: выплата исполнителю')`,
        [
          order.performerId,
          order.id,
          escrow.id,
          order.amount,
          updatedPerformerWallet.rows[0].availableBalance,
        ],
      );

      await client.query(
        `insert into order_status_history (order_id, status, actor_id, note)
         values ($1, 'completed', $2, $3)`,
        [order.id, input.actorId, `Спор решен в пользу исполнителя. ${input.note}`],
      );

      await client.query(`update jobs set status = 'completed', updated_at = now() where id = $1`, [
        order.jobId,
      ]);
    }

    await recordAdminAction(
      {
        actorId: input.actorId,
        targetType: 'order',
        targetId: order.id,
        action: 'dispute_resolved',
        note: input.note,
        metadata: { resolution: input.action, amount: order.amount },
      },
      client,
    );

    await Promise.all([
      createNotification(
        {
          userId: order.customerId,
          actorId: input.actorId,
          type: input.action === 'refund_customer' ? 'order_cancelled' : 'order_completed',
          title: 'Спор закрыт платформой',
          body:
            input.action === 'refund_customer'
              ? `По заказу «${order.title}» средства возвращены заказчику.`
              : `По заказу «${order.title}» средства выплачены исполнителю.`,
          linkUrl: `/orders/${order.id}`,
        },
        client,
      ),
      createNotification(
        {
          userId: order.performerId,
          actorId: input.actorId,
          type: input.action === 'refund_customer' ? 'order_cancelled' : 'order_completed',
          title: 'Спор закрыт платформой',
          body:
            input.action === 'refund_customer'
              ? `По заказу «${order.title}» средства возвращены заказчику.`
              : `По заказу «${order.title}» средства выплачены исполнителю.`,
          linkUrl: `/orders/${order.id}`,
        },
        client,
      ),
    ]);

    await client.query('commit');

    return {
      orderId: order.id,
      performerId: order.performerId,
      title: order.title,
      action: input.action,
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listAdminActions = async () => {
  const result = await pool.query<AdminActionItem>(
    `${actionSelect} order by admin_actions.created_at desc limit 120`,
  );

  return result.rows;
};
