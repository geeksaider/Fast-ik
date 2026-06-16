<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft, LockKeyhole, Mail, UserRound, Zap } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  email: 'customer@fastik.local',
  password: 'Fastik123!',
});

const standAccounts = [
  { label: 'Заказчик', email: 'customer@fastik.local' },
  { label: 'Исполнитель', email: 'performer@fastik.local' },
  { label: 'Админ', email: 'admin@fastik.local' },
];

const fillStandAccount = (email: string) => {
  form.email = email;
  form.password = 'Fastik123!';
};

const submit = async () => {
  try {
    await auth.login(form);
    await router.push(String(route.query.redirect ?? '/dashboard'));
  } catch {
    // Ошибка уже сохранена в auth store и показана в форме.
  }
};

onMounted(() => {
  auth.clearError();
});
</script>

<template>
  <main class="grid min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto grid w-full max-w-[1044px] gap-5 self-center rounded-[2rem] border border-ink bg-paper/95 p-4 md:min-h-[640px] md:grid-cols-[0.95fr_1.05fr] md:p-6"
    >
      <aside class="flex rounded-[1.5rem] border border-ink bg-ink p-6 text-paper md:p-8">
        <div class="flex w-full flex-col justify-start">
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
          <h1
            class="mt-7 max-w-sm text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl"
          >
            Вход в рабочую зону Fastik.
          </h1>
          <p class="mt-5 max-w-sm text-base font-medium leading-7 text-paper/68">
            Войдите в аккаунт и продолжайте работу с заказами, откликами, профилем и RPG-прогрессом.
          </p>
        </div>
      </aside>

      <section class="flex rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-8">
        <div class="my-auto w-full">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-ink/55">Авторизация</p>
          <h2 class="mt-3 text-4xl font-black tracking-[-0.06em]">Войти</h2>

          <form class="mt-8 space-y-4" @submit.prevent="submit">
            <label class="block">
              <span class="mb-2 block text-sm font-black">Email</span>
              <span
                class="flex items-center gap-3 rounded-2xl border border-ink bg-paper px-4 py-3"
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
                class="flex items-center gap-3 rounded-2xl border border-ink bg-paper px-4 py-3"
              >
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
            </button>
          </form>

          <details class="group mt-4 text-sm text-ink/55">
            <summary
              class="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition hover:border-ink hover:text-ink"
            >
              <UserRound :size="14" />
              Режим показа
            </summary>
            <div class="mt-3 rounded-2xl border border-line bg-paper p-3">
              <div class="grid gap-2 sm:grid-cols-3">
                <button
                  v-for="account in standAccounts"
                  :key="account.email"
                  class="rounded-full border border-line px-3 py-2 text-xs font-black transition hover:border-ink hover:bg-[#fffaf0]"
                  type="button"
                  @click="fillStandAccount(account.email)"
                >
                  {{ account.label }}
                </button>
              </div>
              <p class="mt-3 text-xs font-semibold leading-5 text-ink/45">
                Пароль стенда: Fastik123!
              </p>
            </div>
          </details>

          <p class="mt-6 text-center text-sm font-bold text-ink/65">
            Нет аккаунта?
            <RouterLink class="text-bolt underline decoration-2 underline-offset-4" to="/register">
              Зарегистрироваться
            </RouterLink>
          </p>
        </div>
      </section>
    </section>
  </main>
</template>
