<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowLeft, Plus, Save } from 'lucide-vue-next';
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
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <header class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
        <RouterLink
          to="/jobs"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-paper/65 transition hover:text-paper"
        >
          <ArrowLeft :size="16" />
          К заказам
        </RouterLink>
        <div class="mt-6 max-w-4xl">
          <p class="text-xs font-black uppercase tracking-[0.22em] text-paper/55">Новый заказ</p>
          <h1 class="mt-2 text-[2.35rem] font-black leading-[0.94] tracking-[-0.07em] sm:text-5xl">
            Опишите задачу так, чтобы сильный исполнитель понял темп.
          </h1>
        </div>
      </header>

      <form class="mt-4 space-y-5" @submit.prevent="submit">
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
          class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-4 text-sm font-black text-paper transition hover:bg-bolt disabled:opacity-60"
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
