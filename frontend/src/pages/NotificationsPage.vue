<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, CheckCheck, Loader2, Radio } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { formatDateTime } from '../lib/format';
import type { NotificationListItem } from '../lib/api';

const auth = useAuthStore();
const communication = useCommunicationStore();
const router = useRouter();
const page = ref(1);
const pageSize = 10;

const unread = computed(() => communication.notifications.filter((item) => !item.readAt));
const visibleNotifications = computed(() =>
  communication.notifications.slice(0, page.value * pageSize),
);
const hasMoreNotifications = computed(
  () => visibleNotifications.value.length < communication.notifications.length,
);

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  communication.isLoading = true;
  try {
    await communication.loadNotifications(auth.accessToken);
  } finally {
    communication.isLoading = false;
  }
};

const openNotification = async (notification: NotificationListItem) => {
  if (!auth.accessToken) {
    return;
  }

  if (!notification.readAt) {
    await communication.readNotification(auth.accessToken, notification.id);
  }

  if (notification.linkUrl) {
    await router.push(notification.linkUrl);
  }
};

const readAll = async () => {
  if (!auth.accessToken) {
    return;
  }

  await communication.readAllNotifications(auth.accessToken);
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section class="grid gap-5 lg:grid-cols-[0.74fr_1.26fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <Bell class="text-moss" :size="34" />
          <p class="mt-6 text-sm font-black uppercase tracking-[0.2em] text-paper/55">
            Уведомления
          </p>
          <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            Платформа сама подсказывает, что делать дальше.
          </h1>
          <div class="mt-7 rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
            <p class="font-black">Новых событий: {{ unread.length }}</p>
          </div>
          <button
            class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper bg-paper px-5 py-3 font-black text-ink transition hover:bg-moss hover:text-paper"
            type="button"
            @click="readAll"
          >
            <CheckCheck :size="18" />
            Прочитать все
          </button>
        </aside>

        <section class="space-y-3">
          <div
            v-if="communication.isLoading"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6"
          >
            <span class="inline-flex items-center gap-3 font-black">
              <Loader2 class="animate-spin" :size="20" />
              Загружаем уведомления
            </span>
          </div>

          <button
            v-for="notification in visibleNotifications"
            :key="notification.id"
            class="block w-full rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 text-left transition hover:-translate-y-1 hover:bg-white"
            :class="!notification.readAt ? 'shadow-cut' : ''"
            type="button"
            @click="openNotification(notification)"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p
                  class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/55"
                >
                  <Radio v-if="!notification.readAt" :size="14" class="text-ember" />
                  {{ notification.type }} · {{ formatDateTime(notification.createdAt) }}
                </p>
                <h2 class="mt-3 text-2xl font-black tracking-[-0.05em]">
                  {{ notification.title }}
                </h2>
                <p class="mt-2 text-sm font-semibold leading-6 text-ink/68">
                  {{ notification.body }}
                </p>
              </div>
              <span
                class="rounded-full border border-line bg-paper px-3 py-1 text-xs font-black uppercase tracking-[0.14em]"
              >
                {{ notification.readAt ? 'прочитано' : 'новое' }}
              </span>
            </div>
          </button>

          <p
            v-if="!communication.isLoading && !communication.notifications.length"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center text-lg font-black"
          >
            Уведомлений пока нет
          </p>

          <button
            v-if="hasMoreNotifications"
            class="w-full rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-ink hover:text-paper"
            type="button"
            @click="page += 1"
          >
            Показать еще уведомления
          </button>
        </section>
      </section>
    </section>
  </main>
</template>
