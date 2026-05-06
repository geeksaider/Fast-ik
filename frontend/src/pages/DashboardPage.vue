<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Medal,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { useLevelsStore } from '../stores/levels';
import { useMarketplaceStore } from '../stores/marketplace';
import { useOrdersStore } from '../stores/orders';
import { useProfileStore } from '../stores/profile';
import { formatAmount } from '../lib/format';

const auth = useAuthStore();
const communication = useCommunicationStore();
const levels = useLevelsStore();
const marketplace = useMarketplaceStore();
const orders = useOrdersStore();
const profile = useProfileStore();

type HubLink = {
  to: string;
  title: string;
  label?: string;
  text: string;
  icon: Component;
  tone: 'dark' | 'light' | 'ember' | 'moss' | 'bolt';
  badge?: string;
};

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);

const roleTitle = computed(() => {
  const map: Record<string, string> = {
    customer: 'Заказчик',
    performer: 'Исполнитель',
    support: 'Поддержка',
    moderator: 'Модератор',
    admin: 'Администратор',
    super_admin: 'Суперадмин',
  };

  return auth.user ? (map[auth.user.role] ?? 'Пользователь') : 'Пользователь';
});
const displayName = computed(() => auth.user?.displayName || auth.user?.email || 'Fastik');
const firstName = computed(() => displayName.value.split(' ')[0] || 'Fastik');

const heroTitle = computed(() => {
  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return 'Центр операций';
  }

  return 'Центр Fastik';
});

const heroGreetingLines = computed(() => ({
  time: `${greeting.value},`,
  name: firstName.value,
}));

const profilePercent = computed(() => profile.summary?.progress.percentage ?? 0);
const activeOrders = computed(() =>
  orders.orders.filter((order) => ['in_progress', 'submitted', 'disputed'].includes(order.status)),
);
const escrowAmount = computed(() =>
  activeOrders.value.reduce(
    (sum, order) => sum + (order.escrowStatus === 'held' ? order.amount : 0),
    0,
  ),
);
const disputedOrders = computed(() =>
  activeOrders.value.filter((order) => order.status === 'disputed'),
);
const jobsReadyForPerformerChoice = computed(() =>
  marketplace.jobs.filter((job) => job.status === 'published' && job.applicationsCount > 0),
);
const greeting = computed(() => {
  const hour = new Date().getHours();

  if (hour < 6) {
    return 'Доброй ночи';
  }

  if (hour < 12) {
    return 'Доброе утро';
  }

  if (hour < 18) {
    return 'Добрый день';
  }

  return 'Добрый вечер';
});
const summaryStats = computed(() => {
  const unread = communication.unreadMessages + communication.unreadNotifications;

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return [
      { label: 'Активные', value: activeOrders.value.length, text: 'заказы в движении' },
      { label: 'Споры', value: disputedOrders.value.length, text: 'нужны решения' },
      { label: 'События', value: unread, text: 'новое за день' },
    ];
  }

  return [
    { label: 'Активные', value: activeOrders.value.length, text: 'заказы в работе' },
    { label: 'В гаранте', value: formatAmount(escrowAmount.value), text: 'защищено сейчас' },
    { label: 'События', value: unread, text: 'требуют внимания' },
  ];
});

const heroText = computed(() => {
  if (auth.user?.role === 'customer') {
    return 'Профиль, заказы, отклики, гарант и приемка собраны здесь.';
  }

  if (auth.user?.role === 'performer') {
    return 'Профиль, путь роста, отклики, рабочие заказы и сдача результата собраны здесь.';
  }

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return 'Споры, модерация, пользователи и журнал действий собраны здесь.';
  }

  return 'Это рабочий центр Fastik: все разделы собраны в одном месте, чтобы не искать их по URL.';
});

const primaryAction = computed(() => {
  if (auth.user?.role === 'customer') {
    return { to: '/jobs/new', label: 'Создать заказ', icon: Plus };
  }

  if (auth.user?.role === 'performer') {
    return { to: '/level-roadmap', label: 'Открыть LVL', icon: Trophy };
  }

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return { to: '/admin', label: 'Открыть админку', icon: ShieldCheck };
  }

  return { to: '/jobs', label: 'Открыть биржу', icon: BriefcaseBusiness };
});

