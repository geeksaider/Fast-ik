<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
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
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import { formatDate, formatMoney } from '../lib/format';

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const route = useRoute();
const router = useRouter();

const applyForm = reactive({
  coverLetter: '',
  price: null as number | null,
  deliveryDays: null as number | null,
});

const jobId = computed(() => String(route.params.id));
const job = computed(() => marketplace.currentJob);
const canApply = computed(() => Boolean(auth.isAuthenticated && job.value?.canApply));
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

const load = async () => {
  await marketplace.loadJob(jobId.value, auth.accessToken);
};

const submitApplication = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await marketplace.apply(auth.accessToken, jobId.value, {
    coverLetter: applyForm.coverLetter,
    price: numberOrNull(applyForm.price),
    deliveryDays: numberOrNull(applyForm.deliveryDays),
  });

  applyForm.coverLetter = '';
  applyForm.price = null;
  applyForm.deliveryDays = null;
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
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
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

      <div v-else-if="job" class="grid gap-5 py-7 lg:grid-cols-[1.28fr_0.72fr]">
        <section class="space-y-5">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-7">
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
              {{ job.title }}
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
          </article>

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
                class="min-h-36 rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none md:col-span-2"
                placeholder="Расскажите, почему вы подходите, как начнете и что будет результатом"
                required
              />
              <input
                v-model.number="applyForm.price"
                class="rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                type="number"
                min="0"
                placeholder="Цена"
              />
              <input
                v-model.number="applyForm.deliveryDays"
                class="rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                type="number"
                min="1"
                placeholder="Срок в днях"
              />
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt md:col-span-2"
                type="submit"
              >
                <Send :size="18" />
                Отправить отклик
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
            <p class="mt-3 text-sm font-black text-bolt">Статус: {{ job.myApplication.status }}</p>
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
                  <div>
                    <p class="font-black">{{ application.performerName }}</p>
                    <p class="mt-2 text-sm leading-6 text-ink/68">{{ application.coverLetter }}</p>
                    <p class="mt-3 text-sm font-black text-bolt">
                      {{
                        application.price
                          ? `${application.price.toLocaleString('ru-RU')} ₽`
                          : 'Цена обсуждается'
                      }}
                      ·
                      {{
                        application.deliveryDays
                          ? `${application.deliveryDays} дней`
                          : 'Срок обсуждается'
                      }}
                      ·
                      {{ application.status }}
                    </p>
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
                Откликов пока нет. Когда исполнитель откликнется, заказчик увидит его здесь.
              </p>
            </div>
          </section>
        </section>

        <aside class="space-y-4">
          <section class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Бюджет</p>
            <p class="mt-3 text-3xl font-black tracking-[-0.05em]">
              {{ formatMoney(job.budgetMin, job.budgetMax) }}
            </p>
            <div class="mt-6 space-y-3 text-sm font-bold text-paper/70">
              <p class="flex items-center gap-2">
                <BriefcaseBusiness :size="18" /> Заказчик: {{ job.customerName }}
              </p>
              <p class="flex items-center gap-2">
                <Clock3 :size="18" /> Срок: {{ formatDate(job.deadlineAt) }}
              </p>
              <p class="flex items-center gap-2">
                <ShieldCheck :size="18" /> Гарант будет подключен следующим блоком
              </p>
            </div>
          </section>

          <RouterLink
            v-if="!auth.isAuthenticated"
            class="block rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 font-black transition hover:bg-white"
            to="/login"
          >
            Войдите, чтобы откликнуться или управлять заказом.
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
