<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowRight, BriefcaseBusiness, Loader2, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useOrdersStore } from '../stores/orders';
import { formatAmount, formatDate } from '../lib/format';

const auth = useAuthStore();
const orders = useOrdersStore();
const router = useRouter();

const activeOrders = computed(() =>
  orders.orders.filter((order) => ['in_progress', 'submitted', 'disputed'].includes(order.status)),
);

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await orders.load(auth.accessToken);
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

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-5xl rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">
            Заказы в работе
          </p>
          <h1
            class="mt-3 max-w-xl text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Гарант держит темп и деньги.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Когда заказчик выбирает исполнителя, Fastik создает order и резервирует сумму в
            мок-гаранте. После принятия средства уходят исполнителю.
          </p>
        </aside>

        <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Сводка</p>
          <div class="mt-4 grid gap-3">
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">Активные</p>
              <p class="mt-1 text-3xl font-black">{{ activeOrders.length }}</p>
            </div>
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">Всего заказов</p>
              <p class="mt-1 text-3xl font-black">{{ orders.orders.length }}</p>
            </div>
          </div>
          <div class="mt-4 rounded-2xl border border-line bg-paper p-4">
            <p class="flex items-center gap-2 font-black">
              <ShieldCheck :size="20" class="text-moss" /> Мок-гарант включен
            </p>
            <p class="mt-2 text-sm font-semibold leading-5 text-ink/62">
              Деньги блокируются только после выбора исполнителя.
            </p>
          </div>
        </article>
      </section>

      <section class="mt-4 space-y-4">
        <div v-if="orders.isLoading" class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6">
          <span class="inline-flex items-center gap-3 font-black"
            ><Loader2 class="animate-spin" :size="20" /> Загружаем заказы</span
          >
        </div>

        <article
          v-for="order in orders.orders"
          :key="order.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                {{ statusTitle(order.status) }} · {{ formatDate(order.createdAt) }}
              </p>
              <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">{{ order.title }}</h2>
              <p class="mt-3 text-sm font-semibold leading-6 text-ink/68">
                Заказчик: {{ order.customerName }} · Исполнитель: {{ order.performerName }} ·
                Escrow: {{ order.escrowStatus || 'нет' }}
              </p>
            </div>
            <div class="rounded-2xl border border-line bg-paper px-4 py-3 text-right">
              <p class="text-sm font-black text-bolt">{{ formatAmount(order.amount) }}</p>
              <p class="mt-1 text-xs font-bold text-ink/55">мок-гарант</p>
            </div>
          </div>

          <RouterLink
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            :to="`/orders/${order.id}`"
          >
            Открыть заказ
            <ArrowRight :size="18" />
          </RouterLink>
        </article>

        <div
          v-if="!orders.isLoading && !orders.orders.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <BriefcaseBusiness class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Заказов в работе пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Выберите исполнителя на странице заказа, и order появится здесь.
          </p>
        </div>
      </section>
    </section>
  </main>
</template>