const nextSteps = computed(() => {
  if (auth.user?.role === 'customer') {
    const steps = [
      {
        title: 'Заполнить профиль заказчика',
        text: 'Так будущие заказы выглядят доверительнее.',
        to: '/onboarding',
        done: profilePercent.value >= 75,
      },
      {
        title: 'Создать заказ',
        text: 'Опишите задачу, бюджет и сроки.',
        to: '/jobs/new',
        done: orders.orders.length > 0,
      },
    ];

    if (jobsReadyForPerformerChoice.value.length > 0) {
      steps.push({
        title: 'Выбрать исполнителя',
        text: 'После выбора включится гарант и рабочий чат.',
        to: '/applications',
        done: activeOrders.value.length > 0,
      });
    }

    return steps;
  }

  if (auth.user?.role === 'performer') {
    return [
      {
        title: 'Усилить профиль',
        text: 'Навыки, портфолио и условия работы дают стартовый XP.',
        to: '/onboarding',
        done: profilePercent.value >= 80,
      },
      {
        title: 'Проверить дорогу к славе',
        text: 'Путь роста показывает, что именно мешает следующему уровню.',
        to: '/level-roadmap',
        done: Boolean(
          levels.summary?.currentLevel.code && levels.summary.currentLevel.code !== 'newcomer',
        ),
      },
      {
        title: 'Откликнуться на заказ',
        text: 'Каждый реальный отклик попадает в XP-журнал.',
        to: '/jobs',
        done: Boolean(levels.summary?.events.some((event) => event.type === 'application_sent')),
      },
    ];
  }

  return [
    {
      title: 'Проверить flow',
      text: 'Биржа -> заказ -> гарант -> чат.',
      to: '/jobs',
      done: true,
    },
    {
      title: 'Споры',
      text: 'Очередь support-панели.',
      to: '/admin',
      done: activeOrders.value.some((order) => order.status === 'disputed'),
    },
    {
      title: 'Журнал',
      text: 'Действия фиксируются в audit-log.',
      to: '/admin',
      done: true,
    },
  ];
});

