const moneyFormatter = new Intl.NumberFormat('ru-RU');

export const formatAmount = (amount: number | null | undefined) =>
  `${moneyFormatter.format(amount ?? 0)} руб.`;

export const formatMoney = (min: number | null, max: number | null) => {
  if (min && max) {
    return `${moneyFormatter.format(min)} - ${moneyFormatter.format(max)} руб.`;
  }

  if (min) {
    return `от ${moneyFormatter.format(min)} руб.`;
  }

  if (max) {
    return `до ${moneyFormatter.format(max)} руб.`;
  }

  return 'Бюджет обсуждается';
};

const parseDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    '$1T$2:$3:$4.$5Z',
  );
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
};

const rawTimestampPattern = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/g;

export const formatDate = (value: string | null) => {
  const date = parseDate(value);

  if (!date) {
    return 'Без срока';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value: string | null) => {
  const date = parseDate(value);

  if (!date) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDisplayText = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  return value.replace(rawTimestampPattern, (timestamp) => formatDateTime(timestamp));
};

const systemLabels: Record<string, string> = {
  application_sent: 'Отклик отправлен',
  application_selected: 'Исполнитель выбран',
  pending: 'Ожидает решения',
  approved: 'Одобрено',
  draft: 'Черновик',
  accepted: 'Принят',
  rejected: 'Отклонен',
  withdrawn: 'Отозван',
  active: 'Активен',
  blocked: 'Заблокирован',
  order_submitted: 'Работа сдана',
  order_completed: 'Заказ завершен',
  order_reviewed: 'Отзыв получен',
  order_disputed: 'Открыт спор',
  order_cancelled: 'Заказ отменен',
  message_received: 'Новое сообщение',
  in_progress: 'В работе',
  submitted: 'На проверке',
  completed: 'Завершен',
  cancelled: 'Отменен',
  disputed: 'Спор',
  published: 'Опубликован',
  held: 'В гаранте',
  released: 'Выплачено',
  refunded: 'Возврат',
  escrow_hold: 'Резерв гаранта',
  escrow_release: 'Закрытие гаранта',
  escrow_refund: 'Возврат из гаранта',
  performer_payout: 'Выплата исполнителю',
  wallet_top_up: 'Пополнение',
  mock_top_up: 'Мок-пополнение',
  refund_customer: 'Возврат заказчику',
  pay_performer: 'Выплата исполнителю',
  user_status_updated: 'Статус пользователя изменен',
  job_moderated: 'Заказ промодерирован',
  dispute_resolved: 'Спор закрыт',
  performer_interview_decided: 'HR-интервью исполнителя',
  interview_passed: 'Интервью пройдено',
  interview_failed: 'Интервью не зачтено',
  passed: 'Пройдено',
  failed: 'Не зачтено',
  in: 'Зачисление',
  out: 'Списание',
  hold: 'Удержание',
  release: 'Выплата',
  completed_level: 'Пройден',
  current: 'Текущий',
  locked: 'Закрыт',
  job: 'Заказ',
  order: 'Рабочий заказ',
  support: 'Поддержка',
  customer: 'Заказчик',
  performer: 'Исполнитель',
  moderator: 'Модератор',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
};

export const formatSystemLabel = (value: string | null | undefined) => {
  if (!value) {
    return 'Не указано';
  }

  return systemLabels[value] ?? value.replaceAll('_', ' ');
};
