<script setup lang="ts">
import { RouterLink } from 'vue-router';
import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-vue-next';

type Step = { title: string; text: string };

const customerSteps: Step[] = [
  {
    title: 'Опубликуйте заказ',
    text: 'Опишите задачу, бюджет и срок. Можно пригласить исполнителя из каталога или дождаться откликов.',
  },
  {
    title: 'Выберите исполнителя',
    text: 'Сравните цены, сроки и портфолио. Выбор автоматически переводит заказ в работу и резервирует деньги.',
  },
  {
    title: 'Примите результат',
    text: 'Исполнитель присылает работу в чат. Принимаете — гарант передаёт оплату. Не подходит — отправляете на доработку или открываете спор.',
  },
];

const performerSteps: Step[] = [
  {
    title: 'Заполните профиль',
    text: 'Навыки, портфолио, ставка — это видят заказчики и платформа при подборе. Заполненная анкета даёт стартовый XP.',
  },
  {
    title: 'Откликайтесь или принимайте приглашения',
    text: 'Биржа открыта всем. Если заказчик зовёт лично — приглашение появится в «Работа».',
  },
  {
    title: 'Растите уровень',
    text: 'Каждый завершённый заказ, отзыв и удачное приглашение приближают к следующему LVL и Elite-интервью.',
  },
];

const pillars = [
  {
    title: 'Гарант сделки',
    text: 'Бюджет резервируется до приёмки. Исполнитель защищён от обмана, заказчик — от срыва сроков.',
    icon: ShieldCheck,
  },
  {
    title: 'Конкурсы',
    text: 'Альтернатива классическому заказу. Получаете несколько работ — выбираете лучшую, остальным выплачиваются призовые места.',
    icon: Trophy,
  },
  {
    title: 'Уровни и репутация',
    text: 'XP, отзывы и закрытые сделки формируют LVL. Высокий уровень открывает доступ к большим заказам и Elite-конкурсам.',
    icon: Sparkles,
  },
];
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8 lg:p-10">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">Как это работает</p>
        <h1
          class="mt-3 text-[2.55rem] font-black leading-[0.94] tracking-[-0.07em] sm:text-5xl lg:text-6xl"
        >
          Заказы, гарант, рост — всё в одном месте.
        </h1>
        <p class="mt-5 max-w-2xl text-sm font-semibold leading-6 text-paper/70 sm:text-base">
          Fastik — фриланс-площадка с финансовым гарантом и системой уровней. Заказчик получает
          предсказуемый результат, исполнитель — справедливую оплату и понятную дорожную карту
          роста.
        </p>
        <div class="mt-6 flex flex-wrap gap-2">
          <RouterLink
            class="inline-flex h-[42px] items-center gap-2 rounded-full border border-paper bg-ember px-5 text-sm font-black text-paper transition hover:bg-bolt"
            to="/register"
          >
            <Handshake :size="16" />
            Начать работу
          </RouterLink>
          <RouterLink
            class="inline-flex h-[42px] items-center gap-2 rounded-full border border-paper bg-paper/10 px-5 text-sm font-black text-paper transition hover:bg-paper/20"
            to="/jobs"
          >
            <BriefcaseBusiness :size="16" />
            Смотреть биржу
          </RouterLink>
        </div>
      </aside>

      <section class="mt-6 grid gap-4 lg:grid-cols-2">
        <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Заказчику</p>
          <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Три шага до результата</h2>

          <ol class="mt-5 space-y-3">
            <li
              v-for="(step, index) in customerSteps"
              :key="step.title"
              class="flex gap-3 rounded-2xl border border-line bg-paper p-4"
            >
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink font-black text-paper"
              >
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="min-w-0">
                <span class="block text-base font-black">{{ step.title }}</span>
                <span class="mt-1 block text-sm font-semibold leading-5 text-ink/65">
                  {{ step.text }}
                </span>
              </span>
            </li>
          </ol>
        </article>

        <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Исполнителю</p>
          <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Растите вместе с платформой</h2>

          <ol class="mt-5 space-y-3">
            <li
              v-for="(step, index) in performerSteps"
              :key="step.title"
              class="flex gap-3 rounded-2xl border border-line bg-paper p-4"
            >
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ember font-black text-paper"
              >
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="min-w-0">
                <span class="block text-base font-black">{{ step.title }}</span>
                <span class="mt-1 block text-sm font-semibold leading-5 text-ink/65">
                  {{ step.text }}
                </span>
              </span>
            </li>
          </ol>
        </article>
      </section>

      <section class="mt-6 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Что внутри</p>
        <h2 class="mt-2 text-3xl font-black tracking-[-0.06em]">Три опоры Fastik</h2>

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <article
            v-for="pillar in pillars"
            :key="pillar.title"
            class="rounded-2xl border border-line bg-paper p-5"
          >
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
              <component :is="pillar.icon" :size="20" />
            </span>
            <p class="mt-4 text-lg font-black">{{ pillar.title }}</p>
            <p class="mt-2 text-sm font-semibold leading-5 text-ink/65">{{ pillar.text }}</p>
          </article>
        </div>
      </section>

      <section class="mt-6 grid gap-4 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
        <div class="flex items-start gap-3">
          <CircleDollarSign class="text-ember" :size="28" />
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Гарант</p>
            <h3 class="mt-1 text-2xl font-black tracking-[-0.05em]">Как защищены деньги</h3>
          </div>
        </div>
        <p class="text-sm font-semibold leading-6 text-ink/65">
          После выбора исполнителя сумма заказа удерживается на стороне платформы. Деньги выходят
          из удержания только после приёмки. Если стороны не договорились — спор передаётся
          модератору, который принимает решение на основании переписки и результата работы.
        </p>
        <RouterLink
          class="inline-flex w-fit items-center gap-2 rounded-full border border-ink bg-paper px-4 py-2 text-sm font-black transition hover:bg-ink hover:text-paper"
          to="/faq"
        >
          <CheckCircle2 :size="16" />
          Частые вопросы
        </RouterLink>
      </section>
    </section>
  </main>
</template>
