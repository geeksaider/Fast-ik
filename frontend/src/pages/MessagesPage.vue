<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { CheckCircle2, Inbox, Loader2, MessageCircle, Search, Users } from 'lucide-vue-next';
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
const latestConversation = computed(() => communication.conversations[0] ?? null);

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
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside class="rounded-[1.35rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <MessageCircle class="text-ember" :size="34" />
          <p class="mt-6 text-xs font-black uppercase tracking-[0.24em] text-paper/55">Чаты</p>
          <h1
            class="mt-3 max-w-xl text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
          >
            Рабочие диалоги по заказам.
          </h1>
          <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
            Здесь остаются договоренности, ссылки и файлы после выбора исполнителя.
          </p>
        </aside>

        <article class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Сводка</p>
          <div class="mt-4 divide-y divide-line rounded-2xl border border-line bg-paper">
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Диалоги</p>
              <p class="text-2xl font-black">{{ communication.conversations.length }}</p>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <p class="text-sm font-bold text-ink/55">Непрочитано</p>
              <p class="text-2xl font-black">{{ unreadCount }}</p>
            </div>
          </div>
          <div v-if="latestConversation" class="mt-4 rounded-2xl border border-line bg-paper p-4">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/45">
              Последний диалог
            </p>
            <p class="mt-2 line-clamp-2 text-sm font-black leading-5">
              {{ formatDisplayText(latestConversation.title) }}
            </p>
          </div>
        </article>
      </section>

      <section class="mt-4 grid gap-3 md:grid-cols-3">
        <button
          class="rounded-[1.2rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5"
          :class="
            conversationFilter === 'all'
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-[#fffaf0] text-ink hover:border-ink'
          "
          type="button"
          @click="setConversationFilter('all')"
        >
          <Users :size="22" />
          <p class="mt-3 text-xl font-black">Все диалоги</p>
          <p class="mt-1 text-sm font-semibold opacity-70">Полная история рабочих заказов.</p>
        </button>
        <button
          class="rounded-[1.2rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5"
          :class="
            conversationFilter === 'unread'
              ? 'border-ink bg-ember text-paper'
              : 'border-line bg-[#fffaf0] text-ink hover:border-ink'
          "
          type="button"
          @click="setConversationFilter('unread')"
        >
          <MessageCircle :size="22" />
          <p class="mt-3 text-xl font-black">Новые</p>
          <p class="mt-1 text-sm font-semibold opacity-70">
            {{ unreadCount ? `${unreadCount} требуют внимания.` : 'Все спокойно.' }}
          </p>
        </button>
        <RouterLink
          class="rounded-[1.2rem] border border-line bg-[#fffaf0] p-4 transition duration-200 hover:border-ink hover:bg-white"
          :to="latestConversation ? `/messages/${latestConversation.id}` : '/orders'"
        >
          <CheckCircle2 :size="22" class="text-moss" />
          <p class="mt-3 flex items-center justify-between gap-3 text-xl font-black">
            Контекст внутри
          </p>
          <p class="mt-1 text-sm font-semibold text-ink/65">
            Чат привязан к заказу: договоренности, ссылки и файлы не теряются.
          </p>
        </RouterLink>
      </section>

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
