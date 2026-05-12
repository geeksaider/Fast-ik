import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  createApplication,
  createJob,
  createJobInvite,
  getApplicationById,
  getInviteById,
  getJobById,
  getPerformerInviteTarget,
  hasApplicationForJob,
  listApplicationsByJob,
  listApplicationsByPerformer,
  listCategories,
  listInvitesByJob,
  listInvitesForPerformer,
  listInvitesSentByCustomer,
  listJobs,
  markInviteDeclined,
} from './marketplace.repository.js';
import {
  EscrowBalanceError,
  selectApplicationAndCreateOrder,
} from '../orders/orders.repository.js';
import { createNotification } from '../communication/communication.repository.js';
import { awardPerformerXp } from '../levels/levels.service.js';
import type {
  ApplicationCreateInput,
  JobCreateInput,
  JobInviteCreateInput,
  JobListQuery,
} from './marketplace.schemas.js';
import type { JobApplication, JobDetail, JobInvite } from './marketplace.types.js';

const managerRoles = new Set(['admin']);

const canManageJob = (user: AuthUser | undefined, customerId: string) => {
  if (!user) {
    return false;
  }

  return user.id === customerId || managerRoles.has(user.role);
};

const visibleApplications = (
  applications: JobApplication[],
  user: AuthUser | undefined,
  customerId: string,
) => {
  if (!user) {
    return [];
  }

  if (canManageJob(user, customerId)) {
    return applications;
  }

  if (user.role === 'performer') {
    return applications.filter((application) => application.performerId === user.id);
  }

  return [];
};

const visibleInvites = (invites: JobInvite[], user: AuthUser | undefined, customerId: string) => {
  if (!user) {
    return [];
  }

  if (canManageJob(user, customerId)) {
    return invites;
  }

  if (user.role === 'performer') {
    return invites.filter((invite) => invite.performerId === user.id);
  }

  return [];
};

const buildJobDetail = async (id: string, user?: AuthUser): Promise<JobDetail> => {
  const job = await getJobById(id);

  if (!job) {
    throw new HttpError(404, 'Заказ не найден');
  }

  const [applications, invites] = await Promise.all([
    listApplicationsByJob(job.id),
    listInvitesByJob(job.id),
  ]);
  const myApplication =
    user?.role === 'performer'
      ? (applications.find((application) => application.performerId === user.id) ?? null)
      : null;
  const myInvite =
    user?.role === 'performer'
      ? (invites.find((invite) => invite.performerId === user.id) ?? null)
      : null;
  const canApply = Boolean(
    user?.role === 'performer' && job.status === 'published' && !myApplication,
  );

  return {
    ...job,
    applications: visibleApplications(applications, user, job.customerId),
    invites: visibleInvites(invites, user, job.customerId),
    canApply,
    canManage: canManageJob(user, job.customerId),
    myApplication,
    myInvite,
  };
};

export const getMarketplaceCategories = async () => ({
  categories: await listCategories(),
});

export const getMarketplaceJobs = async (query: JobListQuery, user?: AuthUser) => {
  const customerId = query.mine === 'true' && user?.role === 'customer' ? user.id : null;

  if (query.mine === 'true' && !customerId) {
    return { jobs: [] };
  }

  return {
    jobs: await listJobs({
      ...query,
      customerId,
    }),
  };
};

export const getMarketplaceJob = async (id: string, user?: AuthUser) => buildJobDetail(id, user);

export const publishJob = async (user: AuthUser, input: JobCreateInput) => {
  if (user.role !== 'customer' && !managerRoles.has(user.role)) {
    throw new HttpError(403, 'Создавать заказы может только заказчик');
  }

  const jobId = await createJob(user.id, input);

  if (!jobId) {
    throw new HttpError(500, 'Не удалось создать заказ');
  }

  return buildJobDetail(jobId, user);
};

