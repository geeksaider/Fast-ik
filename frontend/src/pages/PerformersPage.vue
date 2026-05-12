<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Loader2,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import InlineFilterSelect from '../components/InlineFilterSelect.vue';
import PageHero from '../components/PageHero.vue';
import PersonAvatar from '../components/PersonAvatar.vue';
import { usePerformersStore } from '../stores/performers';
import { formatAmount } from '../lib/format';
import type { PublicPerformerListItem } from '../lib/api';

const performers = usePerformersStore();
const pageSize = 6;
const page = ref(1);
const filters = reactive({
  search: '',
  level: 'all',
  quick: 'all',
  sort: 'trust',
});

const load = async () => {
  page.value = 1;
  await performers.loadAll();
};

const ratingLabel = (performer: PublicPerformerListItem) =>
  performer.stats.averageRating ? performer.stats.averageRating.toFixed(1) : 'новый';

const hourlyRate = (performer: PublicPerformerListItem) =>
  performer.performerProfile?.hourlyRate
    ? `${formatAmount(performer.performerProfile.hourlyRate)} / час`
    : 'ставка по задаче';

const levelOptions = computed(() => {
  const levels = performers.performers
    .map((performer) => performer.currentLevel)
    .filter((level): level is NonNullable<PublicPerformerListItem['currentLevel']> => Boolean(level));

  return [...new Map(levels.map((level) => [level.code, level])).values()].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
});
const availabilityLabel = (value: string | null | undefined) => {
  const map: Record<string, string> = {
    full_time: 'Полная занятость',
    part_time: 'Частичная занятость',
    project: 'Проектная работа',
  };

  return value ? map[value] ?? value : 'Формат не указан';
};
const matchesSearch = (performer: PublicPerformerListItem) => {
  const query = filters.search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    performer.user.displayName,
    performer.profile?.city,
    performer.profile?.bio,
    performer.performerProfile?.headline,
    performer.performerProfile?.specialization,
    ...performer.skills.flatMap((skill) => [skill.name, skill.slug, skill.categoryName]),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};
