import { pool } from '../../db/pool.js';

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

export const getCustomerAnalyticsData = async (userId: string) => {
  const [jobsResult, ordersResult, escrowResult, invitesResult, transactionsResult] =
    await Promise.all([
      pool.query<{
        totalJobs: string;
        publishedJobs: string;
        applicationsReceived: string;
      }>(
        `select
           count(*)::text as "totalJobs",
           count(*) filter (where status = 'published')::text as "publishedJobs",
           coalesce(sum(applications_count), 0)::text as "applicationsReceived"
         from jobs
         where customer_id = $1`,
        [userId],
      ),
      pool.query<{
        totalOrders: string;
        activeOrders: string;
        completedOrders: string;
        disputedOrders: string;
        cancelledOrders: string;
        completedAmount: string;
        totalAmount: string;
      }>(
        `select
           count(*)::text as "totalOrders",
           count(*) filter (where status in ('in_progress', 'submitted', 'disputed'))::text as "activeOrders",
           count(*) filter (where status = 'completed')::text as "completedOrders",
           count(*) filter (where status = 'disputed')::text as "disputedOrders",
           count(*) filter (where status = 'cancelled')::text as "cancelledOrders",
           coalesce(sum(amount) filter (where status = 'completed'), 0)::text as "completedAmount",
           coalesce(sum(amount), 0)::text as "totalAmount"
         from orders
         where customer_id = $1`,
        [userId],
      ),
      pool.query<{ heldAmount: string }>(
        `select coalesce(sum(amount), 0)::text as "heldAmount"
         from escrow_holds
         where customer_id = $1
           and status in ('held', 'disputed')`,
        [userId],
      ),
      pool.query<{ sentInvites: string }>(
        `select count(*)::text as "sentInvites"
         from job_invites
         where customer_id = $1`,
        [userId],
      ),
      pool.query<{
        topUps: string;
        holds: string;
        releases: string;
        refunds: string;
      }>(
        `select
           coalesce(sum(amount) filter (where type = 'mock_top_up'), 0)::text as "topUps",
           coalesce(sum(amount) filter (where direction = 'hold'), 0)::text as holds,
           coalesce(sum(amount) filter (where direction = 'release'), 0)::text as releases,
           coalesce(sum(amount) filter (where type = 'escrow_refund'), 0)::text as refunds
         from transactions
         where user_id = $1`,
        [userId],
      ),
    ]);

  return {
    jobs: jobsResult.rows[0],
    orders: ordersResult.rows[0],
    escrow: escrowResult.rows[0],
    invites: invitesResult.rows[0],
    transactions: transactionsResult.rows[0],
  };
};

