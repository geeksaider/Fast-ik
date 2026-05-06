<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2, Plus, WalletCards } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useFinanceStore } from '../stores/finance';
import { formatAmount, formatDateTime, formatSystemLabel } from '../lib/format';

const auth = useAuthStore();
const finance = useFinanceStore();
const router = useRouter();
const page = ref(1);
const pageSize = 10;

const form = reactive({ amount: 150000 });
const visibleTransactions = computed(() => finance.transactions.slice(0, page.value * pageSize));
const hasMoreTransactions = computed(
  () => visibleTransactions.value.length < finance.transactions.length,
);

const transactionDescription = (description: string) =>
  description.replace('Моковое пополнение баланса', 'Пополнение баланса');

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
          <section class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <WalletCards class="text-ember" :size="32" />
              <span
                class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
              >
                Wallet
              </span>
            </div>
            <p class="mt-5 text-xs font-black uppercase tracking-[0.24em] text-paper/55">Wallet</p>
            <h1
              class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
            >
              Финансы под контролем.
            </h1>
          </section>

          <section class="grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">Доступно</p>
              <p class="mt-1 text-3xl font-black">
                {{ formatAmount(finance.wallet?.availableBalance ?? 0) }}
              </p>
            </div>
            <div class="rounded-2xl border border-line bg-paper p-4">
              <p class="text-sm font-bold text-ink/55">В гаранте</p>
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
                Движение средств
              </p>
              <h2 class="mt-2 text-4xl font-black tracking-[-0.06em]">История транзакций</h2>
            </div>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ finance.transactions.length }} операций
            </span>
          </div>
          <div class="mt-5 space-y-3">
            <article
              v-for="transaction in visibleTransactions"
              :key="transaction.id"
              class="rounded-2xl border border-line bg-paper p-4"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="font-black">{{ transactionDescription(transaction.description) }}</p>
                  <div
                    class="mt-2 grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/50 sm:grid-cols-3"
                  >
                    <span>{{ formatSystemLabel(transaction.type) }}</span>
                    <span>{{ formatSystemLabel(transaction.direction) }}</span>
                    <span>{{ formatDateTime(transaction.createdAt) }}</span>
                  </div>
                </div>
                <p
                  class="text-lg font-black"
                  :class="transaction.direction === 'hold' ? 'text-ember' : 'text-moss'"
                >
                  {{ formatAmount(transaction.amount) }}
                </p>
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
