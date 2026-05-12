<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Medal,
  PieChart,
  Send,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-vue-next';
import { useAnalyticsStore } from '../stores/analytics';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { useLevelsStore } from '../stores/levels';
import { useMarketplaceStore } from '../stores/marketplace';
import { useOrdersStore } from '../stores/orders';
import { useProfileStore } from '../stores/profile';
import { formatAmount } from '../lib/format';
import type { AnalyticsBreakdownItem } from '../lib/api';

const analytics = useAnalyticsStore();
const auth = useAuthStore();
const communication = useCommunicationStore();
const levels = useLevelsStore();
const marketplace = useMarketplaceStore();
const orders = useOrdersStore();
const profile = useProfileStore();

const managerRoles = new Set(['admin']);

const displayName = computed(() => auth.user?.displayName || auth.user?.email || 'Fastik');
const firstName = computed(() => displayName.value.split(' ')[0] || 'Fastik');

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

const heroGreetingLines = computed(() => ({
  time: `${greeting.value},`,
  name: firstName.value,
}));

const profilePercent = computed(() => profile.summary?.progress.percentage ?? 0);
const activeOrders = computed(() =>
  orders.orders.filter((order) => ['in_progress', 'submitted', 'disputed'].includes(order.status)),
);
const disputedOrders = computed(() =>
  activeOrders.value.filter((order) => order.status === 'disputed'),
);
const jobsReadyForPerformerChoice = computed(() =>
  marketplace.jobs.filter((job) => job.status === 'published' && job.applicationsCount > 0),
);
const nextSteps = computed(() => {
  if (auth.user?.role === 'customer') {
    const steps = [
      {
        title: 'Заполнить профиль заказчика',
        text: 'Так будущие заказы выглядят доверительнее.',
        to: '/onboarding',
        done: profilePercent.value >= 75,
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
      title: 'Очередь споров',
      text: 'Решения по конфликтам сторон.',
      to: '/admin',
      done: !disputedOrders.value.length,
    },
    {
      title: 'Журнал действий',
      text: 'Аудит ключевых событий платформы.',
      to: '/admin',
      done: false,
    },
  ];
});

const unfinishedNextSteps = computed(() => nextSteps.value.filter((step) => !step.done));
const showNextSteps = computed(() => {
  if (!unfinishedNextSteps.value.length) {
    return false;
  }

  return auth.user?.role !== 'performer' || (levels.summary?.currentLevel.sortOrder ?? 1) < 2;
});

type SideNavItem = {
  to: string;
  label: string;
  description?: string;
  icon: Component;
  badge?: string;
  emphasize?: boolean;
};

const findMetricValue = (label: string) =>
  analytics.summary?.metrics.find((metric) => metric.label === label)?.value ?? 0;

const sideNavItems = computed<SideNavItem[]>(() => {
  if (auth.user?.role === 'customer') {
    const pending = findMetricValue('Откликов ждёт решения');
    const submitted = findMetricValue('На приёмке');
    const disputed = findMetricValue('Споры');

    const items: SideNavItem[] = [
      {
        to: '/applications',
        label: 'Текущие отклики',
        description: pending > 0 ? 'ждут вашего решения' : 'кандидаты по вашим задачам',
        icon: Send,
        badge: pending > 0 ? String(pending) : undefined,
        emphasize: pending > 0,
      },
      {
        to: '/applications?tab=invites',
        label: 'Мои приглашения',
        description: 'кого вы позвали в заказ',
        icon: Sparkles,
      },
    ];

    if (submitted > 0) {
      items.push({
        to: '/orders?status=submitted',
        label: 'На приёмке',
        description: 'исполнитель сдал работу',
        icon: ClipboardList,
        badge: String(submitted),
      });
    }

    if (disputed > 0) {
      items.push({
        to: '/orders?status=disputed',
        label: 'Споры',
        description: 'требуют решения',
        icon: AlertTriangle,
        badge: String(disputed),
      });
    }

    return items;
  }

  if (auth.user?.role === 'performer') {
    const pendingInvites = findMetricValue('Приглашения');
    const pendingApps = findMetricValue('Откликов в ожидании');
    const submitted = findMetricValue('На приёмке');

    const items: SideNavItem[] = [];

    if (pendingInvites > 0) {
      items.push({
        to: '/applications?tab=invites',
        label: 'Приглашения',
        description: 'прямые от заказчиков',
        icon: Sparkles,
        badge: String(pendingInvites),
        emphasize: true,
      });
    }

    items.push(
      {
        to: '/applications',
        label: 'Мои отклики',
        description: pendingApps > 0 ? 'ждут решения заказчиков' : 'все отправленные',
        icon: Send,
        badge: pendingApps > 0 ? String(pendingApps) : undefined,
      },
      {
        to: '/contests',
        label: 'Конкурсы',
        description: 'призы и LVL-допуск',
        icon: Medal,
      },
    );

    if (submitted > 0) {
      items.push({
        to: '/orders?status=submitted',
        label: 'На приёмке',
        description: 'заказчик смотрит работу',
        icon: ClipboardList,
        badge: String(submitted),
      });
    }

    return items;
  }

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return [
      {
        to: '/admin',
        label: 'Открыть админку',
        description: 'споры и модерация',
        icon: ShieldCheck,
        emphasize: true,
      },
    ];
  }

  return [];
});

