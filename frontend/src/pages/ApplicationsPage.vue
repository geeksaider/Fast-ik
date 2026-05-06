<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  BriefcaseBusiness,
  Clock3,
  Inbox,
  Loader2,
  RotateCcw,
  Send,
  UserCheck,
} from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useAuthStore } from '../stores/auth';
import { useMarketplaceStore } from '../stores/marketplace';
import {
  getMarketplaceJob,
  selectJobApplication,
  type JobApplication,
  type JobDetail,
} from '../lib/api';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDisplayText,
  formatSystemLabel,
  getDeadlineSignal,
} from '../lib/format';

type ApplicationRow = {
  job: JobDetail;
  application: JobApplication;
};

const auth = useAuthStore();
const marketplace = useMarketplaceStore();
const router = useRouter();
const detailedJobs = ref<JobDetail[]>([]);
const isLoadingDetails = ref(false);
const statusFilter = ref('all');
const jobFilter = ref('all');
const sortMode = ref('newest');

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);

const canSeeAllJobs = computed(() => Boolean(auth.user?.role && managerRoles.has(auth.user.role)));
const roleHint = computed(() => {
  if (auth.user?.role === 'performer') {
    return 'Здесь собраны ваши отправленные отклики: удобно видеть статус, цену, срок и заказ.';
  }

  if (canSeeAllJobs.value) {
    return 'Операционная сводка показывает, где заказчики еще не выбрали исполнителя.';
  }

  return 'Сравнивайте кандидатов по цене, сроку и письму, затем выбирайте исполнителя в один шаг.';
});

const jobsWithApplications = computed(() =>
  detailedJobs.value
    .filter((job) => job.applications.length > 0)
    .sort((a, b) => b.applications.length - a.applications.length),
);

const rows = computed<ApplicationRow[]>(() =>
  jobsWithApplications.value.flatMap((job) =>
    job.applications.map((application) => ({
      job,
      application,
    })),
  ),
);

const filteredRows = computed(() => {
  const byStatus =
    statusFilter.value === 'all'
      ? rows.value
      : rows.value.filter((row) => row.application.status === statusFilter.value);
  const source =
    jobFilter.value === 'all' ? byStatus : byStatus.filter((row) => row.job.id === jobFilter.value);

  return [...source].sort((first, second) => {
    if (sortMode.value === 'price') {
      return (second.application.price ?? 0) - (first.application.price ?? 0);
    }

    if (sortMode.value === 'delivery') {
      return (first.application.deliveryDays ?? 999) - (second.application.deliveryDays ?? 999);
    }

    if (sortMode.value === 'deadline') {
      const firstDeadline = first.job.deadlineAt
        ? new Date(first.job.deadlineAt).getTime()
        : Infinity;
      const secondDeadline = second.job.deadlineAt
        ? new Date(second.job.deadlineAt).getTime()
        : Infinity;

      return firstDeadline - secondDeadline;
    }

    return (
      new Date(second.application.createdAt).getTime() -
      new Date(first.application.createdAt).getTime()
    );
  });
});

const totalApplications = computed(() => rows.value.length);
const pendingApplications = computed(
  () => rows.value.filter((row) => row.application.status === 'pending').length,
);
const jobOptions = computed(() =>
  jobsWithApplications.value.map((job) => ({
    id: job.id,
    title: formatDisplayText(job.title),
    total: job.applications.length,
    pending: job.applications.filter((application) => application.status === 'pending').length,
  })),
);
const selectedRowsStats = computed(() => {
  const rowsForStats = filteredRows.value;
  const prices = rowsForStats
    .map((row) => row.application.price)
    .filter((price): price is number => typeof price === 'number');
  const deliveryDays = rowsForStats
    .map((row) => row.application.deliveryDays)
    .filter((days): days is number => typeof days === 'number');

  return {
    total: rowsForStats.length,
    pending: rowsForStats.filter((row) => row.application.status === 'pending').length,
    bestPrice: prices.length ? Math.min(...prices) : null,
    fastestDelivery: deliveryDays.length ? Math.min(...deliveryDays) : null,
  };
});

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await marketplace.loadJobs(canSeeAllJobs.value ? {} : { mine: true }, auth.accessToken);

  const targets = marketplace.jobs.filter((job) => job.applicationsCount > 0);
  isLoadingDetails.value = true;

  try {
    detailedJobs.value = await Promise.all(
      targets.map((job) => getMarketplaceJob(job.id, auth.accessToken)),
    );
  } finally {
    isLoadingDetails.value = false;
  }
};

