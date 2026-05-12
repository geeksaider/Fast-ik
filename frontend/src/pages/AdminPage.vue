<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, type Component } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Ban,
  Check,
  ClipboardList,
  Gavel,
  Loader2,
  Scale,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-vue-next';
import { useAdminStore } from '../stores/admin';
import { useAuthStore } from '../stores/auth';
import {
  formatAmount,
  formatDateTime,
  formatDisplayText,
  formatMoney,
  formatSystemLabel,
} from '../lib/format';
import type { AdminInterviewItem, AdminPermission } from '../lib/api';

const auth = useAuthStore();
const admin = useAdminStore();
const router = useRouter();

const managerRoles = new Set(['admin']);
const activeTab = ref<AdminPermission>('overview');
const localError = ref<string | null>(null);
const moderationPage = ref(1);
const usersPage = ref(1);
const interviewPage = ref(1);
const auditPage = ref(1);
const moderationPageSize = 4;
const usersPageSize = 6;
const interviewPageSize = 5;
const auditPageSize = 8;

const disputeNotes = reactive<Record<string, string>>({});
const moderationNotes = reactive<Record<string, string>>({});
const userNotes = reactive<Record<string, string>>({});
const interviewNotes = reactive<Record<string, string>>({});

type AdminTab = {
  key: AdminPermission;
  label: string;
  icon: Component;
  count?: number;
};

const hasAdminAccess = computed(() => Boolean(auth.user?.role && managerRoles.has(auth.user.role)));

const tabs = computed<AdminTab[]>(() => {
  const items: AdminTab[] = [{ key: 'overview', label: 'Обзор', icon: Activity }];

  if (admin.can('disputes')) {
    items.push({ key: 'disputes', label: 'Споры', icon: Scale, count: admin.disputes.length });
  }

  if (admin.can('moderation')) {
    items.push({
      key: 'moderation',
      label: 'Модерация',
      icon: ClipboardList,
      count: admin.jobs.filter((job) => ['pending', 'draft'].includes(job.moderationStatus)).length,
    });
  }

  if (admin.can('users')) {
    items.push({ key: 'users', label: 'Пользователи', icon: Users, count: admin.users.length });
  }

  if (admin.can('interviews')) {
    items.push({
      key: 'interviews',
      label: 'Elite HR',
      icon: BadgeCheck,
      count: admin.interviews.filter((candidate) => candidate.interviewRequired).length,
    });
  }

  if (admin.can('auditLog')) {
    items.push({
      key: 'auditLog',
      label: 'Журнал',
      icon: ShieldCheck,
      count: admin.actions.length,
    });
  }

  return items;
});

const stats = computed(() => admin.overview?.stats);
const pendingJobs = computed(() =>
  admin.jobs.filter((job) => ['pending', 'draft'].includes(job.moderationStatus)),
);
const blockedUsers = computed(() => admin.users.filter((user) => user.status === 'blocked'));
const interviewQueue = computed(() =>
  admin.interviews.filter((candidate) => candidate.interviewRequired && !candidate.interviewPassed),
);
const visibleModerationJobs = computed(() =>
  admin.jobs.slice(0, moderationPage.value * moderationPageSize),
);
const hasMoreModerationJobs = computed(
  () => visibleModerationJobs.value.length < admin.jobs.length,
);
const visibleUsers = computed(() => admin.users.slice(0, usersPage.value * usersPageSize));
const hasMoreUsers = computed(() => visibleUsers.value.length < admin.users.length);
const visibleInterviews = computed(() =>
  admin.interviews.slice(0, interviewPage.value * interviewPageSize),
);
const hasMoreInterviews = computed(() => visibleInterviews.value.length < admin.interviews.length);
const visibleActions = computed(() => admin.actions.slice(0, auditPage.value * auditPageSize));
const hasMoreActions = computed(() => visibleActions.value.length < admin.actions.length);

