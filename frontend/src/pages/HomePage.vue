<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-vue-next';
import { useSystemStore } from '../stores/system';

const system = useSystemStore();

const roadmap = [
  { level: '01', title: 'Новичок', text: 'Профиль, роль, базовые навыки' },
  { level: '02', title: 'Исполнитель', text: 'Портфолио и первые отклики' },
  { level: '03', title: 'Проверенный', text: 'Заказы без споров и стабильный рейтинг' },
  { level: '06', title: 'Fastik Elite', text: 'Интервью с HR платформы' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Мок-гарант',
    text: 'Средства заказчика резервируются в сервисе и переходят исполнителю после принятия работы.',
  },
  {
    icon: Trophy,
    title: 'RPG-уровни',
    text: 'Исполнитель растет через задания, отзывы, портфолио, проверки и финальное интервью.',
  },
  {
    icon: MessagesSquare,
    title: 'Коммуникация',
    text: 'Чат, уведомления и обмен файлами после начала обсуждения проекта.',
  },
  {
    icon: BarChart3,
    title: 'Аналитика',
    text: 'Панели для заказчиков, исполнителей и администраторов с понятными метриками.',
  },
];

const apiStatusText = computed(() => {
  if (system.isLoading) {
    return 'Проверяем API';
  }

  if (system.health) {
    return 'API online';
  }

  return 'API offline';
});

onMounted(() => {
  void system.checkHealth();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header
        class="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-center md:justify-between"
      >
        <a href="#" class="flex items-center gap-3" aria-label="Fastik home">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="24" stroke-width="2.6" />
          </span>
          <span>
            <span class="block font-display text-xl font-black uppercase tracking-[-0.04em]">
              Fastik
            </span>
            <span class="block text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
              freelance speedrun
            </span>
          </span>
        </a>

        <nav class="flex flex-wrap items-center gap-2 text-sm font-bold">
          <a
            class="rounded-full border border-ink px-4 py-2 transition hover:bg-ink hover:text-paper"
            href="#market"
          >
            Биржа
          </a>
          <a
            class="rounded-full border border-ink px-4 py-2 transition hover:bg-ink hover:text-paper"
            href="#levels"
          >
            Уровни
          </a>
          <a
            class="rounded-full border border-ink px-4 py-2 transition hover:bg-ink hover:text-paper"
            href="#trust"
          >
            Гарант
          </a>
          <a class="rounded-full bg-ink px-4 py-2 text-paper transition hover:bg-bolt" href="#auth">
            Войти
          </a>
        </nav>
      </header>

      <div class="grid gap-6 py-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:py-12">
        <section
          class="flex flex-col justify-between rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-8"
        >
          <div>
            <div
              class="mb-6 inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black uppercase tracking-[0.14em]"
            >
              <Sparkles :size="16" />
              Дипломный fullstack-проект
            </div>

            <h1
              class="max-w-3xl font-display text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl lg:text-7xl"
            >
              Биржа, где надежность видно до первого сообщения.
            </h1>

            <p class="mt-6 max-w-2xl text-lg font-medium leading-8 text-ink/72">
              Fastik соединяет заказчиков и исполнителей через заказы, отклики, моковый гарант и
              RPG-систему роста, где уровень исполнителя становится понятным сигналом доверия.
            </p>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
            <a
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ember px-6 py-3 font-black text-paper transition hover:-translate-y-0.5"
              href="#create-job"
            >
              Опубликовать заказ
              <ArrowRight :size="18" />
            </a>
            <a
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-6 py-3 font-black transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
              href="#become-performer"
            >
              Стать исполнителем
            </a>
            <div
              class="rounded-full border border-ink px-4 py-3 text-sm font-bold sm:justify-self-end"
            >
              <span
                :class="system.health ? 'bg-moss' : 'bg-ember'"
                class="mr-2 inline-block h-2.5 w-2.5 rounded-full"
              />
              {{ apiStatusText }}
            </div>
          </div>
        </section>

        <aside id="levels" class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Roadmap</p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.05em]">Дорога к славе</h2>
            </div>
            <span
              class="rounded-full border border-paper/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
            >
              XP system
            </span>
          </div>

          <div class="mt-7 space-y-3">
            <article
              v-for="item in roadmap"
              :key="item.level"
              class="grid grid-cols-[3.25rem_1fr] gap-4 rounded-2xl border border-paper/18 bg-paper/[0.06] p-4"
            >
              <span
                class="grid h-12 w-12 place-items-center rounded-xl bg-paper font-black text-ink"
              >
                {{ item.level }}
              </span>
              <span>
                <span class="block text-lg font-black">{{ item.title }}</span>
                <span class="mt-1 block text-sm leading-6 text-paper/68">{{ item.text }}</span>
              </span>
            </article>
          </div>
        </aside>
      </div>

      <section
        id="market"
        class="grid gap-4 border-t border-ink pt-6 md:grid-cols-2 xl:grid-cols-4"
      >
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-[1.25rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-1 hover:bg-white"
        >
          <component :is="feature.icon" class="mb-5 text-bolt" :size="28" stroke-width="2.3" />
          <h3 class="text-xl font-black tracking-[-0.04em]">{{ feature.title }}</h3>
          <p class="mt-3 text-sm font-medium leading-6 text-ink/70">{{ feature.text }}</p>
        </article>
      </section>

      <section
        id="trust"
        class="mt-6 grid gap-4 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 md:grid-cols-3 md:p-6"
      >
        <div class="md:col-span-1">
          <div class="inline-flex rounded-full border border-ink p-2">
            <BadgeCheck :size="26" class="text-moss" />
          </div>
          <h2 class="mt-4 text-3xl font-black tracking-[-0.05em]">Что строим первым</h2>
        </div>
        <div class="grid gap-3 md:col-span-2 sm:grid-cols-2">
          <div class="rounded-2xl border border-line bg-paper p-4">
            <BriefcaseBusiness class="mb-3 text-ember" :size="24" />
            <p class="font-black">Заказы и отклики</p>
            <p class="mt-2 text-sm leading-6 text-ink/68">
              Основной marketplace-сценарий для дипломной демонстрации.
            </p>
          </div>
          <div class="rounded-2xl border border-line bg-paper p-4">
            <Bell class="mb-3 text-bolt" :size="24" />
            <p class="font-black">Профили и уровни</p>
            <p class="mt-2 text-sm leading-6 text-ink/68">
              Рост исполнителя будет встроен в onboarding и реальные действия.
            </p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
