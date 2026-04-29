import type { AuthUser } from '../auth/auth.types.js';
import { HttpError } from '../../http/errors/http-error.js';
import { createNotification } from '../communication/communication.repository.js';
import {
  getPerformerMetrics,
  getPerformerProgress,
  insertXpEvent,
  listPerformerLevels,
  listXpEvents,
  upsertPerformerProgress,
  type PerformerMetrics,
} from './levels.repository.js';
import type {
  LevelMetric,
  LevelRequirement,
  PerformerLevel,
  PerformerLevelSummary,
  RoadmapLevel,
} from './levels.types.js';

const profileXpMap = {
  baseProfile: 40,
  positioning: 40,
  skills: 40,
  portfolio: 40,
  workTerms: 40,
};

const calculateProfileXp = (metrics: PerformerMetrics) => {
  let xp = 0;

  if (metrics.hasBaseProfile) {
    xp += profileXpMap.baseProfile;
  }

  if (metrics.hasPositioning) {
    xp += profileXpMap.positioning;
  }

  if (metrics.skillsCount >= 3) {
    xp += profileXpMap.skills;
  }

  if (metrics.portfolioCount >= 1) {
    xp += profileXpMap.portfolio;
  }

  if (metrics.hasWorkTerms) {
    xp += profileXpMap.workTerms;
  }

  return xp;
};

const buildMetrics = (metrics: PerformerMetrics): LevelMetric[] => [
  {
    code: 'profile',
    title: 'Профиль и позиционирование',
    value: metrics.hasBaseProfile && metrics.hasPositioning,
    target: true,
    completed: metrics.hasBaseProfile && metrics.hasPositioning,
  },
  {
    code: 'work_terms',
    title: 'Условия работы',
    value: metrics.hasWorkTerms,
    target: true,
    completed: metrics.hasWorkTerms,
  },
  {
    code: 'skills',
    title: 'Навыки',
    value: metrics.skillsCount,
    target: 3,
    completed: metrics.skillsCount >= 3,
  },
  {
    code: 'portfolio',
    title: 'Проекты в портфолио',
    value: metrics.portfolioCount,
    target: 1,
    completed: metrics.portfolioCount >= 1,
  },
  {
    code: 'applications',
    title: 'Отклики',
    value: metrics.applicationsCount,
    target: 3,
    completed: metrics.applicationsCount >= 3,
  },
  {
    code: 'selected',
    title: 'Выбранные заявки',
    value: metrics.selectedApplicationsCount,
    target: 1,
    completed: metrics.selectedApplicationsCount >= 1,
  },
  {
    code: 'completed_orders',
    title: 'Завершенные заказы',
    value: metrics.completedOrdersCount,
    target: 3,
    completed: metrics.completedOrdersCount >= 3,
  },
  {
    code: 'reviews',
    title: 'Отзывы заказчиков',
    value: metrics.reviewsCount,
    target: 3,
    completed: metrics.reviewsCount >= 3,
  },
  {
    code: 'rating',
    title: 'Средняя оценка',
    value: metrics.averageRating,
    target: 4.5,
    completed: (metrics.averageRating ?? 0) >= 4.5,
  },
  {
    code: 'disputes',
    title: 'Активные споры',
    value: metrics.disputedOrdersCount,
    target: 0,
    completed: metrics.disputedOrdersCount === 0,
  },
];

const requirement = (
  code: string,
  title: string,
  description: string,
  completed: boolean,
  currentValue: number | boolean | null,
  targetValue: number | boolean,
): LevelRequirement => ({ code, title, description, completed, currentValue, targetValue });

const buildRequirements = (
  level: PerformerLevel,
  metrics: PerformerMetrics,
  xp: number,
  interviewPassed: boolean,
): LevelRequirement[] => {
  const xpRequirement = requirement(
    'xp',
    'Опыт платформы',
    `Набрать ${level.requiredXp} XP за профиль, отклики и выполненные заказы.`,
    xp >= level.requiredXp,
    xp,
    level.requiredXp,
  );

  if (level.code === 'newcomer') {
    return [xpRequirement];
  }

  if (level.code === 'builder') {
    return [
      xpRequirement,
      requirement(
        'profile',
        'Профиль готов к показу',
        'Заполнены базовое описание, город, заголовок и специализация.',
        metrics.hasBaseProfile && metrics.hasPositioning,
        metrics.hasBaseProfile && metrics.hasPositioning,
        true,
      ),
      requirement(
        'skills',
        'Минимум 3 навыка',
        'Навыки помогают заказчику быстрее понять специализацию исполнителя.',
        metrics.skillsCount >= 3,
        metrics.skillsCount,
        3,
      ),
    ];
  }

  if (level.code === 'verified') {
    return [
      xpRequirement,
      requirement(
        'portfolio',
        'Портфолио',
        'Добавлен хотя бы один проект, который можно показать заказчику.',
        metrics.portfolioCount >= 1,
        metrics.portfolioCount,
        1,
      ),
      requirement(
        'selected',
        'Первая выбранная заявка',
        'Заказчик хотя бы раз выбрал исполнителя в работу.',
        metrics.selectedApplicationsCount >= 1,
        metrics.selectedApplicationsCount,
        1,
      ),
    ];
  }

  if (level.code === 'reliable') {
    return [
      xpRequirement,
      requirement(
        'completed_orders',
        '3 завершенных заказа',
        'История выполненных заказов без ручной накрутки доверия.',
        metrics.completedOrdersCount >= 3,
        metrics.completedOrdersCount,
        3,
      ),
      requirement(
        'reviews',
        'Первый сильный отзыв',
        'Хотя бы один заказчик подтвердил качество работы оценкой 4+.',
        metrics.reviewsCount >= 1 && (metrics.averageRating ?? 0) >= 4,
        metrics.averageRating,
        4,
      ),
      requirement(
        'no_disputes',
        'Без активных споров',
        'Споры не запрещают работу, но блокируют рост надежности до решения.',
        metrics.disputedOrdersCount === 0,
        metrics.disputedOrdersCount,
        0,
      ),
    ];
  }

  if (level.code === 'pro') {
    return [
      xpRequirement,
      requirement(
        'completed_orders',
        '7 завершенных заказов',
        'Профи должен подтвердить стабильность несколькими заказами.',
        metrics.completedOrdersCount >= 7,
        metrics.completedOrdersCount,
        7,
      ),
      requirement(
        'applications',
        '10 откликов',
        'Платформа видит регулярную активность исполнителя.',
        metrics.applicationsCount >= 10,
        metrics.applicationsCount,
        10,
      ),
      requirement(
        'rating',
        'Рейтинг 4.5+',
        'Профи должен быть не только активным, но и стабильно хорошо оцененным.',
        metrics.reviewsCount >= 3 && (metrics.averageRating ?? 0) >= 4.5,
        metrics.averageRating,
        4.5,
      ),
    ];
  }

  return [
    xpRequirement,
    requirement(
      'completed_orders',
      '12 завершенных заказов',
      'Elite - это не только XP, но и длинная история выполненных работ.',
      metrics.completedOrdersCount >= 12,
      metrics.completedOrdersCount,
      12,
    ),
    requirement(
      'interview',
      'HR-интервью Fastik',
      'Финальный уровень открывается только после ручного онлайн-собеседования.',
      interviewPassed,
      interviewPassed,
      true,
    ),
  ];
};

