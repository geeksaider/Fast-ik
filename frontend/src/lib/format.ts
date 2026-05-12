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

export type DeadlineSignal = {
  label: string;
  tone: 'neutral' | 'warning' | 'danger' | 'success';
  daysLeft: number | null;
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

export const getDeadlineSignal = (value: string | null): DeadlineSignal => {
  const date = parseDate(value);

  if (!date) {
    return { label: 'Без срока', tone: 'neutral', daysLeft: null };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDeadline = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysLeft = Math.ceil((startOfDeadline - startOfToday) / 86_400_000);

  if (daysLeft < 0) {
    return { label: 'Просрочен', tone: 'danger', daysLeft };
  }

  if (daysLeft === 0) {
    return { label: 'Сегодня', tone: 'danger', daysLeft };
  }

  if (daysLeft <= 2) {
    return { label: `${daysLeft} дн.`, tone: 'warning', daysLeft };
  }

  if (daysLeft <= 7) {
    return { label: `${daysLeft} дн.`, tone: 'neutral', daysLeft };
  }

  return { label: formatDate(value), tone: 'success', daysLeft };
};

export const formatDisplayText = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  return value
    .replace(rawTimestampPattern, (timestamp) => formatDateTime(timestamp))
    .replaceAll('мок-гарант', 'гарант')
    .replaceAll('Мок-гарант', 'Гарант')
    .replaceAll('моковым гарантом', 'гарантом')
    .replaceAll('demo-', '')
    .replaceAll('Demo-', '')
    .replaceAll('демо-', '')
    .replaceAll('Демо-', '')
    .replaceAll('Escrow', 'Гарант')
    .replaceAll('escrow', 'гарант');
};

const systemLabels: Record<string, string> = {
  application_sent: 'Отклик отправлен',
  application_selected: 'Исполнитель выбран',
  application_received: 'Новый отклик',
  job_invited: 'Приглашение в заказ',
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
  contest_submission: 'Участие в конкурсе',
  contest_submission_received: 'Новая работа на конкурс',
  contest_won: 'Победа в конкурсе',
  message_received: 'Новое сообщение',
  open: 'Открыт',
  review: 'На рассмотрении',
  in_progress: 'В работе',
  submitted: 'На проверке',
  winner: 'Победитель',
  completed: 'Завершен',
  cancelled: 'Отменен',
  disputed: 'Спор',
  published: 'Опубликован',
  held: 'На удержании',
  released: 'Выплачено',
  refunded: 'Возврат',
  escrow_hold: 'Резерв гаранта',
  escrow_release: 'Закрытие гаранта',
  escrow_refund: 'Возврат из гаранта',
  performer_payout: 'Выплата исполнителю',
  wallet_top_up: 'Пополнение',
  mock_top_up: 'Пополнение',
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
  customer: 'Заказчик',
  performer: 'Исполнитель',
  admin: 'Администратор',
};

export const formatSystemLabel = (value: string | null | undefined) => {
  if (!value) {
    return 'Не указано';
  }

  return systemLabels[value] ?? value.replaceAll('_', ' ');
};
