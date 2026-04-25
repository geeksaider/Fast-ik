<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MessageCircle,
  Plus,
  Sparkles,
  Trophy,
  UserRound,
  WalletCards,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { useLevelsStore } from '../stores/levels';
import { useOrdersStore } from '../stores/orders';
import { useProfileStore } from '../stores/profile';
import { formatAmount } from '../lib/format';

const auth = useAuthStore();
const communication = useCommunicationStore();
const levels = useLevelsStore();
const orders = useOrdersStore();
const profile = useProfileStore();

type HubLink = {
  to: string;
  title: string;
  label?: string;
  text: string;
  icon: Component;
  tone: 'dark' | 'light' | 'ember' | 'moss' | 'bolt';
  badge?: string;
};

const managerRoles = new Set(['support', 'moderator', 'admin', 'super_admin']);

const roleTitle = computed(() => {
  const map: Record<string, string> = {
    customer: 'Заказчик',
    performer: 'Исполнитель',
    support: 'Поддержка',
    moderator: 'Модератор',
    admin: 'Администратор',
    super_admin: 'Суперадмин',
  };

  return auth.user ? (map[auth.user.role] ?? 'Пользователь') : 'Пользователь';
});

const heroTitle = computed(() => {
  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return 'Центр операций';
  }

  return 'Центр Fastik';
});

const profilePercent = computed(() => profile.summary?.progress.percentage ?? 0);
const activeOrders = computed(() =>
  orders.orders.filter((order) => ['in_progress', 'submitted', 'disputed'].includes(order.status)),
);
const escrowAmount = computed(() =>
  activeOrders.value.reduce(
    (sum, order) => sum + (order.escrowStatus === 'held' ? order.amount : 0),
    0,
  ),
);

const heroText = computed(() => {
  if (auth.user?.role === 'customer') {
    return 'Начните с профиля и заказа: дальше Fastik проведет через отклики, выбор исполнителя, гарант, чат и приемку работы.';
  }

  if (auth.user?.role === 'performer') {
    return 'Главная петля исполнителя: профиль, LVL-roadmap, отклики, заказ в работе, сдача результата и рост XP.';
  }

  if (auth.user?.role && managerRoles.has(auth.user.role)) {
    return 'Операционная зона: сейчас доступны пользовательские сценарии, а админские панели будут следующим крупным блоком.';
  }

  return 'Это рабочий центр Fastik: все разделы собраны в одном месте, чтобы не искать их по URL.';
});

const primaryAction = computed(() => {
  if (auth.user?.role === 'customer') {
    return { to: '/jobs/new', label: 'Создать заказ', icon: Plus };
  }

  if (auth.user?.role === 'performer') {
    return { to: '/level-roadmap', label: 'Открыть LVL', icon: Trophy };
  }

  return { to: '/jobs', label: 'Открыть биржу', icon: BriefcaseBusiness };
});

const nextSteps = computed(() => {
  if (auth.user?.role === 'customer') {
    return [
      {
        title: 'Заполнить профиль заказчика',
        text: 'Так будущие заказы выглядят доверительнее.',
        to: '/onboarding',
        done: profilePercent.value >= 75,
      },
      {
        title: 'Создать заказ',
        text: 'Опишите задачу, бюджет и сроки.',
        to: '/jobs/new',
        done: orders.orders.length > 0,
      },
      {
        title: 'Выбрать исполнителя',
        text: 'После выбора включится мок-гарант и рабочий чат.',
        to: '/jobs',
        done: activeOrders.value.length > 0,
      },
    ];
  }

  if (auth.user?.role === 'performer') {
    return [
      {
        title: 'Усилить профиль',
        text: 'Навыки, портфолио и условия работы дают стартовый XP.',
        to: '/onboarding',
        done: profilePercent.value >= 80,
      },
      {
        title: 'Проверить дорогу к славе',
        text: 'Roadmap показывает, что именно мешает следующему уровню.',
        to: '/level-roadmap',
        done: Boolean(
          levels.summary?.currentLevel.code && levels.summary.currentLevel.code !== 'newcomer',
        ),
      },
      {
        title: 'Откликнуться на заказ',
        text: 'Каждый реальный отклик попадает в XP-журнал.',
        to: '/jobs',
        done: Boolean(levels.summary?.events.some((event) => event.type === 'application_sent')),
      },
    ];
  }

  return [
    {
      title: 'Проверить пользовательский flow',
      text: 'Биржа, заказы, гарант и чат уже связаны в один сценарий.',
      to: '/jobs',
      done: true,
    },
    {
      title: 'Открыть споры в заказах',
      text: 'Это подготовка к админке и support-панели.',
      to: '/orders',
      done: activeOrders.value.some((order) => order.status === 'disputed'),
    },
    {
      title: 'Следующий блок: админка',
      text: 'Пользователи, модерация, споры, роли и audit-log.',
      to: '/orders',
      done: false,
    },
  ];
});