export const invitePerformerToJob = async (
  user: AuthUser,
  jobId: string,
  input: JobInviteCreateInput,
) => {
  if (user.role !== 'customer' && !managerRoles.has(user.role)) {
    throw new HttpError(403, 'Приглашать исполнителей может только заказчик');
  }

  const [job, performer] = await Promise.all([
    getJobById(jobId),
    getPerformerInviteTarget(input.performerId),
  ]);

  if (!job) {
    throw new HttpError(404, 'Заказ не найден');
  }

  if (!performer || performer.status !== 'active') {
    throw new HttpError(404, 'Исполнитель не найден или недоступен');
  }

  if (!canManageJob(user, job.customerId)) {
    throw new HttpError(403, 'Вы не можете приглашать исполнителей в этот заказ');
  }

  if (job.customerId === input.performerId) {
    throw new HttpError(409, 'Нельзя пригласить себя в собственный заказ');
  }

  if (job.status !== 'published') {
    throw new HttpError(409, 'Приглашать можно только в опубликованный заказ');
  }

  if (await hasApplicationForJob(jobId, input.performerId)) {
    throw new HttpError(409, 'Этот исполнитель уже откликнулся на заказ');
  }

  try {
    const inviteId = await createJobInvite(jobId, job.customerId, input);

    if (!inviteId) {
      throw new HttpError(500, 'Не удалось создать приглашение');
    }

    await createNotification({
      userId: input.performerId,
      actorId: user.id,
      type: 'job_invited',
      title: 'Вас пригласили в заказ',
      body: `${user.displayName} приглашает вас в заказ «${job.title}»`,
      linkUrl: `/jobs/${jobId}`,
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw new HttpError(409, 'Вы уже приглашали этого исполнителя в заказ');
    }

    throw error;
  }

  return buildJobDetail(jobId, user);
};

export const applyToJob = async (user: AuthUser, jobId: string, input: ApplicationCreateInput) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Отклики доступны только исполнителям');
  }

  const job = await getJobById(jobId);

  if (!job) {
    throw new HttpError(404, 'Заказ не найден');
  }

  if (job.customerId === user.id) {
    throw new HttpError(403, 'Нельзя откликнуться на собственный заказ');
  }

  if (job.status !== 'published') {
    throw new HttpError(409, 'На этот заказ уже нельзя откликнуться');
  }

  try {
    const applicationId = await createApplication(jobId, user.id, input);

    if (!applicationId) {
      throw new HttpError(500, 'Не удалось отправить отклик');
    }

    await awardPerformerXp({
      userId: user.id,
      type: 'application_sent',
      dedupeKey: `application_sent:${applicationId}`,
      xp: 15,
      title: 'Отклик отправлен',
      description: `Отклик на заказ «${job.title}»`,
      sourceType: 'job_application',
      sourceId: applicationId,
    });

    await createNotification({
      userId: job.customerId,
      actorId: user.id,
      type: 'application_received',
      title: 'Новый отклик на заказ',
      body: `${user.displayName} откликнулся на заказ «${job.title}»`,
      linkUrl: `/jobs/${jobId}`,
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw new HttpError(409, 'Вы уже откликнулись на этот заказ');
    }

    throw error;
  }

  return buildJobDetail(jobId, user);
};

export const getMyApplications = async (user: AuthUser) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Доступно только исполнителю');
  }

  return listApplicationsByPerformer(user.id);
};

export const getCustomerSentInvites = async (user: AuthUser) => {
  if (user.role !== 'customer') {
    throw new HttpError(403, 'Доступно только заказчику');
  }

  return listInvitesSentByCustomer(user.id);
};

export const getPerformerInvites = async (user: AuthUser) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Приглашения доступны только исполнителям');
  }

  return listInvitesForPerformer(user.id);
};

const ensureOwnPendingInvite = async (user: AuthUser, inviteId: string) => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Действие доступно только исполнителю');
  }

  const invite = await getInviteById(inviteId);

  if (!invite || invite.performerId !== user.id) {
    throw new HttpError(404, 'Приглашение не найдено');
  }

  if (invite.status !== 'pending') {
    throw new HttpError(409, 'Это приглашение уже обработано');
  }

  return invite;
};

export const acceptPerformerInvite = async (user: AuthUser, inviteId: string) => {
  const invite = await ensureOwnPendingInvite(user, inviteId);
  const job = await getJobById(invite.jobId);

  if (!job) {
    throw new HttpError(404, 'Заказ из приглашения недоступен');
  }

  if (job.status !== 'published') {
    throw new HttpError(409, 'Заказ уже закрыт или не принимает отклики');
  }

  const price = job.budgetMax ?? job.budgetMin ?? null;
  const coverLetter =
    invite.message.trim().length >= 10
      ? `Принимаю приглашение. ${invite.message.trim()}`
      : 'Принимаю приглашение заказчика и готов взяться за задачу.';

  return applyToJob(user, invite.jobId, {
    coverLetter,
    price,
    deliveryDays: null,
  });
};

export const declinePerformerInvite = async (user: AuthUser, inviteId: string) => {
  await ensureOwnPendingInvite(user, inviteId);
  await markInviteDeclined(inviteId);

  return { ok: true };
};

export const selectApplication = async (user: AuthUser, jobId: string, applicationId: string) => {
  const job = await getJobById(jobId);

  if (!job) {
    throw new HttpError(404, 'Заказ не найден');
  }

  if (!canManageJob(user, job.customerId)) {
    throw new HttpError(403, 'Вы не можете выбрать исполнителя для этого заказа');
  }

  if (job.status !== 'published') {
    throw new HttpError(409, 'Исполнитель для этого заказа уже выбран или заказ закрыт');
  }

  const application = await getApplicationById(applicationId);

  if (!application || application.jobId !== jobId) {
    throw new HttpError(404, 'Отклик не найден');
  }

  if (application.status !== 'pending') {
    throw new HttpError(409, 'Этот отклик уже обработан');
  }

  try {
    const orderId = await selectApplicationAndCreateOrder({
      jobId,
      applicationId,
      actorId: user.id,
    });

    await awardPerformerXp({
      userId: application.performerId,
      type: 'application_selected',
      dedupeKey: `application_selected:${applicationId}`,
      xp: 70,
      title: 'Заявка выбрана заказчиком',
      description: `Исполнитель выбран для заказа «${job.title}»`,
      sourceType: 'order',
      sourceId: orderId,
    });
  } catch (error) {
    if (error instanceof EscrowBalanceError) {
      throw new HttpError(409, error.message);
    }

    throw error;
  }

  return buildJobDetail(jobId, user);
};