const anchors = computed(() => {
  const list: { id: string; label: string }[] = [];

  if (showNextSteps.value) {
    list.push({ id: 'steps', label: 'Шаги' });
  }

  if (analytics.summary) {
    list.push(
      { id: 'pipeline', label: 'Воронка' },
      { id: 'statuses', label: 'Статусы' },
      { id: 'money', label: 'Деньги' },
      { id: 'activity', label: 'Активность' },
    );
  }

  return list;
});

const summary = computed(() => analytics.summary);

const maxValue = (items: AnalyticsBreakdownItem[]) => {
  const value = Math.max(...items.map((item) => Math.abs(item.amount ?? item.value)), 0);

  return value || 1;
};

const maxPipelineValue = computed(() => maxValue(summary.value?.pipeline ?? []));
const maxStatusValue = computed(() => maxValue(summary.value?.orderStatuses ?? []));
const maxMoneyValue = computed(() => maxValue(summary.value?.money ?? []));
const maxActivityValue = computed(() => maxValue(summary.value?.activity ?? []));

const barWidth = (item: AnalyticsBreakdownItem, max: number) => {
  const value = Math.abs(item.amount ?? item.value);

  if (!value) {
    return '0%';
  }

  return `${Math.max(6, Math.round((value / max) * 100))}%`;
};

const barToneClass = (index: number) => {
  const classes = ['bg-ink', 'bg-ember', 'bg-moss', 'bg-bolt'];

  return classes[index % classes.length];
};

const valueLabel = (item: AnalyticsBreakdownItem) => {
  if (typeof item.amount === 'number') {
    return formatAmount(item.amount);
  }

  return item.displayValue;
};

