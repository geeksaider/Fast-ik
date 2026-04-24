import { pool } from '../../db/pool.js';
import type {
  BaseProfile,
  CustomerProfile,
  PerformerProfile,
  PortfolioItem,
  Skill,
  UserSkill,
} from './profile.types.js';
import type {
  PortfolioCreateInput,
  PortfolioUpdateInput,
  ProfileUpdateInput,
  ReplaceSkillsInput,
} from './profile.schemas.js';

export const getBaseProfile = async (userId: string) => {
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
    [userId],
  );

  return result.rows[0] ?? null;
};

export const upsertBaseProfile = async (userId: string, input: ProfileUpdateInput) => {
  const result = await pool.query<BaseProfile>(
    `insert into user_profiles (user_id, bio, city, avatar_url, website_url, telegram, preferred_language)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (user_id) do update set
       bio = excluded.bio,
       city = excluded.city,
       avatar_url = excluded.avatar_url,
       website_url = excluded.website_url,
       telegram = excluded.telegram,
       preferred_language = excluded.preferred_language,
       updated_at = now()
     returning
       user_id as "userId",
       bio,
       city,
       avatar_url as "avatarUrl",
       website_url as "websiteUrl",
       telegram,
       preferred_language as "preferredLanguage"`,
    [
      userId,
      input.bio,
      input.city,
      input.avatarUrl,
      input.websiteUrl,
      input.telegram,
      input.preferredLanguage,
    ],
  );

  return result.rows[0] ?? null;
};

export const getCustomerProfile = async (userId: string) => {
  const result = await pool.query<CustomerProfile>(
    `select
       user_id as "userId",
       company_name as "companyName",
       company_site as "companySite",
       company_description as "companyDescription",
       project_budget_min as "projectBudgetMin",
       project_budget_max as "projectBudgetMax",
       moderation_status as "moderationStatus"
     from customer_profiles
     where user_id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
};

export const upsertCustomerProfile = async (
  userId: string,
  input: NonNullable<ProfileUpdateInput['customer']>,
) => {
  const result = await pool.query<CustomerProfile>(
    `insert into customer_profiles (
       user_id,
       company_name,
       company_site,
       company_description,
       project_budget_min,
       project_budget_max,
       moderation_status
     )
     values ($1, $2, $3, $4, $5, $6, 'draft')
     on conflict (user_id) do update set
       company_name = excluded.company_name,
       company_site = excluded.company_site,
       company_description = excluded.company_description,
       project_budget_min = excluded.project_budget_min,
       project_budget_max = excluded.project_budget_max,
       updated_at = now()
     returning
       user_id as "userId",
       company_name as "companyName",
       company_site as "companySite",
       company_description as "companyDescription",
       project_budget_min as "projectBudgetMin",
       project_budget_max as "projectBudgetMax",
       moderation_status as "moderationStatus"`,
    [
      userId,
      input.companyName,
      input.companySite,
      input.companyDescription,
      input.projectBudgetMin,
      input.projectBudgetMax,
    ],
  );

  return result.rows[0] ?? null;
};

export const getPerformerProfile = async (userId: string) => {
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
    [userId],
  );

  return result.rows[0] ?? null;
};

export const upsertPerformerProfile = async (
  userId: string,
  input: NonNullable<ProfileUpdateInput['performer']>,
) => {
  const result = await pool.query<PerformerProfile>(
    `insert into performer_profiles (
       user_id,
       headline,
       hourly_rate,
       availability,
       experience_years,
       specialization
     )
     values ($1, $2, $3, $4, $5, $6)
     on conflict (user_id) do update set
       headline = excluded.headline,
       hourly_rate = excluded.hourly_rate,
       availability = excluded.availability,
       experience_years = excluded.experience_years,
       specialization = excluded.specialization,
       updated_at = now()
     returning
       user_id as "userId",
       headline,
       hourly_rate as "hourlyRate",
       availability,
       experience_years as "experienceYears",
       specialization,
       onboarding_completed as "onboardingCompleted"`,
    [
      userId,
      input.headline,
      input.hourlyRate,
      input.availability,
      input.experienceYears,
      input.specialization,
    ],
  );

  return result.rows[0] ?? null;
};

export const listSkills = async () => {
  const result = await pool.query<Skill>(
    `select
       skills.id,
       skills.name,
       skills.slug,
       skills.category_id as "categoryId",
       categories.name as "categoryName",
       categories.slug as "categorySlug"
     from skills
     left join categories on categories.id = skills.category_id
     order by categories.name nulls last, skills.name`,
  );

  return result.rows;
};

export const listUserSkills = async (userId: string) => {
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
     order by skills.name`,
    [userId],
  );

  return result.rows;
};

export const replaceUserSkills = async (userId: string, input: ReplaceSkillsInput) => {
  const client = await pool.connect();

  try {
    await client.query('begin');
    await client.query('delete from user_skills where user_id = $1', [userId]);

    for (const skill of input.skills) {
      await client.query(
        `insert into user_skills (user_id, skill_id, level)
         values ($1, $2, $3)`,
        [userId, skill.skillId, skill.level],
      );
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listPortfolio = async (userId: string) => {
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
     order by sort_order, created_at desc`,
    [userId],
  );

  return result.rows;
};

export const createPortfolioItem = async (userId: string, input: PortfolioCreateInput) => {
  const result = await pool.query<PortfolioItem>(
    `insert into portfolio_items (user_id, title, description, project_url, cover_url)
     values ($1, $2, $3, $4, $5)
     returning
       id,
       user_id as "userId",
       title,
       description,
       project_url as "projectUrl",
       cover_url as "coverUrl",
       sort_order as "sortOrder",
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [userId, input.title, input.description, input.projectUrl, input.coverUrl],
  );

  return result.rows[0];
};

export const updatePortfolioItem = async (
  userId: string,
  id: string,
  input: PortfolioUpdateInput,
) => {
  const current = await pool.query<PortfolioItem>(
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
     where user_id = $1 and id = $2`,
    [userId, id],
  );
  const item = current.rows[0];

  if (!item) {
    return null;
  }

  const result = await pool.query<PortfolioItem>(
    `update portfolio_items set
       title = $3,
       description = $4,
       project_url = $5,
       cover_url = $6,
       updated_at = now()
     where user_id = $1 and id = $2
     returning
       id,
       user_id as "userId",
       title,
       description,
       project_url as "projectUrl",
       cover_url as "coverUrl",
       sort_order as "sortOrder",
       created_at as "createdAt",
       updated_at as "updatedAt"`,
    [
      userId,
      id,
      input.title ?? item.title,
      input.description ?? item.description,
      input.projectUrl ?? item.projectUrl,
      input.coverUrl ?? item.coverUrl,
    ],
  );

  return result.rows[0] ?? null;
};

export const deletePortfolioItem = async (userId: string, id: string) => {
  const result = await pool.query('delete from portfolio_items where user_id = $1 and id = $2', [
    userId,
    id,
  ]);

  return (result.rowCount ?? 0) > 0;
};