const hubLinks = computed<HubLink[]>(() => {
  const links: HubLink[] = [
    {
      to: '/onboarding',
      title: 'Профиль',
      label: `${profilePercent.value}%`,
      text: 'Анкета, навыки, портфолио и базовый onboarding.',
      icon: UserRound,
      tone: 'light',
    },
    {
      to: '/jobs',
      title: 'Биржа',
      text: 'Список заказов, фильтры, отклики и публикация задач.',
      icon: BriefcaseBusiness,
      tone: 'dark',
    },
    {
      to: '/orders',
      title: 'Заказы',
      label: activeOrders.value.length ? `${activeOrders.value.length} акт.` : undefined,
      text: 'Статусы, сдача результата, приемка, отмена и спор.',
      icon: ClipboardList,
      tone: 'ember',
    },
    {
      to: '/messages',
      title: 'Чат',
      label: communication.unreadMessages ? `${communication.unreadMessages} нов.` : undefined,
      text: 'Рабочие диалоги появляются после выбора исполнителя.',
      icon: MessageCircle,
      tone: 'bolt',
    },
    {
      to: '/finance',
      title: 'Финансы',
      label: escrowAmount.value ? formatAmount(escrowAmount.value) : undefined,
      text: 'Мок-кошелек, пополнение, удержания гаранта и транзакции.',
      icon: WalletCards,
      tone: 'moss',
    },
    {
      to: '/notifications',
      title: 'События',
      label: communication.unreadNotifications
        ? `${communication.unreadNotifications} нов.`
        : undefined,
      text: 'Отклики, сообщения, статусы заказов и изменения уровня.',
      icon: Bell,
      tone: 'light',
    },
  ];

  if (auth.user?.role === 'performer') {
    links.splice(2, 0, {
      to: '/level-roadmap',
      title: 'LVL-roadmap',
      label: levels.summary?.currentLevel.title ?? 'уровни',
      text: 'XP, требования уровней, история действий и Elite-интервью.',
      icon: Trophy,
      tone: 'dark',
    });
  }

  if (auth.user?.role === 'customer' || (auth.user?.role && managerRoles.has(auth.user.role))) {
    links.splice(2, 0, {
      to: '/jobs/new',
      title: 'Новый заказ',
      label: 'создать',
      text: 'Быстрый вход в публикацию задачи для исполнителей.',
      icon: Plus,
      tone: 'ember',
    });
  }

  return links;
});

const loadDashboard = async () => {
  if (!auth.accessToken) {
    return;
  }

  await Promise.allSettled([
    communication.loadConversations(auth.accessToken),
    communication.loadNotifications(auth.accessToken),
    profile.load(auth.accessToken),
    orders.load(auth.accessToken),
    auth.user?.role === 'performer' ? levels.load(auth.accessToken) : Promise.resolve(),
  ]);
};

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section class="grid min-w-0 gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside class="min-w-0 rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-7">
          <div class="flex items-start justify-between gap-4">
            <div class="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
              <Gauge :size="28" />
            </div>
            <span
              class="rounded-full border border-paper/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
            >
              {{ roleTitle }}
            </span>
          </div>

          <p class="mt-7 text-sm font-black uppercase tracking-[0.2em] text-paper/55">
            Центр управления
          </p>
          <h1
            class="mt-3 break-words text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            {{ heroTitle }}
          </h1>
          <p class="mt-2 text-sm font-black text-paper/48">{{ auth.user?.displayName }}</p>
          <p class="mt-5 text-sm font-semibold leading-6 text-paper/68">{{ heroText }}</p>

          <RouterLink
            class="mt-7 inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
            :to="primaryAction.to"
          >
            <component :is="primaryAction.icon" :size="18" />
            <span class="truncate">{{ primaryAction.label }}</span>
          </RouterLink>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-paper/45">Профиль</p>
              <p class="mt-1 text-2xl font-black">{{ profilePercent }}%</p>
            </div>
            <div class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
              <p class="text-xs font-black uppercase tracking-[0.16em] text-paper/45">Заказы</p>
              <p class="mt-1 text-2xl font-black">{{ activeOrders.length }}</p>
            </div>
          </div>
        </aside>

        <section class="grid min-w-0 gap-4">
          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
                  Что делать дальше
                </p>
                <h2 class="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">
                  Сценарий без поиска
                </h2>
              </div>
              <span
                class="inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black"
              >
                <Sparkles :size="16" />
                {{ auth.user?.email }}
              </span>
            </div>

            <div class="mt-5 grid gap-3 md:grid-cols-3">
              <RouterLink
                v-for="step in nextSteps"
                :key="step.title"
                class="rounded-2xl border border-line bg-paper p-4 transition hover:-translate-y-1 hover:border-ink hover:bg-white"
                :to="step.to"
              >
                <div class="flex items-start justify-between gap-3">
                  <span>
                    <span class="block font-black">{{ step.title }}</span>
                    <span class="mt-2 block text-sm font-semibold leading-5 text-ink/65">
                      {{ step.text }}
                    </span>
                  </span>
                  <CheckCircle2
                    :class="step.done ? 'text-moss' : 'text-ink/25'"
                    :size="22"
                    class="shrink-0"
                  />
                </div>
              </RouterLink>
            </div>
          </article>

          <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Разделы</p>
                <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Куда перейти</h2>
              </div>
              <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
                {{ hubLinks.length }}
              </span>
            </div>

            <div class="mt-4 grid gap-2">
              <RouterLink
                v-for="link in hubLinks"
                :key="link.to"
                class="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 transition hover:-translate-y-0.5 hover:border-ink hover:bg-white"
                :to="link.to"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-[#fffaf0]"
                >
                  <component :is="link.icon" :size="22" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-black tracking-[-0.03em]">{{ link.title }}</span>
                  <span class="mt-1 block truncate text-sm font-semibold text-ink/60">
                    {{ link.text }}
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2">
                  <span
                    v-if="link.label"
                    class="max-w-24 truncate rounded-full border border-line bg-[#fffaf0] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-ink/62"
                  >
                    {{ link.label }}
                  </span>
                  <ArrowRight :size="16" class="transition group-hover:translate-x-1" />
                </span>
              </RouterLink>
            </div>
          </section>
        </section>
      </section>
    </section>
  </main>
</template>
