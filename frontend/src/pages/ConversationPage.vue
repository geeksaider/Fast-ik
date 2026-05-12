<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useCommunicationStore } from '../stores/communication';
import { formatDateTime, formatDisplayText, formatSystemLabel } from '../lib/format';
import type { SendMessageAttachmentPayload } from '../lib/api';

const auth = useAuthStore();
const communication = useCommunicationStore();
const route = useRoute();
const router = useRouter();
const messagesEnd = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const localError = ref<string | null>(null);

const form = reactive({ body: '' });
const attachments = ref<SendMessageAttachmentPayload[]>([]);
const conversationId = computed(() => String(route.params.id));
const conversation = computed(() => communication.currentConversation);
const maxAttachmentSize = 262_144;
const maxAttachments = 3;

const scrollToBottom = async (behavior: ScrollBehavior = 'smooth') => {
  await nextTick();
  messagesEnd.value?.scrollIntoView({ block: 'end', behavior });
};

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await communication.loadConversation(auth.accessToken, conversationId.value);
  await scrollToBottom('auto');
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });

const addFiles = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  localError.value = null;

  if (attachments.value.length + files.length > maxAttachments) {
    localError.value = `Можно прикрепить до ${maxAttachments} файлов за сообщение.`;
    input.value = '';
    return;
  }

  for (const file of files) {
    if (file.size > maxAttachmentSize) {
      localError.value = `Файл «${file.name}» больше 256 КБ. В рабочем чате пока принимаем только небольшие вложения.`;
      input.value = '';
      return;
    }

    const fileUrl = await readFileAsDataUrl(file);
    attachments.value.push({
      fileName: file.name,
      fileUrl,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
  }

  input.value = '';
};

const removeAttachment = (index: number) => {
  attachments.value = attachments.value.filter((_, attachmentIndex) => attachmentIndex !== index);
};

const send = async () => {
  if (!auth.accessToken || (!form.body.trim() && !attachments.value.length)) {
    return;
  }

  localError.value = null;
  await communication.sendMessage(
    auth.accessToken,
    conversationId.value,
    form.body,
    attachments.value,
  );
  form.body = '';
  attachments.value = [];
  await scrollToBottom('smooth');
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
          class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
          :to="`/orders/${conversation.orderId}`"
        >
          <BriefcaseBusiness :size="16" />
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
            {{ formatSystemLabel(conversation.type) }}
          </p>
          <h1 class="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em]">
            {{ formatDisplayText(conversation.title) }}
          </h1>
          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="participant in conversation.participants"
              :key="participant.userId"
              class="rounded-full border border-paper/25 px-3 py-1 text-xs font-black uppercase tracking-[0.14em]"
            >
              {{ participant.displayName }} · {{ formatSystemLabel(participant.role) }}
            </span>
          </div>
        </article>

        <section class="mt-5 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-4 sm:p-5">
          <div class="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            <article
              v-for="message in conversation.messages"
              :key="message.id"
              class="flex transition duration-300 ease-out"
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
                  {{ message.senderName }} · {{ formatDateTime(message.createdAt) }}
                </p>
                <p class="mt-2 whitespace-pre-line text-sm font-semibold leading-6">
                  {{ message.body }}
                </p>
                <div v-if="message.attachments.length" class="mt-3 grid gap-2">
                  <a
                    v-for="attachment in message.attachments"
                    :key="attachment.id"
                    class="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm font-black transition hover:opacity-80"
                    :class="
                      message.senderId === auth.user?.id
                        ? 'border-paper/25 bg-paper/10 text-paper'
                        : 'border-line bg-[#fffaf0] text-ink'
                    "
                    :href="attachment.fileUrl"
                    :download="attachment.fileName"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <FileText class="shrink-0" :size="17" />
                      <span class="min-w-0 truncate">{{ attachment.fileName }}</span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2 opacity-70">
                      {{ formatFileSize(attachment.sizeBytes) }}
                      <Download :size="16" />
                    </span>
                  </a>
                </div>
              </div>
            </article>
            <div ref="messagesEnd" />
          </div>

          <form class="mt-5 space-y-3 border-t border-ink pt-5" @submit.prevent="send">
            <textarea
              v-model="form.body"
              class="min-h-28 w-full rounded-2xl border border-ink bg-paper px-4 py-3 font-semibold outline-none focus:bg-white"
              placeholder="Напишите сообщение, ссылку или договоренность по заказу"
            />
            <div v-if="attachments.length" class="grid gap-2">
              <div
                v-for="(attachment, index) in attachments"
                :key="`${attachment.fileName}-${index}`"
                class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
              >
                <span class="flex min-w-0 items-center gap-2 text-sm font-black">
                  <FileText class="shrink-0" :size="17" />
                  <span class="truncate">{{ attachment.fileName }}</span>
                  <span class="shrink-0 text-ink/45">{{
                    formatFileSize(attachment.sizeBytes)
                  }}</span>
                </span>
                <button
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink transition hover:bg-ink hover:text-paper"
                  type="button"
                  @click="removeAttachment(index)"
                >
                  <X :size="15" />
                </button>
              </div>
            </div>
            <p
              v-if="localError || communication.error"
              class="rounded-2xl border border-ember bg-ember/10 px-4 py-3 text-sm font-black text-ember"
            >
              {{ localError || communication.error }}
            </p>
            <input ref="fileInput" class="hidden" type="file" multiple @change="addFiles" />
            <div class="grid gap-3 sm:grid-cols-[auto_1fr]">
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-black transition hover:bg-white"
                type="button"
                @click="fileInput?.click()"
              >
                <Paperclip :size="18" />
                Прикрепить файл
              </button>
              <button
                class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ember px-5 py-3 font-black text-paper transition hover:bg-bolt disabled:opacity-50"
                type="submit"
                :disabled="communication.isSaving || (!form.body.trim() && !attachments.length)"
              >
                <Send :size="18" />
                {{ communication.isSaving ? 'Отправляем...' : 'Отправить' }}
              </button>
            </div>
          </form>
        </section>

        <p
          class="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-[#fffaf0] p-4 text-sm font-bold leading-6 text-ink/68"
        >
          <ShieldCheck class="mt-1 shrink-0 text-moss" :size="18" />
          Файлы прикрепляются к сообщению: до 3 файлов и до 512 КБ каждый. Этого достаточно для
          брифов, ссылок и небольших рабочих материалов.
        </p>
      </section>
    </section>
  </main>
</template>