const statCards = computed(() => {
  const cards = [
    {
      title: 'Пользователи',
      value: stats.value?.totalUsers ?? 0,
      detail: `${stats.value?.activeUsers ?? 0} активных`,
      icon: Users,
    },
    {
      title: 'Споры',
      value: stats.value?.openDisputes ?? 0,
      detail: 'требуют решения',
      icon: Scale,
    },
    {
      title: 'Модерация',
      value: stats.value?.pendingJobs ?? 0,
      detail: 'заказов в очереди',
      icon: ClipboardList,
    },
    {
      title: 'На удержании',
      value: formatAmount(stats.value?.escrowHeldAmount ?? 0),
      detail: `${stats.value?.activeOrders ?? 0} активных заказов`,
      icon: WalletCards,
    },
  ];

  if (admin.can('interviews')) {
    cards.splice(3, 0, {
      title: 'Elite HR',
      value: stats.value?.interviewRequests ?? 0,
      detail: 'ожидают интервью',
      icon: BadgeCheck,
    });
  }

  return cards;
});

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  if (!hasAdminAccess.value) {
    return;
  }

  await admin.load(auth.accessToken);
  moderationPage.value = 1;
  usersPage.value = 1;
  interviewPage.value = 1;
  auditPage.value = 1;
};

const requireNote = (value: string | undefined, fallback: string) => {
  const note = value?.trim();

  if (note && note.length >= 10) {
    return note;
  }

  localError.value = fallback;
  return null;
};

const resolveDispute = async (id: string, action: 'refund_customer' | 'pay_performer') => {
  if (!auth.accessToken) {
    return;
  }

  localError.value = null;
  const note = requireNote(
    disputeNotes[id],
    'Для закрытия спора нужен комментарий минимум 10 символов.',
  );

  if (!note) {
    return;
  }

  await admin.resolveDispute(auth.accessToken, id, action, note);
  disputeNotes[id] = '';
};

const moderateJob = async (id: string, action: 'approve' | 'reject') => {
  if (!auth.accessToken) {
    return;
  }

  localError.value = null;
  const note = moderationNotes[id]?.trim();

  await admin.moderateJob(auth.accessToken, id, action, note || undefined);
  moderationNotes[id] = '';
};

const updateUserStatus = async (id: string, status: 'active' | 'blocked') => {
  if (!auth.accessToken) {
    return;
  }

  localError.value = null;
  const note = userNotes[id]?.trim();

  await admin.updateUserStatus(auth.accessToken, id, status, note || undefined);
  userNotes[id] = '';
};

const decideInterview = async (id: string, status: 'passed' | 'failed') => {
  if (!auth.accessToken) {
    return;
  }

  localError.value = null;
  const note = requireNote(
    interviewNotes[id],
    'Для HR-решения нужен комментарий минимум 10 символов.',
  );

  if (!note) {
    return;
  }

  await admin.decideInterview(auth.accessToken, id, status, note);
  interviewNotes[id] = '';
};

const getInterviewState = (candidate: AdminInterviewItem) => {
  if (candidate.interviewPassed) {
    return 'Интервью пройдено';
  }

  if (candidate.interviewRequired) {
    return 'Нужна HR-проверка';
  }

  if (candidate.xp >= candidate.eliteRequiredXp) {
    return 'Можно назначать';
  }

  return 'Копит XP';
};

const getInterviewDetail = (candidate: AdminInterviewItem) => {
  if (candidate.interviewPassed) {
    return 'Финальный барьер Elite уже закрыт.';
  }

  if (candidate.interviewRequired) {
    return 'Исполнитель дошел до порога Elite и ждет решения платформы.';
  }

  return `${Math.max(0, candidate.eliteRequiredXp - candidate.xp)} XP до порога Elite.`;
};

