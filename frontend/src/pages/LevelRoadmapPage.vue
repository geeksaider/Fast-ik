<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  BadgeCheck,
  Check,
  CircleDashed,
  Clock3,
  Loader2,
  Lock,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useLevelsStore } from '../stores/levels';
import { formatDateTime, formatDisplayText, formatSystemLabel } from '../lib/format';
import type { LevelRequirement } from '../lib/api';

const auth = useAuthStore();
const levels = useLevelsStore();
const router = useRouter();

const summary = computed(() => levels.summary);
const showCompleted = ref(false);
const currentLevel = computed(() => summary.value?.currentLevel);
const nextLevel = computed(() => summary.value?.nextLevel);
const roadmapCounts = computed(() => {
  const roadmap = summary.value?.roadmap ?? [];

  return {
    completed: roadmap.filter((level) => level.status === 'completed').length,
    current: roadmap.find((level) => level.status === 'current')?.title ?? 'Не рассчитан',
    locked: roadmap.filter((level) => level.status === 'locked').length,
  };
});
const nextRequirements = computed(() => {
  const current = summary.value?.roadmap.find((level) => level.status === 'current');

  return current?.requirements.filter((requirement) => !requirement.completed).slice(0, 3) ?? [];
});
const visibleRoadmap = computed(() => {
  const roadmap = summary.value?.roadmap ?? [];

  return showCompleted.value ? roadmap : roadmap.filter((level) => level.status !== 'completed');
});

