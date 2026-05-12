<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  BriefcaseBusiness,
  Check,
  Clock3,
  Inbox,
  Loader2,
  Send,
  Sparkles,
  UserCheck,
  UsersRound,
  X,
} from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import InlineFilterSelect from '../components/InlineFilterSelect.vue';
import PageHero from '../components/PageHero.vue';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useAuthStore } from '../stores/auth';
import { useInvitesStore } from '../stores/invites';
import { useMarketplaceStore } from '../stores/marketplace';
import {
  getSentInvites,
  getMarketplaceJob,
  getMyApplications,
  selectJobApplication,
  type JobApplication,
  type JobDetail,
  type MyApplication,
  type SentInvite,
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
const invites = useInvitesStore();
const marketplace = useMarketplaceStore();
const route = useRoute();
const router = useRouter();
const detailedJobs = ref<JobDetail[]>([]);
const myApplications = ref<MyApplication[]>([]);
const sentInvites = ref<SentInvite[]>([]);
const isLoadingDetails = ref(false);
const isLoadingSent = ref(false);
const statusFilter = ref('all');
const jobFilter = ref('all');
const sortMode = ref('newest');
const activeTab = ref<'applications' | 'invites'>('applications');

const managerRoles = new Set(['admin']);
const isPerformerView = computed(() => auth.user?.role === 'performer');
const isCustomerView = computed(() => auth.user?.role === 'customer');

const canSeeAllJobs = computed(() => Boolean(auth.user?.role && managerRoles.has(auth.user.role)));
const heroTitle = computed(() => {
  if (isPerformerView.value) {
    return 'Ваши кандидаты и приглашения.';
  }

  return 'Кандидаты по вашим заказам.';
});
const heroCards = computed(() => {
  if (isPerformerView.value) {
    return [
      {
        key: 'applications' as const,
        title: 'Мои отклики',
        value: myApplications.value.length,
        icon: Send,
      },
      {
        key: 'invites' as const,
        title: 'Приглашения',
        value: invites.invites.length,
        icon: Sparkles,
      },
    ];
  }

  return [
    {
      key: 'applications' as const,
      title: 'Отклики',
      value: rows.value.length,
      icon: UsersRound,
    },
    {
      key: 'invites' as const,
      title: 'Приглашения',
      value: sentInvites.value.length,
      icon: Sparkles,
    },
  ];
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

  if (isPerformerView.value) {
    isLoadingDetails.value = true;

    try {
      const [applications] = await Promise.all([
        getMyApplications(auth.accessToken),
        invites.load(auth.accessToken),
      ]);

      myApplications.value = applications;
    } finally {
      isLoadingDetails.value = false;
    }

    return;
  }

  await marketplace.loadJobs(canSeeAllJobs.value ? {} : { mine: true }, auth.accessToken);

  const targets = marketplace.jobs.filter((job) => job.applicationsCount > 0);
  isLoadingDetails.value = true;
  isLoadingSent.value = isCustomerView.value;

  try {
    const [jobs, sent] = await Promise.all([
      Promise.all(targets.map((job) => getMarketplaceJob(job.id, auth.accessToken))),
      isCustomerView.value ? getSentInvites(auth.accessToken) : Promise.resolve([]),
    ]);

    detailedJobs.value = jobs;
    sentInvites.value = sent;
  } finally {
    isLoadingDetails.value = false;
    isLoadingSent.value = false;
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

const acceptInvite = async (id: string) => {
  if (!auth.accessToken) return;

  await invites.accept(auth.accessToken, id);
};

const declineInvite = async (id: string) => {
  if (!auth.accessToken) return;

  await invites.decline(auth.accessToken, id);
};

const budgetLabel = (min: number | null, max: number | null) => {
  if (min && max && min !== max) return `${formatAmount(min)} – ${formatAmount(max)}`;
  return formatAmount(max ?? min ?? 0);
};

const inviteTone = (status: string) => {
  if (status === 'pending') return 'border-bolt/30 bg-bolt/10 text-bolt';
  if (status === 'accepted') return 'border-moss/40 bg-moss/10 text-moss';
  return 'border-line bg-paper text-ink/55';
};

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'invites' ? 'invites' : 'applications';
  },
  { immediate: true },
);

const setTab = (tab: typeof activeTab.value) => {
  activeTab.value = tab;
  void router.replace({
    path: '/applications',
    query: tab === 'invites' ? { tab: 'invites' } : {},
  });
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
      <PageHero eyebrow="Кандидаты" :title="heroTitle">
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
            <button
              v-for="card in heroCards"
              :key="card.key"
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                activeTab === card.key
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="setTab(card.key)"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <component :is="card.icon" :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]">
                  {{ card.title }}
                </span>
              </span>
              <span
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                :class="activeTab === card.key ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
              >
                {{ card.value }}
              </span>
            </button>
          </section>
        </template>
      </PageHero>

      <template v-if="isPerformerView && activeTab === 'applications'">
        <section class="mt-4 space-y-3">
          <div v-if="isLoadingDetails" class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
            <span class="inline-flex items-center gap-3 font-black">
              <Loader2 class="animate-spin" :size="20" /> Загружаем ваши отклики
            </span>
          </div>

          <article
            v-for="application in myApplications"
            v-else
            :key="application.id"
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white sm:p-6"
          >
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-start">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full border px-3 py-1 text-xs font-black"
                    :class="applicationTone(application.status)"
                  >
                    {{ formatSystemLabel(application.status) }}
                  </span>
                  <span
                    class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black"
                    :class="deadlineClass(application.deadlineAt)"
                  >
                    <Clock3 :size="14" />
                    Дедлайн: {{ getDeadlineSignal(application.deadlineAt).label }}
                  </span>
                </div>

                <RouterLink
                  class="mt-3 block text-3xl font-black tracking-[-0.06em] text-ink hover:underline"
                  :to="`/jobs/${application.jobId}`"
                >
                  {{ formatDisplayText(application.jobTitle) }}
                </RouterLink>
                <p class="mt-1 text-sm font-black text-ink/55">
                  Заказчик:
                  <RouterLink
                    class="text-bolt underline-offset-4 hover:underline"
                    :to="`/customers/${application.customerId}`"
                  >
                    {{ application.customerName }}
                  </RouterLink>
                </p>
                <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/68">
                  {{ formatDisplayText(application.coverLetter) }}
                </p>

                <div class="mt-4 grid gap-2 sm:grid-cols-3">
                  <span
                    class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black"
                  >
                    {{ application.price ? formatAmount(application.price) : 'Цена обсуждается' }}
                  </span>
                  <span
                    class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black"
                  >
                    {{
                      application.deliveryDays
                        ? `${application.deliveryDays} дн.`
                        : 'Срок обсуждается'
                    }}
                  </span>
                  <span
                    class="rounded-2xl border border-line bg-paper px-3 py-2 text-sm font-black"
                  >
                    {{ formatDateTime(application.createdAt) }}
                  </span>
                </div>
              </div>

              <div class="grid gap-2 lg:justify-items-end">
                <RouterLink
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
                  :to="`/jobs/${application.jobId}`"
                >
                  Открыть заказ
                </RouterLink>
                <RouterLink
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-black transition hover:border-ink"
                  :to="`/customers/${application.customerId}`"
                >
                  Заказчик
                </RouterLink>
              </div>
            </div>
          </article>

          <div
            v-if="!isLoadingDetails && !myApplications.length"
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
          >
            <Inbox class="mx-auto mb-4 text-ember" :size="36" />
            <p class="text-xl font-black">Откликов пока нет</p>
            <p class="mt-2 text-sm font-semibold text-ink/65">
              Откликнитесь на задачу с биржи — отклик появится здесь со статусом и решением
              заказчика.
            </p>
            <RouterLink
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              to="/jobs"
            >
              Открыть биржу
              <BriefcaseBusiness :size="18" />
            </RouterLink>
          </div>
        </section>
      </template>

      <section v-if="isPerformerView && activeTab === 'invites'" class="mt-4 grid gap-3">
        <div
          v-if="invites.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем приглашения
          </span>
        </div>

        <article
          v-for="invite in invites.invites"
          v-else
          :key="invite.id"
          class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 transition hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">
                {{ invite.customerName }} · {{ formatDateTime(invite.createdAt) }}
              </p>
              <RouterLink
                class="mt-2 block text-2xl font-black tracking-[-0.04em] hover:underline"
                :to="`/jobs/${invite.jobId}`"
              >
                {{ invite.jobTitle }}
              </RouterLink>
              <p class="mt-2 text-sm font-semibold leading-5 text-ink/65">{{ invite.message }}</p>
              <div class="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
                <span class="rounded-full border border-line bg-paper px-3 py-1 text-ink/60">
                  Бюджет · {{ budgetLabel(invite.budgetMin, invite.budgetMax) }}
                </span>
                <span
                  v-if="invite.deadlineAt"
                  class="rounded-full border border-line bg-paper px-3 py-1 text-ink/60"
                >
                  Срок · {{ formatDate(invite.deadlineAt) }}
                </span>
              </div>
            </div>
            <div class="flex shrink-0 flex-row gap-2 sm:flex-col">
              <button
                class="inline-flex h-[38px] items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                :disabled="invites.pendingAction === invite.id"
                type="button"
                @click="acceptInvite(invite.id)"
              >
                <Check :size="16" />
                Принять
              </button>
              <button
                class="inline-flex h-[38px] items-center justify-center gap-2 rounded-full border border-ink/40 bg-paper px-4 text-sm font-black text-ink/65 transition hover:border-ink hover:text-ink disabled:opacity-50"
                :disabled="invites.pendingAction === invite.id"
                type="button"
                @click="declineInvite(invite.id)"
              >
                <X :size="16" />
                Отклонить
              </button>
            </div>
          </div>
        </article>

        <div
          v-if="!invites.isLoading && !invites.invites.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Inbox class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Приглашений пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Заполните профиль и держите его актуальным — заказчики приходят из каталога исполнителей.
          </p>
        </div>
      </section>

      <div v-if="!isPerformerView && activeTab === 'applications'" class="mt-4">
        <FilterPanel
          title="Фильтры"
          columns="lg:grid-cols-3"
          @reset="resetFilters"
        >
          <InlineFilterSelect v-model="jobFilter">
            <option value="all">Все заказы</option>
            <option v-for="job in jobOptions" :key="job.id" :value="job.id">
              {{ job.title }} · {{ job.total }}
            </option>
          </InlineFilterSelect>
          <InlineFilterSelect v-model="statusFilter">
            <option value="all">Все отклики</option>
            <option value="pending">Ждут решения</option>
            <option value="accepted">Выбранные</option>
            <option value="rejected">Отклоненные</option>
            <option value="withdrawn">Отозванные</option>
          </InlineFilterSelect>
          <InlineFilterSelect v-model="sortMode">
            <option value="newest">Сначала новые</option>
            <option value="deadline">По дедлайну заказа</option>
            <option value="delivery">По сроку работы</option>
            <option value="price">По цене</option>
          </InlineFilterSelect>
        </FilterPanel>
      </div>

      <section
        v-if="!isPerformerView && activeTab === 'applications' && totalApplications"
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

      <section v-if="!isPerformerView && activeTab === 'applications'" class="mt-4 space-y-4">
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

      <section v-if="!isPerformerView && activeTab === 'invites'" class="mt-4 grid gap-3">
        <div v-if="isLoadingSent" class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем приглашения
          </span>
        </div>

        <article
          v-for="invite in sentInvites"
          v-else
          :key="invite.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full border px-3 py-1 text-xs font-black" :class="inviteTone(invite.status)">
                  {{ formatSystemLabel(invite.status) }}
                </span>
                <span class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">
                  {{ formatDateTime(invite.createdAt) }}
                </span>
              </div>
              <RouterLink
                class="mt-3 block text-2xl font-black tracking-[-0.05em] hover:underline"
                :to="`/performers/${invite.performerId}`"
              >
                {{ invite.performerName }}
              </RouterLink>
              <p class="mt-1 text-sm font-black text-ink/55">
                По заказу
                <RouterLink class="text-bolt underline-offset-4 hover:underline" :to="`/jobs/${invite.jobId}`">
                  {{ invite.jobTitle }}
                </RouterLink>
              </p>
              <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/68">{{ invite.message }}</p>
            </div>
            <div class="grid gap-2 lg:justify-items-end">
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
                :to="`/performers/${invite.performerId}`"
              >
                Профиль
              </RouterLink>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-black transition hover:border-ink"
                :to="`/jobs/${invite.jobId}`"
              >
                Заказ
              </RouterLink>
            </div>
          </div>
        </article>

        <div
          v-if="!isLoadingSent && !sentInvites.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <UsersRound class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Вы пока никого не приглашали</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Откройте каталог исполнителей и пригласите подходящих специалистов на свой заказ.
          </p>
          <RouterLink
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            to="/performers"
          >
            Открыть каталог
            <UsersRound :size="18" />
          </RouterLink>
        </div>
      </section>
    </section>
  </main>
</template>
