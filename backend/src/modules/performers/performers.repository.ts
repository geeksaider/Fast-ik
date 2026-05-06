import { pool } from '../../db/pool.js';
import type { PerformerLevel, PerformerProgressRow } from '../levels/levels.types.js';
import type {
  BaseProfile,
  PerformerProfile,
  PortfolioItem,
  UserSkill,
} from '../profile/profile.types.js';
import type {
  PublicPerformerListItem,
  PublicPerformerProfile,
  PublicPerformerReview,
  PublicPerformerStats,
  PublicPerformerUser,
} from './performers.types.js';

type ProgressLevelRow = PerformerProgressRow &
  PerformerLevel & {
    levelInterviewRequired: boolean;
  };

type PerformerListRow = {
  userId: string;
  displayName: string;
  status: string;
  createdAt: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  telegram: string | null;
  preferredLanguage: 'ru' | 'en';
  headline: string | null;
  hourlyRate: number | null;
  availability: 'part_time' | 'full_time' | 'project' | null;
  experienceYears: number | null;
  specialization: string | null;
  onboardingCompleted: boolean | null;
  levelId: number | null;
  xp: number | null;
  completedOrders: number | null;
  rating: number | null;
  interviewRequired: boolean | null;
  interviewPassed: boolean | null;
  progressUpdatedAt: string | null;
  performerLevelId: number | null;
  levelCode: PerformerLevel['code'] | null;
  levelTitle: string | null;
  levelDescription: string | null;
  requiredXp: number | null;
  sortOrder: number | null;
  accent: string | null;
  levelInterviewRequired: boolean | null;
  applicationsCount: number;
  selectedApplicationsCount: number;
  completedOrdersCount: number;
  reviewsCount: number;
  averageRating: number | null;
};

const mapProgressLevel = (row: PerformerListRow) => ({
  progress:
    row.levelId === null
      ? null
      : {
          userId: row.userId,
          levelId: row.levelId,
          xp: row.xp ?? 0,
          completedOrders: row.completedOrders ?? 0,
          rating: row.rating,
          interviewRequired: row.interviewRequired ?? false,
          interviewPassed: row.interviewPassed ?? false,
          updatedAt: row.progressUpdatedAt ?? row.createdAt,
        },
  currentLevel:
    row.performerLevelId === null || !row.levelCode || !row.levelTitle
      ? null
      : {
          id: row.performerLevelId,
          code: row.levelCode,
          title: row.levelTitle,
          description: row.levelDescription,
          requiredXp: row.requiredXp ?? 0,
          sortOrder: row.sortOrder ?? 0,
          accent: row.accent ?? 'ink',
          interviewRequired: row.levelInterviewRequired ?? false,
        },
});

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

export const listPublicPerformers = async (input: {
  search?: string;
}): Promise<PublicPerformerListItem[]> => {
  const search = input.search?.trim();
  const result = await pool.query<PerformerListRow>(
    `select
       users.id as "userId",
       users.display_name as "displayName",
       users.status,
       users.created_at as "createdAt",
       user_profiles.bio,
       user_profiles.city,
       user_profiles.avatar_url as "avatarUrl",
       user_profiles.website_url as "websiteUrl",
       user_profiles.telegram,
       user_profiles.preferred_language as "preferredLanguage",
       performer_profiles.headline,
       performer_profiles.hourly_rate as "hourlyRate",
       performer_profiles.availability,
       performer_profiles.experience_years as "experienceYears",
       performer_profiles.specialization,
       performer_profiles.onboarding_completed as "onboardingCompleted",
       performer_progress.level_id as "levelId",
       performer_progress.xp,
       performer_progress.completed_orders as "completedOrders",
       performer_progress.rating::float8 as rating,
       performer_progress.interview_required as "interviewRequired",
       performer_progress.interview_passed as "interviewPassed",
       performer_progress.updated_at as "progressUpdatedAt",
       performer_levels.id as "performerLevelId",
       performer_levels.code as "levelCode",
       performer_levels.title as "levelTitle",
       performer_levels.description as "levelDescription",
       performer_levels.required_xp as "requiredXp",
       performer_levels.sort_order as "sortOrder",
       performer_levels.accent,
       performer_levels.interview_required as "levelInterviewRequired",
       (select count(*)::int from job_applications where performer_id = users.id) as "applicationsCount",
       (
         select count(*)::int
         from job_applications
         where performer_id = users.id and status = 'accepted'
       ) as "selectedApplicationsCount",
       (
         select count(*)::int
         from orders
         where performer_id = users.id and status = 'completed'
       ) as "completedOrdersCount",
       (select count(*)::int from order_reviews where performer_id = users.id) as "reviewsCount",
       (
         select round(avg(rating)::numeric, 2)::float8
         from order_reviews
         where performer_id = users.id
       ) as "averageRating"
     from users
     join roles on roles.id = users.role_id
     left join user_profiles on user_profiles.user_id = users.id
     left join performer_profiles on performer_profiles.user_id = users.id
     left join performer_progress on performer_progress.user_id = users.id
     left join performer_levels on performer_levels.id = performer_progress.level_id
     where roles.code = 'performer'
       and users.status = 'active'
       and (
         $1::text is null
         or users.display_name ilike '%' || $1 || '%'
         or performer_profiles.headline ilike '%' || $1 || '%'
         or performer_profiles.specialization ilike '%' || $1 || '%'
         or user_profiles.city ilike '%' || $1 || '%'
       )
     order by coalesce(performer_progress.xp, 0) desc,
              coalesce((select avg(rating) from order_reviews where performer_id = users.id), 0) desc,
              users.created_at desc
     limit 60`,
    [search || null],
  );

  return Promise.all(
    result.rows.map(async (row) => {
      const levelState = mapProgressLevel(row);

      return {
        user: {
          id: row.userId,
          displayName: row.displayName,
          status: row.status,
          createdAt: row.createdAt,
        },
        profile: {
          userId: row.userId,
          bio: row.bio,
          city: row.city,
          avatarUrl: row.avatarUrl,
          websiteUrl: row.websiteUrl,
          telegram: row.telegram,
          preferredLanguage: row.preferredLanguage ?? 'ru',
        },
        performerProfile: row.availability
          ? {
              userId: row.userId,
              headline: row.headline,
              hourlyRate: row.hourlyRate,
              availability: row.availability,
              experienceYears: row.experienceYears,
              specialization: row.specialization,
              onboardingCompleted: row.onboardingCompleted ?? false,
            }
          : null,
        skills: await listSkills(row.userId),
        progress: levelState.progress,
        currentLevel: levelState.currentLevel,
        stats: {
          applicationsCount: row.applicationsCount,
          selectedApplicationsCount: row.selectedApplicationsCount,
          completedOrdersCount: row.completedOrdersCount,
          reviewsCount: row.reviewsCount,
          averageRating: row.averageRating,
        },
      };
    }),
  );
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
