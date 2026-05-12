<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, CheckCheck, Inbox, Loader2, Radio } from 'lucide-vue-next';
import PageHero from '../components/PageHero.vue';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { formatDateTime, formatDisplayText, formatSystemLabel } from '../lib/format';
import type { NotificationListItem } from '../lib/api';

const auth = useAuthStore();
const communication = useCommunicationStore();
const router = useRouter();
const page = ref(1);
const pageSize = 10;
const filterMode = ref<'unread' | 'read'>('unread');

const unread = computed(() => communication.notifications.filter((item) => !item.readAt));
const readCount = computed(() => communication.notifications.length - unread.value.length);
const filteredNotifications = computed(() =>
  filterMode.value === 'unread'
    ? communication.notifications.filter((item) => !item.readAt)
    : communication.notifications.filter((item) => item.readAt),
);
const visibleNotifications = computed(() =>
  filteredNotifications.value.slice(0, page.value * pageSize),
);
const hasMoreNotifications = computed(
  () => visibleNotifications.value.length < filteredNotifications.value.length,
);
const setFilterMode = (mode: typeof filterMode.value) => {
  filterMode.value = mode;
  page.value = 1;
};

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
      <section class="grid gap-5">
        <PageHero eyebrow="Уведомления" title="Платформа сама подсказывает, что делать дальше.">
          <template #actions>
            <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
              <button
                class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
                :class="
                  filterMode === 'unread'
                    ? 'border-ember bg-ember text-paper hover:bg-bolt'
                    : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
                "
                type="button"
                @click="setFilterMode('unread')"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <Bell :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]"> Новые </span>
                </span>
                <span
                  class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                  :class="filterMode === 'unread' ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
                >
                  {{ unread.length }}
                </span>
              </button>
              <button
                class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
                :class="
                  filterMode === 'read'
                    ? 'border-ember bg-ember text-paper hover:bg-bolt'
                    : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
                "
                type="button"
                @click="setFilterMode('read')"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <Inbox :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]">
                    Прочитано
                  </span>
                </span>
                <span
                  class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                  :class="filterMode === 'read' ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'"
                >
                  {{ readCount }}
                </span>
              </button>
              <button
                class="group flex h-[70px] items-center gap-3 rounded-2xl border border-paper/20 bg-paper/[0.06] px-4 text-left text-paper transition duration-200 ease-out hover:border-paper/45 hover:bg-paper/[0.12]"
                type="button"
                @click="readAll"
              >
                <span
                  class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink"
                >
                  <CheckCheck :size="20" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-black tracking-[-0.02em]">
                    Прочитать все
                  </span>
                </span>
              </button>
            </section>
          </template>
        </PageHero>

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
            class="block w-full rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 text-left transition hover:bg-white"
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
                  {{ formatSystemLabel(notification.type) }} ·
                  {{ formatDateTime(notification.createdAt) }}
                </p>
                <h2 class="mt-3 text-2xl font-black tracking-[-0.05em]">
                  {{ formatDisplayText(notification.title) }}
                </h2>
                <p class="mt-2 text-sm font-semibold leading-6 text-ink/68">
                  {{ formatDisplayText(notification.body) }}
                </p>
              </div>
              <span
                class="inline-grid h-8 shrink-0 place-items-center rounded-full border border-line bg-paper px-4 text-xs font-black uppercase leading-none tracking-[0.14em]"
              >
                {{ notification.readAt ? 'прочитано' : 'новое' }}
              </span>
            </div>
          </button>

          <p
            v-if="!communication.isLoading && !visibleNotifications.length"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center text-lg font-black"
          >
            {{ filterMode === 'unread' ? 'Новых уведомлений нет' : 'Прочитанных уведомлений нет' }}
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
