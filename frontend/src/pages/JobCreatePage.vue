<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowLeft, BriefcaseBusiness, Plus, Save } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const router = useRouter();

const form = reactive({
  title: '',
  description: '',
  categoryId: '',
  budgetMin: null as number | null,
  budgetMax: null as number | null,
  deadlineAt: '',
  tags: '',
});

const numberOrNull = (value: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const submit = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  const job = await marketplace.create(auth.accessToken, {
    title: form.title,
    description: form.description,
    categoryId: form.categoryId || null,
    budgetMin: numberOrNull(form.budgetMin),
    budgetMax: numberOrNull(form.budgetMax),
    deadlineAt: form.deadlineAt || null,
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  });

  await router.push(`/jobs/${job.id}`);
};

onMounted(() => {
  void marketplace.loadCategories();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-4xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header class="border-b border-ink pb-5">
        <RouterLink
          to="/jobs"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К заказам
        </RouterLink>
        <div class="mt-8 flex items-start gap-4">
          <span
            class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <BriefcaseBusiness :size="28" />
          </span>
          <div>
            <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Новый заказ</p>
            <h1 class="mt-2 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
              Опишите задачу так, чтобы сильный исполнитель понял темп.
            </h1>
          </div>
        </div>
      </header>

      <form class="mt-7 space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-sm font-black">Название</span>
          <input
            v-model="form.title"
            class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
            placeholder="Например, разработать MVP личного кабинета"
            required
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Описание</span>
          <textarea
            v-model="form.description"
            class="min-h-44 w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
            placeholder="Контекст, результат, ограничения, что уже готово"
            required
          />
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label>
            <span class="mb-2 block text-sm font-black">Категория</span>
            <select
              v-model="form.categoryId"
              class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
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
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Срок</span>
            <input
              v-model="form.deadlineAt"
              class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
              type="date"
            />
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Бюджет от</span>
            <input
              v-model.number="form.budgetMin"
              class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
              type="number"
              min="0"
              placeholder="50000"
            />
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Бюджет до</span>
            <input
              v-model.number="form.budgetMax"
              class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
              type="number"
              min="0"
              placeholder="120000"
            />
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Теги через запятую</span>
          <input
            v-model="form.tags"
            class="w-full rounded-2xl border border-ink bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
            placeholder="vue, docker, dashboard"
          />
        </label>

        <p
          v-if="marketplace.error"
          class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
        >
          {{ marketplace.error }}
        </p>

        <button
          class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-6 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-60"
          type="submit"
          :disabled="marketplace.isSaving"
        >
          <Save :size="18" />
          {{ marketplace.isSaving ? 'Публикуем...' : 'Опубликовать заказ' }}
        </button>
      </form>
    </section>
  </main>
</template>