const hubLinks = computed<HubLink[]>(() => {
  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return [
      {
        to: '/admin',
        title: 'Админка',
        label: disputedOrders.value.length ? `${disputedOrders.value.length} спор.` : undefined,
        text: 'Споры и модерация.',
        icon: ShieldCheck,
        tone: 'dark',
      },
      {
        to: '/orders',
        title: 'Заказы',
        label: activeOrders.value.length ? `${activeOrders.value.length} акт.` : undefined,
        text: 'Рабочие статусы.',
        icon: ClipboardList,
        tone: 'ember',
      },
      {
        to: '/applications',
        title: 'Отклики',
        text: 'Кандидаты по заказам.',
        icon: Send,
        tone: 'bolt',
      },
      {
        to: '/jobs',
        title: 'Биржа',
        text: 'Задачи и отклики.',
        icon: BriefcaseBusiness,
        tone: 'dark',
      },
      {
        to: '/customers',
        title: 'Заказчики',
        text: 'Публичные профили.',
        icon: Building2,
        tone: 'light',
      },
      {
        to: '/contests',
        title: 'Конкурсы',
        text: 'LVL-допуск и работы.',
        icon: Medal,
        tone: 'ember',
      },
      {
        to: '/messages',
        title: 'Чат',
        label: communication.unreadMessages ? `${communication.unreadMessages} нов.` : undefined,
        text: 'Рабочие диалоги.',
        icon: MessageCircle,
        tone: 'bolt',
      },
      {
        to: '/analytics',
        title: 'Аналитика',
        text: 'Роли, деньги, активность.',
        icon: BarChart3,
        tone: 'light',
      },
    ];
  }

  const customerLinks: HubLink[] = [
    {
      to: '/onboarding',
      title: 'Профиль',
      label: `${profilePercent.value}%`,
      text: 'Анкета заказчика и базовая информация.',
      icon: UserRound,
      tone: 'light',
    },
    {
      to: '/jobs/new',
      title: 'Новый заказ',
      label: 'создать',
      text: 'Опишите задачу, бюджет и сроки.',
      icon: Plus,
      tone: 'ember',
    },
    {
      to: '/orders',
      title: 'Заказы',
      label: activeOrders.value.length ? `${activeOrders.value.length} акт.` : undefined,
      text: 'Работа, приемка и спорные ситуации.',
      icon: ClipboardList,
      tone: 'light',
    },
    {
      to: '/applications',
      title: 'Отклики',
      text: 'Кандидаты по опубликованным задачам.',
      icon: Send,
      tone: 'dark',
    },
    {
      to: '/performers',
      title: 'Исполнители',
      text: 'Каталог специалистов и приглашения.',
      icon: UsersRound,
      tone: 'bolt',
    },
    {
      to: '/messages',
      title: 'Чат',
      label: communication.unreadMessages ? `${communication.unreadMessages} нов.` : undefined,
      text: 'Диалоги после выбора исполнителя.',
      icon: MessageCircle,
      tone: 'light',
    },
    {
      to: '/finance',
      title: 'Финансы',
      label: escrowAmount.value ? formatAmount(escrowAmount.value) : undefined,
      text: 'Баланс, гарант и транзакции.',
      icon: WalletCards,
      tone: escrowAmount.value ? 'moss' : 'light',
    },
    {
      to: '/analytics',
      title: 'Аналитика',
      text: 'Сводка по заказам, откликам и деньгам.',
      icon: BarChart3,
      tone: 'light',
    },
  ];

  if (auth.user?.role === 'customer') {
    return customerLinks;
  }

  const links: HubLink[] = [
    {
      to: '/onboarding',
      title: 'Профиль',
      label: `${profilePercent.value}%`,
      text: 'Анкета, навыки, портфолио и базовый профиль.',
      icon: UserRound,
      tone: 'light',
    },
    {
      to: '/jobs',
      title: 'Заказы',
      text: 'Список задач, фильтры, отклики и публикация задач.',
      icon: BriefcaseBusiness,
      tone: 'dark',
    },
    {
      to: '/customers',
      title: 'Заказчики',
      text: 'Публичные профили компаний и частных заказчиков.',
      icon: Building2,
      tone: 'light',
    },
    {
      to: '/orders',
      title: 'Работа',
      label: activeOrders.value.length ? `${activeOrders.value.length} акт.` : undefined,
      text: 'Статусы, сдача результата, приемка, отмена и спор.',
      icon: ClipboardList,
      tone: 'ember',
    },
    {
      to: '/contests',
      title: 'Конкурсы',
      text: 'Задания с LVL-допуском, призами и выбором победителя.',
      icon: Medal,
      tone: 'ember',
    },
    {
      to: '/messages',
      title: 'Чат',
      label: communication.unreadMessages ? `${communication.unreadMessages} нов.` : undefined,
      text: 'Рабочие диалоги появляются после выбора исполнителя.',
      icon: MessageCircle,
      tone: 'bolt',
    },
    {
      to: '/finance',
      title: 'Финансы',
      label: escrowAmount.value ? formatAmount(escrowAmount.value) : undefined,
      text: 'Баланс, удержания гаранта и транзакции.',
      icon: WalletCards,
      tone: 'moss',
    },
    {
      to: '/analytics',
      title: 'Аналитика',
      text: 'Сводка по роли, заказам, деньгам и активности.',
      icon: BarChart3,
      tone: 'light',
    },
    {
      to: '/notifications',
      title: 'События',
      label: communication.unreadNotifications
        ? `${communication.unreadNotifications} нов.`
        : undefined,
      text: 'Отклики, сообщения, статусы заказов и изменения уровня.',
      icon: Bell,
      tone: 'light',
    },
  ];

  if (auth.user?.role === 'performer') {
    links.splice(2, 0, {
      to: '/level-roadmap',
      title: 'Путь роста',
      label: levels.summary?.currentLevel.title ?? 'уровни',
      text: 'XP, требования уровней, история действий и Elite-интервью.',
      icon: Trophy,
      tone: 'dark',
    });
  }

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    links.splice(2, 0, {
      to: '/jobs/new',
      title: 'Новый заказ',
      label: 'создать',
      text: 'Быстрый вход в публикацию задачи для исполнителей.',
      icon: Plus,
      tone: 'ember',
    });
  }

  return links;
});

const unfinishedNextSteps = computed(() => nextSteps.value.filter((step) => !step.done));
const showNextSteps = computed(() => {
  if (!unfinishedNextSteps.value.length) {
    return false;
  }

  return auth.user?.role !== 'performer' || (levels.summary?.currentLevel.sortOrder ?? 1) < 2;
});

const hubToneClass = (tone: HubLink['tone']) => {
  const classes: Record<HubLink['tone'], string> = {
    dark: 'border-ink bg-ink text-paper hover:bg-ink/90',
    ember: 'border-ink bg-ember text-paper hover:bg-bolt',
    moss: 'border-ink bg-moss text-paper hover:bg-moss/90',
    bolt: 'border-bolt/45 bg-bolt/10 text-ink hover:border-bolt hover:bg-bolt/15',
    light: 'border-line bg-paper text-ink hover:border-ink hover:bg-white',
  };

  return classes[tone];
};

