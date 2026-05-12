<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { BriefcaseBusiness, Building2, Loader2, Medal, Search, UserRound } from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import PageHero from '../components/PageHero.vue';
import { globalSearch, type GlobalSearchResult } from '../lib/api';
import { formatAmount } from '../lib/format';

const route = useRoute();
const router = useRouter();

const query = ref(String(route.query.q ?? ''));
const result = ref<GlobalSearchResult | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const totalResults = computed(() => {
  if (!result.value) return 0;
  return (
    result.value.jobs.length +
    result.value.performers.length +
    result.value.customers.length +
    result.value.contests.length
  );
});

const run = async () => {
  const value = query.value.trim();

  if (value.length < 2) {
    result.value = null;
    error.value = 'Минимум 2 символа в запросе';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    result.value = await globalSearch(value);
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось выполнить поиск';
    result.value = null;
  } finally {
    isLoading.value = false;
  }
};

const submit = () => {
  const value = query.value.trim();

  if (!value) return;

  void router.replace({ path: '/search', query: { q: value } });
  void run();
};

const budgetLabel = (min: number | null, max: number | null) => {
  if (min && max && min !== max) return `${formatAmount(min)} – ${formatAmount(max)}`;
  if (!min && !max) return 'бюджет не указан';
  return formatAmount(max ?? min ?? 0);
};

watch(
  () => route.query.q,
  (next) => {
    const value = String(next ?? '');
    query.value = value;

    if (value.trim().length >= 2) {
      void run();
    } else {
      result.value = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <PageHero
        eyebrow="Поиск"
        title="Один запрос - все разделы."
        text="Ищите задачи, исполнителей, заказчиков и конкурсы в одном месте."
      />

      <form class="mt-4" @submit.prevent="submit">
        <FilterPanel
          title="Поиск"
          columns="lg:grid-cols-[minmax(0,1fr)_auto]"
          :show-reset="false"
        >
          <input
            v-model="query"
            class="box-border h-12 min-w-0 appearance-none rounded-2xl border border-line bg-paper px-4 py-0 font-semibold leading-none text-ink outline-none placeholder:text-ink/35 focus:border-ink"
            placeholder="Что найти?"
            type="search"
            autofocus
          />
          <button
            class="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 text-sm font-black text-paper transition hover:bg-bolt lg:w-auto lg:self-center"
            type="submit"
          >
            <Search :size="16" />
            Искать
          </button>
        </FilterPanel>
      </form>

      <div v-if="isLoading" class="mt-4 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
        <span class="inline-flex items-center gap-3 font-black">
          <Loader2 class="animate-spin" :size="20" /> Ищем по платформе
        </span>
      </div>

      <p
        v-else-if="error"
        class="mt-4 rounded-[1.35rem] border border-ember bg-ember/10 p-5 text-sm font-bold text-ember"
      >
        {{ error }}
      </p>

      <div v-else-if="result" class="mt-4 grid gap-4">
        <p class="text-sm font-semibold text-ink/60">
          Найдено <span class="font-black text-ink">{{ totalResults }}</span> результатов по запросу
          «<span class="font-black text-ink">{{ result.query }}</span
          >».
        </p>

        <section
          v-if="result.jobs.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <BriefcaseBusiness :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Задачи</p>
              <h2 class="text-2xl font-black tracking-[-0.05em]">
                {{ result.jobs.length }} совпадений
              </h2>
            </div>
          </div>
          <div class="mt-4 grid gap-2">
            <RouterLink
              v-for="job in result.jobs"
              :key="job.id"
              class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
              :to="`/jobs/${job.id}`"
            >
              <span class="min-w-0">
                <span class="block truncate font-black">{{ job.title }}</span>
                <span class="mt-1 block text-sm font-semibold text-ink/60">
                  {{ budgetLabel(job.budgetMin, job.budgetMax) }}
                </span>
              </span>
            </RouterLink>
          </div>
        </section>

        <section
          v-if="result.performers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <UserRound :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Исполнители</p>
              <h2 class="text-2xl font-black tracking-[-0.05em]">
                {{ result.performers.length }} совпадений
              </h2>
            </div>
          </div>
          <div class="mt-4 grid gap-2">
            <RouterLink
              v-for="person in result.performers"
              :key="person.id"
              class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
              :to="`/performers/${person.id}`"
            >
              <span class="min-w-0">
                <span class="block truncate font-black">{{ person.displayName }}</span>
                <span
                  v-if="person.headline"
                  class="mt-1 block truncate text-sm font-semibold text-ink/60"
                >
                  {{ person.headline }}
                </span>
              </span>
            </RouterLink>
          </div>
        </section>

        <section
          v-if="result.customers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <Building2 :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Заказчики</p>
              <h2 class="text-2xl font-black tracking-[-0.05em]">
                {{ result.customers.length }} совпадений
              </h2>
            </div>
          </div>
          <div class="mt-4 grid gap-2">
            <RouterLink
              v-for="person in result.customers"
              :key="person.id"
              class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
              :to="`/customers/${person.id}`"
            >
              <span class="min-w-0">
                <span class="block truncate font-black">{{ person.displayName }}</span>
                <span
                  v-if="person.companyName"
                  class="mt-1 block truncate text-sm font-semibold text-ink/60"
                >
                  {{ person.companyName }}
                </span>
              </span>
            </RouterLink>
          </div>
        </section>

        <section
          v-if="result.contests.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <Medal :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Конкурсы</p>
              <h2 class="text-2xl font-black tracking-[-0.05em]">
                {{ result.contests.length }} совпадений
              </h2>
            </div>
          </div>
          <div class="mt-4 grid gap-2">
            <RouterLink
              v-for="contest in result.contests"
              :key="contest.id"
              class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
              :to="`/contests/${contest.id}`"
            >
              <span class="min-w-0">
                <span class="block truncate font-black">{{ contest.title }}</span>
                <span class="mt-1 block text-sm font-semibold text-ink/60">
                  Приз: {{ formatAmount(contest.prizeAmount) }}
                </span>
              </span>
            </RouterLink>
          </div>
        </section>

        <p
          v-if="totalResults === 0"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center text-sm font-semibold text-ink/65"
        >
          По запросу «{{ result.query }}» ничего не нашлось. Попробуйте другие слова.
        </p>
      </div>
    </section>
  </main>
</template>
