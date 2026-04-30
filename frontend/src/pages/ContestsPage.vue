<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowRight, Filter, Loader2, Medal, Plus, Search } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useContestsStore } from '../stores/contests';
import { useMarketplaceStore } from '../stores/marketplace';
import { formatAmount, formatDate, formatDisplayText, formatSystemLabel } from '../lib/format';
import type { PerformerLevelCode } from '../lib/api';

const auth = useAuthStore();
const contests = useContestsStore();
const marketplace = useMarketplaceStore();
const router = useRouter();
const page = ref(1);
const pageSize = 6;

const filters = reactive({
  search: '',
  category: '',
});

const form = reactive({
  title: '',
  brief: '',
  categoryId: '',
  requiredLevelCode: 'builder' as PerformerLevelCode,
  prizeAmount: 25000,
  deadlineAt: '',
  tags: 'ui-ux, быстрый-прототип',
});

const levels: Array<{ code: PerformerLevelCode; title: string }> = [
  { code: 'newcomer', title: 'Новичок' },
  { code: 'builder', title: 'Исполнитель' },
  { code: 'verified', title: 'Проверенный' },
  { code: 'reliable', title: 'Надежный' },
  { code: 'pro', title: 'Профи' },
  { code: 'elite', title: 'Fastik Elite' },
];

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);
const canCreateContest = computed(
  () =>
    auth.user?.role === 'customer' || Boolean(auth.user?.role && managerRoles.has(auth.user.role)),
);
const visibleContests = computed(() => contests.contests.slice(0, page.value * pageSize));
const hasMoreContests = computed(() => visibleContests.value.length < contests.contests.length);

const tags = () =>
  form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const load = async () => {
  page.value = 1;
  await Promise.all([
    marketplace.loadCategories(),
    contests.loadContests(
      {
        search: filters.search || undefined,
        category: filters.category || undefined,
      },
      auth.accessToken,
    ),
  ]);
};

const create = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  const contest = await contests.create(auth.accessToken, {
    title: form.title,
    brief: form.brief,
    categoryId: form.categoryId || null,
    requiredLevelCode: form.requiredLevelCode,
    prizeAmount: form.prizeAmount,
    deadlineAt: form.deadlineAt || null,
    tags: tags(),
  });

  await router.push(`/contests/${contest.id}`);
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
          <div class="flex items-start justify-between gap-4">
            <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Конкурсы</p>
            <span class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black">
              LVL gate
            </span>
          </div>
          <h1
            class="mt-3 max-w-2xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Задания, куда пускает уровень.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Конкурс дает заказчику несколько идей, а исполнителю - шанс показать скорость, получить
            XP и усилить доверие. Чем выше требование LVL, тем качественнее входящий поток.
          </p>
        </aside>

        <form
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5"
          @submit.prevent="load"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Фильтр</p>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ contests.contests.length }}
            </span>
          </div>
          <label class="mt-4 block">
            <span class="mb-2 flex items-center gap-2 text-sm font-black">
              <Search :size="16" /> Поиск
            </span>
            <input
              v-model="filters.search"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
              placeholder="roadmap, UI, trust"
            />
          </label>
          <label class="mt-3 block">
            <span class="mb-2 flex items-center gap-2 text-sm font-black">
              <Filter :size="16" /> Категория
            </span>
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
            Применить
          </button>
        </form>
      </section>

      <section
        v-if="canCreateContest"
        class="mt-4 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Заказчик</p>
            <h2 class="mt-1 text-3xl font-black tracking-[-0.06em]">Создать конкурс</h2>
          </div>
          <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
            Мок-приз без реальных платежей
          </span>
        </div>

        <form class="mt-5 grid gap-3 lg:grid-cols-2" @submit.prevent="create">
          <input
            v-model="form.title"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink lg:col-span-2"
            placeholder="Название конкурса"
            required
          />
          <textarea
            v-model="form.brief"
            class="min-h-32 rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink lg:col-span-2"
            placeholder="Что нужно сделать, как будет выбран победитель и почему конкурс полезен"
            required
          />
          <select
            v-model="form.categoryId"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
          >
            <option value="">Без категории</option>
            <option
              v-for="category in marketplace.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <select
            v-model="form.requiredLevelCode"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
          >
            <option v-for="level in levels" :key="level.code" :value="level.code">
              Допуск: {{ level.title }}
            </option>
          </select>
          <input
            v-model.number="form.prizeAmount"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
            type="number"
            min="0"
            placeholder="Приз"
          />
          <input
            v-model="form.deadlineAt"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
            type="date"
          />
          <input
            v-model="form.tags"
            class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink lg:col-span-2"
            placeholder="Теги через запятую"
          />
          <button
            class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt lg:col-span-2"
            type="submit"
            :disabled="contests.isSaving"
          >
            <Plus :size="18" />
            Опубликовать конкурс
          </button>
        </form>
      </section>

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
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-bolt"
              >
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
              <ArrowRight :size="18" />
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
