import type { AuthUser } from '../auth/auth.types.js';
import {
  getAdminAnalyticsData,
  getCustomerAnalyticsData,
  getPerformerAnalyticsData,
  toNumber,
} from './analytics.repository.js';
import type {
  AnalyticsBreakdownItem,
  AnalyticsMetric,
  AnalyticsSummary,
} from './analytics.types.js';

const managerRoles = new Set(['admin']);
const moneyFormatter = new Intl.NumberFormat('ru-RU');

const amountLabel = (value: number) => `${moneyFormatter.format(value)} руб.`;

const metric = (
  label: string,
  value: number,
  detail: string,
  tone: AnalyticsMetric['tone'],
  displayValue = String(value),
): AnalyticsMetric => ({ label, value, displayValue, detail, tone });

const item = (label: string, value: number, amount?: number): AnalyticsBreakdownItem => ({
  label,
  value,
  displayValue: String(value),
  amount,
});

const moneyItem = (label: string, amount: number): AnalyticsBreakdownItem => ({
  label,
  value: amount,
  displayValue: amountLabel(amount),
  amount,
});

const buildCustomerAnalytics = async (user: AuthUser): Promise<AnalyticsSummary> => {
  const data = await getCustomerAnalyticsData(user.id);
  const totalJobs = toNumber(data.jobs?.totalJobs);
  const applicationsReceived = toNumber(data.jobs?.applicationsReceived);
  const pendingApplications = toNumber(data.incomingApplications?.pendingApplications);
  const sentInvites = toNumber(data.invites?.sentInvites);
  const activeOrders = toNumber(data.orders?.activeOrders);
  const inProgressOrders = toNumber(data.orders?.inProgressOrders);
  const submittedOrders = toNumber(data.orders?.submittedOrders);
  const completedOrders = toNumber(data.orders?.completedOrders);
  const disputedOrders = toNumber(data.orders?.disputedOrders);
  const heldAmount = toNumber(data.escrow?.heldAmount);
  const completedAmount = toNumber(data.orders?.completedAmount);

  return {
    role: user.role,
    title: 'Аналитика заказчика',
    subtitle: 'Публикации, отклики, выбор исполнителей и гарант в одной спокойной сводке.',
    generatedAt: new Date().toISOString(),
    metrics: [
      metric('Откликов ждёт решения', pendingApplications, 'на ваших задачах', 'ember'),
      metric('На приёмке', submittedOrders, 'исполнитель сдал работу', 'ember'),
      metric('Споры', disputedOrders, 'требуют вашего решения', 'ember'),
      metric('В работе', inProgressOrders, 'активные заказы', 'bolt'),
      metric('На удержании', heldAmount, 'удержано сейчас', 'moss', amountLabel(heldAmount)),
    ],
    pipeline: [
      item('Опубликовано', toNumber(data.jobs?.publishedJobs)),
      item('Активные заказы', activeOrders),
      item('Завершено', completedOrders),
      item('Споры', disputedOrders),
    ],
    orderStatuses: [
      item('В работе', activeOrders),
      item('Завершено', completedOrders, completedAmount),
      item('Отменено', toNumber(data.orders?.cancelledOrders)),
      item('Споры', disputedOrders),
    ],
    money: [
      moneyItem('Пополнено', toNumber(data.transactions?.topUps)),
      moneyItem('Зарезервировано', toNumber(data.transactions?.holds)),
      moneyItem('Оплачено исполнителям', completedAmount),
      moneyItem('Возвращено', toNumber(data.transactions?.refunds)),
    ],
    activity: [
      item('Задачи на бирже', totalJobs),
      item('Отклики на задачи', applicationsReceived),
      item('Прямые приглашения', sentInvites),
      item('Заказы с гарантом', toNumber(data.orders?.totalOrders)),
    ],
  };
};

