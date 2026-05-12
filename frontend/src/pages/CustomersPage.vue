<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { BriefcaseBusiness, Building2, Loader2, Search, ShieldCheck, Trophy } from 'lucide-vue-next';
import FilterPanel from '../components/FilterPanel.vue';
import PageHero from '../components/PageHero.vue';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useCustomersStore } from '../stores/customers';
import { formatAmount, formatMoney } from '../lib/format';

const customers = useCustomersStore();
const page = ref(1);
const pageSize = 8;
const quickFilter = ref<'all' | 'jobs' | 'contests' | 'held'>('all');
const filters = reactive({ search: '' });

const filteredCustomers = computed(() => {
  if (quickFilter.value === 'jobs') {
    return customers.customers.filter((customer) => customer.stats.publishedJobsCount > 0);
  }

  if (quickFilter.value === 'contests') {
    return customers.customers.filter((customer) => customer.stats.contestsCount > 0);
  }

  if (quickFilter.value === 'held') {
    return customers.customers.filter((customer) => customer.stats.totalEscrowHeld > 0);
  }

  return customers.customers;
});
const visibleCustomers = computed(() => filteredCustomers.value.slice(0, page.value * pageSize));
const hasMoreCustomers = computed(() => visibleCustomers.value.length < filteredCustomers.value.length);
const withJobs = computed(() =>
  customers.customers.filter((customer) => customer.stats.publishedJobsCount > 0),
);
const withContests = computed(() =>
  customers.customers.filter((customer) => customer.stats.contestsCount > 0),
);
const withHeldFunds = computed(() =>
  customers.customers.filter((customer) => customer.stats.totalEscrowHeld > 0),
);
const heroCards = computed(() => [
  {
    key: 'jobs' as const,
    title: 'С заказами',
    value: withJobs.value.length,
    icon: BriefcaseBusiness,
  },
  {
    key: 'contests' as const,
    title: 'С конкурсами',
    value: withContests.value.length,
    icon: Trophy,
  },
  {
    key: 'held' as const,
    title: 'С гарантом',
    value: withHeldFunds.value.length,
    icon: ShieldCheck,
  },
]);
const applyQuickFilter = (key: typeof quickFilter.value) => {
  quickFilter.value = quickFilter.value === key ? 'all' : key;
  page.value = 1;
};

const load = async () => {
  page.value = 1;
  await customers.loadCustomers({ search: filters.search || undefined });
};

const resetFilters = () => {
  filters.search = '';
  quickFilter.value = 'all';
  void load();
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
      <PageHero eyebrow="Заказчики" title="Компании и люди, которые дают работу.">
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
            <button
              v-for="card in heroCards"
              :key="card.key"
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                quickFilter === card.key
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="applyQuickFilter(card.key)"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <component :is="card.icon" :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]">
                  {{ card.title }}
                </span>
              </span>
              <span
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                :class="quickFilter === card.key ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
              >
                {{ card.value }}
              </span>
            </button>
          </section>
        </template>
      </PageHero>

      <form class="mt-4" @submit.prevent="load">
        <FilterPanel title="Поиск" columns="lg:grid-cols-[minmax(0,1fr)_auto]" @reset="resetFilters">
          <label class="block">
            <input
              v-model="filters.search"
              class="h-12 w-full rounded-2xl border border-line bg-paper px-4 font-semibold text-ink outline-none placeholder:text-ink/35 focus:border-ink"
              placeholder="Антон, студия, SaaS"
            />
          </label>
          <button
            class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 text-sm font-black text-paper transition hover:bg-bolt lg:w-auto lg:self-center"
            type="submit"
          >
            <Search :size="16" />
            Искать
          </button>
        </FilterPanel>
      </form>

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
                {{ formatAmount(customer.stats.totalEscrowHeld) }} на удержании
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
          v-if="!customers.isLoading && !visibleCustomers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Building2 class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Заказчиков не найдено</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Попробуйте другой поиск или снимите быстрый фильтр.
          </p>
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
