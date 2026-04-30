import { pool } from '../../db/pool.js';
import type {
  ApplicationCreateInput,
  JobCreateInput,
  JobInviteCreateInput,
  JobListQuery,
} from './marketplace.schemas.js';
import type { Category, JobApplication, JobInvite, JobListItem } from './marketplace.types.js';

const jobSelect = `
  select
    jobs.id,
    jobs.customer_id as "customerId",
    users.display_name as "customerName",
    jobs.category_id as "categoryId",
    categories.name as "categoryName",
    categories.slug as "categorySlug",
    jobs.title,
    jobs.description,
    jobs.budget_min as "budgetMin",
    jobs.budget_max as "budgetMax",
    jobs.deadline_at as "deadlineAt",
    jobs.status,
    jobs.moderation_status as "moderationStatus",
    jobs.applications_count as "applicationsCount",
    coalesce(array_agg(job_tags.tag order by job_tags.tag) filter (where job_tags.tag is not null), '{}') as tags,
    jobs.created_at as "createdAt",
    jobs.updated_at as "updatedAt"
  from jobs
  join users on users.id = jobs.customer_id
  left join categories on categories.id = jobs.category_id
  left join job_tags on job_tags.job_id = jobs.id
`;

const jobGroupBy = `
  group by
    jobs.id,
    users.display_name,
    categories.name,
    categories.slug
`;

export const listCategories = async () => {
  const result = await pool.query<Category>(
    `select id, name, slug, description
     from categories
     where is_active = true
     order by name`,
  );

  return result.rows;
};

export const listJobs = async (query: JobListQuery & { customerId?: string | null }) => {
  const result = await pool.query<JobListItem>(
    `${jobSelect}
     where jobs.status in ('published', 'in_progress')
       and ($1::text is null or categories.slug = $1)
       and (
         $2::text is null
         or jobs.title ilike '%' || $2 || '%'
         or jobs.description ilike '%' || $2 || '%'
         or exists (
           select 1 from job_tags jt
           where jt.job_id = jobs.id and jt.tag ilike '%' || $2 || '%'
         )
       )
       and ($3::uuid is null or jobs.customer_id = $3)
     ${jobGroupBy}
     order by jobs.created_at desc
     limit 60`,
    [query.category ?? null, query.search ?? null, query.customerId ?? null],
  );

  return result.rows;
};

export const getJobById = async (id: string) => {
  const result = await pool.query<JobListItem>(
    `${jobSelect}
     where jobs.id = $1
     ${jobGroupBy}`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const createJob = async (customerId: string, input: JobCreateInput) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `insert into jobs (
         customer_id,
         category_id,
         title,
         description,
         budget_min,
         budget_max,
         deadline_at,
         status,
         moderation_status
       )
       values ($1, $2, $3, $4, $5, $6, $7, 'published', 'approved')
       returning id`,
      [
        customerId,
        input.categoryId,
        input.title,
        input.description,
        input.budgetMin,
        input.budgetMax,
        input.deadlineAt,
      ],
    );
    const jobId = result.rows[0]?.id;

    for (const tag of [...new Set(input.tags)]) {
      await client.query('insert into job_tags (job_id, tag) values ($1, $2)', [jobId, tag]);
    }

    await client.query('commit');

    return jobId;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listApplicationsByJob = async (jobId: string) => {
  const result = await pool.query<JobApplication>(
    `select
       job_applications.id,
       job_applications.job_id as "jobId",
       job_applications.performer_id as "performerId",
       users.display_name as "performerName",
       job_applications.cover_letter as "coverLetter",
       job_applications.price,
       job_applications.delivery_days as "deliveryDays",
       job_applications.status,
       job_applications.created_at as "createdAt",
       job_applications.updated_at as "updatedAt"
     from job_applications
     join users on users.id = job_applications.performer_id
     where job_applications.job_id = $1
     order by job_applications.created_at desc`,
    [jobId],
  );

  return result.rows;
};

export const listInvitesByJob = async (jobId: string) => {
  const result = await pool.query<JobInvite>(
    `select
       job_invites.id,
       job_invites.job_id as "jobId",
       job_invites.customer_id as "customerId",
       customer.display_name as "customerName",
       job_invites.performer_id as "performerId",
       performer.display_name as "performerName",
       job_invites.message,
       job_invites.status,
       job_invites.created_at as "createdAt",
       job_invites.updated_at as "updatedAt"
     from job_invites
     join users customer on customer.id = job_invites.customer_id
     join users performer on performer.id = job_invites.performer_id
     where job_invites.job_id = $1
     order by job_invites.created_at desc`,
    [jobId],
  );

  return result.rows;
};

export const getPerformerInviteTarget = async (performerId: string) => {
  const result = await pool.query<{ id: string; displayName: string; status: string }>(
    `select users.id, users.display_name as "displayName", users.status
     from users
     join roles on roles.id = users.role_id
     where users.id = $1
       and roles.code = 'performer'`,
    [performerId],
  );

  return result.rows[0] ?? null;
};

export const hasApplicationForJob = async (jobId: string, performerId: string) => {
  const result = await pool.query<{ exists: boolean }>(
    `select exists(
       select 1 from job_applications
       where job_id = $1 and performer_id = $2
     ) as exists`,
    [jobId, performerId],
  );

  return Boolean(result.rows[0]?.exists);
};

export const getApplicationById = async (id: string) => {
  const result = await pool.query<JobApplication>(
    `select
       job_applications.id,
       job_applications.job_id as "jobId",
       job_applications.performer_id as "performerId",
       users.display_name as "performerName",
       job_applications.cover_letter as "coverLetter",
       job_applications.price,
       job_applications.delivery_days as "deliveryDays",
       job_applications.status,
       job_applications.created_at as "createdAt",
       job_applications.updated_at as "updatedAt"
     from job_applications
     join users on users.id = job_applications.performer_id
     where job_applications.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const createApplication = async (
  jobId: string,
  performerId: string,
  input: ApplicationCreateInput,
) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `insert into job_applications (job_id, performer_id, cover_letter, price, delivery_days)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [jobId, performerId, input.coverLetter, input.price, input.deliveryDays],
    );

    await client.query(
      `update jobs
       set applications_count = applications_count + 1,
           updated_at = now()
       where id = $1`,
      [jobId],
    );

    await client.query(
      `update job_invites
       set status = 'accepted',
           updated_at = now()
       where job_id = $1
         and performer_id = $2
         and status = 'pending'`,
      [jobId, performerId],
    );

    await client.query('commit');

    return result.rows[0]?.id;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const createJobInvite = async (
  jobId: string,
  customerId: string,
  input: JobInviteCreateInput,
) => {
  const result = await pool.query<{ id: string }>(
    `insert into job_invites (job_id, customer_id, performer_id, message)
     values ($1, $2, $3, $4)
     returning id`,
    [jobId, customerId, input.performerId, input.message],
  );

  return result.rows[0]?.id ?? null;
};

export const acceptApplication = async (jobId: string, applicationId: string) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    await client.query(
      `update job_applications
       set status = case when id = $2 then 'accepted' else 'rejected' end,
           updated_at = now()
       where job_id = $1`,
      [jobId, applicationId],
    );

    await client.query(
      `update jobs
       set selected_application_id = $2,
           status = 'in_progress',
           updated_at = now()
       where id = $1`,
      [jobId, applicationId],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
