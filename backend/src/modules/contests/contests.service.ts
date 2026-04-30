import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import { createNotification } from '../communication/communication.repository.js';
import { awardPerformerXp, recalculatePerformerProgress } from '../levels/levels.service.js';
import {
  createContest,
  createContestSubmission,
  getContestById,
  getLevelByCode,
  getPerformerContestGate,
  getSubmissionById,
  listContests,
  listSubmissionsByContest,
  selectContestWinner,
} from './contests.repository.js';
import type {
  ContestCreateInput,
  ContestListQuery,
  ContestSubmissionCreateInput,
} from './contests.schemas.js';
import type { ContestDetail, ContestSubmission } from './contests.types.js';

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);

const canManageContest = (user: AuthUser | undefined, customerId: string) => {
  if (!user) {
    return false;
  }

  return user.id === customerId || managerRoles.has(user.role);
};

const visibleSubmissions = (
  submissions: ContestSubmission[],
  user: AuthUser | undefined,
  customerId: string,
) => {
  if (!user) {
    return [];
  }

  if (canManageContest(user, customerId)) {
    return submissions;
  }

  if (user.role === 'performer') {
    return submissions.filter((submission) => submission.performerId === user.id);
  }

  return [];
};

const buildContestDetail = async (id: string, user?: AuthUser): Promise<ContestDetail> => {
  const contest = await getContestById(id);

  if (!contest) {
    throw new HttpError(404, 'Конкурс не найден');
  }

  const submissions = await listSubmissionsByContest(contest.id);
  const mySubmission =
    user?.role === 'performer'
      ? (submissions.find((submission) => submission.performerId === user.id) ?? null)
      : null;
  const canManage = canManageContest(user, contest.customerId);
  if (user?.role === 'performer') {
    await recalculatePerformerProgress(user.id);
  }

  const performerGate =
    user?.role === 'performer'
      ? await getPerformerContestGate(user.id, contest.requiredLevelSortOrder)
      : null;
  const levelGate = performerGate
    ? {
        allowed: performerGate.allowed,
        requiredLevelTitle: contest.requiredLevelTitle,
        requiredLevelSortOrder: contest.requiredLevelSortOrder,
        performerLevelTitle: performerGate.performerLevelTitle,
        performerLevelSortOrder: performerGate.performerLevelSortOrder,
      }
    : null;
  const canSubmit = Boolean(
    user?.role === 'performer' &&
    contest.status === 'open' &&
    !mySubmission &&
    levelGate?.allowed &&
    contest.customerId !== user.id,
  );

  return {
    ...contest,
    submissions: visibleSubmissions(submissions, user, contest.customerId),
    canSubmit,
    canManage,
    mySubmission,
    levelGate,
  };
};

export const getContests = async (query: ContestListQuery, user?: AuthUser) => {
  const customerId = query.mine === 'true' && user?.role === 'customer' ? user.id : null;

  if (query.mine === 'true' && !customerId) {
    return { contests: [] };
  }

  return {
    contests: await listContests({
      ...query,
      customerId,
    }),
  };
};

export const getContest = async (id: string, user?: AuthUser) => buildContestDetail(id, user);

export const publishContest = async (user: AuthUser, input: ContestCreateInput) => {
  if (user.role !== 'customer' && !managerRoles.has(user.role)) {
    throw new HttpError(403, 'Создавать конкурсы может только заказчик');
  }

  const level = await getLevelByCode(input.requiredLevelCode);

  if (!level) {
    throw new HttpError(400, 'Уровень допуска не найден');
  }

  const contestId = await createContest(user.id, level.id, input);

  if (!contestId) {
    throw new HttpError(500, 'Не удалось создать конкурс');
  }

  return buildContestDetail(contestId, user);
};

export const submitContestEntry = async (
  user: AuthUser,
  contestId: string,
  input: ContestSubmissionCreateInput,
) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Участвовать в конкурсах могут только исполнители');
  }

  await recalculatePerformerProgress(user.id);
  const contest = await getContestById(contestId);

  if (!contest) {
    throw new HttpError(404, 'Конкурс не найден');
  }

  if (contest.customerId === user.id) {
    throw new HttpError(403, 'Нельзя участвовать в собственном конкурсе');
  }

  if (contest.status !== 'open') {
    throw new HttpError(409, 'Прием работ по этому конкурсу уже закрыт');
  }

  const gate = await getPerformerContestGate(user.id, contest.requiredLevelSortOrder);

  if (!gate.allowed) {
    throw new HttpError(
      403,
      `Для участия нужен уровень «${contest.requiredLevelTitle}» или выше. Сейчас: ${gate.performerLevelTitle ?? 'уровень не рассчитан'}`,
    );
  }

  try {
    const submissionId = await createContestSubmission(contestId, user.id, input);

    if (!submissionId) {
      throw new HttpError(500, 'Не удалось отправить работу на конкурс');
    }

    await awardPerformerXp({
      userId: user.id,
      type: 'contest_submission',
      dedupeKey: `contest_submission:${submissionId}`,
      xp: 25,
      title: 'Участие в конкурсе',
      description: `Работа отправлена на конкурс «${contest.title}»`,
      sourceType: 'contest_submission',
      sourceId: submissionId,
    });

    await createNotification({
      userId: contest.customerId,
      actorId: user.id,
      type: 'contest_submission_received',
      title: 'Новая работа на конкурс',
      body: `${user.displayName} отправил работу на конкурс «${contest.title}»`,
      linkUrl: `/contests/${contestId}`,
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw new HttpError(409, 'Вы уже участвуете в этом конкурсе');
    }

    throw error;
  }

  return buildContestDetail(contestId, user);
};

export const chooseContestWinner = async (
  user: AuthUser,
  contestId: string,
  submissionId: string,
) => {
  const contest = await getContestById(contestId);

  if (!contest) {
    throw new HttpError(404, 'Конкурс не найден');
  }

  if (!canManageContest(user, contest.customerId)) {
    throw new HttpError(403, 'Вы не можете выбрать победителя этого конкурса');
  }

  if (contest.status === 'completed' || contest.status === 'cancelled') {
    throw new HttpError(409, 'Конкурс уже закрыт');
  }

  const submission = await getSubmissionById(submissionId);

  if (!submission || submission.contestId !== contestId) {
    throw new HttpError(404, 'Работа конкурса не найдена');
  }

  if (submission.status !== 'submitted') {
    throw new HttpError(409, 'Эта работа уже обработана');
  }

  const result = await selectContestWinner(contestId, submissionId);

  if (!result) {
    throw new HttpError(404, 'Работа конкурса не найдена');
  }

  await awardPerformerXp({
    userId: result.performerId,
    type: 'contest_won',
    dedupeKey: `contest_won:${contestId}`,
    xp: 120,
    title: 'Победа в конкурсе',
    description: `Заказчик выбрал вашу работу в конкурсе «${contest.title}»`,
    sourceType: 'contest_submission',
    sourceId: submissionId,
  });

  await createNotification({
    userId: result.performerId,
    actorId: user.id,
    type: 'contest_won',
    title: 'Вы победили в конкурсе',
    body: `Ваша работа выбрана победителем конкурса «${contest.title}»`,
    linkUrl: `/contests/${contestId}`,
  });

  return buildContestDetail(contestId, user);
};
