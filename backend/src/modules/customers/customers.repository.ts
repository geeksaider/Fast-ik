import { pool } from '../../db/pool.js';
import type {
  PublicCustomerContest,
  PublicCustomerJob,
  PublicCustomerListItem,
  PublicCustomerProfile,
  PublicCustomerStats,
  PublicCustomerUser,
} from './customers.types.js';

const customerSelect = `
  select
    users.id,
    users.display_name as "displayName",
    users.status,
    users.created_at as "createdAt",
    user_profiles.user_id as "profileUserId",
    user_profiles.bio,
    user_profiles.city,
    user_profiles.avatar_url as "avatarUrl",
    user_profiles.website_url as "websiteUrl",
    user_profiles.telegram,
    user_profiles.preferred_language as "preferredLanguage",
    customer_profiles.user_id as "customerProfileUserId",
    customer_profiles.company_name as "companyName",
    customer_profiles.company_site as "companySite",
    customer_profiles.company_description as "companyDescription",
    customer_profiles.project_budget_min as "projectBudgetMin",
    customer_profiles.project_budget_max as "projectBudgetMax",
    customer_profiles.moderation_status as "moderationStatus",
    (select count(*)::int from jobs where customer_id = users.id and status = 'published') as "publishedJobsCount",
    (select count(*)::int from orders where customer_id = users.id and status in ('in_progress', 'submitted', 'disputed')) as "activeOrdersCount",
    (select count(*)::int from orders where customer_id = users.id and status = 'completed') as "completedOrdersCount",
    (select count(*)::int from contests where customer_id = users.id and status in ('open', 'review', 'completed')) as "contestsCount",
    (select count(*)::int from order_reviews where reviewer_id = users.id) as "reviewsGivenCount",
    coalesce((select sum(amount)::int from escrow_holds where customer_id = users.id and status in ('held', 'disputed')), 0) as "totalEscrowHeld",
    coalesce((select sum(amount)::int from orders where customer_id = users.id and status = 'completed'), 0) as "totalSpentAmount"
  from users
  join roles on roles.id = users.role_id
  left join user_profiles on user_profiles.user_id = users.id
  left join customer_profiles on customer_profiles.user_id = users.id
`;

type CustomerRow = PublicCustomerUser &
  PublicCustomerStats & {
    profileUserId: string | null;
    bio: string | null;
    city: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    telegram: string | null;
    preferredLanguage: 'ru' | 'en';
    customerProfileUserId: string | null;
    companyName: string | null;
    companySite: string | null;
    companyDescription: string | null;
    projectBudgetMin: number | null;
    projectBudgetMax: number | null;
    moderationStatus: string;
  };

const mapCustomer = (row: CustomerRow): PublicCustomerListItem => ({
  user: {
    id: row.id,
    displayName: row.displayName,
    status: row.status,
    createdAt: row.createdAt,
  },
  profile: row.profileUserId
    ? {
        userId: row.profileUserId,
        bio: row.bio,
        city: row.city,
        avatarUrl: row.avatarUrl,
        websiteUrl: row.websiteUrl,
        telegram: row.telegram,
        preferredLanguage: row.preferredLanguage,
      }
    : null,
  customerProfile: row.customerProfileUserId
    ? {
        userId: row.customerProfileUserId,
        companyName: row.companyName,
        companySite: row.companySite,
        companyDescription: row.companyDescription,
        projectBudgetMin: row.projectBudgetMin,
        projectBudgetMax: row.projectBudgetMax,
        moderationStatus: row.moderationStatus,
      }
    : null,
  stats: {
    publishedJobsCount: row.publishedJobsCount,
    activeOrdersCount: row.activeOrdersCount,
    completedOrdersCount: row.completedOrdersCount,
    contestsCount: row.contestsCount,
    reviewsGivenCount: row.reviewsGivenCount,
    totalEscrowHeld: row.totalEscrowHeld,
    totalSpentAmount: row.totalSpentAmount,
  },
});

export const listPublicCustomers = async (query: { search?: string }) => {
  const result = await pool.query<CustomerRow>(
    `${customerSelect}
     where roles.code = 'customer'
       and users.status = 'active'
       and (
         $1::text is null
         or users.display_name ilike '%' || $1 || '%'
         or customer_profiles.company_name ilike '%' || $1 || '%'
         or customer_profiles.company_description ilike '%' || $1 || '%'
       )
     order by
       "publishedJobsCount" desc,
       "contestsCount" desc,
       users.created_at desc
     limit 60`,
    [query.search ?? null],
  );

  return result.rows.map(mapCustomer);
};

export const getPublicCustomer = async (id: string) => {
  const result = await pool.query<CustomerRow>(
    `${customerSelect}
     where roles.code = 'customer'
       and users.status = 'active'
       and users.id = $1`,
    [id],
  );
  const row = result.rows[0];

  return row ? mapCustomer(row) : null;
};

const listCustomerJobs = async (id: string) => {
  const result = await pool.query<PublicCustomerJob>(
    `select
       jobs.id,
       jobs.title,
       categories.name as "categoryName",
       jobs.budget_min as "budgetMin",
       jobs.budget_max as "budgetMax",
       jobs.deadline_at as "deadlineAt",
       jobs.status,
       jobs.applications_count as "applicationsCount",
       jobs.created_at as "createdAt"
     from jobs
     left join categories on categories.id = jobs.category_id
     where jobs.customer_id = $1
       and jobs.status in ('published', 'in_progress', 'completed')
     order by jobs.created_at desc
     limit 12`,
    [id],
  );

  return result.rows;
};

const listCustomerContests = async (id: string) => {
  const result = await pool.query<PublicCustomerContest>(
    `select
       contests.id,
       contests.title,
       categories.name as "categoryName",
       performer_levels.title as "requiredLevelTitle",
       contests.prize_amount as "prizeAmount",
       contests.deadline_at as "deadlineAt",
       contests.status,
       contests.submissions_count as "submissionsCount",
       contests.created_at as "createdAt"
     from contests
     join performer_levels on performer_levels.id = contests.required_level_id
     left join categories on categories.id = contests.category_id
     where contests.customer_id = $1
       and contests.status in ('open', 'review', 'completed')
     order by contests.created_at desc
     limit 12`,
    [id],
  );

  return result.rows;
};

export const getPublicCustomerProfile = async (
  id: string,
): Promise<PublicCustomerProfile | null> => {
  const customer = await getPublicCustomer(id);

  if (!customer) {
    return null;
  }

  const [jobs, contests] = await Promise.all([listCustomerJobs(id), listCustomerContests(id)]);

  return {
    ...customer,
    jobs,
    contests,
  };
};