const buildPerformerAnalytics = async (user: AuthUser): Promise<AnalyticsSummary> => {
  const data = await getPerformerAnalyticsData(user.id);
  const totalApplications = toNumber(data.applications?.totalApplications);
  const acceptedApplications = toNumber(data.applications?.acceptedApplications);
  const pendingApplications = toNumber(data.applications?.pendingApplications);
  const pendingInvites = toNumber(data.invites?.pendingInvites);
  const completedOrders = toNumber(data.orders?.completedOrders);
  const activeOrders = toNumber(data.orders?.activeOrders);
  const inProgressOrders = toNumber(data.orders?.inProgressOrders);
  const submittedOrders = toNumber(data.orders?.submittedOrders);
  const earnedAmount = toNumber(data.orders?.earnedAmount);
  const averageRating = Number(data.reviews?.averageRating ?? 0);
  const xp = toNumber(data.progress?.xp);

  return {
    role: user.role,
    title: 'Аналитика исполнителя',
    subtitle: 'Отклики, выбранные заявки, рейтинг, XP и деньги по выполненным заказам.',
    generatedAt: new Date().toISOString(),
    metrics: [
      metric('Приглашения', pendingInvites, 'прямые от заказчиков', 'ember'),
      metric('Откликов в ожидании', pendingApplications, 'ждут решения заказчиков', 'bolt'),
      metric('На приёмке', submittedOrders, 'отправлено заказчику', 'ember'),
      metric('В работе', inProgressOrders, 'активные заказы', 'bolt'),
      metric('XP', xp, data.progress?.levelTitle ?? 'уровень еще считается', 'dark'),
      metric(
        'Рейтинг',
        averageRating,
        `${toNumber(data.reviews?.reviewsCount)} отзывов`,
        'ember',
        averageRating ? averageRating.toFixed(1) : 'нет',
      ),
    ],
    pipeline: [
      item('Отклики', totalApplications),
      item('Выбрано', acceptedApplications),
      item('В работе', activeOrders),
      item('Завершено', completedOrders),
    ],
    orderStatuses: [
      item('В работе', activeOrders, toNumber(data.orders?.activeAmount)),
      item('Завершено', completedOrders, earnedAmount),
      item('Споры', toNumber(data.orders?.disputedOrders)),
      item('Приглашения', toNumber(data.invites?.pendingInvites)),
    ],
    money: [
      moneyItem('Заработано по завершенным', earnedAmount),
      moneyItem('В активных заказах', toNumber(data.orders?.activeAmount)),
      moneyItem('Средний чек', completedOrders ? Math.round(earnedAmount / completedOrders) : 0),
    ],
    activity: [
      item('Ожидают ответа', toNumber(data.applications?.pendingApplications)),
      item('Отклонено', toNumber(data.applications?.rejectedApplications)),
      item('Отзывы', toNumber(data.reviews?.reviewsCount)),
      item('Приглашения всего', toNumber(data.invites?.totalInvites)),
    ],
  };
};

const buildAdminAnalytics = async (user: AuthUser): Promise<AnalyticsSummary> => {
  const data = await getAdminAnalyticsData();
  const heldAmount = toNumber(data.escrow?.heldAmount);
  const activeOrders = toNumber(data.orders?.activeOrders);
  const disputedOrders = toNumber(data.orders?.disputedOrders);
  const completedAmount = toNumber(data.orders?.completedAmount);

  return {
    role: user.role,
    title: 'Операционная аналитика',
    subtitle: 'Общая температура платформы: пользователи, биржа, заказы, гарант и коммуникации.',
    generatedAt: new Date().toISOString(),
    metrics: [
      metric('Пользователи', toNumber(data.users?.totalUsers), 'всего аккаунтов', 'dark'),
      metric('Заказы', toNumber(data.jobs?.totalJobs), 'опубликованные и рабочие', 'bolt'),
      metric('Споры', disputedOrders, 'требуют внимания', 'ember'),
      metric('На удержании', heldAmount, 'удержано платформой', 'moss', amountLabel(heldAmount)),
    ],
    pipeline: [
      item('Заказчики', toNumber(data.users?.customers)),
      item('Исполнители', toNumber(data.users?.performers)),
      item('Активные пользователи', toNumber(data.users?.activeUsers)),
      item('Модерация', toNumber(data.jobs?.pendingModeration)),
    ],
    orderStatuses: [
      item('В работе', activeOrders),
      item('Завершено', toNumber(data.orders?.completedOrders), completedAmount),
      item('Отменено', toNumber(data.orders?.cancelledOrders)),
      item('Споры', disputedOrders),
    ],
    money: [
      moneyItem('На удержании', heldAmount),
      moneyItem('Завершенный оборот', completedAmount),
    ],
    activity: [
      item('Отклики', toNumber(data.jobs?.totalApplications)),
      item('Приглашения', toNumber(data.jobs?.totalInvites)),
      item('Диалоги', toNumber(data.communications?.conversations)),
      item('Сообщения', toNumber(data.communications?.messages)),
      item('Файлы', toNumber(data.communications?.attachments)),
    ],
  };
};

export const getMyAnalytics = async (user: AuthUser) => {
  if (user.role === 'customer') {
    return buildCustomerAnalytics(user);
  }

  if (user.role === 'performer') {
    return buildPerformerAnalytics(user);
  }

  if (managerRoles.has(user.role)) {
    return buildAdminAnalytics(user);
  }

  return buildCustomerAnalytics(user);
};
