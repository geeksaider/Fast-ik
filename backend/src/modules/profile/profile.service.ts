import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  createPortfolioItem,
  deletePortfolioItem,
  getBaseProfile,
  getCustomerProfile,
  getPerformerProfile,
  listPortfolio,
  listSkills,
  listUserSkills,
  replaceUserSkills,
  updatePortfolioItem,
  upsertBaseProfile,
  upsertCustomerProfile,
  upsertPerformerProfile,
} from './profile.repository.js';
import type {
  PortfolioCreateInput,
  PortfolioUpdateInput,
  ProfileUpdateInput,
  ReplaceSkillsInput,
} from './profile.schemas.js';
import type {
  BaseProfile,
  CustomerProfile,
  OnboardingStep,
  PerformerProfile,
  PortfolioItem,
  ProfileProgress,
  ProfileSummary,
  UserSkill,
} from './profile.types.js';
import { pool } from '../../db/pool.js';

const hasText = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

const calculateCustomerProgress = (
  profile: BaseProfile | null,
  customer: CustomerProfile | null,
): ProfileProgress => {
  const steps: OnboardingStep[] = [
    {
      code: 'base_profile',
      title: 'Базовый профиль',
      description: 'Расскажите, кто вы и из какого города работаете.',
      completed: hasText(profile?.bio) && hasText(profile?.city),
      xp: 25,
    },
    {
      code: 'company',
      title: 'Компания или проект',
      description: 'Укажите название компании или проекта заказчика.',
      completed: hasText(customer?.companyName),
      xp: 25,
    },
    {
      code: 'budget',
      title: 'Бюджетный ориентир',
      description: 'Задайте примерный диапазон бюджета будущих заказов.',
      completed: Boolean(customer?.projectBudgetMin || customer?.projectBudgetMax),
      xp: 25,
    },
    {
      code: 'moderation_ready',
      title: 'Готовность к публикации',
      description: 'Описание компании поможет модерации быстрее пропускать заказы.',
      completed: hasText(customer?.companyDescription),
      xp: 25,
    },
  ];

  return buildProgress(steps);
};

const calculatePerformerProgress = (
  profile: BaseProfile | null,
  performer: PerformerProfile | null,
  skills: UserSkill[],
  portfolio: PortfolioItem[],
): ProfileProgress => {
  const steps: OnboardingStep[] = [
    {
      code: 'base_profile',
      title: 'Личность исполнителя',
      description: 'Заполните описание и город, чтобы заказчик видел живой профиль.',
      completed: hasText(profile?.bio) && hasText(profile?.city),
      xp: 40,
    },
    {
      code: 'positioning',
      title: 'Позиционирование',
      description: 'Добавьте заголовок и специализацию, чтобы профиль было проще найти.',
      completed: hasText(performer?.headline) && hasText(performer?.specialization),
      xp: 40,
    },
    {
      code: 'skills',
      title: 'Навыки',
      description: 'Выберите минимум три навыка и уровень владения.',
      completed: skills.length >= 3,
      xp: 40,
    },
    {
      code: 'portfolio',
      title: 'Портфолио',
      description: 'Добавьте хотя бы один проект, который можно показать заказчику.',
      completed: portfolio.length >= 1,
      xp: 40,
    },
    {
      code: 'rate',
      title: 'Рабочие условия',
      description: 'Укажите ставку или опыт, чтобы заказчик понимал формат сотрудничества.',
      completed: Boolean(performer?.hourlyRate || performer?.experienceYears),
      xp: 40,
    },
  ];

  return buildProgress(steps);
};

const buildProgress = (steps: OnboardingStep[]): ProfileProgress => {
  const completedSteps = steps.filter((step) => step.completed).length;
  const earnedXp = steps.reduce((sum, step) => sum + (step.completed ? step.xp : 0), 0);

  return {
    percentage: Math.round((completedSteps / steps.length) * 100),
    completedSteps,
    totalSteps: steps.length,
    earnedXp,
    steps,
  };
};

const syncPerformerProgress = async (userId: string, progress: ProfileProgress) => {
  const level = await pool.query<{ id: number }>(
    `select id
     from performer_levels
     where required_xp <= $1
     order by required_xp desc
     limit 1`,
    [progress.earnedXp],
  );
  const levelId = level.rows[0]?.id;

  if (!levelId) {
    return;
  }

  await pool.query(
    `insert into performer_progress (user_id, level_id, xp, interview_required, updated_at)
     values ($1, $2, $3, false, now())
     on conflict (user_id) do update set
       level_id = excluded.level_id,
       xp = greatest(performer_progress.xp, excluded.xp),
       updated_at = now()`,
    [userId, levelId, progress.earnedXp],
  );
};

export const getProfileSummary = async (user: AuthUser): Promise<ProfileSummary> => {
  const [profile, customerProfile, performerProfile, skills, portfolio] = await Promise.all([
    getBaseProfile(user.id),
    user.role === 'customer' ? getCustomerProfile(user.id) : Promise.resolve(null),
    user.role === 'performer' ? getPerformerProfile(user.id) : Promise.resolve(null),
    user.role === 'performer' ? listUserSkills(user.id) : Promise.resolve([]),
    user.role === 'performer' ? listPortfolio(user.id) : Promise.resolve([]),
  ]);

  const progress =
    user.role === 'performer'
      ? calculatePerformerProgress(profile, performerProfile, skills, portfolio)
      : calculateCustomerProgress(profile, customerProfile);

  if (user.role === 'performer') {
    await syncPerformerProgress(user.id, progress);
  }

  return {
    user,
    profile,
    customerProfile,
    performerProfile,
    skills,
    portfolio,
    progress,
  };
};

export const updateProfile = async (user: AuthUser, input: ProfileUpdateInput) => {
  await upsertBaseProfile(user.id, input);

  if (user.role === 'customer' && input.customer) {
    await upsertCustomerProfile(user.id, input.customer);
  }

  if (user.role === 'performer' && input.performer) {
    await upsertPerformerProfile(user.id, input.performer);
  }

  return getProfileSummary(user);
};

export const getSkillOptions = async () => ({
  skills: await listSkills(),
});

export const updateUserSkills = async (user: AuthUser, input: ReplaceSkillsInput) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Навыки доступны только исполнителю');
  }

  await replaceUserSkills(user.id, input);

  return getProfileSummary(user);
};

export const addPortfolioItem = async (user: AuthUser, input: PortfolioCreateInput) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Портфолио доступно только исполнителю');
  }

  await createPortfolioItem(user.id, input);

  return getProfileSummary(user);
};

export const editPortfolioItem = async (
  user: AuthUser,
  id: string,
  input: PortfolioUpdateInput,
) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Портфолио доступно только исполнителю');
  }

  const updated = await updatePortfolioItem(user.id, id, input);

  if (!updated) {
    throw new HttpError(404, 'Проект портфолио не найден');
  }

  return getProfileSummary(user);
};

export const removePortfolioItem = async (user: AuthUser, id: string) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Портфолио доступно только исполнителю');
  }

  const deleted = await deletePortfolioItem(user.id, id);

  if (!deleted) {
    throw new HttpError(404, 'Проект портфолио не найден');
  }

  return getProfileSummary(user);
};
