<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  Loader2,
  MessageSquareText,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { useProfileStore } from '../stores/profile';
import { ApiError } from '../lib/api';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDisplayText,
  formatMoney,
  formatSystemLabel,
} from '../lib/format';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const profile = useProfileStore();
const route = useRoute();
const router = useRouter();

const applyForm = reactive({
  coverLetter: '',
  price: null as number | null,
  deliveryDays: null as number | null,
});
const applyErrors = reactive<Record<string, string>>({});
const applyError = ref<string | null>(null);

const jobId = computed(() => String(route.params.id));
const job = computed(() => marketplace.currentJob);
const profilePercent = computed(() => profile.summary?.progress.percentage ?? 0);
const performerCanRespond = computed(
  () => auth.user?.role !== 'performer' || profilePercent.value >= 80,
);
const canApply = computed(() =>
  Boolean(auth.isAuthenticated && job.value?.canApply && performerCanRespond.value),
);
const canManage = computed(() => Boolean(auth.isAuthenticated && job.value?.canManage));

const statusTitle = computed(() => {
  if (job.value?.status === 'in_progress') {
    return 'В работе';
  }

  if (job.value?.status === 'completed') {
    return 'Завершён';
  }

  if (job.value?.status === 'cancelled') {
    return 'Отменён';
  }

  return 'Опубликован';
});

