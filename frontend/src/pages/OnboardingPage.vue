<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Camera,
  Check,
  ExternalLink,
  FolderKanban,
  Hammer,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Trophy,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
  type SkillOption,
  type UserSkill,
} from '../lib/api';
import PageHero from '../components/PageHero.vue';

const auth = useAuthStore();
const profile = useProfileStore();
const router = useRouter();

const baseForm = reactive({
  bio: '',
  city: '',
  avatarUrl: '',
  websiteUrl: '',
  telegram: '',
  preferredLanguage: 'ru' as 'ru' | 'en',
});

const customerForm = reactive({
  companyName: '',
  companySite: '',
  companyDescription: '',
  projectBudgetMin: null as number | null,
  projectBudgetMax: null as number | null,
});

const performerForm = reactive({
  headline: '',
  hourlyRate: null as number | null,
  availability: 'part_time' as 'part_time' | 'full_time' | 'project',
  experienceYears: null as number | null,
  specialization: '',
});

const selectedSkills = ref<Array<{ skillId: string; level: UserSkill['level'] }>>([]);

const portfolioForm = reactive({
  title: '',
  description: '',
  projectUrl: '',
  coverUrl: '',
});
const passwordForm = reactive({ currentPassword: '', newPassword: '' });
const emailForm = reactive({ newEmail: '', currentPassword: '' });
const deleteForm = reactive({ currentPassword: '' });

const isPerformer = computed(() => auth.user?.role === 'performer');
const isCustomer = computed(() => auth.user?.role === 'customer');
const progress = computed(() => profile.summary?.progress);
const incompleteSteps = computed(
  () => progress.value?.steps.filter((step) => !step.completed) ?? [],
);
const avatarPreview = computed(
  () => baseForm.avatarUrl || profile.summary?.profile?.avatarUrl || null,
);
const passwordStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const emailStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const deleteStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const notificationStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const deleteConfirmed = ref(false);
const avatarError = ref<string | null>(null);
const settings = ref<NotificationSettings | null>(null);
const isLoadingSettings = ref(false);
const isSavingSettings = ref(false);
const showProgressModal = ref(false);

const groupedSkills = computed(() => {
  const groups = new Map<string, { title: string; skills: SkillOption[] }>();

  for (const skill of profile.skillOptions) {
    const key = skill.categorySlug ?? 'other';
    const title = skill.categoryName ?? 'Другое';
    const group = groups.get(key) ?? { title, skills: [] };
    group.skills.push(skill);
    groups.set(key, group);
  }

  return [...groups.values()];
});

const selectedSkillMap = computed(
  () => new Map(selectedSkills.value.map((skill) => [skill.skillId, skill.level])),
);

const numberOrNull = (value: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const syncForms = () => {
  const summary = profile.summary;

  if (!summary) {
    return;
  }

  baseForm.bio = summary.profile?.bio ?? '';
  baseForm.city = summary.profile?.city ?? '';
  baseForm.avatarUrl = summary.profile?.avatarUrl ?? '';
  baseForm.websiteUrl = summary.profile?.websiteUrl ?? '';
  baseForm.telegram = summary.profile?.telegram ?? '';
  baseForm.preferredLanguage = summary.profile?.preferredLanguage ?? 'ru';

  customerForm.companyName = summary.customerProfile?.companyName ?? '';
  customerForm.companySite = summary.customerProfile?.companySite ?? '';
  customerForm.companyDescription = summary.customerProfile?.companyDescription ?? '';
  customerForm.projectBudgetMin = summary.customerProfile?.projectBudgetMin ?? null;
  customerForm.projectBudgetMax = summary.customerProfile?.projectBudgetMax ?? null;

  performerForm.headline = summary.performerProfile?.headline ?? '';
  performerForm.hourlyRate = summary.performerProfile?.hourlyRate ?? null;
  performerForm.availability = summary.performerProfile?.availability ?? 'part_time';
  performerForm.experienceYears = summary.performerProfile?.experienceYears ?? null;
  performerForm.specialization = summary.performerProfile?.specialization ?? '';

  selectedSkills.value = summary.skills.map((skill) => ({ skillId: skill.id, level: skill.level }));
};

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await Promise.allSettled([profile.load(auth.accessToken), loadSettings()]);
  syncForms();
};

