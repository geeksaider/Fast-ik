<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  CheckCircle2,
  FileStack,
  Loader2,
  LockKeyhole,
  Medal,
  Plus,
  Trophy,
} from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import InlineFilterSelect from '../components/InlineFilterSelect.vue';
import PageHero from '../components/PageHero.vue';
import { useAuthStore } from '../stores/auth';
import { useContestsStore } from '../stores/contests';
import { useLevelsStore } from '../stores/levels';
import { useMarketplaceStore } from '../stores/marketplace';
import { formatAmount, formatDate, formatDisplayText, formatSystemLabel } from '../lib/format';

const auth = useAuthStore();
const contests = useContestsStore();
const levelsStore = useLevelsStore();
const marketplace = useMarketplaceStore();
const page = ref(1);
const pageSize = 6;
type ContestPreset = 'all' | 'open' | 'available' | 'with_submissions';
type ContestSort = 'newest' | 'deadline' | 'prize' | 'submissions';
const presetFilter = ref<ContestPreset>('all');
const sortMode = ref<ContestSort>('newest');

const filters = reactive({
  category: '',
});
const canCreateContest = computed(() => auth.user?.role === 'customer' || auth.user?.role === 'admin');

const performerLevelSortOrder = computed(() => levelsStore.summary?.currentLevel.sortOrder ?? null);
const isLevelLocked = (requiredLevelSortOrder: number) =>
  auth.user?.role === 'performer' &&
  performerLevelSortOrder.value !== null &&
  performerLevelSortOrder.value < requiredLevelSortOrder;
const contestDeadlineValue = (value: string | null) =>
  value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
const filteredContests = computed(() => {
  let source = contests.contests;

  if (presetFilter.value === 'open') {
    source = contests.contests.filter((contest) => contest.status === 'open');
  } else if (presetFilter.value === 'available') {
    source = contests.contests.filter((contest) => !isLevelLocked(contest.requiredLevelSortOrder));
  } else if (presetFilter.value === 'with_submissions') {
    source = contests.contests.filter((contest) => contest.submissionsCount > 0);
  }

  return [...source].sort((first, second) => {
    if (sortMode.value === 'deadline') {
      return contestDeadlineValue(first.deadlineAt) - contestDeadlineValue(second.deadlineAt);
    }

    if (sortMode.value === 'prize') {
      return second.prizeAmount - first.prizeAmount;
    }

    if (sortMode.value === 'submissions') {
      return second.submissionsCount - first.submissionsCount;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
});
const visibleContests = computed(() => filteredContests.value.slice(0, page.value * pageSize));
const hasMoreContests = computed(
  () => visibleContests.value.length < filteredContests.value.length,
);
const presetCards = computed(() => {
  const cards: Array<{
    key: ContestPreset;
    title: string;
    text: string;
    value: number;
    icon: typeof Trophy;
  }> = [
    {
      key: 'open',
      title: 'Открытые',
      text: 'Прием работ',
      value: contests.contests.filter((contest) => contest.status === 'open').length,
      icon: Medal,
    },
  ];

  if (auth.user?.role === 'performer') {
    cards.push({
      key: 'available',
      title: 'Доступные',
      text: 'Под ваш LVL',
      value: contests.contests.filter((contest) => !isLevelLocked(contest.requiredLevelSortOrder))
        .length,
      icon: CheckCircle2,
    });

    return cards;
  }

  cards.push({
    key: 'with_submissions',
    title: 'С работами',
    text: 'Есть отклики',
    value: contests.contests.filter((contest) => contest.submissionsCount > 0).length,
    icon: FileStack,
  });

  return cards;
});

const applyPreset = (preset: ContestPreset) => {
  presetFilter.value = preset;
  page.value = 1;
};

const resetFilters = () => {
  filters.category = '';
  presetFilter.value = 'all';
  sortMode.value = 'newest';
  page.value = 1;
  void load();
};

const load = async () => {
  page.value = 1;
  await Promise.all([
    marketplace.loadCategories(),
    contests.loadContests(
      {
        category: filters.category || undefined,
      },
      auth.accessToken,
    ),
    auth.accessToken && auth.user?.role === 'performer'
      ? levelsStore.load(auth.accessToken)
      : Promise.resolve(),
  ]);
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
        eyebrow="Конкурсы"
        title="Задания, куда пускает уровень."
        text="Конкурс дает заказчику несколько идей, а исполнителю - шанс показать скорость и усилить доверие."
      >
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
            <RouterLink
              v-if="canCreateContest"
              class="group flex h-[70px] items-center gap-3 rounded-2xl border border-ember bg-ember px-4 text-left text-paper transition duration-200 ease-out hover:bg-bolt"
              to="/contests/new"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <Plus :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]">
                  Создать конкурс
                </span>
              </span>
            </RouterLink>
            <button
              v-for="card in presetCards"
              :key="card.key"
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                presetFilter === card.key
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="applyPreset(card.key)"
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
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                :class="presetFilter === card.key ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
              >
                {{ card.value }}
              </span>
            </button>
          </section>
        </template>
      </PageHero>

      <div class="mt-4">
        <FilterPanel columns="lg:grid-cols-2" @reset="resetFilters">
          <InlineFilterSelect v-model="filters.category" @change="load">
            <option value="">Все категории</option>
            <option
              v-for="category in marketplace.categories"
              :key="category.id"
              :value="category.slug"
            >
              {{ category.name }}
            </option>
          </InlineFilterSelect>
          <InlineFilterSelect v-model="sortMode" @change="page = 1">
            <option value="newest">Сначала новые</option>
            <option value="deadline">По дедлайну</option>
            <option value="prize">По призу</option>
            <option value="submissions">По работам</option>
          </InlineFilterSelect>
        </FilterPanel>
      </div>

      <section class="mt-4 space-y-4">
        <div v-if="contests.isLoading" class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем конкурсы
          </span>
        </div>

        <article
          v-for="contest in visibleContests"
          :key="contest.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div
                class="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/55"
              >
                <span>{{ contest.categoryName || 'Без категории' }}</span>
                <span>•</span>
                <span>{{ formatSystemLabel(contest.status) }}</span>
                <span>•</span>
                <span>{{ formatDate(contest.deadlineAt) }}</span>
              </div>
              <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                {{ formatDisplayText(contest.title) }}
              </h2>
              <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-ink/70">
                {{ contest.brief }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2 md:justify-end">
              <span class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black">
                {{ formatAmount(contest.prizeAmount) }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-bolt"
              >
                <LockKeyhole v-if="isLevelLocked(contest.requiredLevelSortOrder)" :size="15" />
                LVL {{ contest.requiredLevelSortOrder }} · {{ contest.requiredLevelTitle }}
              </span>
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-ink/62"
              >
                {{ contest.submissionsCount }} работ
              </span>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in contest.tags"
                :key="tag"
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                #{{ tag }}
              </span>
            </div>
            <RouterLink
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              :to="`/contests/${contest.id}`"
            >
              Открыть
            </RouterLink>
          </div>
        </article>

        <div
          v-if="!contests.isLoading && !contests.contests.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Medal class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Конкурсов пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Попробуйте другой фильтр или создайте первый конкурс для исполнителей.
          </p>
        </div>

        <button
          v-if="hasMoreContests"
          class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще конкурсы
        </button>
      </section>
    </section>
  </main>
</template>
