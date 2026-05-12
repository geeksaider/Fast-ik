<script setup lang="ts">
import { computed, onMounted, watch, type Component } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Gauge,
  LogIn,
  Medal,
  MessageCircle,
  Rocket,
  ScrollText,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';

const auth = useAuthStore();
const communication = useCommunicationStore();
const route = useRoute();
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
    admin: 'Админ',
  };

  return auth.user ? (map[auth.user.role] ?? 'Пользователь') : 'Гость';
});

const canOpenFinance = computed(
  () => auth.user?.role === 'customer' || auth.user?.role === 'performer',
);

const primaryLinks = computed<NavigationItem[]>(() => {
  if (!auth.isAuthenticated) {
    return [];
  }

  if (auth.user?.role === 'customer') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/orders', label: 'Заказы', icon: ClipboardList },
      { to: '/contests', label: 'Конкурсы', icon: Medal },
      { to: '/performers', label: 'Исполнители', icon: UsersRound },
    ];
  }

  if (auth.user?.role === 'performer') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
      { to: '/orders', label: 'Работа', icon: ClipboardList },
      { to: '/contests', label: 'Конкурсы', icon: Medal },
      { to: '/level-roadmap', label: 'LVL', icon: Trophy },
    ];
  }

  if (auth.user?.role === 'admin') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/admin', label: 'Операции', icon: ShieldCheck },
    ];
  }

  return [{ to: '/dashboard', label: 'Обзор', icon: Gauge }];
});

const mobileLinks = computed<NavigationItem[]>(() => {
  if (!auth.isAuthenticated) {
    return [
      { to: '/', label: 'Главная', icon: Rocket },
      { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
      { to: '/login', label: 'Войти', icon: LogIn },
    ];
  }

  if (auth.user?.role === 'customer') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/orders', label: 'Заказы', icon: ClipboardList },
      { to: '/contests', label: 'Конкурсы', icon: Medal },
      { to: '/performers', label: 'Исполнители', icon: UsersRound },
      { to: '/messages', label: 'Чат', icon: MessageCircle, badge: communication.unreadMessages },
    ];
  }

  if (auth.user?.role === 'performer') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/jobs', label: 'Биржа', icon: BriefcaseBusiness },
      { to: '/orders', label: 'Работа', icon: ClipboardList },
      { to: '/contests', label: 'Конкурсы', icon: Medal },
      { to: '/messages', label: 'Чат', icon: MessageCircle, badge: communication.unreadMessages },
      { to: '/level-roadmap', label: 'LVL', icon: Trophy },
    ];
  }

  if (auth.user?.role === 'admin') {
    return [
      { to: '/dashboard', label: 'Обзор', icon: Gauge },
      { to: '/messages', label: 'Чат', icon: MessageCircle, badge: communication.unreadMessages },
      { to: '/admin', label: 'Операции', icon: ShieldCheck },
    ];
  }

  return [{ to: '/dashboard', label: 'Обзор', icon: Gauge }];
});

const routeMatches = (target: string) => {
  if (target === '/') {
    return route.path === '/';
  }

  if (target === '/jobs') {
    return route.name === 'jobs' || route.name === 'jobs-detail';
  }

  if (target === '/performers') {
    return route.name === 'performers' || route.name === 'performers-detail';
  }

  return route.path === target || route.path.startsWith(`${target}/`);
};

const badgeLabel = (value?: number) => (value && value > 9 ? '9+' : value);
const badgeBase =
  'pointer-events-none grid h-[16px] w-[16px] place-items-center rounded-full bg-ember pt-px text-[9px] font-semibold leading-none text-paper tabular-nums ring-2 ring-paper';
const iconBadgeClass = `${badgeBase} absolute -right-1 -top-1`;
const navBadgeClass =
  'ml-1 grid h-[16px] w-[16px] place-items-center rounded-full bg-ember pt-px text-[9px] font-semibold leading-none text-paper tabular-nums ring-1 ring-ink';
const mobileBadgeClass = `${badgeBase} absolute -right-1 -top-1`;