const loadSettings = async () => {
  if (!auth.accessToken) {
    return;
  }

  isLoadingSettings.value = true;

  try {
    settings.value = await getNotificationSettings(auth.accessToken);
  } catch (error) {
    notificationStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось загрузить настройки',
    };
  } finally {
    isLoadingSettings.value = false;
  }
};

const uploadAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  avatarError.value = null;

  if (!file) {
    return;
  }

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    avatarError.value = 'Загрузите PNG, JPG или WebP.';
    input.value = '';
    return;
  }

  if (file.size > 262_144) {
    avatarError.value = 'Фото должно быть меньше 256 КБ.';
    input.value = '';
    return;
  }

  baseForm.avatarUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
  input.value = '';
};

const saveProfile = async () => {
  if (!auth.accessToken) {
    return;
  }

  await profile.saveProfile(auth.accessToken, {
    ...baseForm,
    customer: isCustomer.value
      ? {
          ...customerForm,
          projectBudgetMin: numberOrNull(customerForm.projectBudgetMin),
          projectBudgetMax: numberOrNull(customerForm.projectBudgetMax),
        }
      : undefined,
    performer: isPerformer.value
      ? {
          ...performerForm,
          hourlyRate: numberOrNull(performerForm.hourlyRate),
          experienceYears: numberOrNull(performerForm.experienceYears),
        }
      : undefined,
  });
  syncForms();
};

const toggleSkill = (skillId: string) => {
  const index = selectedSkills.value.findIndex((skill) => skill.skillId === skillId);

  if (index >= 0) {
    selectedSkills.value.splice(index, 1);
    return;
  }

  selectedSkills.value.push({ skillId, level: 'middle' });
};

const setSkillLevel = (skillId: string, level: UserSkill['level']) => {
  const skill = selectedSkills.value.find((item) => item.skillId === skillId);

  if (skill) {
    skill.level = level;
  }
};

const saveSkills = async () => {
  if (!auth.accessToken) {
    return;
  }

  await profile.saveSkills(auth.accessToken, selectedSkills.value);
  syncForms();
};

const addPortfolio = async () => {
  if (!auth.accessToken || !portfolioForm.title.trim()) {
    return;
  }

  await profile.addPortfolio(auth.accessToken, portfolioForm);
  portfolioForm.title = '';
  portfolioForm.description = '';
  portfolioForm.projectUrl = '';
  portfolioForm.coverUrl = '';
  syncForms();
};

const removePortfolio = async (id: string) => {
  if (!auth.accessToken) {
    return;
  }

  await profile.removePortfolio(auth.accessToken, id);
  syncForms();
};

const submitPassword = async () => {
  if (!auth.accessToken) {
    return;
  }

  passwordStatus.value = null;

  try {
    await changePassword(auth.accessToken, { ...passwordForm });
    passwordStatus.value = { tone: 'ok', text: 'Пароль обновлён.' };
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
  } catch (error) {
    passwordStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сменить пароль',
    };
  }
};

const submitEmail = async () => {
  if (!auth.accessToken) {
    return;
  }

  emailStatus.value = null;

  try {
    const response = await changeEmail(auth.accessToken, { ...emailForm });
    emailStatus.value = { tone: 'ok', text: `Email обновлён: ${response.email}` };

    if (auth.user) {
      auth.user.email = response.email;
    }

    emailForm.newEmail = '';
    emailForm.currentPassword = '';
  } catch (error) {
    emailStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сменить email',
    };
  }
};

const saveNotificationSettings = async () => {
  if (!auth.accessToken || !settings.value) {
    return;
  }

  isSavingSettings.value = true;
  notificationStatus.value = null;

  try {
    settings.value = await updateNotificationSettings(auth.accessToken, settings.value);
    notificationStatus.value = { tone: 'ok', text: 'Уведомления сохранены.' };
  } catch (error) {
    notificationStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сохранить уведомления',
    };
  } finally {
    isSavingSettings.value = false;
  }
};

