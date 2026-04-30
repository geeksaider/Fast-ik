<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Crown,
  ExternalLink,
  Loader2,
  Medal,
  Send,
  ShieldCheck,
  Trophy,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useContestsStore } from '../stores/contests';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDisplayText,
  formatSystemLabel,
} from '../lib/format';

const auth = useAuthStore();
const contests = useContestsStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  pitch: '',
  previewUrl: '',
});

const contestId = computed(() => String(route.params.id));
const contest = computed(() => contests.currentContest);
const gateText = computed(() => {
  if (!contest.value?.levelGate) {
    return 'Войдите как исполнитель, чтобы Fastik проверил доступ по уровню.';
  }

  if (contest.value.levelGate.allowed) {
    return `Ваш уровень подходит: ${contest.value.levelGate.performerLevelTitle}.`;
  }

  return `Нужен уровень «${contest.value.levelGate.requiredLevelTitle}». Сейчас: ${contest.value.levelGate.performerLevelTitle ?? 'уровень не рассчитан'}.`;
});

const canSelectWinner = computed(() =>
  Boolean(contest.value?.canManage && !['completed', 'cancelled'].includes(contest.value.status)),
);

const load = async () => {
  await contests.loadContest(contestId.value, auth.accessToken);
};

const submit = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await contests.submit(auth.accessToken, contestId.value, {
    pitch: form.pitch,
    previewUrl: form.previewUrl || null,
  });

  form.pitch = '';
  form.previewUrl = '';
};

const selectWinner = async (submissionId: string) => {
  if (!auth.accessToken) {
    return;
  }

  await contests.selectWinner(auth.accessToken, contestId.value, submissionId);
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
          to="/contests"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К конкурсам
        </RouterLink>
      </header>

      <div v-if="contests.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем конкурс
        </span>
      </div>

      <div v-else-if="contest" class="grid gap-5 py-7 lg:grid-cols-[1.24fr_0.76fr]">
        <section class="space-y-5">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-7">
            <div
              class="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/55"
            >
              <span>{{ contest.categoryName || 'Без категории' }}</span>
              <span>•</span>
              <span>{{ formatSystemLabel(contest.status) }}</span>
              <span>•</span>
              <span>{{ formatDate(contest.deadlineAt) }}</span>
            </div>

            <h1 class="mt-4 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
              {{ formatDisplayText(contest.title) }}
            </h1>
            <p class="mt-5 whitespace-pre-line text-base font-medium leading-8 text-ink/72">
              {{ contest.brief }}
            </p>

            <div class="mt-6 flex flex-wrap gap-2">
              <span
                v-for="tag in contest.tags"
                :key="tag"
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                #{{ tag }}
              </span>
            </div>
          </article>

          <section
            v-if="contest.canSubmit"
            class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6"
          >
            <div class="flex items-start gap-3">
              <Trophy class="text-ember" :size="28" />
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Участие</p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Отправить работу</h2>
              </div>
            </div>

            <form class="mt-6 grid gap-3" @submit.prevent="submit">
              <textarea
                v-model="form.pitch"
                class="min-h-40 rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="Опишите решение, подход, результат и почему именно оно должно победить"
                required
              />
              <input
                v-model="form.previewUrl"
                class="rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="Ссылка на макет, прототип или демо (необязательно)"
                type="url"
              />
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                type="submit"
                :disabled="contests.isSaving"
              >
                <Send :size="18" />
                Отправить на конкурс
              </button>
            </form>
          </section>

          <section
            v-else-if="auth.user?.role === 'performer'"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <ShieldCheck class="text-ember" :size="24" /> Доступ по уровню
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/70">{{ gateText }}</p>
            <RouterLink
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              to="/level-roadmap"
            >
              Открыть Roadmap
              <ArrowRight :size="18" />
            </RouterLink>
          </section>

          <section
            v-if="contest.mySubmission"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <BadgeCheck class="text-moss" :size="24" /> Ваша работа
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/70">
              {{ contest.mySubmission.pitch }}
            </p>
            <p class="mt-3 text-sm font-black text-bolt">
              {{ formatSystemLabel(contest.mySubmission.status) }} ·
              {{ formatDateTime(contest.mySubmission.createdAt) }}
            </p>
          </section>

          <section
            v-if="contest.canManage"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <Medal class="text-ember" :size="24" /> Работы участников
            </h2>
            <div class="mt-4 space-y-3">
              <article
                v-for="submission in contest.submissions"
                :key="submission.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <RouterLink
                      class="inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-4 transition hover:text-bolt"
                      :to="`/performers/${submission.performerId}`"
                    >
                      {{ submission.performerName }}
                    </RouterLink>
                    <p class="mt-2 text-sm leading-6 text-ink/68">{{ submission.pitch }}</p>
                    <a
                      v-if="submission.previewUrl"
                      class="mt-3 inline-flex items-center gap-2 text-sm font-black text-bolt underline decoration-2 underline-offset-4"
                      :href="submission.previewUrl"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть материал
                      <ExternalLink :size="15" />
                    </a>
                    <p class="mt-3 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                      {{ formatSystemLabel(submission.status) }} ·
                      {{ formatDateTime(submission.createdAt) }}
                    </p>
                  </div>
                  <button
                    v-if="canSelectWinner && submission.status === 'submitted'"
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
                    type="button"
                    :disabled="contests.isSaving"
                    @click="selectWinner(submission.id)"
                  >
                    <Crown :size="16" />
                    Победитель
                  </button>
                </div>
              </article>
              <p
                v-if="!contest.submissions.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
              >
                Работ пока нет. Когда исполнители пройдут LVL-допуск и отправят решения, они
                появятся здесь.
              </p>
            </div>
          </section>
        </section>

        <aside class="space-y-4">
          <section class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Приз</p>
            <p class="mt-3 text-5xl font-black tracking-[-0.06em]">
              {{ formatAmount(contest.prizeAmount) }}
            </p>
            <p class="mt-4 text-sm font-semibold leading-6 text-paper/68">
              Деньги моковые: для диплома это демонстрация логики конкурса без реальных платежей.
            </p>
          </section>

          <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Допуск</p>
            <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
              LVL {{ contest.requiredLevelSortOrder }} · {{ contest.requiredLevelTitle }}
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/65">{{ gateText }}</p>
          </section>

          <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Сводка</p>
            <div class="mt-4 grid gap-3">
              <div class="rounded-2xl border border-line bg-paper p-4">
                <p class="text-sm font-bold text-ink/55">Работ</p>
                <p class="mt-1 text-3xl font-black">{{ contest.submissionsCount }}</p>
              </div>
              <div class="rounded-2xl border border-line bg-paper p-4">
                <p class="text-sm font-bold text-ink/55">Статус</p>
                <p class="mt-1 text-2xl font-black">{{ formatSystemLabel(contest.status) }}</p>
              </div>
              <div class="rounded-2xl border border-line bg-paper p-4">
                <p class="text-sm font-bold text-ink/55">Заказчик</p>
                <p class="mt-1 text-xl font-black">{{ contest.customerName }}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>
