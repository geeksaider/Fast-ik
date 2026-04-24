<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, BriefcaseBusiness, Filter, Loader2, Plus, Search, Zap } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { formatDate, formatMoney } from '../lib/format';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();

const filters = reactive({
  search: '',
  category: '',
});

const canCreateJob = computed(
  () =>
    auth.user?.role === 'customer' ||
    auth.user?.role === 'admin' ||
    auth.user?.role === 'super_admin',
);

const load = async () => {
  await marketplace.loadCategories();
  await marketplace.loadJobs({
    search: filters.search || undefined,
    category: filters.category || undefined,
  });
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header
        class="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-center md:justify-between"
      >
        <RouterLink to="/dashboard" class="flex items-center gap-3">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="24" />
          </span>
          <span>
            <span class="block font-display text-xl font-black uppercase tracking-[-0.04em]"
              >Fastik Jobs</span
            >
            <span class="block text-xs font-semibold uppercase tracking-[0.25em] text-ink/60"
              >marketplace</span
            >
          </span>
        </RouterLink>

        <RouterLink
          v-if="canCreateJob"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
          to="/jobs/new"
        >
          <Plus :size="18" />
          Создать заказ
        </RouterLink>
      </header>

      <section class="grid gap-5 py-7 lg:grid-cols-[0.72fr_1.28fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Биржа</p>
          <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            Живые задачи для быстрых исполнителей.
          </h1>
          <p class="mt-5 text-sm font-semibold leading-6 text-paper/68">
            Сейчас здесь стартовый marketplace: категории, поиск, создание заказа и отклики. Дальше
            поверх этого добавим гарант, чат и статусы работы.
          </p>

          <form class="mt-7 space-y-3" @submit.prevent="load">
            <label class="block">
              <span class="mb-2 flex items-center gap-2 text-sm font-black"
                ><Search :size="16" /> Поиск</span
              >
              <input
                v-model="filters.search"
                class="w-full rounded-2xl border border-paper/25 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="Vue, дизайн, Docker"
              />
            </label>
            <label class="block">
              <span class="mb-2 flex items-center gap-2 text-sm font-black"
                ><Filter :size="16" /> Категория</span
              >
              <select
                v-model="filters.category"
                class="w-full rounded-2xl border border-paper/25 bg-paper px-4 py-3 font-semibold text-ink outline-none"
              >
                <option value="">Все категории</option>
                <option
                  v-for="category in marketplace.categories"
                  :key="category.id"
                  :value="category.slug"
                >
                  {{ category.name }}
                </option>
              </select>
            </label>
            <button
              class="w-full rounded-full border border-paper bg-paper px-5 py-3 font-black text-ink transition hover:bg-ember hover:text-paper"
              type="submit"
            >
              Применить фильтр
            </button>
          </form>
        </aside>

        <section class="space-y-4">
          <div
            v-if="marketplace.isLoading"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6"
          >
            <span class="inline-flex items-center gap-3 font-black"
              ><Loader2 class="animate-spin" :size="20" /> Загружаем заказы</span
            >
          </div>

          <article
            v-for="job in marketplace.jobs"
            :key="job.id"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-1 hover:bg-white sm:p-6"
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
                <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">{{ job.title }}</h2>
                <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-ink/70">
                  {{ job.description }}
                </p>
              </div>
              <div class="shrink-0 rounded-2xl border border-line bg-paper px-4 py-3 text-right">
                <p class="text-sm font-black text-bolt">
                  {{ formatMoney(job.budgetMin, job.budgetMax) }}
                </p>
                <p class="mt-1 text-xs font-bold text-ink/55">
                  {{ job.applicationsCount }} откликов
                </p>
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
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                :to="`/jobs/${job.id}`"
              >
                Открыть
                <ArrowRight :size="18" />
              </RouterLink>
            </div>
          </article>

          <div
            v-if="!marketplace.isLoading && !marketplace.jobs.length"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center"
          >
            <BriefcaseBusiness class="mx-auto mb-4 text-ember" :size="36" />
            <p class="text-xl font-black">Заказов пока нет</p>
            <p class="mt-2 text-sm font-semibold text-ink/65">
              Попробуйте другой фильтр или создайте первый заказ.
            </p>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