const submitDelete = async () => {
  if (!auth.accessToken) {
    return;
  }

  if (!deleteConfirmed.value) {
    deleteStatus.value = { tone: 'error', text: 'Подтвердите удаление аккаунта.' };
    return;
  }

  deleteStatus.value = null;

  try {
    await deleteAccount(auth.accessToken, { ...deleteForm });
    auth.logout();
    await router.push('/');
  } catch (error) {
    deleteStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось удалить аккаунт',
    };
  }
};

watch(() => profile.summary, syncForms);

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <div v-if="profile.isLoading" class="grid min-h-[420px] place-items-center">
        <div
          class="flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем профиль
        </div>
      </div>

      <div v-else class="space-y-5">
        <PageHero eyebrow="Профиль" title="Настройки профиля.">
          <template #actions>
            <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
              <button
                class="group flex h-[70px] items-center gap-3 rounded-2xl border border-paper/20 bg-paper/[0.06] px-4 text-left text-paper transition duration-200 ease-out hover:border-paper/45 hover:bg-paper/[0.12]"
                type="button"
                @click="showProgressModal = true"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <BadgeCheck :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]">
                    Готовность профиля
                  </span>
                </span>
                <span
                  class="ml-2 inline-flex h-7 min-w-12 shrink-0 items-center justify-center rounded-full bg-paper px-2 text-xs font-black leading-none tabular-nums text-ink"
                >
                  {{ progress?.percentage ?? 0 }}%
                </span>
              </button>
              <RouterLink
                v-if="isPerformer"
                class="group flex h-[70px] items-center gap-3 rounded-2xl border border-paper/20 bg-paper/[0.06] px-4 text-paper transition duration-200 ease-out hover:border-paper/45 hover:bg-paper/[0.12]"
                to="/level-roadmap"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <Trophy :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]">
                    Дорога роста
                  </span>
                </span>
                <ExternalLink class="shrink-0 text-paper/70" :size="17" />
              </RouterLink>
            </section>
          </template>
        </PageHero>

        <section class="space-y-5">
          <section
            v-if="showProgressModal"
            class="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 py-8 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-progress-title"
            @click.self="showProgressModal = false"
          >
            <div
              class="w-full max-w-[34rem] rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 text-ink sm:p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/55">Профиль</p>
                  <h2
                    id="profile-progress-title"
                    class="mt-1 text-3xl font-black leading-[1.04] tracking-[-0.05em]"
                  >
                    Готовность профиля
                  </h2>
                </div>
                <button
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-paper text-ink transition hover:border-ink"
                  type="button"
                  aria-label="Закрыть"
                  @click="showProgressModal = false"
                >
                  <X :size="18" />
                </button>
              </div>

              <div class="mt-5 rounded-[1.1rem] border border-ink bg-ink p-4 text-paper">
                <div class="flex items-end justify-between gap-4">
                  <span class="text-sm font-black uppercase tracking-[0.18em] text-paper/60">
                    Заполнено
                  </span>
                  <span class="text-4xl font-black tracking-[-0.06em]">
                    {{ progress?.percentage ?? 0 }}%
                  </span>
                </div>
                <div
                  class="mt-4 h-3 overflow-hidden rounded-full border border-paper/25 bg-paper/10"
                >
                  <div
                    class="h-full bg-ember transition-all"
                    :style="{ width: `${progress?.percentage ?? 0}%` }"
                  />
                </div>
              </div>

              <section v-if="incompleteSteps.length" class="mt-5">
                <h3 class="flex items-center gap-2 text-lg font-black tracking-[-0.03em]">
                  <Trophy :size="21" class="text-ember" />
                  Что заполнить
                </h3>
                <div class="mt-3 space-y-3">
                  <article
                    v-for="step in incompleteSteps"
                    :key="step.code"
                    class="rounded-2xl border border-line bg-paper p-4"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink bg-paper text-ink/35"
                      >
                        <Check :size="14" />
                      </span>
                      <span>
                        <span class="block font-black">{{ step.title }}</span>
                        <span class="mt-1 block text-sm leading-5 text-ink/65">
                          {{ step.description }}
                        </span>
                      </span>
                    </div>
                  </article>
                </div>
              </section>

              <p v-else class="mt-5 rounded-2xl border border-line bg-paper p-4 font-black">
                Профиль заполнен. Можно возвращаться к работе.
              </p>
            </div>
          </section>

          <form
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
            @submit.prevent="saveProfile"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Профиль</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Основная информация</h2>
              </div>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-60"
                type="submit"
                :disabled="profile.isSaving"
              >
                <Save :size="18" />
                {{ profile.isSaving ? 'Сохраняем...' : 'Сохранить' }}
              </button>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2 rounded-2xl border border-ink bg-paper p-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-4">
                    <span
                      class="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[1.35rem] border border-ink bg-[#fffaf0] text-2xl font-black"
                    >
                      <img
                        v-if="avatarPreview"
                        class="h-full w-full object-cover"
                        :src="avatarPreview"
                        alt="Фото профиля"
                      />
                      <span v-else>{{ auth.user?.displayName?.slice(0, 1) ?? 'F' }}</span>
                    </span>
                    <div>
                      <p class="font-black">Фото профиля</p>
                      <p v-if="avatarError" class="mt-1 text-sm font-bold text-ember">
                        {{ avatarError }}
                      </p>
                    </div>
                  </div>
                  <label
                    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                  >
                    <Camera :size="18" />
                    Загрузить фото
                    <input
                      class="sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      @change="uploadAvatar"
                    />
                  </label>
                </div>
              </div>
              <label class="md:col-span-2">
                <span class="mb-2 block text-sm font-black">О себе</span>
                <textarea
                  v-model="baseForm.bio"
                  class="min-h-28 w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="Коротко, понятно, без канцелярита"
                />
              </label>
              <label>
                <span class="mb-2 block text-sm font-black">Город</span>
                <input
                  v-model="baseForm.city"
                  class="w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="Москва"
                />
              </label>
              <label>
                <span class="mb-2 block text-sm font-black">Telegram</span>
                <input
                  v-model="baseForm.telegram"
                  class="w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="@fastik_user"
                />
              </label>
              <label>
                <span class="mb-2 block text-sm font-black">Сайт</span>
                <input
                  v-model="baseForm.websiteUrl"
                  class="w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="https://example.com"
                />
              </label>
            </div>

            <div v-if="isCustomer" class="mt-6 rounded-2xl border border-ink bg-paper p-4">
              <h3 class="flex items-center gap-2 text-xl font-black tracking-[-0.04em]">
                <BriefcaseBusiness :size="22" class="text-ember" />
                Профиль заказчика
              </h3>
              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  v-model="customerForm.companyName"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  placeholder="Название компании"
                />
                <input
                  v-model="customerForm.companySite"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  placeholder="https://company.ru"
                />
                <input
                  v-model.number="customerForm.projectBudgetMin"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  type="number"
                  placeholder="Бюджет от"
                />
                <input
                  v-model.number="customerForm.projectBudgetMax"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  type="number"
                  placeholder="Бюджет до"
                />
                <textarea
                  v-model="customerForm.companyDescription"
                  class="min-h-24 rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none md:col-span-2"
                  placeholder="Чем занимается компания и какие задачи обычно появляются"
                />
              </div>
            </div>

            <div v-if="isPerformer" class="mt-6 rounded-2xl border border-ink bg-paper p-4">
              <h3 class="flex items-center gap-2 text-xl font-black tracking-[-0.04em]">
                <Hammer :size="22" class="text-ember" />
                Профиль исполнителя
              </h3>
              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  v-model="performerForm.headline"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  placeholder="Vue/Node.js разработчик"
                />
                <input
                  v-model="performerForm.specialization"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  placeholder="Frontend, backend, дизайн"
                />
                <input
                  v-model.number="performerForm.hourlyRate"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  type="number"
                  placeholder="Ставка в час"
                />
                <input
                  v-model.number="performerForm.experienceYears"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none"
                  type="number"
                  placeholder="Опыт в годах"
                />
                <select
                  v-model="performerForm.availability"
                  class="rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 font-semibold outline-none md:col-span-2"
                >
                  <option value="part_time">Частичная занятость</option>
                  <option value="full_time">Полная занятость</option>
                  <option value="project">Проектная работа</option>
                </select>
              </div>
            </div>
          </form>

          <section
            v-if="isPerformer"
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Навыки</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Что умеешь</h2>
              </div>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
                type="button"
                @click="saveSkills"
              >
                <BadgeCheck :size="18" />
                Сохранить навыки
              </button>
            </div>

            <div class="mt-6 space-y-5">
              <div v-for="group in groupedSkills" :key="group.title">
                <h3 class="mb-3 text-sm font-black uppercase tracking-[0.18em] text-ink/55">
                  {{ group.title }}
                </h3>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="skill in group.skills"
                    :key="skill.id"
                    class="rounded-full border px-4 py-2 text-sm font-black transition"
                    :class="
                      selectedSkillMap.has(skill.id)
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line bg-paper text-ink hover:border-ink'
                    "
                    type="button"
                    @click="toggleSkill(skill.id)"
                  >
                    {{ skill.name }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="selectedSkills.length" class="mt-6 grid gap-3 md:grid-cols-2">
              <article
                v-for="item in selectedSkills"
                :key="item.skillId"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <p class="font-black">
                  {{ profile.skillOptions.find((skill) => skill.id === item.skillId)?.name }}
                </p>
                <select
                  class="mt-3 w-full rounded-xl border border-line bg-[#fffaf0] px-3 py-2 font-bold outline-none"
                  :value="item.level"
                  @change="
                    setSkillLevel(
                      item.skillId,
                      ($event.target as HTMLSelectElement).value as UserSkill['level'],
                    )
                  "
                >
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>
              </article>
            </div>
          </section>

          <section
            v-if="isPerformer"
            class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6"
          >
            <div class="flex items-start gap-3">
              <FolderKanban :size="28" class="text-ember" />
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Портфолио</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Проекты</h2>
              </div>
            </div>

            <form class="mt-6 grid gap-3 md:grid-cols-2" @submit.prevent="addPortfolio">
              <input
                v-model="portfolioForm.title"
                class="rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="Название проекта"
                required
              />
              <input
                v-model="portfolioForm.projectUrl"
                class="rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="https://project.ru"
              />
              <textarea
                v-model="portfolioForm.description"
                class="min-h-24 rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none md:col-span-2"
                placeholder="Что сделали, чем гордимся, какой результат"
              />
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt md:col-span-2"
                type="submit"
              >
                <Plus :size="18" />
                Добавить проект
              </button>
            </form>

            <div class="mt-6 grid gap-3 md:grid-cols-2">
              <article
                v-for="item in profile.summary?.portfolio"
                :key="item.id"
                class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="font-black">{{ item.title }}</h3>
                    <p class="mt-2 text-sm leading-6 text-paper/68">
                      {{ item.description || 'Описание пока не добавлено' }}
                    </p>
                    <a
                      v-if="item.projectUrl"
                      class="mt-3 inline-flex items-center gap-2 text-sm font-black text-paper underline decoration-2 underline-offset-4"
                      :href="item.projectUrl"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть
                      <ExternalLink :size="14" />
                    </a>
                  </div>
                  <button
                    class="rounded-full border border-paper/25 p-2 text-paper/70 transition hover:border-ember hover:text-ember"
                    type="button"
                    @click="removePortfolio(item.id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section class="grid gap-4 lg:grid-cols-2">
            <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <div class="flex items-start gap-3">
                <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
                  <Mail :size="20" />
                </span>
                <div>
                  <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Email</p>
                  <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Сменить email</h2>
                  <p class="mt-1 text-sm font-semibold text-ink/55">{{ auth.user?.email }}</p>
                </div>
              </div>
              <form class="mt-4 grid gap-3" @submit.prevent="submitEmail">
                <input
                  v-model="emailForm.newEmail"
                  class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                  type="email"
                  placeholder="Новый email"
                  required
                />
                <input
                  v-model="emailForm.currentPassword"
                  class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                  type="password"
                  placeholder="Текущий пароль"
                  required
                />
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                  type="submit"
                >
                  <Save :size="16" />
                  Сохранить email
                </button>
                <p
                  v-if="emailStatus"
                  class="text-sm font-bold"
                  :class="emailStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
                >
                  {{ emailStatus.text }}
                </p>
              </form>
            </article>

            <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <div class="flex items-start gap-3">
                <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
                  <KeyRound :size="20" />
                </span>
                <div>
                  <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Пароль</p>
                  <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Сменить пароль</h2>
                </div>
              </div>
              <form class="mt-4 grid gap-3" @submit.prevent="submitPassword">
                <input
                  v-model="passwordForm.currentPassword"
                  class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                  type="password"
                  placeholder="Текущий пароль"
                  required
                />
                <input
                  v-model="passwordForm.newPassword"
                  class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                  type="password"
                  minlength="8"
                  placeholder="Новый пароль"
                  required
                />
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                  type="submit"
                >
                  <Save :size="16" />
                  Сменить пароль
                </button>
                <p
                  v-if="passwordStatus"
                  class="text-sm font-bold"
                  :class="passwordStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
                >
                  {{ passwordStatus.text }}
                </p>
              </form>
            </article>
          </section>

          <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-3">
                <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
                  <Bell :size="20" />
                </span>
                <div>
                  <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
                    Уведомления
                  </p>
                  <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Настройки событий</h2>
                </div>
              </div>
              <button
                v-if="settings"
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                type="button"
                :disabled="isSavingSettings"
                @click="saveNotificationSettings"
              >
                <Save :size="16" />
                {{ isSavingSettings ? 'Сохраняем...' : 'Сохранить' }}
              </button>
            </div>

            <div v-if="isLoadingSettings" class="mt-4 inline-flex items-center gap-3 font-black">
              <Loader2 class="animate-spin" :size="20" /> Загружаем уведомления
            </div>

            <div v-else-if="settings" class="mt-5 grid gap-3 lg:grid-cols-2">
              <div class="rounded-2xl border border-line bg-paper p-4">
                <p class="font-black">Email</p>
                <div class="mt-3 space-y-2">
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Новые сообщения
                    <input v-model="settings.email.messages" type="checkbox" />
                  </label>
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Отклики и приглашения
                    <input v-model="settings.email.applications" type="checkbox" />
                  </label>
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Статусы заказов
                    <input v-model="settings.email.orders" type="checkbox" />
                  </label>
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Рассылки
                    <input v-model="settings.email.marketing" type="checkbox" />
                  </label>
                </div>
              </div>
              <div class="rounded-2xl border border-line bg-paper p-4">
                <p class="font-black">В приложении</p>
                <div class="mt-3 space-y-2">
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Новые сообщения
                    <input v-model="settings.inApp.messages" type="checkbox" />
                  </label>
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Отклики и приглашения
                    <input v-model="settings.inApp.applications" type="checkbox" />
                  </label>
                  <label class="flex items-center justify-between gap-3 text-sm font-bold">
                    Статусы заказов
                    <input v-model="settings.inApp.orders" type="checkbox" />
                  </label>
                </div>
              </div>
            </div>
            <p
              v-if="notificationStatus"
              class="mt-4 text-sm font-bold"
              :class="notificationStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
            >
              {{ notificationStatus.text }}
            </p>
          </section>

          <section class="rounded-[1.35rem] border border-ember bg-ember/10 p-5 sm:p-6">
            <div class="flex items-start gap-3">
              <span class="grid h-11 w-11 place-items-center rounded-xl bg-ember text-paper">
                <ShieldAlert :size="20" />
              </span>
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ember">Аккаунт</p>
                <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Удалить аккаунт</h2>
              </div>
            </div>
            <form class="mt-4 grid gap-3" @submit.prevent="submitDelete">
              <input
                v-model="deleteForm.currentPassword"
                class="rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ember"
                type="password"
                placeholder="Пароль"
                required
              />
              <label class="flex cursor-pointer items-center gap-3 text-sm font-bold">
                <input v-model="deleteConfirmed" type="checkbox" />
                Я понимаю, что удаление необратимо.
              </label>
              <button
                class="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-ember bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                type="submit"
              >
                <Trash2 :size="16" />
                Удалить аккаунт
              </button>
              <p
                v-if="deleteStatus"
                class="text-sm font-bold"
                :class="deleteStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
              >
                {{ deleteStatus.text }}
              </p>
            </form>
          </section>

          <p
            v-if="profile.error"
            class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
          >
            {{ profile.error }}
          </p>
        </section>
      </div>
    </section>
  </main>
</template>
