<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ArrowRight, Inbox, Loader2, MessageCircle } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { formatDate } from '../lib/format';

const auth = useAuthStore();
const communication = useCommunicationStore();
const router = useRouter();

const unreadCount = computed(() => communication.unreadMessages);

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
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-6xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <section class="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <MessageCircle class="text-ember" :size="34" />
          <p class="mt-6 text-sm font-black uppercase tracking-[0.2em] text-paper/55">Чаты</p>
          <h1 class="mt-3 text-5xl font-black leading-[0.92] tracking-[-0.07em]">
            Договоренности живут рядом с заказом.
          </h1>
          <p class="mt-5 text-sm font-semibold leading-6 text-paper/68">
            Диалог создается автоматически после выбора исполнителя. Здесь удобно хранить детали,
            ссылки и будущие файлы по заказу.
          </p>
          <div class="mt-7 rounded-2xl border border-paper/20 bg-paper/[0.06] p-4">
            <p class="font-black">Непрочитанных сообщений: {{ unreadCount }}</p>
          </div>
        </aside>

        <section class="space-y-4">
          <div
            v-if="communication.isLoading"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6"
          >
            <span class="inline-flex items-center gap-3 font-black">
              <Loader2 class="animate-spin" :size="20" />
              Загружаем диалоги
            </span>
          </div>

          <article
            v-for="conversation in communication.conversations"
            :key="conversation.id"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 transition hover:-translate-y-1 hover:bg-white sm:p-6"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.16em] text-ink/55">
                  {{ conversation.type }} ·
                  {{
                    conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'новый'
                  }}
                </p>
                <h2 class="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {{ conversation.title }}
                </h2>
                <p class="mt-3 text-sm font-semibold leading-6 text-ink/68">
                  <span v-if="conversation.lastMessageBody">
                    {{ conversation.lastMessageSenderName || 'Система' }}:
                    {{ conversation.lastMessageBody }}
                  </span>
                  <span v-else>Сообщений пока нет</span>
                </p>
              </div>
              <div
                class="rounded-2xl border border-line bg-paper px-4 py-3 text-right"
                :class="conversation.unreadCount ? 'border-ink bg-bolt text-paper' : ''"
              >
                <p class="text-sm font-black">{{ conversation.unreadCount }}</p>
                <p class="mt-1 text-xs font-bold opacity-70">unread</p>
              </div>
            </div>

            <RouterLink
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
              :to="`/messages/${conversation.id}`"
            >
              Открыть диалог
              <ArrowRight :size="18" />
            </RouterLink>
          </article>

          <div
            v-if="!communication.isLoading && !communication.conversations.length"
            class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-8 text-center"
          >
            <Inbox class="mx-auto mb-4 text-ember" :size="36" />
            <p class="text-xl font-black">Диалогов пока нет</p>
            <p class="mt-2 text-sm font-semibold text-ink/65">
              Выберите исполнителя по заказу, и Fastik автоматически создаст рабочий чат.
            </p>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
