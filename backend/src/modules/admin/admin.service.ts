import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import { awardPerformerXp } from '../levels/levels.service.js';
import { recalculatePerformerProgress } from '../levels/levels.service.js';
import type { AdminPermission } from './admin.types.js';
import type {
  DecideInterviewInput,
  ModerateJobInput,
  ResolveDisputeInput,
  UpdateUserStatusInput,
} from './admin.schemas.js';
import {
  decideAdminPerformerInterview,
  getAdminOverview,
  listAdminActions,
  listAdminDisputes,
  listAdminInterviews,
  listAdminModerationJobs,
  listAdminUsers,
  moderateAdminJob,
  resolveAdminDispute,
  updateAdminUserStatus,
} from './admin.repository.js';

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);

const getPermissions = (user: AuthUser): AdminPermission[] => {
  if (!managerRoles.has(user.role)) {
    return [];
  }

  const permissions: AdminPermission[] = ['overview'];

  if (['support', 'admin', 'super_admin'].includes(user.role)) {
    permissions.push('disputes');
  }

  if (['moderator', 'admin', 'super_admin'].includes(user.role)) {
    permissions.push('moderation');
  }

  if (['admin', 'super_admin'].includes(user.role)) {
    permissions.push('users', 'interviews', 'auditLog');
  }

  return permissions;
};

const ensurePermission = (user: AuthUser, permission: AdminPermission) => {
  if (!getPermissions(user).includes(permission)) {
    throw new HttpError(403, 'Недостаточно прав для этого раздела админки');
  }
};

const mapAdminError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return error;
  }

  if (error.message === 'USER_NOT_FOUND') {
    return new HttpError(404, 'Пользователь не найден');
  }

  if (error.message === 'PERFORMER_NOT_FOUND') {
    return new HttpError(404, 'Исполнитель не найден');
  }

  if (error.message === 'JOB_NOT_FOUND') {
    return new HttpError(404, 'Заказ для модерации не найден');
  }

  if (error.message === 'ORDER_NOT_FOUND') {
    return new HttpError(404, 'Спорный заказ не найден');
  }

  if (error.message === 'DISPUTE_ALREADY_RESOLVED') {
    return new HttpError(409, 'Спор уже закрыт или escrow не находится в споре');
  }

  if (error.message === 'ESCROW_STATE_INVALID') {
    return new HttpError(409, 'Состояние мок-гаранта не позволяет закрыть спор');
  }

  return error;
};

export const getAdminDashboard = async (user: AuthUser) => {
  ensurePermission(user, 'overview');

  return getAdminOverview(getPermissions(user));
};

export const getAdminUsers = async (user: AuthUser) => {
  ensurePermission(user, 'users');

  return { users: await listAdminUsers() };
};

export const changeAdminUserStatus = async (
  user: AuthUser,
  userId: string,
  input: UpdateUserStatusInput,
) => {
  ensurePermission(user, 'users');

  if (user.id === userId && input.status === 'blocked') {
    throw new HttpError(409, 'Нельзя заблокировать собственный аккаунт');
  }

  try {
    return { user: await updateAdminUserStatus({ actorId: user.id, userId, ...input }) };
  } catch (error) {
    throw mapAdminError(error);
  }
};

export const getAdminDisputes = async (user: AuthUser) => {
  ensurePermission(user, 'disputes');

  return { disputes: await listAdminDisputes() };
};

export const closeAdminDispute = async (
  user: AuthUser,
  orderId: string,
  input: ResolveDisputeInput,
) => {
  ensurePermission(user, 'disputes');

  try {
    const result = await resolveAdminDispute({ actorId: user.id, orderId, ...input });

    if (result.action === 'pay_performer') {
      await awardPerformerXp({
        userId: result.performerId,
        type: 'order_completed',
        dedupeKey: `order_completed:${result.orderId}`,
        xp: 220,
        title: 'Заказ завершен после спора',
        description: `Платформа закрыла спор по заказу «${result.title}» в пользу исполнителя`,
        sourceType: 'order',
        sourceId: result.orderId,
      });
    }

    return { disputes: await listAdminDisputes(), result };
  } catch (error) {
    throw mapAdminError(error);
  }
};

export const getAdminModerationJobs = async (user: AuthUser) => {
  ensurePermission(user, 'moderation');

  return { jobs: await listAdminModerationJobs() };
};

export const reviewAdminJob = async (user: AuthUser, jobId: string, input: ModerateJobInput) => {
  ensurePermission(user, 'moderation');

  try {
    return { job: await moderateAdminJob({ actorId: user.id, jobId, ...input }) };
  } catch (error) {
    throw mapAdminError(error);
  }
};

export const getAdminInterviews = async (user: AuthUser) => {
  ensurePermission(user, 'interviews');

  return { interviews: await listAdminInterviews() };
};

export const decideAdminInterview = async (
  user: AuthUser,
  performerId: string,
  input: DecideInterviewInput,
) => {
  ensurePermission(user, 'interviews');

  try {
    const result = await decideAdminPerformerInterview({
      actorId: user.id,
      performerId,
      ...input,
    });

    await recalculatePerformerProgress(performerId);

    return { interviews: await listAdminInterviews(), result };
  } catch (error) {
    throw mapAdminError(error);
  }
};

export const getAdminAuditLog = async (user: AuthUser) => {
  ensurePermission(user, 'auditLog');

  return { actions: await listAdminActions() };
};
