<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ExternalLink,
  Loader2,
  MapPin,
  Medal,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { usePerformersStore } from '../stores/performers';
import { formatAmount, formatDateTime } from '../lib/format';
import type { UserSkill } from '../lib/api';

const auth = useAuthStore();
const route = useRoute();
const performers = usePerformersStore();
const marketplace = useMarketplaceStore();

const inviteForm = reactive({
  jobId: '',
  message: '',
});
const inviteSuccess = ref<string | null>(null);
const inviteError = ref<string | null>(null);

const performerId = computed(() => String(route.params.id));
const profile = computed(() => performers.current);
const isCustomer = computed(() => auth.user?.role === 'customer');
const invitableJobs = computed(() =>
  marketplace.jobs.filter((job) => job.status === 'published' && job.customerId === auth.user?.id),
);
const selectedInviteJob = computed(
  () => invitableJobs.value.find((job) => job.id === inviteForm.jobId) ?? null,
);
const ratingLabel = computed(() => {
  const rating = profile.value?.stats.averageRating;

  return rating ? rating.toFixed(1).replace('.', ',') : 'Нет оценок';
});
const inviteTarget = computed(() => {
  if (!auth.isAuthenticated) {
    return { to: `/login?redirect=${route.fullPath}`, label: 'Войти, чтобы пригласить' };
  }

  if (auth.user?.role === 'customer') {
    return { to: '#invite-performer', label: 'Пригласить в заказ' };
  }

  return { to: '/performers', label: 'К исполнителям' };
});

const skillLevelLabel = (level: UserSkill['level']) => {
  const map: Record<UserSkill['level'], string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
  };

  return map[level];
};

const availabilityLabel = (value: string | null | undefined) => {
  const map: Record<string, string> = {
    part_time: 'Частичная занятость',
    full_time: 'Полная занятость',
    project: 'Проектная работа',
  };

  return value ? (map[value] ?? value) : 'Формат обсуждается';
};

const load = async () => {
  await performers.load(performerId.value);

  if (auth.accessToken && isCustomer.value) {
    await marketplace.loadJobs({ mine: true }, auth.accessToken);
  }
};

const submitInvite = async () => {
  if (!auth.accessToken || !profile.value) {
    return;
  }

  inviteError.value = null;
  inviteSuccess.value = null;

  if (!inviteForm.jobId) {
    inviteError.value = 'Выберите заказ, куда пригласить исполнителя.';
    return;
  }

  try {
    await marketplace.invitePerformer(auth.accessToken, inviteForm.jobId, {
      performerId: profile.value.user.id,
      message: inviteForm.message,
    });
  } catch {
    return;
  }

  inviteSuccess.value = selectedInviteJob.value
    ? `Приглашение отправлено в заказ «${selectedInviteJob.value.title}».`
    : 'Приглашение отправлено исполнителю.';
  inviteForm.message = '';
};

onMounted(() => {
  void load();
});

watch(performerId, () => {
  void load();
});

