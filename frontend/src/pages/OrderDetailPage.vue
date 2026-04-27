<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Check,
  Flag,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  WalletCards,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useOrdersStore } from '../stores/orders';
import { formatAmount, formatDateTime, formatDisplayText, formatSystemLabel } from '../lib/format';

const auth = useAuthStore();
const orders = useOrdersStore();
const route = useRoute();
const router = useRouter();

const forms = reactive({
  workResult: '',
  disputeReason: '',
  cancelReason: '',
});

const orderId = computed(() => String(route.params.id));
const order = computed(() => orders.currentOrder);
const isPerformer = computed(() => auth.user?.id === order.value?.performerId);
const isCustomer = computed(() => auth.user?.id === order.value?.customerId);

const statusTitle = computed(() => {
  const map: Record<string, string> = {
    in_progress: 'В работе',
    submitted: 'На проверке',
    completed: 'Завершен',
    cancelled: 'Отменен',
    disputed: 'Спор открыт',
  };

  return order.value ? map[order.value.status] : 'Заказ';
});

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await orders.loadOne(auth.accessToken, orderId.value);
};

const submitWork = async () => {
  if (!auth.accessToken || !forms.workResult.trim()) {
    return;
  }

  await orders.submit(auth.accessToken, orderId.value, forms.workResult);
  forms.workResult = '';
};

const acceptWork = async () => {
  if (!auth.accessToken) {
    return;
  }

  await orders.accept(auth.accessToken, orderId.value);
};

const dispute = async () => {
  if (!auth.accessToken || !forms.disputeReason.trim()) {
    return;
  }

  await orders.dispute(auth.accessToken, orderId.value, forms.disputeReason);
  forms.disputeReason = '';
};

const cancel = async () => {
  if (!auth.accessToken) {
    return;
  }

  await orders.cancel(auth.accessToken, orderId.value, forms.cancelReason || 'Отмена заказчиком');
  forms.cancelReason = '';
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header
        class="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-center md:justify-between"
      >
        <RouterLink
          to="/orders"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К заказам
        </RouterLink>
        <div class="flex flex-col gap-2 sm:flex-row">
          <RouterLink
            v-if="order?.conversationId"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black text-ink transition hover:bg-white"
            :to="`/messages/${order.conversationId}`"
          >
            <MessageCircle :size="18" />
            Рабочий чат
          </RouterLink>
          <RouterLink
            class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            to="/finance"
          >
            <WalletCards :size="18" />
            Финансы
          </RouterLink>
        </div>
      </header>

      <div v-if="orders.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем заказ
        </span>
      </div>

      <div v-else-if="order" class="grid gap-5 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <section class="space-y-5">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-7">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">
              {{ statusTitle }}
            </p>
            <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
              {{ formatDisplayText(order.title) }}
            </h1>
            <p class="mt-5 text-sm font-semibold leading-6 text-ink/70">
              Заказчик: {{ order.customerName }} · Исполнитель: {{ order.performerName }} · Создан:
              {{ formatDateTime(order.createdAt) }}
            </p>
          </article>

          <section
            v-if="isPerformer && order.status === 'in_progress'"
            class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-3xl font-black tracking-[-0.05em]">
              <Send :size="26" class="text-ember" /> Сдать работу
            </h2>
            <form class="mt-5 space-y-3" @submit.prevent="submitWork">
              <textarea
                v-model="forms.workResult"
                class="min-h-36 w-full rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
                placeholder="Опишите результат, ссылки, что проверить заказчику"
                required
              />
              <button
                class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                type="submit"
              >
                <Send :size="18" />
                Отправить на проверку
              </button>
            </form>
          </section>

          <section
            v-if="order.workResult"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="text-2xl font-black tracking-[-0.04em]">Результат работы</h2>
            <p class="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-ink/70">
              {{ order.workResult }}
            </p>
            <button
              v-if="isCustomer && order.status === 'submitted'"
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-moss px-5 py-3 font-black text-paper transition hover:bg-ink"
              type="button"
              @click="acceptWork"
            >
              <Check :size="18" />
              Принять и выплатить
            </button>
          </section>

          <section
            v-if="['in_progress', 'submitted'].includes(order.status)"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
          >
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <Flag class="text-ember" :size="22" /> Спор или отмена
            </h2>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <form class="space-y-3" @submit.prevent="dispute">
                <textarea
                  v-model="forms.disputeReason"
                  class="min-h-28 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="Причина спора"
                  required
                />
                <button
                  class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper"
                  type="submit"
                >
                  <Flag :size="18" />
                  Открыть спор
                </button>
              </form>
              <form v-if="isCustomer" class="space-y-3" @submit.prevent="cancel">
                <textarea
                  v-model="forms.cancelReason"
                  class="min-h-28 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none"
                  placeholder="Причина отмены"
                />
                <button
                  class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black text-ink"
                  type="submit"
                >
                  <RotateCcw :size="18" />
                  Отменить и вернуть
                </button>
              </form>
            </div>
          </section>
        </section>

        <aside class="grid gap-4 lg:grid-rows-[auto_1fr]">
          <section class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Мок-гарант</p>
            <p class="mt-3 text-4xl font-black tracking-[-0.06em]">
              {{ formatAmount(order.amount) }}
            </p>
            <p class="mt-4 flex items-center gap-2 text-sm font-bold text-paper/70">
              <ShieldCheck :size="18" class="text-moss" /> Статус:
              {{ formatSystemLabel(order.escrowStatus) }}
            </p>
          </section>

          <section class="h-full rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5">
            <h2 class="text-2xl font-black tracking-[-0.04em]">История</h2>
            <div class="mt-4 space-y-3">
              <article
                v-for="item in order.statusHistory"
                :key="item.id"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <p class="font-black">{{ formatSystemLabel(item.status) }}</p>
                <p class="mt-1 text-xs font-bold text-ink/55">
                  {{ item.actorName || 'Система' }} · {{ formatDateTime(item.createdAt) }}
                </p>
                <p v-if="item.note" class="mt-2 text-sm leading-5 text-ink/65">{{ item.note }}</p>
              </article>
            </div>
          </section>

          <p
            v-if="orders.error"
            class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
          >
            {{ orders.error }}
          </p>
        </aside>
      </div>
    </section>
  </main>
</template>
