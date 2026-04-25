<script setup lang="ts">
import { reactive } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Hammer,
  LockKeyhole,
  Mail,
  UserRound,
  Zap,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  role: 'performer' as 'customer' | 'performer',
});

const submit = async () => {
  await auth.register(form);
  await router.push('/dashboard');
};
</script>

<template>
  <main class="grid min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto grid w-full max-w-[1044px] gap-5 self-center rounded-[2rem] border border-ink bg-paper/95 p-4 md:min-h-[680px] md:grid-cols-[0.92fr_1.08fr] md:p-6"
    >
      <aside class="flex rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 md:p-8">
        <div class="flex w-full flex-col justify-center">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/60 transition hover:text-ink"
          >
            <ArrowLeft :size="16" />
            На главную
          </RouterLink>

          <div
            class="mt-12 grid h-14 w-14 place-items-center rounded-2xl border border-ink bg-ink text-paper"
          >
            <Zap :size="30" />
          </div>
          <h1 class="mt-7 max-w-sm text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            Первый шаг на дороге к славе.
          </h1>
          <p class="mt-5 max-w-sm text-base font-medium leading-7 text-ink/68">
            Регистрация сразу задает роль. Для исполнителя дальше появится профиль, портфолио,
            навыки и RPG-roadmap уровня доверия.
          </p>
        </div>
      </aside>

      <section class="flex rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-8">
        <div class="my-auto w-full">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">Новый аккаунт</p>
          <h2 class="mt-3 text-4xl font-black tracking-[-0.06em]">Регистрация</h2>

          <form class="mt-8 space-y-4" @submit.prevent="submit">
            <label class="block">
              <span class="mb-2 block text-sm font-black">Как вас показать на платформе</span>
              <span
                class="flex items-center gap-3 rounded-2xl border border-paper/35 bg-paper px-4 py-3 text-ink"
              >
                <UserRound :size="18" class="text-ink/55" />
                <input
                  v-model="form.displayName"
                  class="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink/35"
                  type="text"
                  autocomplete="name"
                  placeholder="Например, Алексей Frontend"
                  required
                />
              </span>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-black">Email</span>
              <span
                class="flex items-center gap-3 rounded-2xl border border-paper/35 bg-paper px-4 py-3 text-ink"
              >
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
              <span
                class="flex items-center gap-3 rounded-2xl border border-paper/35 bg-paper px-4 py-3 text-ink"
              >
                <LockKeyhole :size="18" class="text-ink/55" />
                <input
                  v-model="form.password"
                  class="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink/35"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Минимум 8 символов"
                  minlength="8"
                  required
                />
              </span>
            </label>

            <div>
              <span class="mb-2 block text-sm font-black">Роль</span>
              <div class="grid gap-3 sm:grid-cols-2">
                <label
                  class="cursor-pointer rounded-2xl border p-4 transition"
                  :class="
                    form.role === 'performer'
                      ? 'border-paper bg-paper text-ink'
                      : 'border-paper/30 bg-paper/[0.06]'
                  "
                >
                  <input v-model="form.role" class="sr-only" type="radio" value="performer" />
                  <Hammer :size="22" />
                  <span class="mt-3 block font-black">Исполнитель</span>
                  <span class="mt-1 block text-sm leading-5 opacity-70"
                    >Портфолио, отклики, уровни и XP.</span
                  >
                </label>
                <label
                  class="cursor-pointer rounded-2xl border p-4 transition"
                  :class="
                    form.role === 'customer'
                      ? 'border-paper bg-paper text-ink'
                      : 'border-paper/30 bg-paper/[0.06]'
                  "
                >
                  <input v-model="form.role" class="sr-only" type="radio" value="customer" />
                  <BriefcaseBusiness :size="22" />
                  <span class="mt-3 block font-black">Заказчик</span>
                  <span class="mt-1 block text-sm leading-5 opacity-70"
                    >Заказы, гарант, отклики и выбор исполнителя.</span
                  >
                </label>
              </div>
            </div>

            <p
              v-if="auth.error"
              class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-bold text-ember"
            >
              {{ auth.error }}
            </p>

            <button
              class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-ember px-6 py-3 font-black text-paper transition hover:bg-bolt disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              :disabled="auth.isLoading"
            >
              {{ auth.isLoading ? 'Создаем аккаунт...' : 'Создать аккаунт' }}
              <ArrowRight :size="18" />
            </button>
          </form>

          <p class="mt-6 text-center text-sm font-bold text-paper/65">
            Уже есть аккаунт?
            <RouterLink class="text-paper underline decoration-2 underline-offset-4" to="/login">
              Войти
            </RouterLink>
          </p>
        </div>
      </section>
    </section>
  </main>
</template>