watch(
  tabs,
  (items) => {
    if (!items.some((item) => item.key === activeTab.value)) {
      activeTab.value = items[0]?.key ?? 'overview';
    }
  },
  { immediate: true },
);

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section v-if="!hasAdminAccess" class="grid min-h-[520px] place-items-center text-center">
        <div class="max-w-lg rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8">
          <ShieldCheck class="mx-auto text-ember" :size="42" />
          <h1 class="mt-5 text-4xl font-black tracking-[-0.06em]">Нет доступа</h1>
          <p class="mt-3 text-sm font-semibold leading-6 text-ink/65">
            Этот раздел открыт только для администратора.
          </p>
          <RouterLink
            class="mt-6 inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            to="/dashboard"
          >
            Вернуться в центр
          </RouterLink>
        </div>
      </section>

      <template v-else>
        <header class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <span class="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
                <ShieldCheck :size="28" />
              </span>
              <span
                class="rounded-full border border-paper/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-paper/70"
              >
                {{ formatSystemLabel(auth.user?.role) }}
              </span>
            </div>
            <p class="mt-7 text-sm font-black uppercase tracking-[0.2em] text-paper/55">
              Fastik operations
            </p>
            <h1
              class="mt-3 text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
            >
              Админка без хаоса.
            </h1>
            <p class="mt-5 text-sm font-semibold leading-6 text-paper/68">
              Споры, модерация, пользователи и журнал действий собраны в одном узком экране. Это
              операционный слой платформы, а не отдельная “витрина кнопок”.
            </p>
          </aside>

          <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article
              v-for="card in statCards"
              :key="card.title"
              class="rounded-[1.25rem] border border-line bg-[#fffaf0] p-4 transition hover:border-ink hover:bg-white"
            >
              <div class="flex items-center justify-between gap-3">
                <span
                  class="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-paper"
                >
                  <component :is="card.icon" :size="21" />
                </span>
                <p class="text-right text-2xl font-black tracking-[-0.05em]">{{ card.value }}</p>
              </div>
              <p class="mt-4 text-sm font-black uppercase tracking-[0.14em] text-ink/50">
                {{ card.title }}
              </p>
              <p class="mt-1 text-sm font-semibold text-ink/65">{{ card.detail }}</p>
            </article>
          </section>
        </header>

        <div class="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition"
            :class="
              activeTab === tab.key
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-[#fffaf0] text-ink/65 hover:border-ink hover:text-ink'
            "
            type="button"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
            <span v-if="typeof tab.count === 'number'" class="text-xs opacity-70">{{
              tab.count
            }}</span>
          </button>
        </div>

        <div v-if="admin.isLoading" class="mt-5 grid min-h-[360px] place-items-center">
          <span
            class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
          >
            <Loader2 class="animate-spin" :size="20" />
            Загружаем операционную панель
          </span>
        </div>

        <p
          v-if="admin.error || localError"
          class="mt-5 rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-black text-ember"
        >
          {{ localError || admin.error }}
        </p>

        <section v-if="!admin.isLoading" class="mt-5">
          <div v-if="activeTab === 'overview'" class="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Следующие действия
              </p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Операционный фокус</h2>
              <div class="mt-5 grid gap-3">
                <button
                  v-if="admin.can('disputes')"
                  class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-ink hover:bg-white"
                  type="button"
                  @click="activeTab = 'disputes'"
                >
                  <span>
                    <span class="block font-black">Закрыть открытые споры</span>
                    <span class="mt-1 block text-sm font-semibold text-ink/62">
                      Деньги на удержании не должны висеть без решения.
                    </span>
                  </span>
                  <span class="text-2xl font-black">{{ admin.disputes.length }}</span>
                </button>
                <button
                  v-if="admin.can('moderation')"
                  class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-ink hover:bg-white"
                  type="button"
                  @click="activeTab = 'moderation'"
                >
                  <span>
                    <span class="block font-black">Проверить публикации</span>
                    <span class="mt-1 block text-sm font-semibold text-ink/62">
                      Очередь модерации держит биржу чистой.
                    </span>
                  </span>
                  <span class="text-2xl font-black">{{ pendingJobs.length }}</span>
                </button>
                <button
                  v-if="admin.can('users')"
                  class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-ink hover:bg-white"
                  type="button"
                  @click="activeTab = 'users'"
                >
                  <span>
                    <span class="block font-black">Контроль пользователей</span>
                    <span class="mt-1 block text-sm font-semibold text-ink/62">
                      Блокировки и роли видны в одном списке.
                    </span>
                  </span>
                  <span class="text-2xl font-black">{{ blockedUsers.length }}</span>
                </button>
                <button
                  v-if="admin.can('interviews')"
                  class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-ink hover:bg-white"
                  type="button"
                  @click="activeTab = 'interviews'"
                >
                  <span>
                    <span class="block font-black">Провести Elite HR</span>
                    <span class="mt-1 block text-sm font-semibold text-ink/62">
                      Финальный уровень требует ручного решения платформы.
                    </span>
                  </span>
                  <span class="text-2xl font-black">{{ interviewQueue.length }}</span>
                </button>
              </div>
            </article>

            <article class="rounded-[1.5rem] border border-ink bg-paper p-5 sm:p-6">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Последние действия
              </p>
              <div class="mt-4 space-y-3">
                <article
                  v-for="action in admin.overview?.recentActions ?? []"
                  :key="action.id"
                  class="rounded-2xl border border-line bg-[#fffaf0] p-4"
                >
                  <p class="font-black">{{ formatSystemLabel(action.action) }}</p>
                  <p class="mt-1 text-xs font-bold text-ink/55">
                    {{ action.actorName || 'Система' }} · {{ formatDateTime(action.createdAt) }}
                  </p>
                  <p v-if="action.note" class="mt-2 text-sm font-semibold leading-5 text-ink/65">
                    {{ action.note }}
                  </p>
                </article>
                <p
                  v-if="!(admin.overview?.recentActions.length ?? 0)"
                  class="rounded-2xl border border-line bg-[#fffaf0] p-4 text-sm font-bold text-ink/55"
                >
                  Журнал пока пуст. Первые действия появятся после модерации или решения спора.
                </p>
              </div>
            </article>
          </div>

          <div v-else-if="activeTab === 'disputes'" class="space-y-4">
            <article
              v-for="dispute in admin.disputes"
              :key="dispute.id"
              class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <p
                    class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-ember"
                  >
                    <AlertTriangle :size="16" /> Спор · {{ formatDateTime(dispute.disputedAt) }}
                  </p>
                  <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                    {{ formatDisplayText(dispute.title) }}
                  </h2>
                  <p class="mt-3 text-sm font-semibold leading-6 text-ink/68">
                    Заказчик: {{ dispute.customerName }} · Исполнитель:
                    {{ dispute.performerName }} · Гарант:
                    {{ formatSystemLabel(dispute.escrowStatus) }}
                  </p>
                  <p
                    v-if="dispute.disputeReason"
                    class="mt-3 text-sm font-semibold leading-6 text-ink/72"
                  >
                    {{ dispute.disputeReason }}
                  </p>
                </div>
                <div class="rounded-2xl border border-line bg-paper px-4 py-3 text-right">
                  <p class="text-xl font-black text-bolt">{{ formatAmount(dispute.amount) }}</p>
                  <p class="mt-1 text-xs font-bold text-ink/55">на удержании</p>
                </div>
              </div>

              <textarea
                v-model="disputeNotes[dispute.id]"
                class="mt-5 min-h-24 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none transition focus:border-ink"
                placeholder="Комментарий решения: что проверили и почему закрываем спор именно так"
              />
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-white disabled:opacity-50"
                  type="button"
                  :disabled="admin.isSaving"
                  @click="resolveDispute(dispute.id, 'refund_customer')"
                >
                  <X :size="18" />
                  Вернуть заказчику
                </button>
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-moss px-5 py-3 font-black text-paper transition hover:bg-ink disabled:opacity-50"
                  type="button"
                  :disabled="admin.isSaving"
                  @click="resolveDispute(dispute.id, 'pay_performer')"
                >
                  <Check :size="18" />
                  Выплатить исполнителю
                </button>
              </div>
            </article>
            <p
              v-if="!admin.disputes.length"
              class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center text-xl font-black"
            >
              Открытых споров нет
            </p>
          </div>

          <div v-else-if="activeTab === 'moderation'" class="space-y-4">
            <article
              v-for="job in visibleModerationJobs"
              :key="job.id"
              class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/50">
                    {{ formatSystemLabel(job.moderationStatus) }} ·
                    {{ formatDateTime(job.createdAt) }}
                  </p>
                  <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                    {{ formatDisplayText(job.title) }}
                  </h2>
                  <p class="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-ink/68">
                    {{ job.description }}
                  </p>
                  <p class="mt-3 text-sm font-bold text-ink/55">
                    {{ job.customerName }} · {{ job.categoryName || 'Без категории' }} ·
                    {{ formatSystemLabel(job.status) }}
                  </p>
                </div>
                <div class="rounded-2xl border border-line bg-paper px-4 py-3 text-right">
                  <p class="text-sm font-black text-bolt">
                    {{ formatMoney(job.budgetMin, job.budgetMax) }}
                  </p>
                  <p class="mt-1 text-xs font-bold text-ink/55">
                    {{ job.applicationsCount }} откликов
                  </p>
                </div>
              </div>

              <div v-if="job.moderationStatus !== 'approved'" class="mt-5">
                <textarea
                  v-model="moderationNotes[job.id]"
                  class="min-h-20 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none transition focus:border-ink"
                  placeholder="Комментарий модерации, если нужно"
                />
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-white disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving"
                    @click="moderateJob(job.id, 'reject')"
                  >
                    <Ban :size="18" />
                    Отклонить
                  </button>
                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving"
                    @click="moderateJob(job.id, 'approve')"
                  >
                    <Check :size="18" />
                    Одобрить
                  </button>
                </div>
              </div>
              <p
                v-else
                class="mt-5 rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-black text-ink/55"
              >
                Проверено. Действия скрыты, чтобы не перегружать список.
              </p>
            </article>
            <button
              v-if="hasMoreModerationJobs"
              class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
              type="button"
              @click="moderationPage += 1"
            >
              Показать еще заказы
            </button>
          </div>

          <div v-else-if="activeTab === 'users'" class="space-y-3">
            <article
              v-for="user in visibleUsers"
              :key="user.id"
              class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5"
            >
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="truncate text-2xl font-black tracking-[-0.05em]">
                      {{ user.displayName }}
                    </h2>
                    <span
                      class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black"
                    >
                      {{ formatSystemLabel(user.role) }}
                    </span>
                    <span
                      class="rounded-full border px-3 py-1 text-xs font-black"
                      :class="
                        user.status === 'active'
                          ? 'border-moss bg-moss/10 text-moss'
                          : 'border-ember bg-ember/10 text-ember'
                      "
                    >
                      {{ formatSystemLabel(user.status) }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-ink/60">{{ user.email }}</p>
                  <p class="mt-3 text-sm font-semibold leading-6 text-ink/68">
                    Баланс: {{ formatAmount(user.availableBalance) }} · Удержано:
                    {{ formatAmount(user.heldBalance) }} · Создан:
                    {{ formatDateTime(user.createdAt) }}
                  </p>
                  <p v-if="user.performerLevelTitle" class="mt-1 text-sm font-bold text-bolt">
                    {{ user.performerLevelTitle }} · {{ user.performerXp }} XP
                  </p>
                </div>
                <div class="space-y-3">
                  <textarea
                    v-model="userNotes[user.id]"
                    class="min-h-20 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-semibold outline-none transition focus:border-ink"
                    placeholder="Причина изменения статуса"
                  />
                  <button
                    v-if="user.status === 'active'"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-3 font-black transition hover:bg-white disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving || auth.user?.id === user.id"
                    @click="updateUserStatus(user.id, 'blocked')"
                  >
                    <Ban :size="17" />
                    Заблокировать
                  </button>
                  <button
                    v-else
                    class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-moss px-4 py-3 font-black text-paper transition hover:bg-ink disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving"
                    @click="updateUserStatus(user.id, 'active')"
                  >
                    <Check :size="17" />
                    Активировать
                  </button>
                </div>
              </div>
            </article>
            <button
              v-if="hasMoreUsers"
              class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
              type="button"
              @click="usersPage += 1"
            >
              Показать еще пользователей
            </button>
          </div>

          <div v-else-if="activeTab === 'interviews'" class="space-y-4">
            <article class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
              <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.2em] text-paper/55">
                    Elite HR
                  </p>
                  <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                    Финальная проверка доверия
                  </h2>
                  <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
                    Админ фиксирует итог онлайн-интервью. Решение сразу влияет на путь роста
                    исполнителя, уведомления и журнал действий.
                  </p>
                </div>
                <div class="rounded-2xl border border-paper/20 px-4 py-3 text-right">
                  <p class="text-3xl font-black">{{ interviewQueue.length }}</p>
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-paper/55">
                    ждут решения
                  </p>
                </div>
              </div>
            </article>

            <article
              v-for="candidate in visibleInterviews"
              :key="candidate.userId"
              class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
            >
              <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="truncate text-3xl font-black tracking-[-0.06em]">
                      {{ candidate.displayName }}
                    </h2>
                    <span
                      class="rounded-full border px-3 py-1 text-xs font-black"
                      :class="
                        candidate.interviewPassed
                          ? 'border-moss bg-moss/10 text-moss'
                          : candidate.interviewRequired
                            ? 'border-ember bg-ember/10 text-ember'
                            : 'border-line bg-paper text-ink/60'
                      "
                    >
                      {{ getInterviewState(candidate) }}
                    </span>
                  </div>

                  <p class="mt-2 text-sm font-semibold text-ink/60">
                    {{ candidate.email }}
                  </p>
                  <p class="mt-4 text-sm font-semibold leading-6 text-ink/70">
                    {{ candidate.headline || 'Позиционирование пока не заполнено' }}
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink/55">
                    {{ candidate.specialization || 'Специализация не указана' }}
                  </p>

                  <div class="mt-5 grid gap-3 sm:grid-cols-4">
                    <div class="rounded-2xl border border-line bg-paper px-4 py-3">
                      <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">XP</p>
                      <p class="mt-1 text-xl font-black">{{ candidate.xp }}</p>
                    </div>
                    <div class="rounded-2xl border border-line bg-paper px-4 py-3">
                      <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                        Уровень
                      </p>
                      <p class="mt-1 truncate text-xl font-black">
                        {{ candidate.levelTitle || 'Новичок' }}
                      </p>
                    </div>
                    <div class="rounded-2xl border border-line bg-paper px-4 py-3">
                      <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                        Заказы
                      </p>
                      <p class="mt-1 text-xl font-black">{{ candidate.completedOrders }}</p>
                    </div>
                    <div class="rounded-2xl border border-line bg-paper px-4 py-3">
                      <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                        Рейтинг
                      </p>
                      <p class="mt-1 text-xl font-black">
                        {{ candidate.rating ? candidate.rating.toFixed(1) : 'нет' }}
                      </p>
                    </div>
                  </div>

                  <p
                    class="mt-4 rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-bold text-ink/62"
                  >
                    {{ getInterviewDetail(candidate) }}
                  </p>

                  <p
                    v-if="candidate.latestInterviewAt"
                    class="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-ink/45"
                  >
                    Последнее решение: {{ formatSystemLabel(candidate.latestInterviewStatus) }} ·
                    {{ formatDateTime(candidate.latestInterviewAt) }}
                  </p>
                  <p
                    v-if="candidate.latestInterviewNote"
                    class="mt-2 text-sm font-semibold leading-6 text-ink/65"
                  >
                    {{ candidate.latestInterviewNote }}
                  </p>
                </div>

                <div class="space-y-3">
                  <RouterLink
                    class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-3 font-black transition hover:bg-white"
                    :to="`/performers/${candidate.userId}`"
                  >
                    <Users :size="17" />
                    Профиль исполнителя
                  </RouterLink>
                  <textarea
                    v-model="interviewNotes[candidate.userId]"
                    class="min-h-28 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-semibold outline-none transition focus:border-ink"
                    placeholder="Итог интервью: что проверили, почему засчитано или что улучшить"
                  />
                  <button
                    class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-moss px-4 py-3 font-black text-paper transition hover:bg-ink disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving"
                    @click="decideInterview(candidate.userId, 'passed')"
                  >
                    <BadgeCheck :size="18" />
                    Интервью пройдено
                  </button>
                  <button
                    class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-3 font-black transition hover:bg-white disabled:opacity-50"
                    type="button"
                    :disabled="admin.isSaving"
                    @click="decideInterview(candidate.userId, 'failed')"
                  >
                    <X :size="18" />
                    Не зачтено
                  </button>
                </div>
              </div>
            </article>

            <p
              v-if="!admin.interviews.length"
              class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center text-xl font-black"
            >
              Исполнителей для HR-проверки пока нет
            </p>
            <button
              v-if="hasMoreInterviews"
              class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
              type="button"
              @click="interviewPage += 1"
            >
              Показать еще исполнителей
            </button>
          </div>

          <div v-else-if="activeTab === 'auditLog'" class="space-y-3">
            <article
              v-for="action in visibleActions"
              :key="action.id"
              class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/50">
                    {{ action.targetType }} · {{ formatDateTime(action.createdAt) }}
                  </p>
                  <h2 class="mt-2 text-2xl font-black tracking-[-0.05em]">
                    {{ formatSystemLabel(action.action) }}
                  </h2>
                  <p class="mt-2 text-sm font-semibold text-ink/60">
                    {{ action.actorName || 'Система' }} · {{ formatSystemLabel(action.actorRole) }}
                  </p>
                </div>
                <RouterLink
                  v-if="action.targetType === 'order' && action.targetId"
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-white"
                  :to="`/orders/${action.targetId}`"
                >
                  <Gavel :size="16" />
                  Открыть заказ
                </RouterLink>
                <RouterLink
                  v-else-if="action.targetType === 'performer' && action.targetId"
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-white"
                  :to="`/performers/${action.targetId}`"
                >
                  <Users :size="16" />
                  Открыть профиль
                </RouterLink>
              </div>
              <p v-if="action.note" class="mt-3 text-sm font-semibold leading-6 text-ink/70">
                {{ action.note }}
              </p>
            </article>
            <button
              v-if="hasMoreActions"
              class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
              type="button"
              @click="auditPage += 1"
            >
              Показать еще события
            </button>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
