import { pool } from '../../db/pool.js';
import type {
  ContestCreateInput,
  ContestListQuery,
  ContestSubmissionCreateInput,
} from './contests.schemas.js';
import type { ContestListItem, ContestSubmission } from './contests.types.js';

const contestSelect = `
  select
    contests.id,
    contests.customer_id as "customerId",
    users.display_name as "customerName",
    contests.category_id as "categoryId",
    categories.name as "categoryName",
    categories.slug as "categorySlug",
    contests.required_level_id as "requiredLevelId",
    performer_levels.code as "requiredLevelCode",
    performer_levels.title as "requiredLevelTitle",
    performer_levels.sort_order as "requiredLevelSortOrder",
    contests.title,
    contests.brief,
    contests.prize_amount as "prizeAmount",
    contests.deadline_at as "deadlineAt",
    contests.status,
    contests.submissions_count as "submissionsCount",
    contests.winner_submission_id as "winnerSubmissionId",
    coalesce(array_agg(contest_tags.tag order by contest_tags.tag) filter (where contest_tags.tag is not null), '{}') as tags,
    contests.created_at as "createdAt",
    contests.updated_at as "updatedAt"
  from contests
  join users on users.id = contests.customer_id
  join performer_levels on performer_levels.id = contests.required_level_id
  left join categories on categories.id = contests.category_id
  left join contest_tags on contest_tags.contest_id = contests.id
`;

const contestGroupBy = `
  group by
    contests.id,
    users.display_name,
    categories.name,
    categories.slug,
    performer_levels.code,
    performer_levels.title,
    performer_levels.sort_order
`;

export const listContests = async (
  query: ContestListQuery & { customerId?: string | null; performerId?: string | null },
) => {
  const result = await pool.query<ContestListItem>(
    `${contestSelect}
     where contests.status in ('open', 'review', 'completed')
       and ($1::text is null or categories.slug = $1)
       and (
         $2::text is null
         or contests.title ilike '%' || $2 || '%'
         or contests.brief ilike '%' || $2 || '%'
         or exists (
           select 1 from contest_tags ct
           where ct.contest_id = contests.id and ct.tag ilike '%' || $2 || '%'
         )
       )
       and ($3::uuid is null or contests.customer_id = $3)
       and (
         $4::uuid is null
         or exists (
           select 1 from contest_submissions cs
           where cs.contest_id = contests.id and cs.performer_id = $4
         )
       )
     ${contestGroupBy}
     order by
       case contests.status when 'open' then 1 when 'review' then 2 else 3 end,
       contests.deadline_at asc nulls last,
       contests.created_at desc
     limit 60`,
    [
      query.category ?? null,
      query.search ?? null,
      query.customerId ?? null,
      query.performerId ?? null,
    ],
  );

  return result.rows;
};

export const getContestById = async (id: string) => {
  const result = await pool.query<ContestListItem>(
    `${contestSelect}
     where contests.id = $1
     ${contestGroupBy}`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const getLevelByCode = async (code: string) => {
  const result = await pool.query<{ id: number; title: string; sortOrder: number }>(
    `select id, title, sort_order as "sortOrder"
     from performer_levels
     where code = $1`,
    [code],
  );

  return result.rows[0] ?? null;
};

export const createContest = async (
  customerId: string,
  requiredLevelId: number,
  input: ContestCreateInput,
) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `insert into contests (
         customer_id,
         category_id,
         required_level_id,
         title,
         brief,
         prize_amount,
         deadline_at,
         status
       )
       values ($1, $2, $3, $4, $5, $6, $7, 'open')
       returning id`,
      [
        customerId,
        input.categoryId,
        requiredLevelId,
        input.title,
        input.brief,
        input.prizeAmount,
        input.deadlineAt,
      ],
    );
    const contestId = result.rows[0]?.id;

    for (const tag of [...new Set(input.tags)]) {
      await client.query('insert into contest_tags (contest_id, tag) values ($1, $2)', [
        contestId,
        tag,
      ]);
    }

    await client.query('commit');

    return contestId;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const listSubmissionsByContest = async (contestId: string) => {
  const result = await pool.query<ContestSubmission>(
    `select
       contest_submissions.id,
       contest_submissions.contest_id as "contestId",
       contest_submissions.performer_id as "performerId",
       users.display_name as "performerName",
       contest_submissions.pitch,
       contest_submissions.preview_url as "previewUrl",
       contest_submissions.status,
       contest_submissions.created_at as "createdAt",
       contest_submissions.updated_at as "updatedAt"
     from contest_submissions
     join users on users.id = contest_submissions.performer_id
     where contest_submissions.contest_id = $1
     order by
       case contest_submissions.status when 'winner' then 1 when 'submitted' then 2 else 3 end,
       contest_submissions.created_at desc`,
    [contestId],
  );

  return result.rows;
};

export const getSubmissionById = async (id: string) => {
  const result = await pool.query<ContestSubmission>(
    `select
       contest_submissions.id,
       contest_submissions.contest_id as "contestId",
       contest_submissions.performer_id as "performerId",
       users.display_name as "performerName",
       contest_submissions.pitch,
       contest_submissions.preview_url as "previewUrl",
       contest_submissions.status,
       contest_submissions.created_at as "createdAt",
       contest_submissions.updated_at as "updatedAt"
     from contest_submissions
     join users on users.id = contest_submissions.performer_id
     where contest_submissions.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
};

export const createContestSubmission = async (
  contestId: string,
  performerId: string,
  input: ContestSubmissionCreateInput,
) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `insert into contest_submissions (contest_id, performer_id, pitch, preview_url)
       values ($1, $2, $3, $4)
       returning id`,
      [contestId, performerId, input.pitch, input.previewUrl],
    );
    const submissionId = result.rows[0]?.id;

    await client.query(
      `update contests
       set submissions_count = submissions_count + 1,
           updated_at = now()
       where id = $1`,
      [contestId],
    );

    await client.query('commit');

    return submissionId;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const getPerformerContestGate = async (
  performerId: string,
  requiredLevelSortOrder: number,
) => {
  const result = await pool.query<{
    performerLevelTitle: string | null;
    performerLevelSortOrder: number | null;
  }>(
    `select
       performer_levels.title as "performerLevelTitle",
       performer_levels.sort_order as "performerLevelSortOrder"
     from performer_progress
     left join performer_levels on performer_levels.id = performer_progress.level_id
     where performer_progress.user_id = $1`,
    [performerId],
  );
  const row = result.rows[0] ?? { performerLevelTitle: null, performerLevelSortOrder: null };

  return {
    ...row,
    allowed: (row.performerLevelSortOrder ?? 0) >= requiredLevelSortOrder,
  };
};

export const selectContestWinner = async (contestId: string, submissionId: string) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const submissionResult = await client.query<{ performerId: string }>(
      `select performer_id as "performerId"
       from contest_submissions
       where id = $1 and contest_id = $2`,
      [submissionId, contestId],
    );
    const submission = submissionResult.rows[0];

    if (!submission) {
      await client.query('rollback');
      return null;
    }

    await client.query(
      `update contest_submissions
       set status = case when id = $2 then 'winner' else 'rejected' end,
           updated_at = now()
       where contest_id = $1`,
      [contestId, submissionId],
    );

    await client.query(
      `update contests
       set status = 'completed',
           winner_submission_id = $2,
           updated_at = now()
       where id = $1`,
      [contestId, submissionId],
    );

    await client.query('commit');

    return { performerId: submission.performerId };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
