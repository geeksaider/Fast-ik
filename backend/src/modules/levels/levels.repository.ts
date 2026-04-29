import { pool } from '../../db/pool.js';
import type { PerformerLevel, PerformerProgressRow, XpEvent } from './levels.types.js';

type AwardXpInput = {
  userId: string;
  type: string;
  dedupeKey: string;
  xp: number;
  title: string;
  description?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
};

export type PerformerMetrics = {
  hasBaseProfile: boolean;
  hasPositioning: boolean;
  hasWorkTerms: boolean;
  skillsCount: number;
  portfolioCount: number;
  applicationsCount: number;
  selectedApplicationsCount: number;
  submittedOrdersCount: number;
  completedOrdersCount: number;
  disputedOrdersCount: number;
  reviewsCount: number;
  averageRating: number | null;
  totalEventXp: number;
};

export const listPerformerLevels = async () => {
  const result = await pool.query<PerformerLevel>(
    `select
       id,
       code,
       title,
       description,
       required_xp as "requiredXp",
       sort_order as "sortOrder",
       accent,
       interview_required as "interviewRequired"
     from performer_levels
     order by sort_order asc`,
  );

  return result.rows;
};

export const getPerformerProgress = async (userId: string) => {
  const result = await pool.query<PerformerProgressRow>(
    `select
       user_id as "userId",
       level_id as "levelId",
       xp,
       completed_orders as "completedOrders",
       rating::float8 as rating,
       interview_required as "interviewRequired",
       interview_passed as "interviewPassed",
       updated_at as "updatedAt"
     from performer_progress
     where user_id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
};

export const getPerformerMetrics = async (userId: string): Promise<PerformerMetrics> => {
  const result = await pool.query<PerformerMetrics>(
    `select
       exists(
         select 1 from user_profiles
         where user_id = $1
           and length(trim(coalesce(bio, ''))) > 0
           and length(trim(coalesce(city, ''))) > 0
       ) as "hasBaseProfile",
       exists(
         select 1 from performer_profiles
         where user_id = $1
           and length(trim(coalesce(headline, ''))) > 0
           and length(trim(coalesce(specialization, ''))) > 0
       ) as "hasPositioning",
       exists(
         select 1 from performer_profiles
         where user_id = $1
           and (hourly_rate is not null or experience_years is not null)
       ) as "hasWorkTerms",
       (select count(*)::int from user_skills where user_id = $1) as "skillsCount",
       (select count(*)::int from portfolio_items where user_id = $1) as "portfolioCount",
       (select count(*)::int from job_applications where performer_id = $1) as "applicationsCount",
       (select count(*)::int from job_applications where performer_id = $1 and status = 'accepted') as "selectedApplicationsCount",
       (select count(*)::int from orders where performer_id = $1 and submitted_at is not null) as "submittedOrdersCount",
       (select count(*)::int from orders where performer_id = $1 and status = 'completed') as "completedOrdersCount",
       (select count(*)::int from orders where performer_id = $1 and status = 'disputed') as "disputedOrdersCount",
       (select count(*)::int from order_reviews where performer_id = $1) as "reviewsCount",
       (
         select round(avg(rating)::numeric, 2)::float8
         from order_reviews
         where performer_id = $1
       ) as "averageRating",
       coalesce((select sum(xp)::int from performer_xp_events where user_id = $1), 0) as "totalEventXp"`,
    [userId],
  );

  return result.rows[0];
};

export const listXpEvents = async (userId: string) => {
  const result = await pool.query<XpEvent>(
    `select
       id,
       user_id as "userId",
       type,
       source_type as "sourceType",
       source_id as "sourceId",
       dedupe_key as "dedupeKey",
       xp,
       title,
       description,
       created_at as "createdAt"
     from performer_xp_events
     where user_id = $1
     order by created_at desc
     limit 80`,
    [userId],
  );

  return result.rows;
};

export const insertXpEvent = async (input: AwardXpInput) => {
  const result = await pool.query<XpEvent>(
    `insert into performer_xp_events (
       user_id,
       type,
       source_type,
       source_id,
       dedupe_key,
       xp,
       title,
       description
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (user_id, dedupe_key) do nothing
     returning
       id,
       user_id as "userId",
       type,
       source_type as "sourceType",
       source_id as "sourceId",
       dedupe_key as "dedupeKey",
       xp,
       title,
       description,
       created_at as "createdAt"`,
    [
      input.userId,
      input.type,
      input.sourceType ?? null,
      input.sourceId ?? null,
      input.dedupeKey,
      input.xp,
      input.title,
      input.description ?? null,
    ],
  );

  return result.rows[0] ?? null;
};

export const upsertPerformerProgress = async (input: {
  userId: string;
  levelId: number;
  xp: number;
  completedOrders: number;
  rating: number | null;
  interviewRequired: boolean;
}) => {
  const result = await pool.query<PerformerProgressRow>(
    `insert into performer_progress (user_id, level_id, xp, completed_orders, rating, interview_required, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (user_id) do update set
       level_id = excluded.level_id,
       xp = excluded.xp,
       completed_orders = excluded.completed_orders,
       rating = excluded.rating,
       interview_required = excluded.interview_required,
       updated_at = now()
     returning
       user_id as "userId",
       level_id as "levelId",
       xp,
       completed_orders as "completedOrders",
       rating::float8 as rating,
       interview_required as "interviewRequired",
       interview_passed as "interviewPassed",
       updated_at as "updatedAt"`,
    [
      input.userId,
      input.levelId,
      input.xp,
      input.completedOrders,
      input.rating,
      input.interviewRequired,
    ],
  );

  return result.rows[0];
};
