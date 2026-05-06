<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { BriefcaseBusiness, Loader2, MessageCircle, RotateCcw, ShieldCheck } from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useAuthStore } from '../stores/auth';
import { useOrdersStore } from '../stores/orders';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDisplayText,
  formatSystemLabel,
  getDeadlineSignal,
} from '../lib/format';
import type { OrderListItem } from '../lib/api';

const auth = useAuthStore();
const orders = useOrdersStore();
const route = useRoute();
const router = useRouter();
const page = ref(1);
const pageSize = 8;
const statusFilter = ref('all');
const deadlineFilter = ref('all');
const sortMode = ref('newest');
const statusOptions = ['all', 'in_progress', 'submitted', 'completed', 'cancelled', 'disputed'];
const deadlineOptions = ['all', 'urgent', 'danger', 'warning', 'without'];
const sortOptions = ['newest', 'deadline', 'oldest', 'amount'];

const activeOrders = computed(() =>
  orders.orders.filter((order) => ['in_progress', 'submitted', 'disputed'].includes(order.status)),
);
const urgentOrders = computed(() =>
  orders.orders.filter((order) => {
    const tone = getDeadlineSignal(order.deadlineAt).tone;

    return tone === 'danger' || tone === 'warning';
  }),
);
const reviewOrders = computed(() => orders.orders.filter((order) => order.status === 'submitted'));
const withoutDeadlineOrders = computed(() => orders.orders.filter((order) => !order.deadlineAt));
const focusCards = computed(() => [
  {
    title: 'Срочно',
    value: urgentOrders.value.length,
    text: 'Просроченные и близкие дедлайны.',
    status: 'all',
    deadline: 'urgent',
    sort: 'deadline',
    tone: 'text-ember',
  },
  {
    title: 'Приемка',
    value: reviewOrders.value.length,
    text: 'Работы, которые ждут решения.',
    status: 'submitted',
    deadline: 'all',
    sort: 'newest',
    tone: 'text-bolt',
  },
  {
    title: 'Без срока',
    value: withoutDeadlineOrders.value.length,
    text: 'Заказы, где дедлайн стоит уточнить.',
    status: 'all',
    deadline: 'without',
    sort: 'newest',
    tone: 'text-ink',
  },
]);
const filteredOrders = computed(() => {
  const source =
    statusFilter.value === 'all'
      ? orders.orders
      : orders.orders.filter((order) => order.status === statusFilter.value);

  return source
    .filter((order) => matchesDeadlineFilter(order))
    .sort((first, second) => {
      if (sortMode.value === 'amount') {
        return second.amount - first.amount;
      }

      if (sortMode.value === 'deadline') {
        const firstDeadline = first.deadlineAt ? new Date(first.deadlineAt).getTime() : Infinity;
        const secondDeadline = second.deadlineAt ? new Date(second.deadlineAt).getTime() : Infinity;

        return firstDeadline - secondDeadline;
      }

      if (sortMode.value === 'oldest') {
        return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
      }

      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
});
const visibleOrders = computed(() => filteredOrders.value.slice(0, page.value * pageSize));
const hasMoreOrders = computed(() => visibleOrders.value.length < filteredOrders.value.length);
const pageCopy = computed(() => {
  if (auth.user?.role === 'performer') {
    return {
      eyebrow: 'Моя работа',
      title: 'Заказы, где вы исполнитель.',
      text: 'Здесь только рабочие заказы исполнителя: сдача результата, чат, дедлайны и сумма в гаранте.',
      empty: 'Рабочих заказов пока нет',
      emptyText: 'Откликнитесь на задачу и дождитесь выбора заказчика, чтобы заказ появился здесь.',
    };
  }

  if (auth.user?.role === 'customer') {
    return {
      eyebrow: 'Мои заказы',
      title: 'Работы, которые вы заказали.',
      text: 'Здесь только ваши рабочие заказы: приемка результата, чат с исполнителем, дедлайны и гарант.',
      empty: 'Заказов в работе пока нет',
      emptyText: 'Выберите исполнителя на странице заказа, и рабочий заказ появится здесь.',
    };
  }

  return {
    eyebrow: 'Заказы в работе',
    title: 'Рабочие заказы платформы.',
    text: 'Операционная лента заказов: статусы, дедлайны, чат и состояние гаранта.',
    empty: 'Заказов в работе пока нет',
    emptyText: 'Когда стороны начнут работу, заказы появятся здесь.',
  };
});

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await orders.load(auth.accessToken);
  page.value = 1;
};

const statusTitle = (status: string) => {
  const map: Record<string, string> = {
    in_progress: 'В работе',
    submitted: 'На проверке',
    completed: 'Завершен',
    cancelled: 'Отменен',
    disputed: 'Спор',
  };

  return map[status] ?? status;
};

const matchesDeadlineFilter = (order: OrderListItem) => {
  const signal = getDeadlineSignal(order.deadlineAt);

  if (deadlineFilter.value === 'all') {
    return true;
  }

  if (deadlineFilter.value === 'without') {
    return !order.deadlineAt;
  }

  if (deadlineFilter.value === 'urgent') {
    return signal.tone === 'danger' || signal.tone === 'warning';
  }

  return signal.tone === deadlineFilter.value;
};

type OrderMetaTone = 'neutral' | 'warning' | 'danger' | 'success' | 'moss' | 'bolt';

const orderMetaClass = (tone: OrderMetaTone = 'neutral') => {
  const map = {
    neutral: 'border-line bg-paper text-ink/62',
    warning: 'border-ember/70 bg-ember/10 text-ember',
    danger: 'border-ember bg-ember text-paper',
    success: 'border-moss/40 bg-moss/10 text-moss',
    moss: 'border-moss/40 bg-moss/10 text-moss',
    bolt: 'border-bolt/40 bg-bolt/10 text-bolt',
  };

  return map[tone];
};

const escrowTone = (status: string | null): OrderMetaTone => {
  if (status === 'released') {
    return 'moss';
  }

  if (status === 'held') {
    return 'bolt';
  }

  return 'neutral';
};

const readQueryValue = (value: unknown, allowed: string[], fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return allowed.includes(value) ? value : fallback;
};

const syncFiltersFromRoute = () => {
  statusFilter.value = readQueryValue(route.query.status, statusOptions, 'all');
  deadlineFilter.value = readQueryValue(route.query.deadline, deadlineOptions, 'all');
  sortMode.value = readQueryValue(route.query.sort, sortOptions, 'newest');
  page.value = 1;
};

const syncFiltersToRoute = () => {
  const nextQuery = { ...route.query };

  if (statusFilter.value === 'all') {
    delete nextQuery.status;
  } else {
    nextQuery.status = statusFilter.value;
  }

  if (deadlineFilter.value === 'all') {
    delete nextQuery.deadline;
  } else {
    nextQuery.deadline = deadlineFilter.value;
  }

  if (sortMode.value === 'newest') {
    delete nextQuery.sort;
  } else {
    nextQuery.sort = sortMode.value;
  }

  const sameQuery =
    readQueryValue(route.query.status, statusOptions, 'all') === statusFilter.value &&
    readQueryValue(route.query.deadline, deadlineOptions, 'all') === deadlineFilter.value &&
    readQueryValue(route.query.sort, sortOptions, 'newest') === sortMode.value;

  if (!sameQuery) {
    void router.replace({ path: route.path, query: nextQuery });
  }
};

const applyFocusCard = (card: (typeof focusCards.value)[number]) => {
  statusFilter.value = card.status;
  deadlineFilter.value = card.deadline;
  sortMode.value = card.sort;
  page.value = 1;
};

const resetFilters = () => {
  statusFilter.value = 'all';
  deadlineFilter.value = 'all';
  sortMode.value = 'newest';
  page.value = 1;
};

const orderActionLabel = (order: OrderListItem) => {
  if (order.status === 'submitted' && auth.user?.role === 'customer') {
    return 'Проверить результат';
  }

  if (order.status === 'in_progress' && auth.user?.role === 'performer') {
    return 'Сдать результат';
  }

  if (order.status === 'disputed') {
    return 'Открыть спор';
  }

  return 'Открыть заказ';
};

const orderMetaItems = (order: OrderListItem) => {
  const deadline = getDeadlineSignal(order.deadlineAt);
  const items: Array<{ label: string; value: string; tone?: OrderMetaTone }> = [];

  if (auth.user?.role === 'customer') {
    items.push({ label: 'Исполнитель', value: order.performerName });
  } else if (auth.user?.role === 'performer') {
    items.push({ label: 'Заказчик', value: order.customerName });
  } else {
    items.push(
      { label: 'Заказчик', value: order.customerName },
      { label: 'Исполнитель', value: order.performerName },
    );
  }

  items.push(
    {
      label: 'Гарант',
      value: formatSystemLabel(order.escrowStatus),
      tone: escrowTone(order.escrowStatus),
    },
    {
      label: 'Срок',
      value: deadline.label,
      tone: deadline.tone,
    },
  );

  if (order.deadlineAt) {
    items.push({ label: 'Дата', value: formatDate(order.deadlineAt), tone: 'neutral' });
  }

  return items;
};

watch(() => route.query, syncFiltersFromRoute, { immediate: true });
watch([statusFilter, deadlineFilter, sortMode], () => {
  page.value = 1;
  syncFiltersToRoute();
});

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">
            {{ pageCopy.eyebrow }}
          </p>
          <h1
            class="mt-3 max-w-xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            {{ pageCopy.title }}
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            {{ pageCopy.text }}
          </p>
        </aside>

        <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Сводка</p>
          <div class="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper">
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Активные</p>
              <p class="text-2xl font-black">{{ activeOrders.length }}</p>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">На проверке</p>
              <p class="text-2xl font-black">{{ reviewOrders.length }}</p>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Горящие</p>
              <p class="text-2xl font-black text-ember">{{ urgentOrders.length }}</p>
            </div>
          </div>
          <div class="mt-4 rounded-2xl border border-line bg-paper p-4">
            <p class="flex items-center gap-2 font-black">
              <ShieldCheck :size="20" class="text-moss" /> Гарант включен
            </p>
            <p class="mt-2 text-sm font-semibold leading-5 text-ink/62">
              Деньги блокируются только после выбора исполнителя.
            </p>
          </div>
        </article>
      </section>

      <section class="mt-4 space-y-4">
        <section
          class="grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:grid-cols-3"
        >
          <button
            v-for="card in focusCards"
            :key="card.title"
            class="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-ink hover:bg-white"
            type="button"
            @click="applyFocusCard(card)"
          >
            <span class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">
              {{ card.title }}
            </span>
            <span class="mt-2 block text-3xl font-black" :class="card.tone">
              {{ card.value }}
            </span>
            <span class="mt-2 block text-sm font-semibold leading-5 text-ink/62">
              {{ card.text }}
            </span>
          </button>
        </section>

        <div class="grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 lg:grid-cols-3">
          <div class="flex items-center justify-between gap-3 lg:col-span-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/45">Фильтры</p>
              <p class="mt-1 text-xs font-bold text-ink/45">
                Выбранный вид сохраняется в ссылке страницы.
              </p>
            </div>
            <button
              class="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-black text-ink/62 transition hover:border-ink hover:text-ink"
              type="button"
              @click="resetFilters"
            >
              <RotateCcw :size="14" />
              Сбросить
            </button>
          </div>
          <label class="block">
            <span class="mb-2 block text-sm font-black">Статус</span>
            <select
              v-model="statusFilter"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
              @change="page = 1"
            >
              <option value="all">Все заказы</option>
              <option value="in_progress">В работе</option>
              <option value="submitted">На проверке</option>
              <option value="completed">Завершенные</option>
              <option value="cancelled">Отмененные</option>
              <option value="disputed">Споры</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black">Дедлайн</span>
            <select
              v-model="deadlineFilter"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
              @change="page = 1"
            >
              <option value="all">Любой срок</option>
              <option value="urgent">Горящие</option>
              <option value="danger">Просроченные</option>
              <option value="warning">До 2 дней</option>
              <option value="without">Без срока</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black">Сортировка</span>
            <select
              v-model="sortMode"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
              @change="page = 1"
            >
              <option value="newest">Сначала новые</option>
              <option value="deadline">По дедлайну</option>
              <option value="oldest">Сначала старые</option>
              <option value="amount">По сумме</option>
            </select>
          </label>
        </div>

        <div v-if="orders.isLoading" class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
          <span class="inline-flex items-center gap-3 font-black"
            ><Loader2 class="animate-spin" :size="20" /> Загружаем заказы</span
          >
        </div>

        <article
          v-for="order in visibleOrders"
          :key="order.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:bg-white sm:p-6"
        >
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_12rem]">
            <div class="flex min-w-0 flex-col gap-4 sm:flex-row">
              <PersonAvatar :name="order.performerName" tone="paper" size="md" />
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                  {{ statusTitle(order.status) }} · {{ formatDateTime(order.createdAt) }}
                </p>
                <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {{ formatDisplayText(order.title) }}
                </h2>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="item in orderMetaItems(order)"
                    :key="`${order.id}-${item.label}`"
                    class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black"
                    :class="orderMetaClass(item.tone)"
                  >
                    <span class="uppercase tracking-[0.12em] opacity-65">{{ item.label }}</span>
                    <span>{{ item.value }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div
              class="flex h-fit flex-row items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 lg:flex-col lg:items-start lg:text-left"
            >
              <div>
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">В гаранте</p>
                <p class="mt-1 text-xl font-black text-bolt">{{ formatAmount(order.amount) }}</p>
              </div>
              <p class="text-xs font-bold leading-5 text-ink/55">
                Сумма защищает работу до решения заказчика.
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <RouterLink
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
              :to="`/orders/${order.id}`"
            >
              {{ orderActionLabel(order) }}
            </RouterLink>
            <RouterLink
              v-if="order.conversationId"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
              :to="`/messages/${order.conversationId}`"
            >
              Чат
              <MessageCircle :size="16" />
            </RouterLink>
          </div>
        </article>

        <div
          v-if="!orders.isLoading && !orders.orders.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <BriefcaseBusiness class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">{{ pageCopy.empty }}</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            {{ pageCopy.emptyText }}
          </p>
        </div>

        <button
          v-if="hasMoreOrders"
          class="h-10 w-full rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще заказы
        </button>
      </section>
    </section>
  </main>
</template>
