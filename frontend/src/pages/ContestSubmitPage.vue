<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ExternalLink, Loader2, Send, ShieldCheck, Trophy } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useContestsStore } from '../stores/contests';
import { formatAmount, formatDate, formatDisplayText } from '../lib/format';

const auth = useAuthStore();
const contests = useContestsStore();
const route = useRoute();
const router = useRouter();

const contestId = computed(() => String(route.params.id));
const contest = computed(() => contests.currentContest);

const form = reactive({
  pitch: '',
  previewUrl: '',
});

const error = ref<string | null>(null);
const isSubmitting = ref(false);

const gateText = computed(() => {
  if (!contest.value?.levelGate) {
    return 'Войдите как исполнитель, чтобы Fastik проверил доступ по уровню.';
  }

  if (contest.value.levelGate.allowed) {
    return `Ваш уровень подходит: ${contest.value.levelGate.performerLevelTitle}.`;
  }

  return `Нужен уровень «${contest.value.levelGate.requiredLevelTitle}». Сейчас: ${contest.value.levelGate.performerLevelTitle ?? 'уровень не рассчитан'}.`;
});

const canSubmit = computed(() => Boolean(contest.value?.canSubmit));

const load = async () => {
  if (!auth.accessToken) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }

  await contests.loadContest(contestId.value, auth.accessToken);

  if (contest.value?.mySubmission) {
    await router.replace(`/contests/${contestId.value}`);
  }
};

const submit = async () => {
  if (!auth.accessToken) {
    return;
  }

  error.value = null;
  isSubmitting.value = true;

  try {
    await contests.submit(auth.accessToken, contestId.value, {
      pitch: form.pitch.trim(),
      previewUrl: form.previewUrl.trim() || null,
    });

    await router.push(`/contests/${contestId.value}`);
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось отправить работу';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <header class="border-b border-ink/15 pb-5">
        <RouterLink
          :to="`/contests/${contestId}`"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К конкурсу
        </RouterLink>
      </header>

      <div v-if="contests.isLoading" class="grid min-h-[300px] place-items-center">
        <span class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black">
          <Loader2 class="animate-spin" :size="20" />
          Загружаем конкурс
        </span>
      </div>

      <div v-else-if="contest" class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="grid gap-4">
          <article class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8">
            <div class="flex items-start gap-3">
              <Trophy class="text-ember" :size="28" />
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Участие</p>
                <h1 class="mt-2 text-4xl font-black leading-[0.94] tracking-[-0.06em] sm:text-5xl">
                  Отправить работу
                </h1>
              </div>
            </div>
            <p class="mt-4 text-sm font-semibold leading-6 text-paper/70">
              Поделитесь решением, подходом и результатом. После отправки работа попадает в очередь
              на проверку — заказчик выбирает победителя из всех подач.
            </p>
          </article>

          <article
            v-if="canSubmit"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8"
          >
            <form class="grid gap-4" @submit.prevent="submit">
              <label class="block">
                <span class="mb-2 block text-sm font-black">Описание работы</span>
                <textarea
                  v-model="form.pitch"
                  class="min-h-48 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
                  placeholder="Расскажите о подходе, ключевых решениях, почему именно ваш вариант должен победить"
                  required
                />
                <span class="mt-2 block text-xs font-bold text-ink/50">
                  Описание видит заказчик и другие участники, если он откроет дискуссию.
                </span>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-black">Ссылка на работу</span>
                <input
                  v-model="form.previewUrl"
                  class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
                  placeholder="https://figma.com/... или ссылка на репозиторий"
                  type="url"
                />
                <span class="mt-2 block text-xs font-bold text-ink/50">
                  Макет, прототип, репозиторий, видео — что-то, что заказчик может открыть.
                </span>
              </label>

              <p v-if="error" class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember">
                {{ error }}
              </p>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                  type="submit"
                  :disabled="isSubmitting"
                >
                  <Send :size="18" />
                  Отправить на конкурс
                </button>
                <RouterLink
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-5 py-3 font-black transition hover:border-ink"
                  :to="`/contests/${contestId}`"
                >
                  Отмена
                </RouterLink>
              </div>
            </form>
          </article>

          <article
            v-else
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <ShieldCheck class="text-ember" :size="24" />
              Участие пока недоступно
            </h2>
            <p class="mt-3 text-sm font-semibold leading-6 text-ink/68">{{ gateText }}</p>
            <RouterLink
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              to="/level-roadmap"
            >
              Открыть дорогу к славе
            </RouterLink>
          </article>
        </section>

        <aside class="grid gap-4">
          <article class="rounded-[1.5rem] border border-ink bg-paper p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Конкурс</p>
            <h2 class="mt-2 text-2xl font-black tracking-[-0.05em]">
              {{ formatDisplayText(contest.title) }}
            </h2>
            <p class="mt-3 max-w-md text-sm font-semibold leading-6 text-ink/68">
              {{ formatDisplayText(contest.brief) }}
            </p>
            <div class="mt-4 grid gap-2 text-sm font-bold">
              <p>
                <span class="text-ink/55">Приз:</span>
                <span class="ml-1 font-black">{{ formatAmount(contest.prizeAmount) }}</span>
              </p>
              <p v-if="contest.deadlineAt">
                <span class="text-ink/55">Дедлайн:</span>
                <span class="ml-1 font-black">{{ formatDate(contest.deadlineAt) }}</span>
              </p>
              <p>
                <span class="text-ink/55">LVL-допуск:</span>
                <span class="ml-1 font-black">{{ contest.requiredLevelTitle }}</span>
              </p>
            </div>
            <RouterLink
              class="mt-5 inline-flex items-center gap-2 text-sm font-black text-bolt hover:underline"
              :to="`/contests/${contestId}`"
            >
              Открыть карточку конкурса
              <ExternalLink :size="14" />
            </RouterLink>
          </article>
        </aside>
      </div>
    </section>
  </main>
</template>
