import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';

export const searchRouter = Router();

const searchSchema = z.object({
  q: z.string().trim().min(2).max(80),
});

type SearchResult = {
  query: string;
  jobs: Array<{ id: string; title: string; budgetMin: number | null; budgetMax: number | null }>;
  performers: Array<{ id: string; displayName: string; headline: string | null }>;
  customers: Array<{ id: string; displayName: string; companyName: string | null }>;
  contests: Array<{ id: string; title: string; prizeAmount: number }>;
};

searchRouter.get('/', async (request, response, next) => {
  try {
    const { q } = searchSchema.parse(request.query);
    const pattern = `%${q}%`;

    const [jobs, performers, customers, contests] = await Promise.all([
      pool.query<{ id: string; title: string; budgetMin: number | null; budgetMax: number | null }>(
        `select id, title, budget_min as "budgetMin", budget_max as "budgetMax"
         from jobs
         where status = 'published'
           and (title ilike $1 or description ilike $1)
         order by created_at desc
         limit 8`,
        [pattern],
      ),
      pool.query<{ id: string; displayName: string; headline: string | null }>(
        `select users.id, users.display_name as "displayName", performer_profiles.headline
         from users
         join roles on roles.id = users.role_id
         left join performer_profiles on performer_profiles.user_id = users.id
         left join user_profiles on user_profiles.user_id = users.id
         where roles.code = 'performer'
           and users.status = 'active'
           and (
             users.display_name ilike $1
             or coalesce(performer_profiles.headline, '') ilike $1
             or coalesce(performer_profiles.specialization, '') ilike $1
             or coalesce(user_profiles.bio, '') ilike $1
           )
         order by users.last_login_at desc nulls last
         limit 8`,
        [pattern],
      ),
      pool.query<{ id: string; displayName: string; companyName: string | null }>(
        `select users.id, users.display_name as "displayName", customer_profiles.company_name as "companyName"
         from users
         join roles on roles.id = users.role_id
         left join customer_profiles on customer_profiles.user_id = users.id
         where roles.code = 'customer'
           and users.status = 'active'
           and (
             users.display_name ilike $1
             or coalesce(customer_profiles.company_name, '') ilike $1
             or coalesce(customer_profiles.company_description, '') ilike $1
           )
         order by users.last_login_at desc nulls last
         limit 8`,
        [pattern],
      ),
      pool.query<{ id: string; title: string; prizeAmount: number }>(
        `select id, title, prize_amount as "prizeAmount"
         from contests
         where status in ('open', 'review')
           and (title ilike $1 or brief ilike $1)
         order by created_at desc
         limit 8`,
        [pattern],
      ),
    ]);

    const result: SearchResult = {
      query: q,
      jobs: jobs.rows,
      performers: performers.rows,
      customers: customers.rows,
      contests: contests.rows,
    };

    response.json(result);
  } catch (error) {
    next(error);
  }
});