const numberOrNull = (value: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const clearApplyErrors = () => {
  Object.keys(applyErrors).forEach((key) => {
    delete applyErrors[key];
  });
};

const applyField = (path: string) => {
  const [field] = path.split('.');
  return ['coverLetter', 'price', 'deliveryDays'].includes(field) ? field : 'form';
};

const friendlyApplyError = (field: string, message: string) => {
  if (field === 'coverLetter') {
    return 'Напишите отклик от 20 до 2000 символов.';
  }

  if (field === 'price') {
    return 'Укажите цену от 0 до 50 000 000 руб.';
  }

  if (field === 'deliveryDays') {
    return 'Укажите срок от 0 до 365 дней.';
  }

  return message;
};

const applyFieldClass = (field: string) => [
  'rounded-2xl border bg-paper px-4 py-3 font-semibold text-ink outline-none transition',
  applyErrors[field] ? 'border-ember ring-2 ring-ember/30' : 'border-paper/30 focus:ring-2 focus:ring-bolt/30',
];

const setApplyErrors = (error: unknown) => {
  clearApplyErrors();

  if (error instanceof ApiError && error.issues.length) {
    error.issues.forEach((issue) => {
      const field = applyField(issue.path);
      const message = friendlyApplyError(field, issue.message);

      if (field === 'form') {
        applyError.value = message;
        return;
      }

      applyErrors[field] = message;
    });

    applyError.value = 'Проверьте выделенные поля.';
    return;
  }

  applyError.value = error instanceof Error ? error.message : 'Не удалось отправить отклик';
};

const load = async () => {
  await Promise.allSettled([
    marketplace.loadJob(jobId.value, auth.accessToken),
    auth.accessToken ? profile.load(auth.accessToken) : Promise.resolve(),
  ]);
};

const submitApplication = async () => {
  clearApplyErrors();
  applyError.value = null;

  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  try {
    await marketplace.apply(auth.accessToken, jobId.value, {
      coverLetter: applyForm.coverLetter,
      price: numberOrNull(applyForm.price),
      deliveryDays: numberOrNull(applyForm.deliveryDays),
    });

    applyForm.coverLetter = '';
    applyForm.price = null;
    applyForm.deliveryDays = null;
  } catch (error) {
    setApplyErrors(error);
  }
};

const selectApplication = async (applicationId: string) => {
  if (!auth.accessToken) {
    return;
  }

  await marketplace.selectApplication(auth.accessToken, jobId.value, applicationId);
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header class="border-b border-ink pb-5">
        <RouterLink
          to="/jobs"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К заказам
        </RouterLink>
      </header>

      <div v-if="marketplace.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем заказ
        </span>
      </div>

      <div v-else-if="job" class="grid gap-5 py-7">
        <aside class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-7">
            <div
              class="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/55"
            >
              <span>{{ job.categoryName || 'Без категории' }}</span>
              <span>•</span>
              <span>{{ statusTitle }}</span>
              <span>•</span>
              <span>{{ formatDate(job.deadlineAt) }}</span>
            </div>

            <h1 class="mt-4 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
              {{ formatDisplayText(job.title) }}
            </h1>
            <p class="mt-5 whitespace-pre-line text-base font-medium leading-8 text-ink/72">
              {{ job.description }}
            </p>

            <div class="mt-6 flex flex-wrap gap-2">
              <span
                v-for="tag in job.tags"
                :key="tag"
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                #{{ tag }}
              </span>
            </div>
          </section>

          <section class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Бюджет</p>
            <p class="mt-3 text-3xl font-black tracking-[-0.05em]">
              {{ formatMoney(job.budgetMin, job.budgetMax) }}
            </p>
            <div class="mt-6 space-y-3 text-sm font-bold text-paper/70">
              <RouterLink
                class="flex items-center gap-2 transition hover:text-paper"
                :to="`/customers/${job.customerId}`"
              >
                <BriefcaseBusiness :size="18" /> Заказчик: {{ job.customerName }}
              </RouterLink>
              <p class="flex items-center gap-2">
                <Clock3 :size="18" /> Срок: {{ formatDate(job.deadlineAt) }}
              </p>
              <p class="flex items-center gap-2">
                <ShieldCheck :size="18" /> Гарант подключится после выбора исполнителя
              </p>
            </div>
          </section>
        </aside>

        <section class="space-y-5">
          <section
            v-if="job.myInvite && !job.myApplication"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <BadgeCheck class="text-moss" :size="24" /> Вас пригласили
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/70">
              {{ job.myInvite.message }}
            </p>
            <p class="mt-3 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
              {{ job.myInvite.customerName }} · {{ formatDateTime(job.myInvite.createdAt) }}
            </p>
          </section>

          <RouterLink
            v-if="auth.user?.role === 'performer' && job.canApply && !performerCanRespond"
            class="block rounded-[1.5rem] border border-ember bg-ember/10 p-5 transition hover:bg-ember/15 sm:p-6"
            to="/onboarding"
          >
            <span class="block text-sm font-black uppercase tracking-[0.2em] text-ember">
              Отклик пока закрыт
            </span>
            <span class="mt-2 block text-3xl font-black tracking-[-0.06em]">
              Сначала усилите профиль
            </span>
            <span class="mt-3 block text-sm font-semibold leading-6 text-ink/68">
              Заказчики видят исполнителей с заполненными навыками, портфолио и условиями работы.
              Сейчас профиль заполнен на {{ profilePercent }}%.
            </span>
          </RouterLink>

          <section
            v-if="canApply"
            class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6"
          >
            <div class="flex items-start gap-3">
              <MessageSquareText class="text-ember" :size="28" />
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Отклик</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Предложить себя</h2>
              </div>
            </div>

            <form class="mt-6 grid gap-3 md:grid-cols-2" @submit.prevent="submitApplication">
              <textarea
                v-model="applyForm.coverLetter"
                :class="[applyFieldClass('coverLetter'), 'min-h-36 md:col-span-2']"
                placeholder="Расскажите, почему вы подходите, как начнете и что будет результатом"
                required
              />
              <p
                v-if="applyErrors.coverLetter"
                class="text-sm font-bold text-ember md:col-span-2"
              >
                {{ applyErrors.coverLetter }}
              </p>
              <input
                v-model.number="applyForm.price"
                :class="applyFieldClass('price')"
                type="number"
                min="0"
                placeholder="Цена"
              />
              <input
                v-model.number="applyForm.deliveryDays"
                :class="applyFieldClass('deliveryDays')"
                type="number"
                min="1"
                placeholder="Срок в днях"
              />
              <p v-if="applyErrors.price" class="text-sm font-bold text-ember">
                {{ applyErrors.price }}
              </p>
              <p v-if="applyErrors.deliveryDays" class="text-sm font-bold text-ember">
                {{ applyErrors.deliveryDays }}
              </p>
              <p
                v-if="applyError"
                class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember md:col-span-2"
              >
                {{ applyError }}
              </p>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt md:col-span-2"
                type="submit"
                :disabled="marketplace.isSaving"
              >
                <Send :size="18" />
                {{ marketplace.isSaving ? 'Отправляем...' : 'Отправить отклик' }}
              </button>
            </form>
          </section>

          <section
            v-if="job.myApplication"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <BadgeCheck class="text-moss" :size="24" /> Ваш отклик
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/70">
              {{ job.myApplication.coverLetter }}
            </p>
            <p class="mt-3 text-sm font-black text-bolt">
              Статус: {{ formatSystemLabel(job.myApplication.status) }}
            </p>
          </section>

          <section
            v-if="canManage"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <UserRound class="text-ember" :size="24" /> Отклики
            </h2>
            <div class="mt-4 space-y-3">
              <article
                v-for="application in job.applications"
                :key="application.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex min-w-0 gap-3">
                    <PersonAvatar :name="application.performerName" tone="paper" size="sm" />
                    <div class="min-w-0">
                      <RouterLink
                        class="inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-4 transition hover:text-bolt"
                        :to="`/performers/${application.performerId}`"
                      >
                        {{ application.performerName }}
                      </RouterLink>
                      <p class="mt-2 text-sm leading-6 text-ink/68">
                        {{ application.coverLetter }}
                      </p>
                      <p class="mt-3 text-sm font-black text-bolt">
                        {{
                          application.price ? formatAmount(application.price) : 'Цена обсуждается'
                        }}
                        ·
                        {{
                          application.deliveryDays
                            ? `${application.deliveryDays} дней`
                            : 'Срок обсуждается'
                        }}
                        ·
                        {{ formatSystemLabel(application.status) }}
                      </p>
                    </div>
                  </div>
                  <button
                    v-if="job.status === 'published'"
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
                    type="button"
                    @click="selectApplication(application.id)"
                  >
                    <Check :size="16" />
                    Выбрать
                  </button>
                </div>
              </article>
              <p
                v-if="!job.applications.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
              >
                Откликов пока нет. Новые заявки появятся в этом списке.
              </p>
            </div>
          </section>

          <section
            v-if="canManage && job.invites.length"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <MessageSquareText class="text-bolt" :size="24" /> Приглашения
            </h2>
            <div class="mt-4 grid gap-3">
              <article
                v-for="invite in job.invites"
                :key="invite.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <RouterLink
                      class="inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-4 transition hover:text-bolt"
                      :to="`/performers/${invite.performerId}`"
                    >
                      {{ invite.performerName }}
                    </RouterLink>
                    <p class="mt-2 text-sm font-semibold leading-6 text-ink/68">
                      {{ invite.message }}
                    </p>
                  </div>
                  <div
                    class="shrink-0 rounded-2xl border border-line bg-[#fffaf0] px-4 py-3 text-right"
                  >
                    <p class="text-sm font-black">{{ formatSystemLabel(invite.status) }}</p>
                    <p class="mt-1 text-xs font-bold text-ink/50">
                      {{ formatDateTime(invite.createdAt) }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </section>

        <aside class="space-y-4">
          <RouterLink
            v-if="!auth.isAuthenticated"
            class="block rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 font-black transition hover:bg-white"
            to="/login"
          >
            Войдите, чтобы откликнуться или управлять заказом.
          </RouterLink>
          <RouterLink
            v-if="auth.isAuthenticated && job.status === 'in_progress'"
            class="block rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 font-black transition hover:bg-white"
            to="/orders"
          >
            Исполнитель выбран. Открыть заказы в работе.
          </RouterLink>

          <p
            v-if="marketplace.error"
            class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
          >
            {{ marketplace.error }}
          </p>
        </aside>
      </div>
    </section>
  </main>
</template>