const syncCounters = async () => {
  if (!auth.accessToken) {
    return;
  }

  await Promise.allSettled([
    communication.loadConversations(auth.accessToken),
    communication.loadNotifications(auth.accessToken),
  ]);
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
      class="mx-auto flex max-w-[1044px] flex-col gap-3 rounded-[1.35rem] border border-ink bg-paper/95 p-2.5 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:rounded-[2rem] lg:p-4"
    >
      <div class="flex items-center justify-between gap-3">
        <RouterLink class="flex items-center gap-3" :to="logoTarget">
          <span
            class="grid h-[38px] w-[38px] place-items-center rounded-2xl border border-ink bg-ink text-paper"
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

        <div class="flex items-center gap-2 lg:hidden">
          <RouterLink
            v-if="auth.isAuthenticated"
            class="grid h-[38px] w-[38px] place-items-center rounded-2xl border border-ink bg-[#fffaf0] text-ink"
            to="/search"
            aria-label="Поиск"
          >
            <Search :size="19" />
          </RouterLink>
          <RouterLink
            v-if="auth.isAuthenticated"
            class="relative grid h-[38px] w-[38px] place-items-center rounded-2xl border border-ink bg-[#fffaf0]"
            to="/notifications"
            aria-label="Уведомления"
          >
            <Bell :size="20" />
            <span v-if="communication.unreadNotifications" :class="iconBadgeClass">{{
              badgeLabel(communication.unreadNotifications)
            }}</span>
          </RouterLink>
          <RouterLink
            v-if="canOpenFinance"
            class="grid h-[38px] w-[38px] place-items-center rounded-2xl border border-ink bg-[#fffaf0]"
            to="/finance"
            aria-label="Финансы"
          >
            <WalletCards :size="19" />
          </RouterLink>
          <RouterLink
            v-if="auth.isAuthenticated"
            class="grid h-[38px] w-[38px] place-items-center rounded-2xl border border-ink bg-ember text-paper"
            :class="routeMatches('/me') ? 'bg-ink' : ''"
            to="/me"
            aria-label="Профиль"
          >
            <UserRound :size="19" />
          </RouterLink>
          <RouterLink
            v-if="!auth.isAuthenticated"
            class="inline-flex h-[38px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-black text-paper transition hover:bg-bolt"
            to="/login"
          >
            <LogIn :size="16" />
            Войти
          </RouterLink>
          <RouterLink
            v-if="!auth.isAuthenticated"
            class="inline-flex h-[38px] items-center gap-2 rounded-full border border-ink bg-[#fffaf0] px-4 text-sm font-black transition hover:bg-white"
            to="/register"
          >
            <ScrollText :size="16" />
            Регистрация
          </RouterLink>
        </div>
      </div>

      <div class="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
        <RouterLink
          v-for="item in primaryLinks"
          :key="item.to"
          class="relative inline-flex h-[38px] items-center gap-2 rounded-full border px-3 text-sm font-black transition duration-200 ease-out"
          :class="
            routeMatches(item.to)
              ? 'border-ink bg-ink text-paper'
              : 'border-transparent text-ink/66 hover:border-ink hover:bg-[#fffaf0] hover:text-ink'
          "
          :to="item.to"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
          <span v-if="item.badge" :class="navBadgeClass">{{ badgeLabel(item.badge) }}</span>
        </RouterLink>
      </div>

      <div class="hidden items-center gap-2 lg:flex">
        <RouterLink
          v-if="auth.isAuthenticated"
          class="grid h-[38px] w-[38px] place-items-center rounded-full border transition duration-200 ease-out"
          :class="
            routeMatches('/search')
              ? 'border-ink bg-ink text-paper hover:bg-ink'
              : 'border-ink bg-[#fffaf0] text-ink hover:bg-white'
          "
          to="/search"
          aria-label="Поиск"
          title="Поиск"
        >
          <Search :size="16" />
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated"
          class="relative grid h-[38px] w-[38px] place-items-center rounded-full border transition duration-200 ease-out"
          :class="
            routeMatches('/notifications')
              ? 'border-ink bg-ink text-paper hover:bg-ink'
              : 'border-ink bg-[#fffaf0] text-ink hover:bg-white'
          "
          to="/notifications"
          aria-label="Уведомления"
          title="Уведомления"
        >
          <Bell :size="17" />
          <span v-if="communication.unreadNotifications" :class="iconBadgeClass">{{
            badgeLabel(communication.unreadNotifications)
          }}</span>
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated"
          class="relative grid h-[38px] w-[38px] place-items-center rounded-full border transition duration-200 ease-out"
          :class="
            routeMatches('/messages')
              ? 'border-ink bg-ink text-paper hover:bg-ink'
              : 'border-ink bg-[#fffaf0] text-ink hover:bg-white'
          "
          to="/messages"
          aria-label="Чат"
          title="Чат"
        >
          <MessageCircle :size="17" />
          <span v-if="communication.unreadMessages" :class="iconBadgeClass">{{
            badgeLabel(communication.unreadMessages)
          }}</span>
        </RouterLink>
        <RouterLink
          v-if="canOpenFinance"
          class="grid h-[38px] w-[38px] place-items-center rounded-full border transition duration-200 ease-out"
          :class="
            routeMatches('/finance')
              ? 'border-ink bg-ink text-paper hover:bg-ink'
              : 'border-ink bg-[#fffaf0] text-ink hover:bg-white'
          "
          to="/finance"
          aria-label="Финансы"
          title="Финансы"
        >
          <WalletCards :size="17" />
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated"
          class="grid h-[38px] w-[38px] place-items-center rounded-full border border-ink bg-ember text-paper transition duration-200 ease-out hover:bg-bolt"
          :class="routeMatches('/me') ? 'bg-ink hover:bg-ink' : ''"
          to="/me"
          aria-label="Профиль"
          title="Профиль"
        >
          <UserRound :size="16" />
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          class="inline-flex h-[38px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-black text-paper transition hover:bg-bolt"
          to="/login"
        >
          <LogIn :size="16" />
          Войти
        </RouterLink>
        <RouterLink
          v-if="!auth.isAuthenticated"
          class="inline-flex h-[38px] items-center gap-2 rounded-full border border-ink bg-[#fffaf0] px-4 text-sm font-black transition hover:bg-white"
          to="/register"
        >
          <ScrollText :size="16" />
          Регистрация
        </RouterLink>
      </div>
    </div>
  </nav>

  <div
    v-if="showNavigation"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper/95 px-2 py-2 backdrop-blur lg:hidden"
  >
    <div
      class="mx-auto grid max-w-md gap-1"
      :class="{
        'grid-cols-3': mobileLinks.length === 3,
        'grid-cols-4': mobileLinks.length === 4,
        'grid-cols-5': mobileLinks.length === 5,
      }"
    >
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
        <span v-if="item.badge" :class="mobileBadgeClass">{{ badgeLabel(item.badge) }}</span>
      </RouterLink>
    </div>
  </div>
</template>
