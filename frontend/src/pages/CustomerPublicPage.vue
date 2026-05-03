<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
  Trophy,
  WalletCards,
} from 'lucide-vue-next';
import { useCustomersStore } from '../stores/customers';
import { formatAmount, formatDate, formatMoney, formatSystemLabel } from '../lib/format';

const route = useRoute();
const customers = useCustomersStore();

const customerId = computed(() => String(route.params.id));
const profile = computed(() => customers.current);

const load = async () => {
  await customers.load(customerId.value);
};

onMounted(() => {
  void load();
});

watch(customerId, () => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <div v-if="customers.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем заказчика
        </span>
      </div>

      <section
        v-else-if="customers.error"
        class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ember">Профиль недоступен</p>
        <h1 class="mt-3 text-4xl font-black tracking-[-0.06em]">
          Не получилось открыть заказчика.
        </h1>
        <p class="mt-3 max-w-xl text-sm font-semibold leading-6 text-ink/65">
          {{ customers.error }}
        </p>
        <RouterLink
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
          to="/customers"
        >
          К заказчикам
          <ArrowRight :size="18" />
        </RouterLink>
      </section>

      <section v-else-if="profile" class="space-y-4">
        <RouterLink
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/60 transition hover:text-ink"
          to="/customers"
        >
          <ArrowLeft :size="16" />
          К заказчикам
        </RouterLink>

        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-7">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="grid h-16 w-16 place-items-center rounded-2xl bg-paper text-ink">
                <Building2 :size="32" />
              </div>
              <span
                class="inline-flex items-center gap-2 rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-paper/70"
              >
                <ShieldCheck :size="15" />
                Профиль заказчика
              </span>
            </div>

            <p class="mt-7 text-xs font-black uppercase tracking-[0.24em] text-paper/50">
              {{ profile.customerProfile?.companyName || 'Fastik customer' }}
            </p>
            <h1
              class="mt-3 text-[2.65rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl"
            >
              {{ profile.user.displayName }}
            </h1>
            <p class="mt-4 max-w-2xl text-lg font-black leading-7 text-paper/84">
              {{
                profile.customerProfile?.companyDescription ||
                'Заказчик публикует задачи и выбирает исполнителей через Fastik.'
              }}
            </p>
            <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/66">
              {{
                profile.profile?.bio ||
                'Публичное описание пока короткое, но активность заказчика уже видна по заказам и конкурсам.'
              }}
            </p>

            <div class="mt-6 flex flex-wrap gap-2 text-sm font-bold text-paper/72">
              <span
                v-if="profile.profile?.city"
                class="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1"
              >
                <MapPin :size="16" />
                {{ profile.profile.city }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1"
              >
                <WalletCards :size="16" />
                {{
                  formatMoney(
                    profile.customerProfile?.projectBudgetMin ?? null,
                    profile.customerProfile?.projectBudgetMax ?? null,
                  )
                }}
              </span>
            </div>

            <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
                to="/jobs"
              >
                Открыть заказы
                <ArrowRight :size="18" />
              </RouterLink>
              <a
                v-if="profile.customerProfile?.companySite"
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper/40 px-5 py-3 font-black text-paper transition hover:bg-paper hover:text-ink"
                :href="profile.customerProfile.companySite"
                target="_blank"
                rel="noreferrer"
              >
                Сайт компании
                <ExternalLink :size="18" />
              </a>
            </div>
          </article>

          <aside class="grid gap-4">
            <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Активность</p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Сигналы доверия</h2>
              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Заказы</p>
                  <p class="mt-1 text-3xl font-black">{{ profile.stats.publishedJobsCount }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Конкурсы</p>
                  <p class="mt-1 text-3xl font-black">{{ profile.stats.contestsCount }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                    Завершено
                  </p>
                  <p class="mt-1 text-3xl font-black">{{ profile.stats.completedOrdersCount }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-paper p-4">
                  <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                    В гаранте
                  </p>
                  <p class="mt-1 text-2xl font-black">
                    {{ formatAmount(profile.stats.totalEscrowHeld) }}
                  </p>
                </div>
              </div>
            </section>

            <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">
                Почему это важно
              </p>
              <div class="mt-4 grid gap-2">
                <p class="flex items-start gap-2 text-sm font-bold leading-6 text-ink/70">
                  <BriefcaseBusiness class="mt-1 shrink-0 text-bolt" :size="18" />
                  Исполнитель видит не только задачу, но и публичную историю заказчика.
                </p>
                <p class="flex items-start gap-2 text-sm font-bold leading-6 text-ink/70">
                  <ShieldCheck class="mt-1 shrink-0 text-moss" :size="18" />
                  Деньги и статусы остаются моковыми, но поведение похоже на реальный marketplace.
                </p>
              </div>
            </section>
          </aside>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Заказы</p>
                <h2 class="mt-1 text-3xl font-black tracking-[-0.06em]">Публикации</h2>
              </div>
              <BriefcaseBusiness :size="24" />
            </div>
            <div class="mt-4 grid gap-3">
              <RouterLink
                v-for="job in profile.jobs"
                :key="job.id"
                class="rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                :to="`/jobs/${job.id}`"
              >
                <p class="font-black">{{ job.title }}</p>
                <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                  {{ job.categoryName || 'Без категории' }} · {{ formatSystemLabel(job.status) }} ·
                  {{ formatDate(job.deadlineAt) }}
                </p>
                <p class="mt-2 text-sm font-black text-bolt">
                  {{ formatMoney(job.budgetMin, job.budgetMax) }} ·
                  {{ job.applicationsCount }} откликов
                </p>
              </RouterLink>
              <p
                v-if="!profile.jobs.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
              >
                Публичных заказов пока нет.
              </p>
            </div>
          </article>

          <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Конкурсы</p>
                <h2 class="mt-1 text-3xl font-black tracking-[-0.06em]">LVL-задания</h2>
              </div>
              <Trophy :size="24" />
            </div>
            <div class="mt-4 grid gap-3">
              <RouterLink
                v-for="contest in profile.contests"
                :key="contest.id"
                class="rounded-2xl border border-line bg-paper p-4 transition hover:border-ink hover:bg-white"
                :to="`/contests/${contest.id}`"
              >
                <p class="font-black">{{ contest.title }}</p>
                <p class="mt-2 text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                  {{ contest.categoryName || 'Без категории' }} ·
                  {{ formatSystemLabel(contest.status) }} ·
                  {{ contest.requiredLevelTitle }}
                </p>
                <p class="mt-2 text-sm font-black text-bolt">
                  {{ formatAmount(contest.prizeAmount) }} · {{ contest.submissionsCount }} работ
                </p>
              </RouterLink>
              <p
                v-if="!profile.contests.length"
                class="rounded-2xl border border-line bg-paper p-4 text-sm font-bold text-ink/65"
              >
                Конкурсов пока нет.
              </p>
            </div>
          </article>
        </section>
      </section>
    </section>
  </main>
</template>