const loadDashboard = async () => {
  if (!auth.accessToken) {
    return;
  }

  await Promise.allSettled([
    analytics.load(auth.accessToken),
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
              <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Обзор</p>
              <h1
                class="mt-3 text-[2.55rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl"
              >
                <span class="block break-words">{{ heroGreetingLines.time }}</span>
                <span class="block break-words">{{ heroGreetingLines.name }}</span>
              </h1>
            </div>

            <nav v-if="sideNavItems.length" class="grid gap-2" aria-label="Что важно сейчас">
              <RouterLink
                v-for="item in sideNavItems"
                :key="`${item.to}-${item.label}`"
                class="group flex items-center gap-3 rounded-2xl border px-4 py-3 transition duration-200 ease-out"
                :class="
                  item.emphasize
                    ? 'border-ember bg-ember text-paper hover:bg-bolt'
                    : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
                "
                :to="item.to"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <component :is="item.icon" :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]">
                    {{ item.label }}
                  </span>
                </span>
                <span
                  v-if="item.badge"
                  class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                  :class="item.emphasize ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
                >
                  {{ item.badge }}
                </span>
              </RouterLink>
            </nav>
          </div>
        </aside>

        <nav
          v-if="anchors.length"
          class="-mx-1 flex gap-1 overflow-x-auto px-1"
          aria-label="Разделы Обзора"
        >
          <a
            v-for="anchor in anchors"
            :key="anchor.id"
            class="relative inline-flex h-[38px] shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-3 text-sm font-black text-ink/66 transition duration-200 ease-out hover:border-ink hover:bg-[#fffaf0] hover:text-ink"
            :href="`#${anchor.id}`"
          >
            {{ anchor.label }}
          </a>
        </nav>

        <article
          v-if="showNextSteps"
          id="steps"
          class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
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

        <section v-if="summary" class="grid min-w-0 gap-4">
          <div class="grid gap-4 xl:grid-cols-2">
            <section
              id="pipeline"
              class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
            >
              <div class="flex items-center gap-3">
                <PieChart :size="22" />
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Воронка</p>
                  <h3 class="text-2xl font-black tracking-[-0.05em]">Путь работы</h3>
                </div>
              </div>
              <div class="mt-5 space-y-4">
                <div v-for="(item, index) in summary.pipeline" :key="item.label">
                  <div class="flex items-center justify-between gap-3 text-sm font-black">
                    <span>{{ item.label }}</span>
                    <span>{{ valueLabel(item) }}</span>
                  </div>
                  <div class="mt-2 h-3 overflow-hidden rounded-full border border-line bg-paper">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      :class="barToneClass(index)"
                      :style="{ width: barWidth(item, maxPipelineValue) }"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="statuses"
              class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
            >
              <div class="flex items-center gap-3">
                <ClipboardList :size="22" />
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Заказы</p>
                  <h3 class="text-2xl font-black tracking-[-0.05em]">Статусы</h3>
                </div>
              </div>
              <div class="mt-5 space-y-4">
                <div v-for="(item, index) in summary.orderStatuses" :key="item.label">
                  <div class="flex items-center justify-between gap-3 text-sm font-black">
                    <span>{{ item.label }}</span>
                    <span>{{ valueLabel(item) }}</span>
                  </div>
                  <div class="mt-2 h-3 overflow-hidden rounded-full border border-line bg-paper">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      :class="barToneClass(index + 1)"
                      :style="{ width: barWidth(item, maxStatusValue) }"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="money"
              class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
            >
              <div class="flex items-center gap-3">
                <WalletCards :size="22" />
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Деньги</p>
                  <h3 class="text-2xl font-black tracking-[-0.05em]">Удержания</h3>
                </div>
              </div>
              <div class="mt-5 space-y-4">
                <div v-for="(item, index) in summary.money" :key="item.label">
                  <div class="flex items-center justify-between gap-3 text-sm font-black">
                    <span>{{ item.label }}</span>
                    <span>{{ valueLabel(item) }}</span>
                  </div>
                  <div class="mt-2 h-3 overflow-hidden rounded-full border border-line bg-paper">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      :class="barToneClass(index + 2)"
                      :style="{ width: barWidth(item, maxMoneyValue) }"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              id="activity"
              class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
            >
              <div class="flex items-center gap-3">
                <Activity :size="22" />
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                    Активность
                  </p>
                  <h3 class="text-2xl font-black tracking-[-0.05em]">Сигналы</h3>
                </div>
              </div>
              <div class="mt-5 space-y-4">
                <div v-for="(item, index) in summary.activity" :key="item.label">
                  <div class="flex items-center justify-between gap-3 text-sm font-black">
                    <span>{{ item.label }}</span>
                    <span>{{ valueLabel(item) }}</span>
                  </div>
                  <div class="mt-2 h-3 overflow-hidden rounded-full border border-line bg-paper">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out"
                      :class="barToneClass(index + 3)"
                      :style="{ width: barWidth(item, maxActivityValue) }"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