export const getPerformerAnalyticsData = async (userId: string) => {
  const [applicationsResult, ordersResult, reviewsResult, progressResult, invitesResult] =
    await Promise.all([
      pool.query<{
        totalApplications: string;
        acceptedApplications: string;
        pendingApplications: string;
        rejectedApplications: string;
      }>(
        `select
           count(*)::text as "totalApplications",
           count(*) filter (where status = 'accepted')::text as "acceptedApplications",
           count(*) filter (where status = 'pending')::text as "pendingApplications",
           count(*) filter (where status = 'rejected')::text as "rejectedApplications"
         from job_applications
         where performer_id = $1`,
        [userId],
      ),
      pool.query<{
        totalOrders: string;
        activeOrders: string;
        completedOrders: string;
        disputedOrders: string;
        earnedAmount: string;
        activeAmount: string;
      }>(
        `select
           count(*)::text as "totalOrders",
           count(*) filter (where status in ('in_progress', 'submitted', 'disputed'))::text as "activeOrders",
           count(*) filter (where status = 'completed')::text as "completedOrders",
           count(*) filter (where status = 'disputed')::text as "disputedOrders",
           coalesce(sum(amount) filter (where status = 'completed'), 0)::text as "earnedAmount",
           coalesce(sum(amount) filter (where status in ('in_progress', 'submitted', 'disputed')), 0)::text as "activeAmount"
         from orders
         where performer_id = $1`,
        [userId],
      ),
      pool.query<{ reviewsCount: string; averageRating: number | null }>(
        `select
           count(*)::text as "reviewsCount",
           round(avg(rating)::numeric, 2)::float8 as "averageRating"
         from order_reviews
         where performer_id = $1`,
        [userId],
      ),
      pool.query<{
        xp: number;
        completedOrders: number;
        rating: number | null;
        levelTitle: string | null;
      }>(
        `select
           performer_progress.xp,
           performer_progress.completed_orders as "completedOrders",
           performer_progress.rating::float8 as rating,
           performer_levels.title as "levelTitle"
         from performer_progress
         left join performer_levels on performer_levels.id = performer_progress.level_id
         where performer_progress.user_id = $1`,
        [userId],
      ),
      pool.query<{ pendingInvites: string; totalInvites: string }>(
        `select
           count(*) filter (where status = 'pending')::text as "pendingInvites",
           count(*)::text as "totalInvites"
         from job_invites
         where performer_id = $1`,
        [userId],
      ),
    ]);

  return {
    applications: applicationsResult.rows[0],
    orders: ordersResult.rows[0],
    reviews: reviewsResult.rows[0],
    progress: progressResult.rows[0],
    invites: invitesResult.rows[0],
  };
};

export const getAdminAnalyticsData = async () => {
  const [usersResult, jobsResult, ordersResult, escrowResult, communicationsResult] =
    await Promise.all([
      pool.query<{
        totalUsers: string;
        activeUsers: string;
        customers: string;
        performers: string;
      }>(
        `select
           count(*)::text as "totalUsers",
           count(*) filter (where users.status = 'active')::text as "activeUsers",
           count(*) filter (where roles.code = 'customer')::text as customers,
           count(*) filter (where roles.code = 'performer')::text as performers
         from users
         join roles on roles.id = users.role_id`,
      ),
      pool.query<{
        totalJobs: string;
        publishedJobs: string;
        pendingModeration: string;
        totalApplications: string;
        totalInvites: string;
      }>(
        `select
           count(*)::text as "totalJobs",
           count(*) filter (where status = 'published')::text as "publishedJobs",
           count(*) filter (where moderation_status = 'pending')::text as "pendingModeration",
           coalesce(sum(applications_count), 0)::text as "totalApplications",
           (select count(*)::text from job_invites) as "totalInvites"
         from jobs`,
      ),
      pool.query<{
        totalOrders: string;
        activeOrders: string;
        completedOrders: string;
        disputedOrders: string;
        cancelledOrders: string;
        completedAmount: string;
      }>(
        `select
           count(*)::text as "totalOrders",
           count(*) filter (where status in ('in_progress', 'submitted', 'disputed'))::text as "activeOrders",
           count(*) filter (where status = 'completed')::text as "completedOrders",
           count(*) filter (where status = 'disputed')::text as "disputedOrders",
           count(*) filter (where status = 'cancelled')::text as "cancelledOrders",
           coalesce(sum(amount) filter (where status = 'completed'), 0)::text as "completedAmount"
         from orders`,
      ),
      pool.query<{ heldAmount: string }>(
        `select coalesce(sum(amount), 0)::text as "heldAmount"
         from escrow_holds
         where status in ('held', 'disputed')`,
      ),
      pool.query<{ conversations: string; messages: string; attachments: string }>(
        `select
           (select count(*)::text from conversations) as conversations,
           (select count(*)::text from messages) as messages,
           (select count(*)::text from message_attachments) as attachments`,
      ),
    ]);

  return {
    users: usersResult.rows[0],
    jobs: jobsResult.rows[0],
    orders: ordersResult.rows[0],
    escrow: escrowResult.rows[0],
    communications: communicationsResult.rows[0],
  };
};

export { toNumber };
