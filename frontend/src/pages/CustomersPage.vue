<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { BriefcaseBusiness, Building2, Loader2, Search } from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useCustomersStore } from '../stores/customers';
import { formatAmount, formatMoney } from '../lib/format';

const customers = useCustomersStore();
const page = ref(1);
const pageSize = 8;
const filters = reactive({ search: '' });

const visibleCustomers = computed(() => customers.customers.slice(0, page.value * pageSize));
const hasMoreCustomers = computed(() => visibleCustomers.value.length < customers.customers.length);

const load = async () => {
  page.value = 1;
  await customers.loadCustomers({ search: filters.search || undefined });
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
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Заказчики</p>
          <h1
            class="mt-3 max-w-2xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Компании и люди, которые дают работу.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Публичная сторона заказчика: профиль компании, активные задачи, конкурсы и история
            работы через Fastik. Исполнитель видит не только задачу, но и кто за ней стоит.
          </p>
        </aside>

        <form
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-4 sm:p-5"
          @submit.prevent="load"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Поиск</p>
            <span class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black">
              {{ customers.customers.length }}
            </span>
          </div>
          <label class="mt-4 block">
            <span class="mb-2 flex items-center gap-2 text-sm font-black">
              <Search :size="16" /> Имя или компания
            </span>
            <input
              v-model="filters.search"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold text-ink outline-none focus:border-ink"
              placeholder="Антон, студия, SaaS"
            />
          </label>
          <button
            class="mt-4 w-full rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            type="submit"
          >
            Найти заказчика
          </button>
        </form>
      </section>

      <section class="mt-4 space-y-4">
        <div
          v-if="customers.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем заказчиков
          </span>
        </div>

        <article
          v-for="customer in visibleCustomers"
          :key="customer.user.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="flex min-w-0 gap-4">
              <PersonAvatar
                :name="customer.user.displayName"
                :src="customer.profile?.avatarUrl"
                tone="paper"
                size="lg"
              />
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                  {{ customer.customerProfile?.companyName || 'Частный заказчик' }}
                </p>
                <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {{ customer.user.displayName }}
                </h2>
                <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-ink/70">
                  {{
                    customer.customerProfile?.companyDescription ||
                    customer.profile?.bio ||
                    'Заказчик пока заполняет публичное описание, но его активность на платформе уже видна.'
                  }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 md:justify-end">
              <span class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black">
                {{ customer.stats.publishedJobsCount }} заказов
              </span>
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-bolt"
              >
                {{ customer.stats.contestsCount }} конкурсов
              </span>
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black text-moss"
              >
                {{ formatAmount(customer.stats.totalEscrowHeld) }} в гаранте
              </span>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                <BriefcaseBusiness :size="15" />
                {{
                  formatMoney(
                    customer.customerProfile?.projectBudgetMin ?? null,
                    customer.customerProfile?.projectBudgetMax ?? null,
                  )
                }}
              </span>
              <span
                v-if="customer.profile?.city"
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/65"
              >
                {{ customer.profile.city }}
              </span>
            </div>
            <RouterLink
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              :to="`/customers/${customer.user.id}`"
            >
              Открыть
            </RouterLink>
          </div>
        </article>

        <div
          v-if="!customers.isLoading && !customers.customers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Building2 class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Заказчиков пока нет</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">Попробуйте другой поиск.</p>
        </div>

        <button
          v-if="hasMoreCustomers"
          class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще заказчиков
        </button>
      </section>
    </section>
  </main>
</template>
