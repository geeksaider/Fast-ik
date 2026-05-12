import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import { createNotification } from '../communication/communication.repository.js';
import { awardPerformerXp } from '../levels/levels.service.js';
import {
  completeOrder,
  createOrderReview,
  disputeOrder as markOrderDisputed,
  getOrderDetail,
  listOrders,
  refundOrder,
  submitOrder as submitOrderResult,
} from './orders.repository.js';
import type {
  CancelOrderInput,
  CreateOrderReviewInput,
  DisputeOrderInput,
  SubmitOrderInput,
} from './orders.schemas.js';
import type { OrderDetail } from './orders.types.js';

const managerRoles = new Set(['admin']);

const canManage = (user: AuthUser) => managerRoles.has(user.role);

const reviewXpByRating = (rating: number) => {
  if (rating >= 5) {
    return 140;
  }

  if (rating === 4) {
    return 90;
  }

  if (rating === 3) {
    return 30;
  }

  return 0;
};

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

const notifyOrderSide = async (
  order: OrderDetail,
  user: AuthUser,
  input: {
    type: 'order_submitted' | 'order_completed' | 'order_disputed' | 'order_cancelled';
    title: string;
    body: string;
    recipients?: string[];
  },
) => {
  const recipients = input.recipients ?? [order.customerId, order.performerId];

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        actorId: user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        linkUrl: `/orders/${order.id}`,
      }),
    ),
  );
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
  await awardPerformerXp({
    userId: order.performerId,
    type: 'order_submitted',
    dedupeKey: `order_submitted:${order.id}`,
    xp: 80,
    title: 'Работа отправлена на проверку',
    description: `Результат по заказу «${order.title}» отправлен заказчику`,
    sourceType: 'order',
    sourceId: order.id,
  });
  await notifyOrderSide(order, user, {
    type: 'order_submitted',
    title: 'Работа отправлена на проверку',
    body: `Исполнитель отправил результат по заказу «${order.title}»`,
    recipients: [order.customerId],
  });

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
  await awardPerformerXp({
    userId: order.performerId,
    type: 'order_completed',
    dedupeKey: `order_completed:${order.id}`,
    xp: 220,
    title: 'Заказ завершен',
    description: `Заказ «${order.title}» принят заказчиком, выплата отправлена исполнителю`,
    sourceType: 'order',
    sourceId: order.id,
  });
  await notifyOrderSide(order, user, {
    type: 'order_completed',
    title: 'Заказ принят',
    body: `Заказ «${order.title}» завершен, выплата отправлена исполнителю`,
    recipients: [order.performerId],
  });

  return ensureOrderAccess(user, orderId);
};

export const disputeOrder = async (user: AuthUser, orderId: string, input: DisputeOrderInput) => {
  const order = await ensureOrderAccess(user, orderId);

  if (!['in_progress', 'submitted'].includes(order.status)) {
    throw new HttpError(409, 'Спор можно открыть только по активному заказу');
  }

  await markOrderDisputed(orderId, user.id, input.reason);
  await notifyOrderSide(order, user, {
    type: 'order_disputed',
    title: 'Открыт спор по заказу',
    body: `По заказу «${order.title}» открыт спор: ${input.reason}`,
  });

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
  await notifyOrderSide(order, user, {
    type: 'order_cancelled',
    title: 'Заказ отменен',
    body: `Заказ «${order.title}» отменен, средства возвращены заказчику`,
  });

  return ensureOrderAccess(user, orderId);
};

export const reviewOrder = async (
  user: AuthUser,
  orderId: string,
  input: CreateOrderReviewInput,
) => {
  const order = await ensureOrderAccess(user, orderId);

  if (order.customerId !== user.id) {
    throw new HttpError(403, 'Отзыв по заказу может оставить только заказчик');
  }

  if (order.status !== 'completed') {
    throw new HttpError(409, 'Отзыв можно оставить только после завершения заказа');
  }

  if (order.reviews.some((review) => review.reviewerId === user.id)) {
    throw new HttpError(409, 'Отзыв по этому заказу уже оставлен');
  }

  const review = await createOrderReview({
    orderId,
    reviewerId: user.id,
    performerId: order.performerId,
    rating: input.rating,
    comment: input.comment,
  });
  const xp = reviewXpByRating(input.rating);

  await awardPerformerXp({
    userId: order.performerId,
    type: 'order_reviewed',
    dedupeKey: `order_reviewed:${order.id}`,
    xp,
    title: `Получен отзыв ${input.rating}/5`,
    description:
      xp > 0
        ? `Заказчик оценил заказ «${order.title}» и добавил ${xp} XP к репутации`
        : `Заказчик оставил отзыв по заказу «${order.title}». XP-бонус не начислен из-за низкой оценки`,
    sourceType: 'order_review',
    sourceId: review.id,
  });

  await createNotification({
    userId: order.performerId,
    actorId: user.id,
    type: 'order_reviewed',
    title: 'Получен отзыв по заказу',
    body: `Заказчик поставил ${input.rating}/5 по заказу «${order.title}»`,
    linkUrl: `/orders/${order.id}`,
  });

  return ensureOrderAccess(user, orderId);
};
