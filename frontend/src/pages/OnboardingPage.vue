<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  FolderKanban,
  Hammer,
  Loader2,
  Plus,
  Save,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';
import type { SkillOption, UserSkill } from '../lib/api';

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

const isPerformer = computed(() => auth.user?.role === 'performer');
const isCustomer = computed(() => auth.user?.role === 'customer');
const progress = computed(() => profile.summary?.progress);

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

  await profile.load(auth.accessToken);
  syncForms();
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

watch(() => profile.summary, syncForms);

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
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          Dashboard
        </RouterLink>

        <div class="flex items-center gap-3">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="24" />
          </span>
          <span>
            <span class="block font-display text-xl font-black uppercase tracking-[-0.04em]"
              >Onboarding</span
            >
            <span class="block text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
              profile setup
            </span>
          </span>
        </div>
      </header>

      <div v-if="profile.isLoading" class="grid min-h-[420px] place-items-center">
        <div
          class="flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем профиль
        </div>
      </div>

      <div v-else class="grid gap-5 py-7 lg:grid-cols-[0.72fr_1.28fr]">
        <aside class="space-y-5">
          <section class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Roadmap</p>
            <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
              {{ progress?.percentage ?? 0 }}% готовности
            </h1>
            <p class="mt-4 text-sm font-semibold leading-6 text-paper/65">
              {{ progress?.completedSteps ?? 0 }} из {{ progress?.totalSteps ?? 0 }} шагов закрыто.
              Уже начисляется {{ progress?.earnedXp ?? 0 }} XP для стартовой RPG-дороги.
            </p>

            <div class="mt-6 h-3 overflow-hidden rounded-full border border-paper/25 bg-paper/10">
              <div
                class="h-full bg-ember transition-all"
                :style="{ width: `${progress?.percentage ?? 0}%` }"
              />
            </div>

            <RouterLink
              v-if="isPerformer"
              class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-paper px-5 py-3 font-black text-ink transition hover:bg-ember hover:text-paper"
              to="/level-roadmap"
            >
              Открыть дорогу к славе
              <ExternalLink :size="18" />
            </RouterLink>
          </section>

          <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5">
            <h2 class="flex items-center gap-2 text-xl font-black tracking-[-0.04em]">
              <Trophy :size="24" class="text-ember" />
              Шаги
            </h2>
            <div class="mt-4 space-y-3">
              <article
                v-for="step in progress?.steps"
                :key="step.code"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink"
                    :class="step.completed ? 'bg-moss text-paper' : 'bg-paper text-ink/35'"
                  >
                    <Check :size="14" />
                  </span>
                  <span>
                    <span class="block font-black">{{ step.title }}</span>
                    <span class="mt-1 block text-sm leading-5 text-ink/65">{{
                      step.description
                    }}</span>
                    <span
                      class="mt-2 block text-xs font-black uppercase tracking-[0.14em] text-bolt"
                      >+{{ step.xp }} XP</span
                    >
                  </span>
                </div>
              </article>
            </div>
          </section>
        </aside>

        <section class="space-y-5">
          <form
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
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
              <label>
                <span class="mb-2 block text-sm font-black">Аватар URL</span>
                <input
                  v-model="baseForm.avatarUrl"
                  class="w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="https://..."
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
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
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
            class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6"
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
