<script setup lang="ts">
import { ref } from 'vue';
import { Mail, MessageCircle, Send } from 'lucide-vue-next';

const form = ref({ subject: '', message: '' });
const submitted = ref(false);

const submit = () => {
  if (!form.value.subject.trim() || !form.value.message.trim()) {
    return;
  }

  submitted.value = true;
  form.value = { subject: '', message: '' };
};

const channels = [
  {
    title: 'Email поддержки',
    text: 'admin@fastik.local · ответ в течение нескольких часов в рабочее время.',
    icon: Mail,
  },
  {
    title: 'Чат с менеджером',
    text: 'Откройте /messages и напишите аккаунту admin@fastik.local — мы подхватим обращение.',
    icon: MessageCircle,
  },
];
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Поддержка</p>
        <h1 class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl">
          Поможем разобраться
        </h1>
        <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
          Опишите задачу — мы ответим лично. Если вопрос общий, начните с раздела «Частые вопросы».
        </p>
      </aside>

      <section class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <form
          class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8"
          @submit.prevent="submit"
        >
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Обращение</p>
          <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Напишите нам</h2>

          <label class="mt-5 block">
            <span class="mb-2 block text-sm font-black">Тема обращения</span>
            <input
              v-model="form.subject"
              class="w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
              type="text"
              placeholder="Например: вопрос по гаранту"
              required
            />
          </label>
          <label class="mt-3 block">
            <span class="mb-2 block text-sm font-black">Сообщение</span>
            <textarea
              v-model="form.message"
              class="min-h-32 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-semibold outline-none focus:border-ink"
              placeholder="Расскажите ситуацию максимально подробно"
              required
            />
          </label>

          <button
            class="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink bg-ink px-5 py-3 font-black text-paper transition hover:bg-bolt"
            type="submit"
          >
            <Send :size="16" />
            Отправить обращение
          </button>

          <p v-if="submitted" class="mt-3 text-sm font-bold text-moss">
            Спасибо. Запрос принят, мы свяжемся с вами по указанному email.
          </p>
        </form>

        <aside class="grid gap-3">
          <article
            v-for="channel in channels"
            :key="channel.title"
            class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5"
          >
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <component :is="channel.icon" :size="20" />
            </span>
            <p class="mt-3 text-lg font-black">{{ channel.title }}</p>
            <p class="mt-1 text-sm font-semibold leading-5 text-ink/65">{{ channel.text }}</p>
          </article>
        </aside>
      </section>
    </section>
  </main>
</template>