watch(
  invitableJobs,
  (jobs) => {
    if (!inviteForm.jobId && jobs[0]) {
      inviteForm.jobId = jobs[0].id;
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <div v-if="performers.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем профиль исполнителя
        </span>
      </div>

      <section
        v-else-if="performers.error"
        class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ember">Профиль недоступен</p>
        <h1 class="mt-3 text-4xl font-black tracking-[-0.06em]">
          Не получилось открыть исполнителя.
        </h1>
        <p class="mt-3 max-w-xl text-sm font-semibold leading-6 text-ink/65">
          {{ performers.error }}
        </p>
        <RouterLink
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
          to="/jobs"
        >
          К исполнителям
        </RouterLink>
      </section>

      <section v-else-if="profile" class="space-y-4">
        <RouterLink
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/60 transition hover:text-ink"
          to="/jobs"
        >
          <ArrowLeft :size="16" />
          К исполнителям
        </RouterLink>

        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">
              Публичный профиль
            </p>
            <h1
              class="mt-3 max-w-2xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
            >
              {{ profile.user.displayName }}
            </h1>
            <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/78">
              {{ profile.performerProfile?.headline || 'Исполнитель готов к проектной работе' }}
            </p>
            <p
              class="mt-5 max-w-2xl whitespace-pre-line text-sm font-semibold leading-6 text-paper/68"
            >
              {{
                profile.profile?.bio ||
                'Профиль еще заполняется, но базовая статистика и действия на платформе уже видны заказчику.'
              }}
            </p>

            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-if="profile.profile?.city"
                class="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1"
              >
                <MapPin :size="16" />
                {{ profile.profile.city }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1"
              >
                <BriefcaseBusiness :size="16" />
                {{ availabilityLabel(profile.performerProfile?.availability) }}
              </span>
              <span
                v-if="profile.performerProfile?.experienceYears !== null"
                class="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1"
              >
                <Medal :size="16" />
                {{ profile.performerProfile?.experienceYears }} года опыта
              </span>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <a
                v-if="isCustomer"
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                :href="inviteTarget.to"
              >
                <MessageCircle :size="18" />
                {{ inviteTarget.label }}
              </a>
              <RouterLink
                v-else
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                :to="inviteTarget.to"
              >
                <MessageCircle :size="18" />
                {{ inviteTarget.label }}
              </RouterLink>
              <a
                v-if="profile.profile?.websiteUrl"
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper/40 px-5 py-3 font-black text-paper transition hover:bg-paper hover:text-ink"
                :href="profile.profile.websiteUrl"
                target="_blank"
                rel="noreferrer"
              >
                Сайт / кейсы
                <ExternalLink :size="18" />
              </a>
            </div>
          </article>

          <aside class="grid gap-4">
            <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                    Уровень доверия
                  </p>
                  <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                    {{ profile.currentLevel?.title || 'Новичок' }}
                  </h2>
                </div>
                <div
                  class="grid h-12 w-12 place-items-center rounded-2xl border border-ink bg-paper"
                >
                  <Trophy :size="24" />
                </div>
              </div>
              <p class="mt-3 text-sm font-semibold leading-6 text-ink/64">
                {{
                  profile.currentLevel?.description ||
                  'Fastik собирает действия исполнителя в понятный уровень доверия.'
                }}
              </p>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Рейтинг</p>
                  <p class="mt-1 flex items-center gap-2 text-3xl font-black">
                    <Star class="text-ember" :size="24" />
                    {{ ratingLabel }}
                  </p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">XP</p>
                  <p class="mt-1 text-3xl font-black">{{ profile.progress?.xp ?? 0 }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Заказы</p>
                  <p class="mt-1 text-3xl font-black">{{ profile.stats.completedOrdersCount }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Отзывы</p>
                  <p class="mt-1 text-3xl font-black">{{ profile.stats.reviewsCount }}</p>
                </div>
              </div>
            </section>

            <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Почему можно доверять
              </p>
              <div class="mt-4 grid gap-2">
                <p class="flex items-start gap-2 text-sm font-bold leading-6 text-ink/70">
                  <BadgeCheck class="mt-1 shrink-0 text-moss" :size="18" />
                  {{ profile.stats.selectedApplicationsCount }} раз заказчики выбирали исполнителя
                  из откликов.
                </p>
                <p class="flex items-start gap-2 text-sm font-bold leading-6 text-ink/70">
                  <Sparkles class="mt-1 shrink-0 text-bolt" :size="18" />
                  Рейтинг и XP считаются по завершенным заказам и отзывам, а не по ручной накрутке.
                </p>
              </div>
            </section>
          </aside>
        </section>

        <section
          v-if="isCustomer"
          id="invite-performer"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <div class="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Прямое приглашение
              </p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                Позвать исполнителя в заказ
              </h2>
              <p class="mt-3 text-sm font-semibold leading-6 text-ink/65">
                Если профиль подходит, заказчик может не ждать случайных откликов, а отправить
                персональное приглашение. Исполнитель получит уведомление и перейдет прямо к заказу.
              </p>
            </div>

            <form v-if="invitableJobs.length" class="grid gap-3" @submit.prevent="submitInvite">
              <select
                v-model="inviteForm.jobId"
                class="rounded-2xl border border-line bg-paper px-4 py-3 font-black outline-none transition focus:border-ink"
                required
              >
                <option v-for="job in invitableJobs" :key="job.id" :value="job.id">
                  {{ job.title }}
                </option>
              </select>
              <textarea
                v-model="inviteForm.message"
                class="min-h-28 rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none transition focus:border-ink"
                placeholder="Коротко объясните, почему зовете именно этого исполнителя и что нужно сделать"
                minlength="10"
                required
              />
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                type="submit"
                :disabled="marketplace.isSaving"
              >
                <Send :size="18" />
                Отправить приглашение
              </button>
              <p
                v-if="inviteSuccess"
                class="rounded-2xl border border-moss bg-moss/10 px-4 py-3 text-sm font-black text-moss"
              >
                {{ inviteSuccess }}
              </p>
              <p
                v-if="inviteError || marketplace.error"
                class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-black text-ember"
              >
                {{ inviteError || marketplace.error }}
              </p>
            </form>

            <div v-else class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold leading-6 text-ink/65">
                У вас пока нет опубликованных заказов для приглашения. Создайте заказ, а затем
                вернитесь к профилю исполнителя.
              </p>
              <RouterLink
                class="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                to="/jobs/new"
              >
                Создать заказ
              </RouterLink>
            </div>
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Навыки</p>
            <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Рабочий стек</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="skill in profile.skills"
                :key="skill.id"
                class="rounded-full border border-ink bg-paper px-3 py-1 text-sm font-black"
              >
                {{ skill.name }} · {{ skillLevelLabel(skill.level) }}
              </span>
            </div>
            <p
              v-if="!profile.skills.length"
              class="mt-4 rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/62"
            >
              Навыки еще не заполнены.
            </p>

            <div class="mt-6 rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">Ставка</p>
              <p class="mt-1 text-2xl font-black">
                {{
                  profile.performerProfile?.hourlyRate
                    ? `${formatAmount(profile.performerProfile.hourlyRate)} / час`
                    : 'По договоренности'
                }}
              </p>
            </div>
          </article>

          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Отзывы</p>
            <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Что говорят заказчики</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="review in profile.reviews"
                :key="review.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-black">{{ review.orderTitle }}</p>
                    <p class="mt-1 text-sm font-semibold leading-6 text-ink/68">
                      {{ review.comment }}
                    </p>
                  </div>
                  <p class="shrink-0 rounded-full border border-ink px-3 py-1 font-black">
                    {{ review.rating }}/5
                  </p>
                </div>
                <p class="mt-3 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                  {{ review.reviewerName }} · {{ formatDateTime(review.createdAt) }}
                </p>
              </div>
              <p
                v-if="!profile.reviews.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/62"
              >
                Отзывов пока нет. Они появятся после завершенных заказов.
              </p>
            </div>
          </article>
        </section>

        <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Портфолио</p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Кейсы исполнителя</h2>
            </div>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ profile.portfolio.length }} работ
            </span>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <article
              v-for="item in profile.portfolio"
              :key="item.id"
              class="rounded-2xl border border-line bg-paper p-4"
            >
              <p class="text-xl font-black tracking-[-0.04em]">{{ item.title }}</p>
              <p v-if="item.description" class="mt-2 text-sm font-semibold leading-6 text-ink/66">
                {{ item.description }}
              </p>
              <a
                v-if="item.projectUrl"
                class="mt-4 inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
                :href="item.projectUrl"
                target="_blank"
                rel="noreferrer"
              >
                Открыть кейс
                <ExternalLink :size="16" />
              </a>
            </article>
          </div>

          <p
            v-if="!profile.portfolio.length"
            class="mt-4 rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/62"
          >
            Портфолио пока пустое.
          </p>
        </section>
      </section>
    </section>
  </main>
</template>