const filteredPerformers = computed(() => {
  const source = performers.performers.filter((performer) => {
    if (!matchesSearch(performer)) {
      return false;
    }

    if (filters.level !== 'all' && performer.currentLevel?.code !== filters.level) {
      return false;
    }

    if (filters.quick === 'rated' && performer.stats.averageRating === null) {
      return false;
    }

    if (filters.quick === 'top' && (performer.stats.averageRating ?? 0) < 4.8) {
      return false;
    }

    if (filters.quick === 'skills' && !performer.skills.length) {
      return false;
    }

    if (filters.quick === 'complete' && !performer.performerProfile?.onboardingCompleted) {
      return false;
    }

    if (filters.quick === 'with_rate' && !performer.performerProfile?.hourlyRate) {
      return false;
    }

    if (filters.quick === 'without_rate' && performer.performerProfile?.hourlyRate) {
      return false;
    }

    if (
      ['full_time', 'part_time', 'project'].includes(filters.quick) &&
      performer.performerProfile?.availability !== filters.quick
    ) {
      return false;
    }

    if (filters.quick === 'junior' && (performer.performerProfile?.experienceYears ?? 0) > 1) {
      return false;
    }

    if (
      filters.quick === 'middle' &&
      !(
        (performer.performerProfile?.experienceYears ?? 0) >= 2 &&
        (performer.performerProfile?.experienceYears ?? 0) <= 4
      )
    ) {
      return false;
    }

    if (filters.quick === 'senior' && (performer.performerProfile?.experienceYears ?? 0) < 5) {
      return false;
    }

    if (filters.quick === 'with_orders' && performer.stats.completedOrdersCount < 1) {
      return false;
    }

    if (filters.quick === 'experienced' && performer.stats.completedOrdersCount < 3) {
      return false;
    }

    if (filters.quick === 'active' && (performer.progress?.xp ?? 0) < 100) {
      return false;
    }

    if (filters.quick === 'advanced' && (performer.progress?.xp ?? 0) < 300) {
      return false;
    }

    return true;
  });

  return [...source].sort((first, second) => {
    if (filters.sort === 'rating') {
      return (second.stats.averageRating ?? 0) - (first.stats.averageRating ?? 0);
    }

    if (filters.sort === 'orders') {
      return second.stats.completedOrdersCount - first.stats.completedOrdersCount;
    }

    if (filters.sort === 'experience') {
      return (
        (second.performerProfile?.experienceYears ?? 0) -
        (first.performerProfile?.experienceYears ?? 0)
      );
    }

    if (filters.sort === 'skills') {
      return second.skills.length - first.skills.length;
    }

    if (filters.sort === 'rate_low') {
      return (
        (first.performerProfile?.hourlyRate ?? Number.MAX_SAFE_INTEGER) -
        (second.performerProfile?.hourlyRate ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (filters.sort === 'rate_high') {
      return (second.performerProfile?.hourlyRate ?? 0) - (first.performerProfile?.hourlyRate ?? 0);
    }

    return (
      (second.progress?.xp ?? 0) - (first.progress?.xp ?? 0) ||
      (second.stats.averageRating ?? 0) - (first.stats.averageRating ?? 0)
    );
  });
});
const visiblePerformers = computed(() => filteredPerformers.value.slice(0, page.value * pageSize));
const hasMorePerformers = computed(
  () => visiblePerformers.value.length < filteredPerformers.value.length,
);
const ratedPerformers = computed(() =>
  performers.performers.filter((performer) => performer.stats.averageRating !== null),
);
const withSkills = computed(() =>
  performers.performers.filter((performer) => performer.skills.length > 0),
);
const withRate = computed(() =>
  performers.performers.filter((performer) => performer.performerProfile?.hourlyRate),
);
const heroCards = computed(() => [
  {
    key: 'rated' as const,
    title: 'С рейтингом',
    text: 'Есть оценки',
    value: ratedPerformers.value.length,
    icon: Star,
  },
  {
    key: 'skills' as const,
    title: 'С навыками',
    text: 'Профиль заполнен',
    value: withSkills.value.length,
    icon: BadgeCheck,
  },
  {
    key: 'rate' as const,
    title: 'Со ставкой',
    text: 'Цена указана',
    value: withRate.value.length,
    icon: BriefcaseBusiness,
  },
]);

const isHeroCardActive = (key: (typeof heroCards.value)[number]['key']) => {
  if (key === 'rated') {
    return filters.quick === 'rated';
  }

  if (key === 'skills') {
    return filters.quick === 'skills';
  }

  return filters.quick === 'with_rate';
};

const applyHeroFilter = (key: (typeof heroCards.value)[number]['key']) => {
  if (key === 'rated') {
    filters.quick = filters.quick === 'rated' ? 'all' : 'rated';
  } else if (key === 'skills') {
    filters.quick = filters.quick === 'skills' ? 'all' : 'skills';
  } else {
    filters.quick = filters.quick === 'with_rate' ? 'all' : 'with_rate';
  }

  page.value = 1;
};

const resetFilters = () => {
  filters.search = '';
  filters.level = 'all';
  filters.quick = 'all';
  filters.sort = 'trust';
  page.value = 1;
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
      <PageHero
        eyebrow="Исполнители"
        title="Найдите человека до публикации задачи."
        text="Смотрите уровень, навыки, рейтинг и портфолио. Заказчик может открыть профиль и сразу пригласить исполнителя."
      >
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
            <button
              v-for="card in heroCards"
              :key="card.key"
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                isHeroCardActive(card.key)
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="applyHeroFilter(card.key)"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <component :is="card.icon" :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]">
                  {{ card.title }}
                </span>
              </span>
              <span
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper/15 px-0 text-xs font-black leading-none tabular-nums text-paper"
                :class="isHeroCardActive(card.key) ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
              >
                {{ card.value }}
              </span>
            </button>
          </section>
        </template>
      </PageHero>

      <div class="mt-4">
        <FilterPanel title="Фильтры" columns="sm:grid-cols-2 lg:grid-cols-4" @reset="resetFilters">
          <label class="block">
            <input
              v-model="filters.search"
              class="h-12 w-full rounded-2xl border border-line bg-paper px-4 font-semibold outline-none placeholder:text-ink/35 focus:border-ink"
              placeholder="Vue, дизайн, Москва"
              @input="page = 1"
            />
          </label>

          <InlineFilterSelect v-model="filters.level" @change="page = 1">
            <option value="all">Любой уровень</option>
            <option v-for="level in levelOptions" :key="level.code" :value="level.code">
              {{ level.title }}
            </option>
          </InlineFilterSelect>

          <InlineFilterSelect v-model="filters.quick" @change="page = 1">
            <option value="all">Любой исполнитель</option>
            <option value="rated">Есть оценки</option>
            <option value="top">Рейтинг 4.8 и выше</option>
            <option value="skills">Есть навыки</option>
            <option value="complete">Профиль заполнен</option>
            <option value="with_rate">Ставка указана</option>
            <option value="without_rate">По задаче</option>
            <option value="full_time">Полная занятость</option>
            <option value="part_time">Частичная занятость</option>
            <option value="project">Проектная работа</option>
            <option value="junior">До 1 года</option>
            <option value="middle">2-4 года</option>
            <option value="senior">5+ лет</option>
            <option value="with_orders">Есть завершенные</option>
            <option value="experienced">3+ завершенных</option>
            <option value="active">100+ XP</option>
            <option value="advanced">300+ XP</option>
          </InlineFilterSelect>

          <InlineFilterSelect v-model="filters.sort" @change="page = 1">
            <option value="trust">По доверию</option>
            <option value="rating">По рейтингу</option>
            <option value="orders">По заказам</option>
            <option value="experience">По опыту</option>
            <option value="skills">По навыкам</option>
            <option value="rate_low">Ставка ниже</option>
            <option value="rate_high">Ставка выше</option>
          </InlineFilterSelect>
        </FilterPanel>
      </div>

      <p
        v-if="!performers.isLoading && performers.performers.length"
        class="mt-4 text-sm font-semibold text-ink/55"
      >
        Найдено <span class="font-black text-ink">{{ filteredPerformers.length }}</span> из
        <span class="font-black text-ink">{{ performers.performers.length }}</span> исполнителей.
      </p>

      <section class="mt-4 grid gap-4">
        <div
          v-if="performers.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем исполнителей
          </span>
        </div>

        <article
          v-for="performer in visiblePerformers"
          :key="performer.user.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="grid gap-5 lg:grid-cols-[5rem_minmax(0,1fr)_14rem] lg:items-center">
            <PersonAvatar
              :name="performer.user.displayName"
              :src="performer.profile?.avatarUrl"
              tone="paper"
              size="lg"
            />

            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/50">
                {{ performer.currentLevel?.title ?? 'Новый исполнитель' }} ·
                {{ performer.profile?.city ?? 'город не указан' }}
              </p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                {{ performer.user.displayName }}
              </h2>
              <p class="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/68">
                {{
                  performer.performerProfile?.headline ||
                  performer.profile?.bio ||
                  'Профиль готов к первым заказам.'
                }}
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="skill in performer.skills.slice(0, 4)"
                  :key="skill.id"
                  class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/68"
                >
                  #{{ skill.slug }}
                </span>
                <span
                  class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/68"
                >
                  {{ hourlyRate(performer) }}
                </span>
                <span
                  class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/68"
                >
                  {{ availabilityLabel(performer.performerProfile?.availability) }}
                </span>
              </div>
            </div>

            <div class="grid gap-3 lg:justify-items-end">
              <div class="flex flex-wrap gap-2 lg:justify-end">
                <span
                  class="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-black"
                >
                  <Star :size="14" /> {{ ratingLabel(performer) }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-black"
                >
                  <Trophy :size="14" /> {{ performer.progress?.xp ?? 0 }} XP
                </span>
              </div>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                :to="`/performers/${performer.user.id}`"
              >
                Открыть профиль
              </RouterLink>
            </div>
          </div>
        </article>

        <div
          v-if="!performers.isLoading && !visiblePerformers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Sparkles class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Исполнителей не найдено</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Попробуйте другой навык, город или имя.
          </p>
        </div>

        <button
          v-if="hasMorePerformers"
          class="h-10 w-full rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще исполнителей
        </button>
      </section>
    </section>
  </main>
</template>
