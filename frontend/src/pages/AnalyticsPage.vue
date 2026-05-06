<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  Activity,
  BarChart3,
  ClipboardList,
  Gauge,
  Loader2,
  PieChart,
  WalletCards,
} from 'lucide-vue-next';
import { useAnalyticsStore } from '../stores/analytics';
import { useAuthStore } from '../stores/auth';
import { formatAmount, formatDateTime } from '../lib/format';
import type { AnalyticsBreakdownItem, AnalyticsMetric } from '../lib/api';

const analytics = useAnalyticsStore();
const auth = useAuthStore();
const router = useRouter();

const summary = computed(() => analytics.summary);
const maxPipelineValue = computed(() => maxValue(summary.value?.pipeline ?? []));
const maxStatusValue = computed(() => maxValue(summary.value?.orderStatuses ?? []));
const maxMoneyValue = computed(() => maxValue(summary.value?.money ?? []));
const maxActivityValue = computed(() => maxValue(summary.value?.activity ?? []));

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    customer: 'заказчик',
    performer: 'исполнитель',
    support: 'поддержка',
    moderator: 'модератор',
    admin: 'админ',
    super_admin: 'суперадмин',
  };

  return summary.value ? (map[summary.value.role] ?? 'пользователь') : 'пользователь';
});

const maxValue = (items: AnalyticsBreakdownItem[]) => {
  const value = Math.max(...items.map((item) => Math.abs(item.amount ?? item.value)), 0);

  return value || 1;
};

const barWidth = (item: AnalyticsBreakdownItem, max: number) => {
  const value = Math.abs(item.amount ?? item.value);

  return `${Math.max(7, Math.round((value / max) * 100))}%`;
};

const metricToneClass = (tone: AnalyticsMetric['tone']) => {
  const classes: Record<AnalyticsMetric['tone'], string> = {
    dark: 'border-ink bg-ink text-paper',
    ember: 'border-ink bg-ember text-paper',
    moss: 'border-moss bg-moss text-paper',
    bolt: 'border-bolt bg-paper text-ink',
    paper: 'border-line bg-paper text-ink',
  };

  return classes[tone];
};

const metricRoute = (metric: AnalyticsMetric) => {
  const routes: Record<string, string> = {
    Заказы: '/orders',
    Отклики: '/applications',
    Приглашения: '/applications',
    'В гаранте': '/finance',
    XP: '/level-roadmap',
    Выбрано: '/orders',
    Рейтинг: '/level-roadmap',
    Пользователи: '/admin',
    Споры: '/admin',
  };

  return routes[metric.label] ?? '/dashboard';
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

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await analytics.load(auth.accessToken);
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <div v-if="analytics.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Собираем аналитику
        </span>
      </div>

      <section
        v-else-if="analytics.error"
        class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ember">Аналитика недоступна</p>
        <h1 class="mt-3 text-4xl font-black tracking-[-0.06em]">Не получилось собрать сводку.</h1>
        <p class="mt-3 max-w-xl text-sm font-semibold leading-6 text-ink/65">
          {{ analytics.error }}
        </p>
        <RouterLink
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
          to="/dashboard"
        >
          Вернуться в центр
        </RouterLink>
      </section>

      <section v-else-if="summary" class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside class="space-y-4">
          <section class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div class="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
                <BarChart3 :size="28" />
              </div>
              <span
                class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
              >
                {{ roleLabel }}
              </span>
            </div>

            <p class="mt-5 text-xs font-black uppercase tracking-[0.24em] text-paper/55">
              Fastik Pulse
            </p>
            <h1
              class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
            >
              {{ summary.title }}
            </h1>
            <p class="mt-4 text-sm font-semibold leading-6 text-paper/68">
              {{ summary.subtitle }}
            </p>
            <p
              class="mt-5 rounded-2xl border border-paper/20 bg-paper/[0.06] p-4 text-sm font-bold"
            >
              Обновлено: {{ formatDateTime(summary.generatedAt) }}
            </p>
          </section>

          <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
            <div class="flex items-center gap-3">
              <Gauge :size="22" />
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Метрики</p>
                <h2 class="text-2xl font-black tracking-[-0.05em]">Сейчас</h2>
              </div>
            </div>

            <div class="mt-4 grid gap-3">
              <RouterLink
                v-for="metric in summary.metrics"
                :key="metric.label"
                class="rounded-2xl border p-4 transition duration-200 ease-out hover:-translate-y-0.5"
                :class="metricToneClass(metric.tone)"
                :to="metricRoute(metric)"
              >
                <p class="text-xs font-black uppercase tracking-[0.16em] opacity-65">
                  {{ metric.label }}
                </p>
                <p class="mt-2 text-3xl font-black tracking-[-0.05em]">
                  {{ metric.displayValue }}
                </p>
                <p class="mt-1 text-sm font-semibold opacity-70">{{ metric.detail }}</p>
                <span
                  class="mt-4 inline-flex h-8 items-center gap-2 rounded-full border border-current px-3 text-xs font-black uppercase tracking-[0.1em] opacity-80"
                >
                  Открыть
                </span>
              </RouterLink>
            </div>
          </section>
        </aside>

        <section class="space-y-4">
          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Обзор</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Роль без хаоса</h2>
              </div>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
                to="/dashboard"
              >
                В центр
              </RouterLink>
            </div>
            <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/65">
              Здесь нет тяжелых графиков ради графиков: только показатели, которые помогают быстро
              понять состояние заказов, денег, откликов и активности в текущей роли.
            </p>
            <div class="mt-5 grid gap-3 md:grid-cols-3">
              <RouterLink
                class="group rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                to="/orders"
              >
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Заказы</p>
                <p class="mt-2 flex items-center justify-between gap-3 text-xl font-black">
                  Управлять статусами
                </p>
              </RouterLink>
              <RouterLink
                class="group rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                to="/applications"
              >
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Отклики</p>
                <p class="mt-2 flex items-center justify-between gap-3 text-xl font-black">
                  Сравнить кандидатов
                </p>
              </RouterLink>
              <RouterLink
                class="group rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                to="/finance"
              >
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Финансы</p>
                <p class="mt-2 flex items-center justify-between gap-3 text-xl font-black">
                  Проверить гарант
                </p>
              </RouterLink>
            </div>
          </article>

          <div class="grid gap-4 xl:grid-cols-2">
            <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
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

            <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
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

            <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
              <div class="flex items-center gap-3">
                <WalletCards :size="22" />
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Деньги</p>
                  <h3 class="text-2xl font-black tracking-[-0.05em]">Гарант</h3>
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

            <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
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
