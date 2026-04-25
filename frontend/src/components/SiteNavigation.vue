<script setup lang="ts">
import { computed, onMounted, watch, type Component } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Gauge,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Rocket,
  ScrollText,
  Trophy,
  UserRound,
  WalletCards,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';

const auth = useAuthStore();
const communication = useCommunicationStore();
const route = useRoute();
const router = useRouter();

type NavigationItem = {
  to: string;
  label: string;
  icon: Component;
  badge?: number;
};

const hiddenRoutes = new Set(['login', 'register']);
const showNavigation = computed(() => !hiddenRoutes.has(String(route.name ?? '')));
const logoTarget = computed(() => (auth.isAuthenticated ? '/dashboard' : '/'));

const roleTitle = computed(() => {
  const map: Record<string, string> = {
    customer: 'Заказчик',
    performer: 'Исполнитель',
    support: 'Поддержка',
    moderator: 'Модератор',
    admin: 'Админ',
    super_admin: 'Суперадмин',
  };

  return auth.user ? (map[auth.user.role] ?? 'Пользователь') : 'Гость';
});

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);
const canCreateJob = computed(
  () =>
    auth.user?.role === 'customer' || Boolean(auth.user?.role && managerRoles.has(auth.user.role)),
);

const primaryLinks = computed<NavigationItem[]>(() => {
  const links: NavigationItem[] = [
    { to: '/', label: 'Главная', icon: Rocket },
    { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
  ];

  if (!auth.isAuthenticated) {
    return links;
  }

  return [
    { to: '/dashboard', label: 'Центр', icon: Gauge },
    { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
    { to: '/orders', label: 'Заказы', icon: ClipboardList },
    { to: '/messages', label: 'Чат', icon: MessageCircle, badge: communication.unreadMessages },
    auth.user?.role === 'performer'
      ? { to: '/level-roadmap', label: 'LVL', icon: Trophy }
      : { to: '/onboarding', label: 'Профиль', icon: UserRound },
  ];
});

const mobileLinks = computed<NavigationItem[]>(() => {
  if (!auth.isAuthenticated) {
    return [
      { to: '/', label: 'Главная', icon: Rocket },
      { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
      { to: '/login', label: 'Войти', icon: LogIn },
    ];
  }

  return [
    { to: '/dashboard', label: 'Центр', icon: Gauge },
    { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
    { to: '/orders', label: 'Заказы', icon: ClipboardList },
    { to: '/messages', label: 'Чат', icon: MessageCircle, badge: communication.unreadMessages },
    {
      to: auth.user?.role === 'performer' ? '/level-roadmap' : '/onboarding',
      label: auth.user?.role === 'performer' ? 'LVL' : 'Профиль',
      icon: auth.user?.role === 'performer' ? Trophy : UserRound,
    },
  ];
});

const routeMatches = (target: string) => {
  if (target === '/') {
    return route.path === '/';
  }

  if (target === '/jobs') {
    return route.name === 'jobs' || route.name === 'jobs-detail';
  }

  return route.path === target || route.path.startsWith(`${target}/`);
};

const createJobActive = computed(() => route.name === 'jobs-new');

const syncCounters = async () => {
  if (!auth.accessToken) {
    return;
  }

  await Promise.allSettled([
    communication.loadConversations(auth.accessToken),
    communication.loadNotifications(auth.accessToken),
  ]);
};

const logout = async () => {
  auth.logout();
  await router.push('/');
};

watch(
  () => auth.accessToken,
  () => {
    void syncCounters();
  },
);

onMounted(() => {
  void syncCounters();
});
</script>

<template>
  <nav
    v-if="showNavigation"
    class="sticky top-0 z-40 px-3 pt-3 text-ink sm:px-5 lg:px-8"
    aria-label="Основная навигация"
  >
    <div
      class="mx-auto flex max-w-[1044px] flex-col gap-3 rounded-[1.35rem] border border-ink bg-paper/95 p-2.5 backdrop-blur md:flex-row md:items-center md:justify-between md:rounded-[2rem] md:p-4"
    >
      <div class="flex items-center justify-between gap-3">
        <RouterLink class="flex items-center gap-3" :to="logoTarget">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="24" stroke-width="2.7" />
          </span>
          <span>
            <span class="block font-display text-xl font-black uppercase tracking-[-0.05em]">
              Fastik
            </span>
            <span class="block text-[11px] font-black uppercase tracking-[0.22em] text-ink/55">
              {{ roleTitle }}
            </span>
          </span>
        </RouterLink>

        <div class="flex items-center gap-2 md:hidden">
          <RouterLink
            v-if="auth.isAuthenticated"
            class="relative grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-[#fffaf0]"
            to="/notifications"
            aria-label="Уведомления"
          >
            <Bell :size="20" />
            <span
              v-if="communication.unreadNotifications"
              class="absolute -right-1 -top-1 min-w-5 rounded-full border border-ink bg-ember px-1 text-center text-[10px] font-black text-paper"
            >
              {{ communication.unreadNotifications }}
            </span>
          </RouterLink>
          <button
            v-if="auth.isAuthenticated"
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
            type="button"
            aria-label="Выйти"
            @click="logout"
          >
            <LogOut :size="19" />
          </button>
        </div>
      </div>

      <div class="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
        <RouterLink
          v-for="item in primaryLinks"
          :key="item.to"
          class="relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition duration-200 ease-out"
          :class="
            routeMatches(item.to)
              ? 'border-ink bg-ink text-paper'
              : 'border-transparent text-ink/66 hover:border-ink hover:bg-[#fffaf0] hover:text-ink'
          "
          :to="item.to"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
          <span
            v-if="item.badge"
            class="ml-1 min-w-5 rounded-full border border-ink bg-ember px-1 text-center text-[10px] font-black text-paper"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <RouterLink
          v-if="auth.isAuthenticated"
          class="relative grid h-10 w-10 place-items-center rounded-full border border-ink bg-[#fffaf0] transition duration-200 ease-out hover:bg-white"
          :class="routeMatches('/notifications') ? 'bg-ink text-paper hover:bg-ink' : ''"
          to="/notifications"
          aria-label="Уведомления"
        >
          <Bell :size="17" />
          <span
            v-if="communication.unreadNotifications"
            class="absolute -right-1 -top-1 min-w-5 rounded-full border border-ink bg-ember px-1 text-center text-[10px] font-black text-paper"
          >
            {{ communication.unreadNotifications }}
          </span>
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated"
          class="grid h-10 w-10 place-items-center rounded-full border border-ink bg-[#fffaf0] transition duration-200 ease-out hover:bg-white"
          :class="routeMatches('/finance') ? 'bg-ink text-paper hover:bg-ink' : ''"
          to="/finance"
          aria-label="Финансы"
        >
          <WalletCards :size="17" />
        </RouterLink>
        <RouterLink
          v-if="canCreateJob"
          class="inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-black transition duration-200 ease-out hover:bg-bolt"
          :class="createJobActive ? 'bg-ink text-paper' : 'bg-ember text-paper'"
          to="/jobs/new"
        >
          <Plus :size="16" />
          Заказ
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          class="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
          to="/login"
        >
          <LogIn :size="16" />
          Войти
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          class="inline-flex items-center gap-2 rounded-full border border-ink bg-[#fffaf0] px-4 py-2 text-sm font-black transition hover:bg-white"
          to="/register"
        >
          <ScrollText :size="16" />
          Регистрация
        </RouterLink>
        <button
          v-if="auth.isAuthenticated"
          class="grid h-10 w-10 place-items-center rounded-full border border-ink bg-[#fffaf0] transition duration-200 ease-out hover:bg-ink hover:text-paper"
          type="button"
          aria-label="Выйти"
          @click="logout"
        >
          <LogOut :size="16" />
        </button>
      </div>
    </div>
  </nav>

  <div
    v-if="showNavigation"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper/95 px-2 py-2 backdrop-blur md:hidden"
  >
    <div class="mx-auto grid max-w-md grid-cols-5 gap-1">
      <RouterLink
        v-for="item in mobileLinks"
        :key="item.to"
        class="relative flex flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-black transition"
        :class="
          routeMatches(item.to)
            ? 'border-ink bg-ink text-paper'
            : 'border-transparent text-ink/65 hover:border-line hover:bg-[#fffaf0]'
        "
        :to="item.to"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="absolute right-2 top-1 min-w-5 rounded-full border border-ink bg-ember px-1 text-center text-[10px] font-black text-paper"
        >
          {{ item.badge }}
        </span>
      </RouterLink>
    </div>
  </div>

  <RouterLink
    v-if="showNavigation && canCreateJob"
    class="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl border border-ink bg-ember text-paper md:hidden"
    to="/jobs/new"
    aria-label="Создать заказ"
  >
    <Plus :size="24" />
  </RouterLink>
</template>
