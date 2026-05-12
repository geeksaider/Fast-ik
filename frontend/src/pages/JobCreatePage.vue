<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowLeft, Plus, Save } from 'lucide-vue-next';
import PageHero from '../components/PageHero.vue';
import { ApiError } from '../lib/api';
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

const formErrors = reactive<Record<string, string>>({});
const submitError = ref<string | null>(null);

const fieldLabels: Record<string, string> = {
  title: 'Название',
  description: 'Описание',
  categoryId: 'Категория',
  deadlineAt: 'Срок',
  budgetMin: 'Бюджет от',
  budgetMax: 'Бюджет до',
  tags: 'Теги',
};

const clearFormErrors = () => {
  Object.keys(formErrors).forEach((key) => {
    delete formErrors[key];
  });
};

const numberOrNull = (value: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const errorField = (path: string) => {
  const [field] = path.split('.');
  return field in fieldLabels ? field : 'form';
};

const friendlyError = (field: string, message: string) => {
  if (field === 'title') {
    return 'Название должно быть от 6 до 140 символов.';
  }

  if (field === 'description') {
    return 'Описание должно быть от 20 до 4000 символов.';
  }

  if (field === 'categoryId') {
    return 'Выберите категорию из списка или оставьте поле пустым.';
  }

  if (field === 'deadlineAt') {
    return 'Укажите корректную дату срока.';
  }

  if (field === 'budgetMin' || field === 'budgetMax') {
    if (message.includes('меньше минимального')) {
      return message;
    }

    return 'Укажите сумму от 0 до 50 000 000 руб.';
  }

  if (field === 'tags') {
    return 'До 8 тегов, каждый от 2 до 32 символов: буквы, цифры, пробелы и дефис.';
  }

  return message;
};

const setApiErrors = (error: unknown) => {
  clearFormErrors();

  if (error instanceof ApiError && error.issues.length) {
    error.issues.forEach((issue) => {
      const field = errorField(issue.path);
      const message = friendlyError(field, issue.message);

      if (field === 'form') {
        submitError.value = message;
        return;
      }

      formErrors[field] = message;
    });

    submitError.value = 'Проверьте выделенные поля.';
    return;
  }

  submitError.value = error instanceof Error ? error.message : 'Не удалось создать заказ';
};

const fieldClass = (field: string) => [
  'w-full rounded-2xl border bg-[#fffaf0] px-4 py-3 font-semibold outline-none transition',
  formErrors[field]
    ? 'border-ember ring-2 ring-ember/20'
    : 'border-ink focus:ring-2 focus:ring-bolt/25',
];

const formError = computed(() => submitError.value ?? marketplace.error);

const submit = async () => {
  clearFormErrors();
  submitError.value = null;

  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  try {
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
  } catch (error) {
    setApiErrors(error);
  }
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
      <RouterLink
        to="/jobs"
        class="mb-3 inline-flex items-center gap-2 px-1 text-sm font-black uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
      >
        <ArrowLeft :size="16" />
        К заказам
      </RouterLink>

      <PageHero
        eyebrow="Новый заказ"
        title="Опишите задачу так, чтобы сильный исполнитель понял темп."
      />

      <form class="mt-4 space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-sm font-black">Название</span>
          <input
            v-model="form.title"
            :class="fieldClass('title')"
            placeholder="Например, разработать MVP личного кабинета"
            required
          />
          <span v-if="formErrors.title" class="mt-2 block text-sm font-bold text-ember">
            {{ formErrors.title }}
          </span>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Описание</span>
          <textarea
            v-model="form.description"
            :class="[fieldClass('description'), 'min-h-44']"
            placeholder="Контекст, результат, ограничения, что уже готово"
            required
          />
          <span v-if="formErrors.description" class="mt-2 block text-sm font-bold text-ember">
            {{ formErrors.description }}
          </span>
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label>
            <span class="mb-2 block text-sm font-black">Категория</span>
            <select
              v-model="form.categoryId"
              :class="fieldClass('categoryId')"
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
            <span v-if="formErrors.categoryId" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.categoryId }}
            </span>
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Срок</span>
            <input
              v-model="form.deadlineAt"
              :class="fieldClass('deadlineAt')"
              type="date"
            />
            <span v-if="formErrors.deadlineAt" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.deadlineAt }}
            </span>
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Бюджет от</span>
            <input
              v-model.number="form.budgetMin"
              :class="fieldClass('budgetMin')"
              type="number"
              min="0"
              placeholder="50000"
            />
            <span v-if="formErrors.budgetMin" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.budgetMin }}
            </span>
          </label>
          <label>
            <span class="mb-2 block text-sm font-black">Бюджет до</span>
            <input
              v-model.number="form.budgetMax"
              :class="fieldClass('budgetMax')"
              type="number"
              min="0"
              placeholder="120000"
            />
            <span v-if="formErrors.budgetMax" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.budgetMax }}
            </span>
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Теги через запятую</span>
          <input
            v-model="form.tags"
            :class="fieldClass('tags')"
            placeholder="vue, docker, dashboard"
          />
          <span v-if="formErrors.tags" class="mt-2 block text-sm font-bold text-ember">
            {{ formErrors.tags }}
          </span>
        </label>

        <p
          v-if="formError"
          class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
        >
          {{ formError }}
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
