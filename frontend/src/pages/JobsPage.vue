<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  BriefcaseBusiness,
  CalendarOff,
  CircleDollarSign,
  Loader2,
  Trophy,
} from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import InlineFilterSelect from '../components/InlineFilterSelect.vue';
import PageHero from '../components/PageHero.vue';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { useProfileStore } from '../stores/profile';
import { formatDate, formatDisplayText, formatMoney } from '../lib/format';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const profile = useProfileStore();
const page = ref(1);
const pageSize = 6;
const presetFilter = ref<'all' | 'budget' | 'without'>('all');

const filters = reactive({
  search: '',
  category: '',
  mine: false,
});

const filteredJobs = computed(() => {
  if (presetFilter.value === 'budget') {
    return marketplace.jobs.filter((job) => job.budgetMin !== null || job.budgetMax !== null);
  }

  if (presetFilter.value === 'without') {
    return marketplace.jobs.filter((job) => !job.deadlineAt);
  }

  return marketplace.jobs;
});
const visibleJobs = computed(() => filteredJobs.value.slice(0, page.value * pageSize));
const hasMoreJobs = computed(() => visibleJobs.value.length < filteredJobs.value.length);
const profilePercent = computed(() => profile.summary?.progress.percentage ?? 0);
const shouldMotivateVerification = computed(
  () => auth.user?.role === 'performer' && profilePercent.value < 80,
);
const presetCards = computed(() => [
  {
    key: 'all' as const,
    title: 'Все задачи',
    text: 'Вся биржа',
    value: marketplace.jobs.length,
    icon: Trophy,
  },
  {
    key: 'budget' as const,
    title: 'С бюджетом',
    text: 'Сумма указана',
    value: marketplace.jobs.filter((job) => job.budgetMin !== null || job.budgetMax !== null)
      .length,
    icon: CircleDollarSign,
  },
  {
    key: 'without' as const,
    title: 'Без срока',
    text: 'Срок уточнить',
    value: marketplace.jobs.filter((job) => !job.deadlineAt).length,
    icon: CalendarOff,
  },
]);

const applyPreset = (preset: (typeof presetCards.value)[number]['key']) => {
  presetFilter.value = preset;
  page.value = 1;
};

let searchTimer: ReturnType<typeof window.setTimeout> | null = null;
const scheduleLoad = () => {
  page.value = 1;

  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }

  searchTimer = window.setTimeout(() => {
    void load();
  }, 300);
};

const load = async () => {
  page.value = 1;
  await Promise.allSettled([
    marketplace.loadCategories(),
    auth.accessToken ? profile.load(auth.accessToken) : Promise.resolve(),
  ]);
  await marketplace.loadJobs(
    {
      search: filters.search || undefined,
      category: filters.category || undefined,
      mine: auth.user?.role === 'customer' && filters.mine ? true : undefined,
    },
    auth.accessToken,
  );
};

const resetFilters = () => {
  filters.search = '';
  filters.category = '';
  filters.mine = false;
  void load();
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
        eyebrow="Биржа задач"
        title="Заказы для исполнителей."
        text="Тут находятся опубликованные задачи. Откройте заказ, чтобы посмотреть детали."
      >
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
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
        <FilterPanel
          :columns="
            auth.user?.role === 'customer'
              ? 'lg:grid-cols-[minmax(0,1fr)_17rem_auto]'
              : 'lg:grid-cols-[minmax(0,1fr)_17rem]'
          "
          @reset="resetFilters"
        >
          <input
            v-model="filters.search"
            class="h-12 w-full rounded-2xl border border-line bg-paper px-4 font-semibold text-ink outline-none placeholder:text-ink/35 focus:border-ink"
            placeholder="Vue, дизайн, Docker"
            @input="scheduleLoad"
          />
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
          <label v-if="auth.user?.role === 'customer'" class="flex cursor-pointer">
            <span
              class="flex h-12 items-center gap-3 rounded-2xl border border-line bg-paper px-4 text-sm font-black transition hover:border-ink"
            >
              Мои
              <input v-model="filters.mine" type="checkbox" class="sr-only" @change="load" />
              <span
                class="relative inline-flex h-7 w-12 shrink-0 rounded-xl transition"
                :class="filters.mine ? 'bg-ink' : 'bg-ink/15'"
              >
                <span
                  class="absolute top-1 h-5 w-5 rounded-lg bg-paper shadow transition-all"
                  :class="filters.mine ? 'left-[1.5rem]' : 'left-1'"
                />
              </span>
            </span>
          </label>
        </FilterPanel>
      </div>

      <section class="mt-4 space-y-4">
        <RouterLink
          v-if="shouldMotivateVerification"
          class="flex flex-col gap-3 rounded-[1.35rem] border border-ember bg-ember/10 p-5 transition hover:bg-ember/15 sm:flex-row sm:items-center sm:justify-between"
          to="/onboarding"
        >
          <span>
            <span class="block text-xs font-black uppercase tracking-[0.18em] text-ember">
              Доступ к откликам
            </span>
            <span class="mt-2 block text-xl font-black">Усильте профиль перед откликами</span>
            <span class="mt-1 block text-sm font-semibold leading-6 text-ink/65">
              Заполненные навыки, портфолио и условия работы помогают заказчику доверять заявке.
              Сейчас профиль заполнен на {{ profilePercent }}%.
            </span>
          </span>
          <span
            class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper"
          >
            Заполнить профиль
          </span>
        </RouterLink>

        <div
          v-if="marketplace.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black"
            ><Loader2 class="animate-spin" :size="20" /> Загружаем заказы</span
          >
        </div>

        <article
          v-for="job in visibleJobs"
          :key="job.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div
                class="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/55"
              >
                <span>{{ job.categoryName || 'Без категории' }}</span>
                <span>•</span>
                <span>{{ formatDate(job.deadlineAt) }}</span>
              </div>
              <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                {{ formatDisplayText(job.title) }}
              </h2>
              <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-ink/70">
                {{ formatDisplayText(job.description) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-bolt"
              >
                {{ formatMoney(job.budgetMin, job.budgetMax) }}
              </span>
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-ink/62"
              >
                {{ job.applicationsCount }} откликов
              </span>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in job.tags"
                :key="tag"
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                #{{ tag }}
              </span>
            </div>
            <RouterLink
              class="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-black text-paper transition hover:bg-bolt"
              :to="`/jobs/${job.id}`"
            >
              Открыть
            </RouterLink>
          </div>
        </article>

        <div
          v-if="!marketplace.isLoading && !marketplace.jobs.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <BriefcaseBusiness class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Заказов пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Попробуйте другой фильтр или создайте первый заказ.
          </p>
        </div>

        <button
          v-if="hasMoreJobs"
          class="h-10 w-full rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще заказы
        </button>
      </section>
    </section>
  </main>
</template>
