<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Check, KeyRound, Loader2, Mail, Save, ShieldAlert, Trash2 } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '../lib/api';

const auth = useAuthStore();
const router = useRouter();

const passwordForm = reactive({ currentPassword: '', newPassword: '' });
const emailForm = reactive({ newEmail: '', currentPassword: '' });
const deleteForm = reactive({ currentPassword: '' });

const passwordStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const emailStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const deleteStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const notificationStatus = ref<{ tone: 'ok' | 'error'; text: string } | null>(null);
const deleteConfirmed = ref(false);

const settings = ref<NotificationSettings | null>(null);
const isLoadingSettings = ref(false);
const isSavingSettings = ref(false);

const loadSettings = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  isLoadingSettings.value = true;

  try {
    settings.value = await getNotificationSettings(auth.accessToken);
  } catch (error) {
    notificationStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось загрузить настройки',
    };
  } finally {
    isLoadingSettings.value = false;
  }
};

const submitPassword = async () => {
  if (!auth.accessToken) {
    return;
  }

  passwordStatus.value = null;

  try {
    await changePassword(auth.accessToken, { ...passwordForm });
    passwordStatus.value = { tone: 'ok', text: 'Пароль обновлён.' };
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
  } catch (error) {
    passwordStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сменить пароль',
    };
  }
};

const submitEmail = async () => {
  if (!auth.accessToken) {
    return;
  }

  emailStatus.value = null;

  try {
    const response = await changeEmail(auth.accessToken, { ...emailForm });
    emailStatus.value = { tone: 'ok', text: `Email обновлён: ${response.email}` };

    if (auth.user) {
      auth.user.email = response.email;
    }

    emailForm.newEmail = '';
    emailForm.currentPassword = '';
  } catch (error) {
    emailStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сменить email',
    };
  }
};

const submitDelete = async () => {
  if (!auth.accessToken) {
    return;
  }

  if (!deleteConfirmed.value) {
    deleteStatus.value = {
      tone: 'error',
      text: 'Подтвердите, что согласны на удаление аккаунта',
    };
    return;
  }

  deleteStatus.value = null;

  try {
    await deleteAccount(auth.accessToken, { ...deleteForm });
    auth.logout();
    await router.push('/');
  } catch (error) {
    deleteStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось удалить аккаунт',
    };
  }
};

const saveNotificationSettings = async () => {
  if (!auth.accessToken || !settings.value) {
    return;
  }

  isSavingSettings.value = true;
  notificationStatus.value = null;

  try {
    settings.value = await updateNotificationSettings(auth.accessToken, settings.value);
    notificationStatus.value = { tone: 'ok', text: 'Настройки уведомлений сохранены.' };
  } catch (error) {
    notificationStatus.value = {
      tone: 'error',
      text: error instanceof Error ? error.message : 'Не удалось сохранить настройки',
    };
  } finally {
    isSavingSettings.value = false;
  }
};

