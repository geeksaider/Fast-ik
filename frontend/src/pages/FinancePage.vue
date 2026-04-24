<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2, Plus, WalletCards } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useFinanceStore } from '../stores/finance';
import { formatAmount, formatDate } from '../lib/format';

const auth = useAuthStore();
const finance = useFinanceStore();
const router = useRouter();

const form = reactive({ amount: 150000 });

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await finance.load(auth.accessToken);
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
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <div v-if="finance.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем финансы
        </span>
      </div>

      <section v-else class="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <WalletCards class="text-ember" :size="34" />
          <p class="mt-6 text-sm font-black uppercase tracking-[0.2em] text-paper/55">
            Mock wallet
          </p>
          <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            Финансы без реальных платежей.
          </h1>
          <div class="mt-7 grid gap-3">
            <div class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
              <p class="text-sm font-bold text-paper/55">Доступно</p>
              <p class="mt-1 text-3xl font-black">
                {{ formatAmount(finance.wallet?.availableBalance ?? 0) }}
              </p>
            </div>
            <div class="rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
              <p class="text-sm font-bold text-paper/55">В гаранте</p>
              <p class="mt-1 text-3xl font-black">
                {{ formatAmount(finance.wallet?.heldBalance ?? 0) }}
              </p>
            </div>
          </div>

          <form class="mt-5 space-y-3" @submit.prevent="topUp">
            <input
              v-model.number="form.amount"
              class="w-full rounded-2xl border border-paper/30 bg-paper px-4 py-3 font-semibold text-ink outline-none"
              type="number"
              min="100"
            />
            <button
              class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
              type="submit"
            >
              <Plus :size="18" />
              Моково пополнить
            </button>
          </form>
        </aside>

        <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
          <h2 class="text-4xl font-black tracking-[-0.06em]">История транзакций</h2>
          <div class="mt-6 space-y-3">
            <article
              v-for="transaction in finance.transactions"
              :key="transaction.id"
              class="rounded-2xl border border-line bg-paper p-4"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="font-black">{{ transaction.description }}</p>
                  <p class="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                    {{ transaction.type }} · {{ transaction.direction }} ·
                    {{ formatDate(transaction.createdAt) }}
                  </p>
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
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
