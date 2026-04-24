<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  LogOut,
  MessagesSquare,
  ShieldCheck,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const roleTitle = computed(() => {
  const role = auth.user?.role;

  if (role === 'customer') {
    return 'Заказчик';
  }

  if (role === 'performer') {
    return 'Исполнитель';
  }

  if (role === 'admin') {
    return 'Администратор';
  }

  if (role === 'moderator') {
    return 'Модератор';
  }

  if (role === 'support') {
    return 'Поддержка';
  }

  if (role === 'super_admin') {
    return 'Суперадмин';
  }

  return 'Пользователь';
});

const nextSteps = computed(() => {
  if (auth.user?.role === 'customer') {
    return [
      'Заполнить профиль заказчика',
      'Создать первый заказ',
      'Пополнить моковый баланс',
      'Получить отклики исполнителей',
    ];
  }

  if (auth.user?.role === 'performer') {
    return [
      'Заполнить профиль исполнителя',
      'Добавить навыки и портфолио',
      'Получить первый XP за onboarding',
      'Откликнуться на подходящий заказ',
    ];
  }

  return [
    'Проверить пользователей',
    'Открыть модерацию',
    'Посмотреть споры',
    'Настроить категории',
  ];
});

const logout = async () => {
  auth.logout();
  await router.push('/');
};
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header
        class="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-center md:justify-between"
      >
        <RouterLink to="/" class="flex items-center gap-3">
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="24" stroke-width="2.6" />
          </span>
          <span>
            <span class="block font-display text-xl font-black uppercase tracking-[-0.04em]"
              >Fastik</span
            >
            <span class="block text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
              dashboard
            </span>
          </span>
        </RouterLink>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="logout"
        >
          <LogOut :size="16" />
          Выйти
        </button>
      </header>

      <section class="grid gap-5 py-7 lg:grid-cols-[0.85fr_1.15fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-7">
          <div class="flex items-center justify-between gap-4">
            <div class="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
              <UserRound :size="28" />
            </div>
            <span
              class="rounded-full border border-paper/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
            >
              {{ roleTitle }}
            </span>
          </div>

          <h1 class="mt-7 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            {{ auth.user?.displayName }}
          </h1>
          <p class="mt-4 text-base font-medium leading-7 text-paper/68">{{ auth.user?.email }}</p>

          <div class="mt-7 rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
            <p class="text-sm font-black uppercase tracking-[0.18em] text-paper/55">Auth status</p>
            <p class="mt-2 flex items-center gap-2 text-lg font-black">
              <BadgeCheck :size="20" class="text-moss" />
              JWT-сессия активна
            </p>
          </div>
        </aside>

        <section class="grid gap-4">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-7">
            <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Следующий блок</p>
            <h2 class="mt-3 text-4xl font-black tracking-[-0.06em]">Onboarding и профили</h2>
            <p class="mt-4 max-w-2xl text-base font-medium leading-7 text-ink/68">
              Авторизация уже держит пользователя и роль. Дальше на эту основу ляжет заполнение
              профиля, портфолио, навыки и первые шаги RPG-roadmap.
            </p>
            <RouterLink
              class="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
              to="/onboarding"
            >
              Открыть onboarding
              <ArrowRight :size="18" />
            </RouterLink>
          </article>

          <div class="grid gap-4 md:grid-cols-2">
            <article class="rounded-[1.25rem] border border-ink bg-[#fffaf0] p-5">
              <Trophy class="mb-4 text-ember" :size="28" />
              <h3 class="text-xl font-black tracking-[-0.04em]">Roadmap уровня</h3>
              <ul class="mt-4 space-y-3">
                <li
                  v-for="step in nextSteps"
                  :key="step"
                  class="flex items-start gap-3 text-sm font-bold leading-6 text-ink/72"
                >
                  <ArrowRight :size="16" class="mt-1 shrink-0 text-bolt" />
                  {{ step }}
                </li>
              </ul>
            </article>

            <article class="rounded-[1.25rem] border border-ink bg-[#fffaf0] p-5">
              <ShieldCheck class="mb-4 text-moss" :size="28" />
              <h3 class="text-xl font-black tracking-[-0.04em]">Доступы</h3>
              <p class="mt-3 text-sm font-medium leading-6 text-ink/70">
                Backend уже умеет проверять токен и ограничивать маршруты по ролям. Админские
                интерфейсы подключим после marketplace и модерации.
              </p>
              <div class="mt-5 grid gap-2 text-sm font-black">
                <span class="rounded-full border border-line bg-paper px-4 py-2">requireAuth</span>
                <span class="rounded-full border border-line bg-paper px-4 py-2">requireRoles</span>
              </div>
            </article>
          </div>
        </section>
      </section>

      <section class="grid gap-4 border-t border-ink pt-6 md:grid-cols-3">
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <BriefcaseBusiness class="mb-3 text-ember" :size="24" />
          <p class="font-black">Заказы</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">Появятся после профилей и категорий.</p>
        </article>
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <MessagesSquare class="mb-3 text-bolt" :size="24" />
          <p class="font-black">Чат</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">Будет привязан к заказам и откликам.</p>
        </article>
        <article class="rounded-2xl border border-ink bg-[#fffaf0] p-5">
          <Bell class="mb-3 text-moss" :size="24" />
          <p class="font-black">Уведомления</p>
          <p class="mt-2 text-sm leading-6 text-ink/68">
            Добавим после ключевых событий marketplace.
          </p>
        </article>
      </section>
    </section>
  </main>
</template>