const acceptApplication = async (row: ApplicationRow) => {
  if (!auth.accessToken) {
    return;
  }

  const updatedJob = await selectJobApplication(auth.accessToken, row.job.id, row.application.id);

  detailedJobs.value = detailedJobs.value.map((job) =>
    job.id === updatedJob.id ? updatedJob : job,
  );
};

const applicationTone = (status: string) => {
  const map: Record<string, string> = {
    pending: 'border-bolt/30 bg-bolt/10 text-bolt',
    accepted: 'border-moss/40 bg-moss/10 text-moss',
    rejected: 'border-line bg-paper text-ink/55',
    withdrawn: 'border-line bg-paper text-ink/55',
  };

  return map[status] ?? 'border-line bg-paper text-ink/55';
};

const deadlineClass = (date: string | null) => {
  const signal = getDeadlineSignal(date);
  const map = {
    neutral: 'border-line bg-paper text-ink/62',
    warning: 'border-ember/70 bg-ember/10 text-ember',
    danger: 'border-ember bg-ember text-paper',
    success: 'border-moss/40 bg-moss/10 text-moss',
  };

  return map[signal.tone];
};

const resetFilters = () => {
  statusFilter.value = 'all';
  jobFilter.value = 'all';
  sortMode.value = 'newest';
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <Send class="text-ember" :size="34" />
          <p class="mt-6 text-xs font-black uppercase tracking-[0.24em] text-paper/55">Отклики</p>
          <h1
            class="mt-3 max-w-xl text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Очередь кандидатов по вашим заказам.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            {{ roleHint }}
          </p>
        </aside>

        <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Сводка</p>
          <div class="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper">
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Всего откликов</p>
              <p class="text-2xl font-black">{{ totalApplications }}</p>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Ждут выбора</p>
              <p class="text-2xl font-black text-bolt">{{ pendingApplications }}</p>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Заказов с откликами</p>
              <p class="text-2xl font-black">{{ jobsWithApplications.length }}</p>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-4 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Фильтры</p>
            <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Сравнение откликов</h2>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-black transition hover:border-ink"
            type="button"
            @click="resetFilters"
          >
            <RotateCcw :size="16" />
            Сбросить
          </button>
        </div>
        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <label class="block">
            <span class="mb-2 block text-sm font-black">Заказ</span>
            <select
              v-model="jobFilter"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
            >
              <option value="all">Все заказы</option>
              <option v-for="job in jobOptions" :key="job.id" :value="job.id">
                {{ job.title }} · {{ job.total }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black">Статус заявки</span>
            <select
              v-model="statusFilter"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
            >
              <option value="all">Все отклики</option>
              <option value="pending">Ждут решения</option>
              <option value="accepted">Выбранные</option>
              <option value="rejected">Отклоненные</option>
              <option value="withdrawn">Отозванные</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black">Сортировка</span>
            <select
              v-model="sortMode"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
            >
              <option value="newest">Сначала новые</option>
              <option value="deadline">По дедлайну заказа</option>
              <option value="delivery">По сроку работы</option>
              <option value="price">По цене</option>
            </select>
          </label>
        </div>
      </section>

      <section
        v-if="totalApplications"
        class="mt-4 grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <RouterLink
          class="rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
          to="/applications"
        >
          <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">В выборке</p>
          <p class="mt-2 text-3xl font-black">{{ selectedRowsStats.total }}</p>
        </RouterLink>
        <RouterLink
          class="rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
          to="/applications"
        >
          <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Ждут решения</p>
          <p class="mt-2 text-3xl font-black text-bolt">{{ selectedRowsStats.pending }}</p>
        </RouterLink>
        <article class="rounded-2xl border border-line bg-paper p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Лучшая цена</p>
          <p class="mt-2 text-2xl font-black">
            {{
              selectedRowsStats.bestPrice
                ? formatAmount(selectedRowsStats.bestPrice)
                : 'Обсуждается'
            }}
          </p>
        </article>
        <article class="rounded-2xl border border-line bg-paper p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">Быстрый срок</p>
          <p class="mt-2 text-2xl font-black">
            {{
              selectedRowsStats.fastestDelivery
                ? `${selectedRowsStats.fastestDelivery} дн.`
                : 'Обсуждается'
            }}
          </p>
        </article>
      </section>

      <section v-if="jobOptions.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          class="shrink-0 rounded-full border px-4 py-2 text-sm font-black transition"
          :class="
            jobFilter === 'all'
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-[#fffaf0] text-ink/70 hover:border-ink hover:text-ink'
          "
          type="button"
          @click="jobFilter = 'all'"
        >
          Все заказы
        </button>
        <button
          v-for="job in jobOptions"
          :key="job.id"
          class="inline-flex max-w-72 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition"
          :class="
            jobFilter === job.id
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-[#fffaf0] text-ink/70 hover:border-ink hover:text-ink'
          "
          type="button"
          @click="jobFilter = job.id"
        >
          <span class="truncate">{{ job.title }}</span>
          <span
            class="rounded-full border px-2 py-0.5 text-xs"
            :class="jobFilter === job.id ? 'border-paper/35' : 'border-line'"
          >
            {{ job.pending }}/{{ job.total }}
          </span>
        </button>
      </section>

      <section class="mt-4 space-y-4">
        <div
          v-if="marketplace.isLoading || isLoadingDetails"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем отклики
          </span>
        </div>

        <article
          v-for="row in filteredRows"
          :key="row.application.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="grid gap-5 lg:grid-cols-[4rem_minmax(0,1fr)_13rem] lg:items-start">
            <PersonAvatar :name="row.application.performerName" tone="paper" size="md" />

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border px-3 py-1 text-xs font-black"
                  :class="applicationTone(row.application.status)"
                >
                  {{ formatSystemLabel(row.application.status) }}
                </span>
                <span
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black"
                  :class="deadlineClass(row.job.deadlineAt)"
                >
                  <Clock3 :size="14" />
                  Дедлайн: {{ getDeadlineSignal(row.job.deadlineAt).label }}
                </span>
              </div>

              <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                {{ row.application.performerName }}
              </h2>
              <p class="mt-1 text-sm font-black text-ink/55">
                Отклик на заказ:
                <RouterLink
                  class="text-bolt underline-offset-4 hover:underline"
                  :to="`/jobs/${row.job.id}`"
                >
                  {{ formatDisplayText(row.job.title) }}
                </RouterLink>
              </p>
              <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/68">
                {{ formatDisplayText(row.application.coverLetter) }}
              </p>

              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <span class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black">
                  {{
                    row.application.price ? formatAmount(row.application.price) : 'Цена обсуждается'
                  }}
                </span>
                <span class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black">
                  {{
                    row.application.deliveryDays
                      ? `${row.application.deliveryDays} дн.`
                      : 'Срок обсуждается'
                  }}
                </span>
                <span class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black">
                  {{ formatDateTime(row.application.createdAt) }}
                </span>
              </div>
            </div>

            <div class="grid gap-2 lg:justify-items-end">
              <p class="text-right text-xs font-black uppercase tracking-[0.16em] text-ink/45">
                {{ formatDate(row.job.deadlineAt) }}
              </p>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
                :to="`/performers/${row.application.performerId}`"
              >
                Профиль
              </RouterLink>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-black transition hover:border-ink"
                :to="`/jobs/${row.job.id}`"
              >
                Заказ
              </RouterLink>
              <button
                v-if="row.application.status === 'pending' && row.job.status === 'published'"
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
                type="button"
                @click="acceptApplication(row)"
              >
                Выбрать
                <UserCheck :size="16" />
              </button>
            </div>
          </div>
        </article>

        <div
          v-if="!marketplace.isLoading && !isLoadingDetails && !filteredRows.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Inbox class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Подходящих откликов пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Измените фильтр или пригласите исполнителя в активный заказ.
          </p>
          <RouterLink
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            to="/jobs/new"
          >
            Создать заказ
            <BriefcaseBusiness :size="18" />
          </RouterLink>
        </div>
      </section>
    </section>
  </main>
</template>
