<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowLeft, BriefcaseBusiness, Loader2, Send, ShieldCheck } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { formatDate } from '../lib/format';

const auth = useAuthStore();
const communication = useCommunicationStore();
const route = useRoute();
const router = useRouter();
const messagesEnd = ref<HTMLElement | null>(null);

const form = reactive({ body: '' });
const conversationId = computed(() => String(route.params.id));
const conversation = computed(() => communication.currentConversation);

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await communication.loadConversation(auth.accessToken, conversationId.value);
  await nextTick();
  messagesEnd.value?.scrollIntoView({ block: 'end' });
};

const send = async () => {
  if (!auth.accessToken || !form.body.trim()) {
    return;
  }

  await communication.sendMessage(auth.accessToken, conversationId.value, form.body);
  form.body = '';
  await nextTick();
  messagesEnd.value?.scrollIntoView({ block: 'end' });
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-5xl rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-8"
    >
      <header
        class="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-center md:justify-between"
      >
        <RouterLink
          to="/messages"
          class="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ink/65 transition hover:text-ink"
        >
          <ArrowLeft :size="16" />
          К диалогам
        </RouterLink>
        <RouterLink
          v-if="conversation?.orderId"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
          :to="`/orders/${conversation.orderId}`"
        >
          <BriefcaseBusiness :size="18" />
          Открыть заказ
        </RouterLink>
      </header>

      <div v-if="communication.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем диалог
        </span>
      </div>

      <section v-else-if="conversation" class="py-7">
        <article class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">
            {{ conversation.type }} chat
          </p>
          <h1 class="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em]">
            {{ conversation.title }}
          </h1>
          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="participant in conversation.participants"
              :key="participant.userId"
              class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.14em]"
            >
              {{ participant.displayName }} · {{ participant.role }}
            </span>
          </div>
        </article>

        <section class="mt-5 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
          <div class="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            <article
              v-for="message in conversation.messages"
              :key="message.id"
              class="flex"
              :class="message.senderId === auth.user?.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[86%] rounded-[1.25rem] border p-4 sm:max-w-[72%]"
                :class="[
                  message.kind === 'system'
                    ? 'border-line bg-paper text-ink/70'
                    : message.senderId === auth.user?.id
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line bg-paper text-ink',
                ]"
              >
                <p class="text-xs font-black uppercase tracking-[0.14em] opacity-60">
                  {{ message.senderName }} · {{ formatDate(message.createdAt) }}
                </p>
                <p class="mt-2 whitespace-pre-line text-sm font-semibold leading-6">
                  {{ message.body }}
                </p>
              </div>
            </article>
            <div ref="messagesEnd" />
          </div>

          <form class="mt-5 space-y-3 border-t border-ink pt-5" @submit.prevent="send">
            <textarea
              v-model="form.body"
              class="min-h-28 w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none focus:bg-white"
              placeholder="Напишите сообщение, ссылку или договоренность по заказу"
              required
            />
            <button
              class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt"
              type="submit"
              :disabled="communication.isSaving"
            >
              <Send :size="18" />
              Отправить
            </button>
          </form>
        </section>

        <p
          class="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-[#fffaf0] p-4 text-sm font-bold leading-6 text-ink/68"
        >
          <ShieldCheck class="mt-1 shrink-0 text-moss" :size="18" />
          В этом блоке файлы пока отмечены как будущий слой. Основа уже есть: рабочий диалог,
          уведомления и привязка к order/escrow.
        </p>
      </section>
    </section>
  </main>
</template>
