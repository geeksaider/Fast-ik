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

export const formatDate = (value: string | null) => {
  if (!value) {
    return 'Без срока';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};
