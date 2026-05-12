<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowLeft, Save } from 'lucide-vue-next';
import PageHero from '../components/PageHero.vue';
import { ApiError, type PerformerLevelCode } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { useContestsStore } from '../stores/contests';
import { useMarketplaceStore } from '../stores/marketplace';

const auth = useAuthStore();
const contests = useContestsStore();
const marketplace = useMarketplaceStore();
const router = useRouter();

const form = reactive({
  title: '',
  brief: '',
  categoryId: '',
  requiredLevelCode: 'builder' as PerformerLevelCode,
  prizeAmount: 25000,
  deadlineAt: '',
  tags: 'ui-ux, прототип',
});

const formErrors = reactive<Record<string, string>>({});
const submitError = ref<string | null>(null);

const levelOptions: Array<{ code: PerformerLevelCode; title: string }> = [
  { code: 'newcomer', title: 'Новичок' },
  { code: 'builder', title: 'Исполнитель' },
  { code: 'verified', title: 'Проверенный' },
  { code: 'reliable', title: 'Надежный' },
  { code: 'pro', title: 'Профи' },
  { code: 'elite', title: 'Fastik Elite' },
];

const fieldLabels: Record<string, string> = {
  title: 'Название',
  brief: 'Описание',
  categoryId: 'Категория',
  requiredLevelCode: 'Допуск',
  prizeAmount: 'Приз',
  deadlineAt: 'Срок',
  tags: 'Теги',
};

const clearFormErrors = () => {
  Object.keys(formErrors).forEach((key) => {
    delete formErrors[key];
  });
};

const errorField = (path: string) => {
  const [field] = path.split('.');
  return field in fieldLabels ? field : 'form';
};

const friendlyError = (field: string, message: string) => {
  if (field === 'title') return 'Название должно быть от 6 до 140 символов.';
  if (field === 'brief') return 'Описание должно быть от 20 до 4000 символов.';
  if (field === 'prizeAmount') return 'Укажите приз от 0 до 50 000 000 руб.';
  if (field === 'deadlineAt') return 'Укажите корректную дату срока.';
  if (field === 'tags') return 'До 8 тегов, каждый от 2 до 32 символов.';

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

  submitError.value = error instanceof Error ? error.message : 'Не удалось создать конкурс';
};

const fieldClass = (field: string) => [
  'w-full rounded-2xl border bg-[#fffaf0] px-4 py-3 font-semibold outline-none transition',
  formErrors[field]
    ? 'border-ember ring-2 ring-ember/20'
    : 'border-ink focus:ring-2 focus:ring-bolt/25',
];

const formError = computed(() => submitError.value ?? contests.error);

const tags = () =>
  form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const submit = async () => {
  clearFormErrors();
  submitError.value = null;

  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  try {
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
        to="/contests"
        class="mb-3 inline-flex items-center gap-2 px-1 text-sm font-black uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
      >
        <ArrowLeft :size="16" />
        К конкурсам
      </RouterLink>

      <PageHero eyebrow="Новый конкурс" title="Опишите задачу с призом и уровнем допуска." />

      <form class="mt-4 space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-sm font-black">Название</span>
          <input
            v-model="form.title"
            :class="fieldClass('title')"
            placeholder="Например, концепт личного кабинета"
            required
          />
          <span v-if="formErrors.title" class="mt-2 block text-sm font-bold text-ember">
            {{ formErrors.title }}
          </span>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Описание конкурса</span>
          <textarea
            v-model="form.brief"
            :class="[fieldClass('brief'), 'min-h-44']"
            placeholder="Что нужно сделать, как будет выбран победитель, какие ограничения важны"
            required
          />
          <span v-if="formErrors.brief" class="mt-2 block text-sm font-bold text-ember">
            {{ formErrors.brief }}
          </span>
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label>
            <span class="mb-2 block text-sm font-black">Категория</span>
            <select v-model="form.categoryId" :class="fieldClass('categoryId')">
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
            <span class="mb-2 block text-sm font-black">Допуск по уровню</span>
            <select v-model="form.requiredLevelCode" :class="fieldClass('requiredLevelCode')">
              <option v-for="level in levelOptions" :key="level.code" :value="level.code">
                {{ level.title }}
              </option>
            </select>
          </label>

          <label>
            <span class="mb-2 block text-sm font-black">Приз</span>
            <input
              v-model.number="form.prizeAmount"
              :class="fieldClass('prizeAmount')"
              type="number"
              min="0"
              placeholder="25000"
            />
            <span v-if="formErrors.prizeAmount" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.prizeAmount }}
            </span>
          </label>

          <label>
            <span class="mb-2 block text-sm font-black">Срок</span>
            <input v-model="form.deadlineAt" :class="fieldClass('deadlineAt')" type="date" />
            <span v-if="formErrors.deadlineAt" class="mt-2 block text-sm font-bold text-ember">
              {{ formErrors.deadlineAt }}
            </span>
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-black">Теги через запятую</span>
          <input v-model="form.tags" :class="fieldClass('tags')" placeholder="ui-ux, прототип" />
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
          :disabled="contests.isSaving"
        >
          <Save :size="18" />
          {{ contests.isSaving ? 'Публикуем...' : 'Опубликовать конкурс' }}
        </button>
      </form>
    </section>
  </main>
</template>
