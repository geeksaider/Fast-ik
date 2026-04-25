<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Flag,
  Gauge,
  MessageCircle,
  Plus,
  ShieldCheck,
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
  label: string;
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
    return { to: '/level-roadmap', label: 'Открыть LVL-roadmap', icon: Trophy };
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
      label: 'market',
      text: 'Список заказов, фильтры, отклики и публикация задач.',
      icon: BriefcaseBusiness,
      tone: 'dark',
    },
    {
      to: '/orders',
      title: 'Заказы',
      label: `${activeOrders.value.length} активных`,
      text: 'Статусы, сдача результата, приемка, отмена и спор.',
      icon: ClipboardList,
      tone: 'ember',
    },
    {
      to: '/messages',
      title: 'Чат',
      label: `${communication.unreadMessages} новых`,
      text: 'Рабочие диалоги появляются после выбора исполнителя.',
      icon: MessageCircle,
      tone: 'bolt',
    },
    {
      to: '/finance',
      title: 'Финансы',
      label: formatAmount(escrowAmount.value),
      text: 'Мок-кошелек, пополнение, удержания гаранта и транзакции.',
      icon: WalletCards,
      tone: 'moss',
    },
    {
      to: '/notifications',
      title: 'События',
      label: `${communication.unreadNotifications} новых`,
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
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section class="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-7">
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
          <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            {{ auth.user?.displayName }}
          </h1>
          <p class="mt-5 text-sm font-semibold leading-6 text-paper/68">{{ heroText }}</p>

          <RouterLink
            class="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
            :to="primaryAction.to"
          >
            <component :is="primaryAction.icon" :size="18" />
            {{ primaryAction.label }}
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

        <section class="grid gap-4">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
                  Что делать дальше
                </p>
                <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">Сценарий без поиска</h2>
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

          <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <RouterLink
              v-for="link in hubLinks"
              :key="link.to"
              class="group rounded-[1.35rem] border border-ink p-5 transition hover:-translate-y-1"
              :class="[
                link.tone === 'dark'
                  ? 'bg-ink text-paper hover:bg-bolt'
                  : link.tone === 'ember'
                    ? 'bg-ember text-paper hover:bg-bolt'
                    : link.tone === 'moss'
                      ? 'bg-moss text-paper hover:bg-ink'
                      : 'bg-[#fffaf0] text-ink hover:bg-white',
              ]"
              :to="link.to"
            >
              <div class="flex items-start justify-between gap-4">
                <component :is="link.icon" :size="28" />
                <span
                  class="rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]"
                  :class="
                    link.tone === 'light' ? 'border-line bg-paper text-ink/65' : 'border-paper/30'
                  "
                >
                  {{ link.label }}
                </span>
              </div>
              <h3 class="mt-5 text-2xl font-black tracking-[-0.05em]">{{ link.title }}</h3>
              <p
                class="mt-3 text-sm font-semibold leading-6"
                :class="link.tone === 'light' ? 'text-ink/68' : 'text-paper/72'"
              >
                {{ link.text }}
              </p>
              <span class="mt-5 inline-flex items-center gap-2 text-sm font-black">
                Открыть
                <ArrowRight :size="16" class="transition group-hover:translate-x-1" />
              </span>
            </RouterLink>
          </section>
        </section>
      </section>

      <section class="mt-5 grid gap-4 border-t border-ink pt-5 md:grid-cols-3">
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <ShieldCheck class="mb-3 text-moss" :size="24" />
          <p class="font-black">Гарант</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">
            Деньги моковые, но lifecycle похож на реальную платформу: hold, release, refund.
          </p>
        </article>
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <Flag class="mb-3 text-ember" :size="24" />
          <p class="font-black">Споры</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">
            Спор можно открыть в заказе; админское решение станет следующим блоком.
          </p>
        </article>
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <BadgeCheck class="mb-3 text-bolt" :size="24" />
          <p class="font-black">Проверки</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">
            Роли и доступы уже есть, интерфейсы support/moderator/admin добавим отдельно.
          </p>
        </article>
      </section>
    </section>
  </main>
</template>