onMounted(() => {
  void loadSettings();
});
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Аккаунт</p>
        <h1 class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl">
          Настройки
        </h1>
        <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
          Управление учетной записью: email, пароль, уведомления и удаление профиля.
        </p>
      </aside>

      <section class="mt-4 grid gap-4 lg:grid-cols-2">
        <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <Mail :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Email</p>
              <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Сменить email</h2>
              <p class="mt-1 text-sm font-semibold text-ink/55">
                Текущий: <span class="text-ink">{{ auth.user?.email }}</span>
              </p>
            </div>
          </div>

          <form class="mt-4 grid gap-3" @submit.prevent="submitEmail">
            <label class="block">
              <span class="mb-2 block text-sm font-black">Новый email</span>
              <input
                v-model="emailForm.newEmail"
                class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                type="email"
                autocomplete="email"
                required
              />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-black">Текущий пароль</span>
              <input
                v-model="emailForm.currentPassword"
                class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                type="password"
                autocomplete="current-password"
                required
              />
            </label>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              type="submit"
            >
              <Save :size="16" />
              Сохранить email
            </button>
            <p
              v-if="emailStatus"
              class="text-sm font-bold"
              :class="emailStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
            >
              {{ emailStatus.text }}
            </p>
          </form>
        </article>

        <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <KeyRound :size="20" />
            </span>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Пароль</p>
              <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Сменить пароль</h2>
              <p class="mt-1 text-sm font-semibold text-ink/55">Минимум 8 символов.</p>
            </div>
          </div>

          <form class="mt-4 grid gap-3" @submit.prevent="submitPassword">
            <label class="block">
              <span class="mb-2 block text-sm font-black">Текущий пароль</span>
              <input
                v-model="passwordForm.currentPassword"
                class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                type="password"
                autocomplete="current-password"
                required
              />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-black">Новый пароль</span>
              <input
                v-model="passwordForm.newPassword"
                class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
                type="password"
                minlength="8"
                autocomplete="new-password"
                required
              />
            </label>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              type="submit"
            >
              <Save :size="16" />
              Сменить пароль
            </button>
            <p
              v-if="passwordStatus"
              class="text-sm font-bold"
              :class="passwordStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
            >
              {{ passwordStatus.text }}
            </p>
          </form>
        </article>
      </section>

      <section class="mt-4 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
        <div class="flex items-start gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
            <Bell :size="20" />
          </span>
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Уведомления</p>
            <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Какие события доставлять</h2>
            <p class="mt-1 text-sm font-semibold text-ink/55">
              Выключенные каналы не присылают уведомления, но события остаются в истории.
            </p>
          </div>
        </div>

        <div v-if="isLoadingSettings" class="mt-4 inline-flex items-center gap-3 font-black">
          <Loader2 class="animate-spin" :size="20" /> Загружаем настройки
        </div>

        <div v-else-if="settings" class="mt-5 grid gap-3 lg:grid-cols-2">
          <div class="rounded-2xl border border-line bg-paper p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Email</p>
            <div class="mt-3 space-y-1.5">
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Новые сообщения
                <input v-model="settings.email.messages" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.email.messages ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.email.messages ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Отклики и приглашения
                <input v-model="settings.email.applications" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.email.applications ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.email.applications ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Статусы заказов
                <input v-model="settings.email.orders" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.email.orders ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.email.orders ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Маркетинговые рассылки
                <input v-model="settings.email.marketing" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.email.marketing ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.email.marketing ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
            </div>
          </div>

          <div class="rounded-2xl border border-line bg-paper p-5">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">В приложении</p>
            <div class="mt-3 space-y-1.5">
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Новые сообщения
                <input v-model="settings.inApp.messages" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.inApp.messages ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.inApp.messages ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Отклики и приглашения
                <input v-model="settings.inApp.applications" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.inApp.applications ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.inApp.applications ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
              <label class="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-bold transition hover:border-line hover:bg-[#fffaf0]">
                Статусы заказов
                <input v-model="settings.inApp.orders" type="checkbox" class="sr-only" />
                <span
                  class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition"
                  :class="settings.inApp.orders ? 'bg-ink' : 'bg-ink/15'"
                >
                  <span
                    class="absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all"
                    :class="settings.inApp.orders ? 'left-[1.375rem]' : 'left-0.5'"
                  />
                </span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="settings" class="mt-5 flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
            type="button"
            :disabled="isSavingSettings"
            @click="saveNotificationSettings"
          >
            <Save :size="16" />
            Сохранить
          </button>
          <p
            v-if="notificationStatus"
            class="text-sm font-bold"
            :class="notificationStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
          >
            {{ notificationStatus.text }}
          </p>
        </div>
      </section>

      <section class="mt-4 rounded-[1.5rem] border border-ember bg-ember/10 p-6 sm:p-8">
        <div class="flex items-start gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-ember text-paper">
            <ShieldAlert :size="20" />
          </span>
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ember">Опасная зона</p>
            <h2 class="mt-1 text-2xl font-black tracking-[-0.05em]">Удалить аккаунт</h2>
            <p class="mt-1 text-sm font-semibold text-ink/68">
              Это действие необратимо. Будут удалены профиль, отклики и история сделок.
            </p>
          </div>
        </div>

        <form class="mt-4 grid gap-3" @submit.prevent="submitDelete">
          <label class="block">
            <span class="mb-2 block text-sm font-black">Пароль для подтверждения</span>
            <input
              v-model="deleteForm.currentPassword"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ember"
              type="password"
              autocomplete="current-password"
              required
            />
          </label>
          <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-ember/30 bg-paper px-3 py-3 text-sm font-bold text-ink/72 transition hover:border-ember">
            <input v-model="deleteConfirmed" type="checkbox" class="sr-only" />
            <span
              class="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition"
              :class="deleteConfirmed ? 'border-ember bg-ember text-paper' : 'border-ink/30 bg-paper'"
            >
              <Check v-if="deleteConfirmed" :size="14" stroke-width="3" />
            </span>
            Я понимаю, что удаление необратимо и хочу продолжить.
          </label>
          <button
            class="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-ember bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
            type="submit"
          >
            <Trash2 :size="16" />
            Удалить аккаунт
          </button>
          <p
            v-if="deleteStatus"
            class="text-sm font-bold"
            :class="deleteStatus.tone === 'ok' ? 'text-moss' : 'text-ember'"
          >
            {{ deleteStatus.text }}
          </p>
        </form>
      </section>
    </section>
  </main>
</template>
