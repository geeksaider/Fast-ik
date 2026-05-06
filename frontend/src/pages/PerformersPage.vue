<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { Loader2, Search, Sparkles, Star, Trophy, UsersRound } from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { usePerformersStore } from '../stores/performers';
import { formatAmount } from '../lib/format';
import type { PublicPerformerListItem } from '../lib/api';

const performers = usePerformersStore();
const filters = reactive({ search: '' });

const load = async () => {
  await performers.loadAll({ search: filters.search || undefined });
};

const ratingLabel = (performer: PublicPerformerListItem) =>
  performer.stats.averageRating ? performer.stats.averageRating.toFixed(1) : 'новый';

const hourlyRate = (performer: PublicPerformerListItem) =>
  performer.performerProfile?.hourlyRate
    ? `${formatAmount(performer.performerProfile.hourlyRate)} / час`
    : 'ставка по задаче';

const topPerformers = computed(() => performers.performers.slice(0, 6));

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
          <div class="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
            <UsersRound :size="28" />
          </div>
          <p class="mt-6 text-xs font-black uppercase tracking-[0.24em] text-paper/55">
            Исполнители
          </p>
          <h1
            class="mt-3 max-w-xl text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Найдите человека до публикации задачи.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Смотрите уровень, навыки, рейтинг и портфолио. Заказчик может открыть профиль и сразу
            пригласить исполнителя в свой заказ.
          </p>
        </aside>

        <form class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5" @submit.prevent="load">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Поиск</p>
          <label class="mt-4 block">
            <span class="mb-2 flex items-center gap-2 font-black">
              <Search :size="18" /> Имя, навык или город
            </span>
            <input
              v-model="filters.search"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none placeholder:text-ink/35 focus:border-ink"
              placeholder="Vue, дизайн, Москва"
            />
          </label>
          <button
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            type="submit"
          >
            Найти исполнителя
          </button>
        </form>
      </section>

      <section class="mt-4 grid gap-4">
        <div
          v-if="performers.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем исполнителей
          </span>
        </div>

        <article
          v-for="performer in topPerformers"
          :key="performer.user.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white sm:p-6"
        >
          <div class="grid gap-5 lg:grid-cols-[5rem_minmax(0,1fr)_14rem] lg:items-center">
            <PersonAvatar
              :name="performer.user.displayName"
              :src="performer.profile?.avatarUrl"
              tone="paper"
              size="lg"
            />

            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/50">
                {{ performer.currentLevel?.title ?? 'Новый исполнитель' }} ·
                {{ performer.profile?.city ?? 'город не указан' }}
              </p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">
                {{ performer.user.displayName }}
              </h2>
              <p class="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/68">
                {{
                  performer.performerProfile?.headline ||
                  performer.profile?.bio ||
                  'Профиль готов к первым заказам.'
                }}
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="skill in performer.skills.slice(0, 4)"
                  :key="skill.id"
                  class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/68"
                >
                  #{{ skill.slug }}
                </span>
                <span
                  class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black text-ink/68"
                >
                  {{ hourlyRate(performer) }}
                </span>
              </div>
            </div>

            <div class="grid gap-3 lg:justify-items-end">
              <div class="flex flex-wrap gap-2 lg:justify-end">
                <span
                  class="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-black"
                >
                  <Star :size="14" /> {{ ratingLabel(performer) }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-black"
                >
                  <Trophy :size="14" /> {{ performer.progress?.xp ?? 0 }} XP
                </span>
              </div>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
                :to="`/performers/${performer.user.id}`"
              >
                Открыть профиль
              </RouterLink>
            </div>
          </div>
        </article>

        <div
          v-if="!performers.isLoading && !performers.performers.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <Sparkles class="mx-auto mb-4 text-ember" :size="36" />
          <p class="text-xl font-black">Исполнителей не найдено</p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            Попробуйте другой навык, город или имя.
          </p>
        </div>
      </section>
    </section>
  </main>
</template>
