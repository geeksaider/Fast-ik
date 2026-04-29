import { pool } from '../../db/pool.js';
import type { PerformerLevel, PerformerProgressRow } from '../levels/levels.types.js';
import type {
  BaseProfile,
  PerformerProfile,
  PortfolioItem,
  UserSkill,
} from '../profile/profile.types.js';
import type {
  PublicPerformerProfile,
  PublicPerformerReview,
  PublicPerformerStats,
  PublicPerformerUser,
} from './performers.types.js';

type ProgressLevelRow = PerformerProgressRow &
  PerformerLevel & {
    levelInterviewRequired: boolean;
  };

export const getPublicPerformerUser = async (id: string) => {
  const result = await pool.query<PublicPerformerUser>(
    `select
       users.id,
       users.display_name as "displayName",
       users.status,
       users.created_at as "createdAt"
     from users
     join roles on roles.id = users.role_id
     where users.id = $1
       and roles.code = 'performer'
       and users.status = 'active'`,
    [id],
  );

  return result.rows[0] ?? null;
};

const getBaseProfile = async (id: string) => {
  const result = await pool.query<BaseProfile>(
    `select
       user_id as "userId",
       bio,
       city,
       avatar_url as "avatarUrl",
       website_url as "websiteUrl",
       telegram,
       preferred_language as "preferredLanguage"
     from user_profiles
     where user_id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

const getPerformerProfile = async (id: string) => {
  const result = await pool.query<PerformerProfile>(
    `select
       user_id as "userId",
       headline,
       hourly_rate as "hourlyRate",
       availability,
       experience_years as "experienceYears",
       specialization,
       onboarding_completed as "onboardingCompleted"
     from performer_profiles
     where user_id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

const listSkills = async (id: string) => {
  const result = await pool.query<UserSkill>(
    `select
       skills.id,
       skills.name,
       skills.slug,
       skills.category_id as "categoryId",
       categories.name as "categoryName",
       categories.slug as "categorySlug",
       user_skills.level
     from user_skills
     join skills on skills.id = user_skills.skill_id
     left join categories on categories.id = skills.category_id
     where user_skills.user_id = $1
     order by
       case user_skills.level when 'senior' then 1 when 'middle' then 2 else 3 end,
       skills.name`,
    [id],
  );

  return result.rows;
};

const listPortfolio = async (id: string) => {
  const result = await pool.query<PortfolioItem>(
    `select
       id,
       user_id as "userId",
       title,
       description,
       project_url as "projectUrl",
       cover_url as "coverUrl",
       sort_order as "sortOrder",
       created_at as "createdAt",
       updated_at as "updatedAt"
     from portfolio_items
     where user_id = $1
     order by sort_order, created_at desc
     limit 12`,
    [id],
  );

  return result.rows;
};

const getProgress = async (id: string) => {
  const result = await pool.query<ProgressLevelRow>(
    `select
       performer_progress.user_id as "userId",
       performer_progress.level_id as "levelId",
       performer_progress.xp,
       performer_progress.completed_orders as "completedOrders",
       performer_progress.rating::float8 as rating,
       performer_progress.interview_required as "interviewRequired",
       performer_progress.interview_passed as "interviewPassed",
       performer_progress.updated_at as "updatedAt",
       performer_levels.id,
       performer_levels.code,
       performer_levels.title,
       performer_levels.description,
       performer_levels.required_xp as "requiredXp",
       performer_levels.sort_order as "sortOrder",
       performer_levels.accent,
       performer_levels.interview_required as "levelInterviewRequired"
     from performer_progress
     join performer_levels on performer_levels.id = performer_progress.level_id
     where performer_progress.user_id = $1`,
    [id],
  );
  const row = result.rows[0];

  if (!row) {
    return { progress: null, currentLevel: null };
  }

  return {
    progress: {
      userId: row.userId,
      levelId: row.levelId,
      xp: row.xp,
      completedOrders: row.completedOrders,
      rating: row.rating,
      interviewRequired: row.interviewRequired,
      interviewPassed: row.interviewPassed,
      updatedAt: row.updatedAt,
    },
    currentLevel: {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      requiredXp: row.requiredXp,
      sortOrder: row.sortOrder,
      accent: row.accent,
      interviewRequired: row.levelInterviewRequired,
    },
  };
};

const getStats = async (id: string) => {
  const result = await pool.query<PublicPerformerStats>(
    `select
       (select count(*)::int from job_applications where performer_id = $1) as "applicationsCount",
       (select count(*)::int from job_applications where performer_id = $1 and status = 'accepted') as "selectedApplicationsCount",
       (select count(*)::int from orders where performer_id = $1 and status = 'completed') as "completedOrdersCount",
       (select count(*)::int from order_reviews where performer_id = $1) as "reviewsCount",
       (
         select round(avg(rating)::numeric, 2)::float8
         from order_reviews
         where performer_id = $1
       ) as "averageRating"`,
    [id],
  );

  return result.rows[0];
};

const listReviews = async (id: string) => {
  const result = await pool.query<PublicPerformerReview>(
    `select
       order_reviews.id,
       order_reviews.order_id as "orderId",
       orders.title as "orderTitle",
       order_reviews.reviewer_id as "reviewerId",
       reviewer.display_name as "reviewerName",
       order_reviews.rating,
       order_reviews.comment,
       order_reviews.created_at as "createdAt"
     from order_reviews
     join orders on orders.id = order_reviews.order_id
     join users reviewer on reviewer.id = order_reviews.reviewer_id
     where order_reviews.performer_id = $1
     order by order_reviews.created_at desc
     limit 12`,
    [id],
  );

  return result.rows;
};

export const getPublicPerformerProfile = async (
  id: string,
): Promise<PublicPerformerProfile | null> => {
  const user = await getPublicPerformerUser(id);

  if (!user) {
    return null;
  }

  const [profile, performerProfile, skills, portfolio, levelState, stats, reviews] =
    await Promise.all([
      getBaseProfile(id),
      getPerformerProfile(id),
      listSkills(id),
      listPortfolio(id),
      getProgress(id),
      getStats(id),
      listReviews(id),
    ]);

  return {
    user,
    profile,
    performerProfile,
    skills,
    portfolio,
    progress: levelState.progress,
    currentLevel: levelState.currentLevel,
    stats,
    reviews,
  };
};