const pickLevel = (
  levels: PerformerLevel[],
  metrics: PerformerMetrics,
  xp: number,
  interviewPassed: boolean,
) =>
  [...levels]
    .reverse()
    .find((level) =>
      buildRequirements(level, metrics, xp, interviewPassed).every((item) => item.completed),
    ) ?? levels[0];

export const recalculatePerformerProgress = async (userId: string) => {
  const [levels, previousProgress, metrics] = await Promise.all([
    listPerformerLevels(),
    getPerformerProgress(userId),
    getPerformerMetrics(userId),
  ]);

  if (!levels.length) {
    throw new Error('PERFORMER_LEVELS_NOT_SEEDED');
  }

  const xp = Math.max(0, calculateProfileXp(metrics) + metrics.totalEventXp);
  const interviewPassed = previousProgress?.interviewPassed ?? false;
  const currentLevel = pickLevel(levels, metrics, xp, interviewPassed);
  const eliteUnlockedByXp = Boolean(
    levels.find((level) => level.interviewRequired && xp >= level.requiredXp),
  );

  return upsertPerformerProgress({
    userId,
    levelId: currentLevel.id,
    xp,
    completedOrders: metrics.completedOrdersCount,
    rating: metrics.averageRating,
    interviewRequired: eliteUnlockedByXp && !interviewPassed,
  });
};

export const awardPerformerXp = async (input: {
  userId: string;
  type: string;
  dedupeKey: string;
  xp: number;
  title: string;
  description?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}) => {
  const previousProgress = await getPerformerProgress(input.userId);
  const event = await insertXpEvent(input);
  const progress = await recalculatePerformerProgress(input.userId);

  if (event && previousProgress && previousProgress.levelId !== progress.levelId) {
    const levels = await listPerformerLevels();
    const newLevel = levels.find((level) => level.id === progress.levelId);

    if (newLevel) {
      await createNotification({
        userId: input.userId,
        type: 'system',
        title: 'Новый уровень Fastik',
        body: `Вы поднялись до уровня «${newLevel.title}». XP уже пересчитан по реальным действиям.`,
        linkUrl: '/level-roadmap',
      });
    }
  }

  return event;
};

export const getMyLevelRoadmap = async (user: AuthUser): Promise<PerformerLevelSummary> => {
  if (user.role !== 'performer') {
    throw new HttpError(403, 'Roadmap уровня доступен исполнителю');
  }

  const progress = await recalculatePerformerProgress(user.id);
  const [levels, metrics, events] = await Promise.all([
    listPerformerLevels(),
    getPerformerMetrics(user.id),
    listXpEvents(user.id),
  ]);
  const currentLevel = levels.find((level) => level.id === progress.levelId) ?? levels[0];
  const nextLevel = levels.find((level) => level.sortOrder > currentLevel.sortOrder) ?? null;
  const xpRange = nextLevel ? nextLevel.requiredXp - currentLevel.requiredXp : 1;
  const xpInRange = nextLevel ? progress.xp - currentLevel.requiredXp : xpRange;
  const roadmap: RoadmapLevel[] = levels.map((level) => ({
    ...level,
    status:
      level.sortOrder < currentLevel.sortOrder
        ? 'completed'
        : level.sortOrder === currentLevel.sortOrder
          ? 'current'
          : 'locked',
    requirements: buildRequirements(level, metrics, progress.xp, progress.interviewPassed),
  }));

  return {
    progress,
    currentLevel,
    nextLevel,
    xpToNext: nextLevel ? Math.max(0, nextLevel.requiredXp - progress.xp) : 0,
    nextLevelProgress: nextLevel
      ? Math.max(0, Math.min(100, Math.round((xpInRange / xpRange) * 100)))
      : 100,
    metrics: buildMetrics(metrics),
    roadmap,
    events,
  };
};
