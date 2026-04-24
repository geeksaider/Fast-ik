import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  completeOrder,
  disputeOrder as markOrderDisputed,
  getOrderDetail,
  listOrders,
  refundOrder,
  submitOrder as submitOrderResult,
} from './orders.repository.js';
import type { CancelOrderInput, DisputeOrderInput, SubmitOrderInput } from './orders.schemas.js';

const managerRoles = new Set(['admin', 'super_admin', 'moderator', 'support']);

const canManage = (user: AuthUser) => managerRoles.has(user.role);

const ensureOrderAccess = async (user: AuthUser, orderId: string) => {
  const order = await getOrderDetail(orderId);

  if (!order) {
    throw new HttpError(404, 'Заказ в работе не найден');
  }

  if (order.customerId !== user.id && order.performerId !== user.id && !canManage(user)) {
    throw new HttpError(403, 'Нет доступа к этому заказу');
  }

  return order;
};

export const getOrders = async (user: AuthUser) => ({
  orders: await listOrders(user),
});

export const getOrder = async (user: AuthUser, orderId: string) => ensureOrderAccess(user, orderId);

export const submitOrder = async (user: AuthUser, orderId: string, input: SubmitOrderInput) => {
  const order = await ensureOrderAccess(user, orderId);

  if (order.performerId !== user.id && !canManage(user)) {
    throw new HttpError(403, 'Сдать работу может только исполнитель');
  }

  if (order.status !== 'in_progress') {
    throw new HttpError(409, 'Сдать можно только заказ в работе');
  }

  await submitOrderResult(orderId, user.id, input.workResult);

  return ensureOrderAccess(user, orderId);
};

export const acceptOrder = async (user: AuthUser, orderId: string) => {
  const order = await ensureOrderAccess(user, orderId);

  if (order.customerId !== user.id && !canManage(user)) {
    throw new HttpError(403, 'Принять работу может только заказчик');
  }

  if (order.status !== 'submitted') {
    throw new HttpError(409, 'Принять можно только заказ, отправленный на проверку');
  }

  await completeOrder(orderId, user.id);

  return ensureOrderAccess(user, orderId);
};

export const disputeOrder = async (user: AuthUser, orderId: string, input: DisputeOrderInput) => {
  const order = await ensureOrderAccess(user, orderId);

  if (!['in_progress', 'submitted'].includes(order.status)) {
    throw new HttpError(409, 'Спор можно открыть только по активному заказу');
  }

  await markOrderDisputed(orderId, user.id, input.reason);

  return ensureOrderAccess(user, orderId);
};

export const cancelOrder = async (user: AuthUser, orderId: string, input: CancelOrderInput) => {
  const order = await ensureOrderAccess(user, orderId);

  if (order.customerId !== user.id && !canManage(user)) {
    throw new HttpError(403, 'Отменить заказ может заказчик или администратор');
  }

  if (!['in_progress', 'submitted', 'disputed'].includes(order.status)) {
    throw new HttpError(409, 'Этот заказ уже нельзя отменить');
  }

  await refundOrder(orderId, user.id, input.reason ?? null);

  return ensureOrderAccess(user, orderId);
};
