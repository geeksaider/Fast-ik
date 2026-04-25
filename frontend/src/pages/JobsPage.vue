<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, BriefcaseBusiness, Filter, Loader2, Plus, Search } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { formatDate, formatDisplayText, formatMoney } from '../lib/format';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const page = ref(1);
const pageSize = 6;

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
const visibleJobs = computed(() => marketplace.jobs.slice(0, page.value * pageSize));
const hasMoreJobs = computed(() => visibleJobs.value.length < marketplace.jobs.length);

const load = async () => {
  page.value = 1;
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
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Биржа</p>
            <RouterLink
              v-if="canCreateJob"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
              to="/jobs/new"
            >
              <Plus :size="16" />
              Создать заказ
            </RouterLink>
          </div>
          <h1
            class="mt-3 max-w-2xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Живые задачи для быстрых исполнителей.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Сейчас здесь стартовый marketplace: категории, поиск, создание заказа и отклики. Дальше
            поверх этого добавим гарант, чат и статусы работы.
          </p>
        </aside>

        <form
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5"
          @submit.prevent="load"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Фильтр задач</p>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ marketplace.jobs.length }}
            </span>
          </div>
          <label class="mt-4 block">
            <span class="mb-2 flex items-center gap-2 text-sm font-black"
              ><Search :size="16" /> Поиск</span
            >
            <input
              v-model="filters.search"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
              placeholder="Vue, дизайн, Docker"
            />
          </label>
          <label class="mt-3 block">
            <span class="mb-2 flex items-center gap-2 text-sm font-black"
              ><Filter :size="16" /> Категория</span
            >
            <select
              v-model="filters.category"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
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
            class="mt-4 w-full rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            type="submit"
          >
            Применить фильтр
          </button>
        </form>
      </section>

      <section class="mt-4 space-y-4">
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
                {{ job.description }}
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
          class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще заказы
        </button>
      </section>
    </section>
  </main>
</template>