const hubIconClass = (tone: HubLink['tone']) =>
  tone === 'dark' || tone === 'ember' || tone === 'moss'
    ? 'border-paper/25 bg-paper/15 text-paper'
    : 'border-line bg-[#fffaf0] text-ink';

const hubMetaClass = (tone: HubLink['tone']) =>
  tone === 'dark' || tone === 'ember' || tone === 'moss'
    ? 'border-paper/25 bg-paper/15 text-paper/82'
    : 'border-line bg-[#fffaf0] text-ink/62';

const loadDashboard = async () => {
  if (!auth.accessToken) {
    return;
  }

  await Promise.allSettled([
    communication.loadConversations(auth.accessToken),
    communication.loadNotifications(auth.accessToken),
    profile.load(auth.accessToken),
    orders.load(auth.accessToken),
    auth.user?.role === 'customer'
      ? marketplace.loadJobs({ mine: true }, auth.accessToken)
      : Promise.resolve(),
    auth.user?.role === 'performer' ? levels.load(auth.accessToken) : Promise.resolve(),
  ]);
};

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section class="grid min-w-0 gap-5">
        <aside class="min-w-0 rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <div
            class="grid gap-5 lg:grid-cols-[minmax(0,21rem)_minmax(0,21rem)] lg:items-start lg:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border border-paper/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-paper/65"
                >
                  {{ roleTitle }}
                </span>
              </div>

              <p class="mt-7 text-sm font-black uppercase tracking-[0.2em] text-paper/55">
                {{ heroTitle }}
              </p>
              <h1
                class="mt-3 text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
              >
                <span class="block break-words">{{ heroGreetingLines.time }}</span>
                <span class="block break-words">{{ heroGreetingLines.name }}</span>
              </h1>
              <p class="mt-5 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
                {{ heroText }}
              </p>
            </div>

            <div class="grid gap-3">
              <div class="grid gap-2">
                <div
                  v-for="stat in summaryStats"
                  :key="stat.label"
                  class="grid grid-cols-[1fr_auto] items-end gap-3 rounded-2xl border border-paper/20 bg-paper/[0.06] p-4"
                >
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-paper/45">
                      {{ stat.label }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-paper/50">{{ stat.text }}</p>
                  </div>
                  <p class="text-2xl font-black">{{ stat.value }}</p>
                </div>
              </div>
              <RouterLink
                class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-paper bg-ember px-4 text-sm font-black text-paper transition hover:bg-bolt"
                :to="primaryAction.to"
              >
                <component :is="primaryAction.icon" :size="18" />
                <span class="truncate">{{ primaryAction.label }}</span>
              </RouterLink>
            </div>
          </div>
        </aside>

        <section class="grid min-w-0 gap-4">
          <article
            v-if="showNextSteps"
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
                  Что делать дальше
                </p>
                <h2 class="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">
                  Ближайший сценарий
                </h2>
              </div>
              <span
                class="inline-flex h-10 items-center gap-2 rounded-full border border-ink bg-paper px-4 text-sm font-black"
              >
                <Sparkles class="shrink-0" :size="18" />
                {{ auth.user?.email }}
              </span>
            </div>

            <div class="mt-4 grid gap-2">
              <RouterLink
                v-for="step in unfinishedNextSteps"
                :key="step.title"
                class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                :to="step.to"
              >
                <span class="min-w-0">
                  <span class="block truncate font-black">{{ step.title }}</span>
                  <span class="mt-1 block truncate text-sm font-semibold text-ink/65">
                    {{ step.text }}
                  </span>
                </span>
                <span class="h-3 w-3 shrink-0 rounded-full bg-ember" />
              </RouterLink>
            </div>
          </article>

          <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Разделы</p>
                <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Быстрый переход</h2>
              </div>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <RouterLink
                v-for="link in hubLinks"
                :key="link.to"
                class="group flex items-center gap-3 rounded-2xl border p-3 transition"
                :class="hubToneClass(link.tone)"
                :to="link.to"
              >
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
                  :class="hubIconClass(link.tone)"
                >
                  <component :is="link.icon" :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-black tracking-[-0.03em]">{{ link.title }}</span>
                  <span class="mt-1 block truncate text-sm font-semibold opacity-65">
                    {{ link.text }}
                  </span>
                </span>
                <span
                  v-if="link.label"
                  class="max-w-24 shrink-0 truncate rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.08em]"
                  :class="hubMetaClass(link.tone)"
                >
                  {{ link.label }}
                </span>
              </RouterLink>
            </div>
          </section>
        </section>
      </section>
    </section>
  </main>
</template>
