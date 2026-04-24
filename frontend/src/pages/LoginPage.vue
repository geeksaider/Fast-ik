<script setup lang="ts">
import { reactive } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Zap } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  email: 'customer@fastik.local',
  password: 'Fastik123!',
});

const submit = async () => {
  await auth.login(form);
  await router.push(String(route.query.redirect ?? '/dashboard'));
};
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto grid max-w-5xl gap-5 rounded-[2rem] border border-ink bg-paper/95 p-4 md:grid-cols-[0.95fr_1.05fr] md:p-6"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper md:p-8">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-paper/70 transition hover:text-paper"
        >
          <ArrowLeft :size="16" />
          На главную
        </RouterLink>

        <div class="mt-12 grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink">
          <Zap :size="30" />
        </div>
        <h1 class="mt-7 max-w-sm text-5xl font-black leading-[0.92] tracking-[-0.07em]">
          Быстрый вход в рабочую зону Fastik.
        </h1>
        <p class="mt-5 max-w-sm text-base font-medium leading-7 text-paper/68">
          Используй demo-аккаунт или войди после регистрации. Следующий шаг после входа - onboarding
          профиля и RPG-прогресс.
        </p>
      </aside>

      <section class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-8">
        <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Авторизация</p>
        <h2 class="mt-3 text-4xl font-black tracking-[-0.06em]">Войти</h2>

        <form class="mt-8 space-y-4" @submit.prevent="submit">
          <label class="block">
            <span class="mb-2 block text-sm font-black">Email</span>
            <span class="flex items-center gap-3 rounded-2xl border border-ink bg-paper px-4 py-3">
              <Mail :size="18" class="text-ink/55" />
              <input
                v-model="form.email"
                class="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink/35"
                type="email"
                autocomplete="email"
                placeholder="you@fastik.ru"
                required
              />
            </span>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-black">Пароль</span>
            <span class="flex items-center gap-3 rounded-2xl border border-ink bg-paper px-4 py-3">
              <LockKeyhole :size="18" class="text-ink/55" />
              <input
                v-model="form.password"
                class="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink/35"
                type="password"
                autocomplete="current-password"
                placeholder="Минимум 8 символов"
                required
              />
            </span>
          </label>

          <p
            v-if="auth.error"
            class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
          >
            {{ auth.error }}
          </p>

          <button
            class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink px-6 py-3 font-black text-paper transition hover:bg-bolt disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            :disabled="auth.isLoading"
          >
            {{ auth.isLoading ? 'Входим...' : 'Войти в Fastik' }}
            <ArrowRight :size="18" />
          </button>
        </form>

        <div class="mt-6 rounded-2xl border border-line bg-paper p-4 text-sm leading-6 text-ink/70">
          <p class="font-black text-ink">Demo-аккаунты после `npm run db:seed`:</p>
          <p>Заказчик: `customer@fastik.local`</p>
          <p>Исполнитель: `performer@fastik.local`</p>
          <p>Админ: `admin@fastik.local`</p>
          <p>Пароль для всех: `Fastik123!`</p>
        </div>

        <p class="mt-6 text-center text-sm font-bold text-ink/65">
          Нет аккаунта?
          <RouterLink class="text-bolt underline decoration-2 underline-offset-4" to="/register">
            Зарегистрироваться
          </RouterLink>
        </p>
      </section>
    </section>
  </main>
</template>
