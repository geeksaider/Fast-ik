<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus, ShieldCheck, WalletCards } from 'lucide-vue-next';
import PageHero from '../components/PageHero.vue';
import { useAuthStore } from '../stores/auth';
import { useFinanceStore } from '../stores/finance';
import { formatAmount, formatDateTime, formatSystemLabel } from '../lib/format';
import type { Transaction } from '../lib/api';

const auth = useAuthStore();
const finance = useFinanceStore();
const router = useRouter();
const page = ref(1);
const pageSize = 5;

const form = reactive({ amount: 150000 });
const visibleTransactions = computed(() => finance.transactions.slice(0, page.value * pageSize));
const hasMoreTransactions = computed(
  () => visibleTransactions.value.length < finance.transactions.length,
);

const transactionDescription = (description: string) =>
  description.replace(/^.+ пополнение баланса$/u, 'Пополнение баланса');

const transactionTone = (transaction: Transaction) => {
  if (transaction.direction === 'hold') {
    return {
      icon: ShieldCheck,
      iconClass: 'bg-ember text-paper',
      amountClass: 'text-ember',
      sign: '-',
    };
  }

  if (transaction.direction === 'out') {
    return {
      icon: ArrowUpRight,
      iconClass: 'bg-ink text-paper',
      amountClass: 'text-ink',
      sign: '-',
    };
  }

  if (transaction.direction === 'release') {
    return {
      icon: WalletCards,
      iconClass: 'bg-moss text-paper',
      amountClass: 'text-moss',
      sign: '+',
    };
  }

  return {
    icon: ArrowDownLeft,
    iconClass: 'bg-moss text-paper',
    amountClass: 'text-moss',
    sign: '+',
  };
};

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await finance.load(auth.accessToken);
  page.value = 1;
};

const topUp = async () => {
  if (!auth.accessToken) {
    return;
  }

  await finance.topUp(auth.accessToken, form.amount);
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
      <div v-if="finance.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем финансы
        </span>
      </div>

      <section v-else class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside class="space-y-4">
          <PageHero eyebrow="Финансы" title="Баланс и операции." />

          <section class="grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">Доступно</p>
              <p class="mt-1 text-3xl font-black">
                {{ formatAmount(finance.wallet?.availableBalance ?? 0) }}
              </p>
            </div>
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">На удержании</p>
              <p class="mt-1 text-3xl font-black">
                {{ formatAmount(finance.wallet?.heldBalance ?? 0) }}
              </p>
            </div>

            <form class="space-y-3" @submit.prevent="topUp">
              <input
                v-model.number="form.amount"
                class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
                type="number"
                min="100"
              />
              <button
                class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                type="submit"
              >
                <Plus :size="18" />
                Пополнить баланс
              </button>
            </form>
          </section>
        </aside>

        <section class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Операции
              </p>
              <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">История баланса</h2>
            </div>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ finance.transactions.length }} операций
            </span>
          </div>
          <div class="mt-5 space-y-3">
            <article
              v-for="transaction in visibleTransactions"
              :key="transaction.id"
              class="rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
            >
              <div class="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
                <span
                  class="grid h-12 w-12 place-items-center rounded-2xl"
                  :class="transactionTone(transaction).iconClass"
                >
                  <component :is="transactionTone(transaction).icon" :size="20" />
                </span>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-black">{{ transactionDescription(transaction.description) }}</p>
                    <span
                      class="rounded-full border border-line bg-[#fffaf0] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-ink/55"
                    >
                      {{ formatSystemLabel(transaction.type) }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-ink/55">
                    {{ formatDateTime(transaction.createdAt) }}
                  </p>
                </div>

                <div class="grid gap-1 sm:justify-items-end sm:text-right">
                  <p
                    class="text-xl font-black"
                    :class="transactionTone(transaction).amountClass"
                  >
                    {{ transactionTone(transaction).sign }}{{ formatAmount(transaction.amount) }}
                  </p>
                  <p class="text-xs font-bold text-ink/45">
                    Остаток: {{ formatAmount(transaction.balanceAfter) }}
                  </p>
                </div>
              </div>
            </article>
            <p
              v-if="!finance.transactions.length"
              class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
            >
              Транзакций пока нет. Пополните баланс или выберите исполнителя по заказу.
            </p>
            <button
              v-if="hasMoreTransactions"
              class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
              type="button"
              @click="page += 1"
            >
              Показать еще операции
            </button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