const valueLabel = (value: LevelRequirement['currentValue']) => {
  if (typeof value === 'boolean') {
    return value ? 'да' : 'нет';
  }

  if (value === null) {
    return 'нет данных';
  }

  return String(value);
};

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  if (auth.user?.role !== 'performer') {
    await router.push('/dashboard');
    return;
  }

  await levels.load(auth.accessToken);
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
      <div v-if="levels.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем дорогу к славе
        </span>
      </div>

      <section
        v-else-if="levels.error"
        class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ember">
          Путь роста недоступен
        </p>
        <h1 class="mt-3 text-4xl font-black tracking-[-0.06em]">
          Не получилось открыть дорогу к славе.
        </h1>
        <p class="mt-3 max-w-xl text-sm font-semibold leading-6 text-ink/65">
          {{ levels.error }}
        </p>
        <RouterLink
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
          to="/dashboard"
        >
          Вернуться в центр
        </RouterLink>
      </section>

      <section v-else-if="summary && currentLevel">
        <div class="grid gap-4">
          <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
                  >
                    LVL {{ currentLevel.sortOrder }}
                  </span>
                  <span
                    class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-paper/65"
                  >
                    Текущий уровень
                  </span>
                </div>
                <h1 class="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.07em] sm:text-5xl">
                  {{ currentLevel.title }} исполнитель
                </h1>
                <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
                  {{ currentLevel.description }}
                </p>
                <div class="mt-5 flex flex-wrap gap-2">
                  <RouterLink
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-paper bg-paper px-4 text-sm font-black text-ink transition hover:bg-ember hover:text-paper"
                    to="/jobs"
                  >
                    Найти заказ для XP
                  </RouterLink>
                  <a
                    class="inline-flex h-10 items-center justify-center rounded-full border border-paper/30 px-4 text-sm font-black text-paper/80 transition hover:bg-paper hover:text-ink"
                    href="#metrics"
                  >
                    Метрики
                  </a>
                  <a
                    class="inline-flex h-10 items-center justify-center rounded-full border border-paper/30 px-4 text-sm font-black text-paper/80 transition hover:bg-paper hover:text-ink"
                    href="#events"
                  >
                    Журнал XP
                  </a>
                </div>
              </div>

              <div class="grid gap-3">
                <div class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
                  <p class="text-sm font-bold text-paper/55">Всего опыта</p>
                  <p class="mt-1 text-3xl font-black">{{ summary.progress.xp }} XP</p>
                </div>

                <div
                  v-if="nextLevel"
                  class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4"
                >
                  <div class="flex items-center justify-between gap-4">
                    <p class="font-black">До {{ nextLevel.title }}</p>
                    <p class="text-sm font-black text-ember">{{ summary.xpToNext }} XP</p>
                  </div>
                  <div
                    class="mt-3 h-3 overflow-hidden rounded-full border border-paper/20 bg-paper/15"
                  >
                    <div
                      class="h-full rounded-full bg-ember"
                      :style="{ width: `${summary.nextLevelProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p
              v-if="summary.progress.interviewRequired"
              class="mt-4 rounded-2xl border border-ember bg-ember/15 p-4 text-sm font-bold leading-6"
            >
              XP уже достаточно для Elite-зоны. Последний замок: онлайн-интервью с HR Fastik.
            </p>
          </aside>

          <section class="space-y-5">
            <article
              v-if="nextRequirements.length"
              class="rounded-[1.35rem] border border-ink bg-ember p-5 text-paper sm:p-6"
            >
              <p class="text-xs font-black uppercase tracking-[0.2em] text-paper/70">
                Ближайший фокус
              </p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Что нужно сделать сейчас</h2>
              <div class="mt-4 grid gap-2 md:grid-cols-3">
                <RouterLink
                  v-for="item in nextRequirements"
                  :key="item.code"
                  class="rounded-2xl border border-paper/25 bg-paper/10 p-4 transition hover:bg-paper/20"
                  to="/onboarding"
                >
                  <p class="font-black">{{ item.title }}</p>
                  <p class="mt-2 text-sm font-semibold leading-5 text-paper/72">
                    {{ item.description }}
                  </p>
                </RouterLink>
              </div>
            </article>

            <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/55">Рост</p>
              <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Дорога к славе</h2>
              <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/68">
                Уровень растет не от пустой галочки, а от действий: профиль, отклики, выбранные
                заявки, сдача результата и завершенные заказы.
              </p>
              <div class="mt-5 grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Пройдено</p>
                  <p class="mt-1 text-2xl font-black">{{ roadmapCounts.completed }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Сейчас</p>
                  <p class="mt-1 truncate text-2xl font-black">{{ roadmapCounts.current }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Впереди</p>
                  <p class="mt-1 text-2xl font-black">{{ roadmapCounts.locked }}</p>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="inline-flex h-10 items-center justify-center rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
                  type="button"
                  @click="showCompleted = !showCompleted"
                >
                  {{ showCompleted ? 'Скрыть пройденное' : 'Показать пройденное' }}
                </button>
                <a
                  class="inline-flex h-10 items-center justify-center rounded-full border border-ink bg-ink px-4 text-sm font-black text-paper transition hover:bg-bolt"
                  href="#current-level"
                >
                  Текущий уровень
                </a>
                <a
                  class="inline-flex h-10 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-black text-ink/65 transition hover:border-ink hover:text-ink"
                  href="#metrics"
                >
                  Метрики
                </a>
              </div>
            </article>

            <div class="grid gap-3">
              <article
                v-for="level in visibleRoadmap"
                :key="level.code"
                :id="level.status === 'current' ? 'current-level' : undefined"
                class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
                :class="level.status === 'current' ? 'shadow-cut' : ''"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                      LVL {{ level.sortOrder }} · {{ formatSystemLabel(level.status) }} ·
                      {{ level.requiredXp }} XP
                    </p>
                    <h3 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                      {{ level.title }}
                    </h3>
                    <p class="mt-2 text-sm font-semibold leading-6 text-ink/68">
                      {{ level.description }}
                    </p>
                  </div>
                  <div
                    class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-ink bg-paper"
                  >
                    <Check v-if="level.status === 'completed'" class="text-moss" :size="22" />
                    <Sparkles
                      v-else-if="level.status === 'current'"
                      class="text-ember"
                      :size="22"
                    />
                    <Lock v-else class="text-ink/45" :size="22" />
                  </div>
                </div>

                <div class="mt-4 grid gap-2 md:grid-cols-2">
                  <div
                    v-for="item in level.requirements"
                    :key="item.code"
                    class="rounded-2xl border border-line bg-paper p-4"
                  >
                    <p class="flex items-center gap-2 font-black">
                      <BadgeCheck v-if="item.completed" class="text-moss" :size="18" />
                      <CircleDashed v-else class="text-ember" :size="18" />
                      {{ item.title }}
                    </p>
                    <p class="mt-2 text-sm font-semibold leading-5 text-ink/65">
                      {{ item.description }}
                    </p>
                    <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                      сейчас: {{ valueLabel(item.currentValue) }} / цель:
                      {{ valueLabel(item.targetValue) }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <section class="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <article
            id="metrics"
            class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/55">Метрики</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="metric in summary.metrics"
                :key="metric.code"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <p class="font-black">{{ metric.title }}</p>
                <p
                  class="mt-1 text-2xl font-black"
                  :class="metric.completed ? 'text-moss' : 'text-ember'"
                >
                  {{ valueLabel(metric.value) }}
                </p>
              </div>
            </div>
          </article>

          <article
            id="events"
            class="scroll-mt-32 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/55">Журнал XP</p>
            <div class="mt-4 space-y-3">
              <div
                v-for="event in summary.events"
                :key="event.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="flex items-center gap-2 font-black">
                      <Medal class="text-bolt" :size="18" />
                      {{ formatDisplayText(event.title) }}
                    </p>
                    <p v-if="event.description" class="mt-1 text-sm font-semibold text-ink/65">
                      {{ formatDisplayText(event.description) }}
                    </p>
                    <p
                      class="mt-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-ink/45"
                    >
                      <Clock3 :size="14" />
                      {{ formatDateTime(event.createdAt) }} · {{ formatSystemLabel(event.type) }}
                    </p>
                  </div>
                  <p class="text-xl font-black" :class="event.xp >= 0 ? 'text-moss' : 'text-ember'">
                    {{ event.xp >= 0 ? '+' : '' }}{{ event.xp }} XP
                  </p>
                </div>
              </div>
              <p
                v-if="!summary.events.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
              >
                Событий XP пока нет. Заполните профиль и начните откликаться на заказы.
              </p>
            </div>
          </article>
        </section>
      </section>
    </section>
  </main>
</template>
