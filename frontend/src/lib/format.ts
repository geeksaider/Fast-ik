export const formatMoney = (min: number | null, max: number | null) => {
  const rub = new Intl.NumberFormat('ru-RU');

  if (min && max) {
    return `${rub.format(min)} - ${rub.format(max)} ₽`;
  }

  if (min) {
    return `от ${rub.format(min)} ₽`;
  }

  if (max) {
    return `до ${rub.format(max)} ₽`;
  }

  return 'Бюджет обсуждается';
};

export const formatAmount = (amount: number) =>
  `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;

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
