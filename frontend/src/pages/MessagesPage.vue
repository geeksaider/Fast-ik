<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { Inbox, Loader2, MessageCircle, Search, Users } from 'lucide-vue-next';
import PageHero from '../components/PageHero.vue';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import PersonAvatar from '../components/PersonAvatar.vue';
import { formatDateTime, formatDisplayText, formatSystemLabel } from '../lib/format';

const auth = useAuthStore();
const communication = useCommunicationStore();
const router = useRouter();
const page = ref(1);
const conversationFilter = ref<'all' | 'unread'>('all');
const pageSize = 8;

const unreadCount = computed(() => communication.unreadMessages);
const filteredConversations = computed(() =>
  conversationFilter.value === 'unread'
    ? communication.conversations.filter((conversation) => conversation.unreadCount > 0)
    : communication.conversations,
);
const visibleConversations = computed(() =>
  filteredConversations.value.slice(0, page.value * pageSize),
);
const hasMoreConversations = computed(
  () => visibleConversations.value.length < filteredConversations.value.length,
);

const setConversationFilter = (filter: typeof conversationFilter.value) => {
  conversationFilter.value = filter;
  page.value = 1;
};

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await communication.loadConversations(auth.accessToken);
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <PageHero
        eyebrow="Чаты"
        title="Рабочие диалоги по заказам."
        text="Тут находятся переписки по заказам."
      >
        <template #actions>
          <section class="grid w-full gap-2 lg:max-w-[21rem] lg:justify-self-end">
            <button
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                conversationFilter === 'all'
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="setConversationFilter('all')"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <Users :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]">
                  Все диалоги
                </span>
              </span>
              <span
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                :class="
                  conversationFilter === 'all' ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'
                "
              >
                {{ communication.conversations.length }}
              </span>
            </button>
            <button
              class="group flex h-[70px] items-center gap-3 rounded-2xl border px-4 text-left transition duration-200 ease-out"
              :class="
                conversationFilter === 'unread'
                  ? 'border-ember bg-ember text-paper hover:bg-bolt'
                  : 'border-paper/20 bg-paper/[0.06] text-paper hover:border-paper/45 hover:bg-paper/[0.12]'
              "
              type="button"
              @click="setConversationFilter('unread')"
            >
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-ink">
                <MessageCircle :size="20" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black tracking-[-0.02em]"> Новые </span>
              </span>
              <span
                class="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full px-0 text-xs font-black leading-none tabular-nums"
                :class="
                  conversationFilter === 'unread' ? 'bg-paper text-ink' : 'bg-paper/15 text-paper'
                "
              >
                {{ unreadCount }}
              </span>
            </button>
          </section>
        </template>
      </PageHero>

      <section class="mt-4 space-y-3">
        <div
          v-if="communication.isLoading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-6"
        >
          <span class="inline-flex items-center gap-3 font-black">
            <Loader2 class="animate-spin" :size="20" /> Загружаем диалоги
          </span>
        </div>

        <article
          v-for="conversation in visibleConversations"
          :key="conversation.id"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white"
        >
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div class="flex min-w-0 gap-4">
              <PersonAvatar
                :name="conversation.lastMessageSenderName || conversation.title"
                tone="paper"
                size="md"
              />
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                  {{ formatSystemLabel(conversation.type) }} ·
                  {{
                    conversation.lastMessageAt
                      ? formatDateTime(conversation.lastMessageAt)
                      : 'новый диалог'
                  }}
                </p>
                <h2 class="mt-2 truncate text-3xl font-black tracking-[-0.06em]">
                  {{ formatDisplayText(conversation.title) }}
                </h2>
                <p class="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-ink/68">
                  <span v-if="conversation.lastMessageBody">
                    {{ conversation.lastMessageSenderName || 'Система' }}:
                    {{ conversation.lastMessageBody }}
                  </span>
                  <span v-else>Сообщений пока нет</span>
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-3 lg:items-end">
              <span
                v-if="conversation.unreadCount"
                class="inline-flex w-fit rounded-full border border-ink bg-paper px-3 py-1 text-xs font-black text-ink"
              >
                Непрочитано: {{ conversation.unreadCount }}
              </span>
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
                :to="`/messages/${conversation.id}`"
              >
                Открыть диалог
              </RouterLink>
            </div>
          </div>
        </article>

        <div
          v-if="!communication.isLoading && !filteredConversations.length"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-8 text-center"
        >
          <component
            :is="conversationFilter === 'unread' ? Search : Inbox"
            class="mx-auto mb-4 text-ember"
            :size="36"
          />
          <p class="text-xl font-black">
            {{ conversationFilter === 'unread' ? 'Новых сообщений нет' : 'Диалогов пока нет' }}
          </p>
          <p class="mt-2 text-sm font-semibold text-ink/65">
            {{
              conversationFilter === 'unread'
                ? 'Можно вернуться ко всем диалогам или продолжить работу с заказами.'
                : 'Выберите исполнителя по заказу, и Fastik автоматически создаст рабочий чат.'
            }}
          </p>
        </div>

        <button
          v-if="hasMoreConversations"
          class="h-10 w-full rounded-full border border-ink bg-paper px-4 text-sm font-black transition hover:bg-ink hover:text-paper"
          type="button"
          @click="page += 1"
        >
          Показать еще диалоги
        </button>
      </section>
    </section>
  </main>
</template>
