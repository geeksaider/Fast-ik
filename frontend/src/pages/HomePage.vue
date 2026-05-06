<script setup lang="ts">
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-vue-next';

const roadmap = [
  { level: '01', title: 'Новичок', text: 'Профиль, роль, базовые навыки' },
  { level: '02', title: 'Исполнитель', text: 'Портфолио и первые отклики' },
  { level: '03', title: 'Проверенный', text: 'Заказы без споров и стабильный рейтинг' },
  { level: '06', title: 'Fastik Elite', text: 'Интервью с HR платформы' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Финансовый гарант',
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
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)]">
        <section
          class="flex flex-col justify-between rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-8"
        >
          <div>
            <div
              class="mb-6 inline-flex items-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black uppercase tracking-[0.14em]"
            >
              <Sparkles :size="16" />
              Платформа быстрых сделок
            </div>

            <h1
              class="max-w-3xl font-display text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-6xl lg:text-7xl"
            >
              Биржа, где надежность видно до первого сообщения.
            </h1>

            <p class="mt-6 max-w-2xl text-lg font-medium leading-8 text-ink/72">
              Fastik соединяет заказчиков и исполнителей через заказы, отклики, гарант и RPG-систему
              роста, где уровень исполнителя становится понятным сигналом доверия.
            </p>
          </div>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <RouterLink
              class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-ink bg-ember px-4 text-sm font-black text-paper transition hover:bg-bolt"
              to="/register"
            >
              Опубликовать заказ
            </RouterLink>
            <RouterLink
              class="inline-flex h-10 min-w-0 items-center justify-center rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
              to="/register"
            >
              Стать исполнителем
            </RouterLink>
          </div>
        </section>

        <aside
          id="levels"
          class="rounded-[1.5rem] border border-ink bg-ink p-5 h-full text-paper sm:p-6"
        >
          <div class="flex items-start justify-between py-[18px] gap-4">
            <div>
              <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">ROADMAP</p>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.05em]">Дорога к славе</h2>
            </div>
          </div>

          <div class="mt-7 grid gap-3">
            <article
              v-for="item in roadmap"
              :key="item.level"
              class="grid h-[114px] grid-cols-[3.25rem_1fr] items-center gap-4 rounded-2xl border border-paper/18 bg-paper/[0.06] p-4"
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

      <section id="market" class="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-[1.25rem] border border-ink bg-[#fffaf0] p-5 transition hover:bg-white"
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
          <h2 class="text-3xl font-black tracking-[-0.05em]">С чего начинается работа</h2>
          <p class="mt-3 text-sm font-semibold leading-6 text-ink/62">
            Показываем ключевые сценарии без лишнего декоративного шума.
          </p>
        </div>
        <div class="grid gap-3 md:col-span-2 sm:grid-cols-2">
          <div class="rounded-2xl border border-line bg-paper p-4">
            <BriefcaseBusiness class="mb-3 text-ember" :size="24" />
            <p class="font-black">Заказы и отклики</p>
            <p class="mt-2 text-sm leading-6 text-ink/68">
              Основной сценарий: публикация задачи, отклики и выбор исполнителя.
            </p>
          </div>
          <div class="rounded-2xl border border-line bg-paper p-4">
            <Bell class="mb-3 text-bolt" :size="24" />
            <p class="font-black">Профили и уровни</p>
            <p class="mt-2 text-sm leading-6 text-ink/68">
              Рост исполнителя встроен в профиль, отклики и реальные действия.
            </p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
