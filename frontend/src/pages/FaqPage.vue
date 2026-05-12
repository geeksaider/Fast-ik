<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

type FaqItem = { question: string; answer: string };
type FaqGroup = { title: string; items: FaqItem[] };

const groups: FaqGroup[] = [
  {
    title: 'Аккаунт и регистрация',
    items: [
      {
        question: 'Чем отличается аккаунт заказчика и исполнителя?',
        answer:
          'Заказчик публикует задачи, выбирает исполнителей и оплачивает работу через гарант. Исполнитель откликается на задачи, выполняет их и получает оплату после приёмки. Один человек может зарегистрировать два аккаунта на разные email.',
      },
      {
        question: 'Можно ли поменять email или пароль?',
        answer:
          'Да. Откройте раздел «Настройки» — там доступна смена email, пароля и удаление аккаунта.',
      },
    ],
  },
  {
    title: 'Заказы и гарант',
    items: [
      {
        question: 'Как работает гарант?',
        answer:
          'Когда заказчик выбирает исполнителя, бюджет заказа автоматически удерживается. Деньги переходят исполнителю только после приёмки результата. Если работа не подошла — заказчик отправляет на доработку или открывает спор.',
      },
      {
        question: 'Что будет, если стороны не договорятся?',
        answer:
          'Любая сторона может открыть спор. Модератор Fastik изучает переписку и результат работы, после чего возвращает деньги заказчику или выплачивает исполнителю — в зависимости от ситуации.',
      },
      {
        question: 'Сколько берёт платформа?',
        answer:
          'Базовая комиссия — 0 на этапе MVP. Финальные условия мы зафиксируем перед запуском, до этого все сделки бесплатны для обеих сторон.',
      },
    ],
  },
  {
    title: 'Конкурсы',
    items: [
      {
        question: 'Чем конкурс отличается от заказа?',
        answer:
          'В конкурсе вы получаете несколько готовых работ от разных исполнителей и выбираете лучшую. Победитель получает основной приз, призёры — призовые места. Это удобно, когда важно сравнить варианты.',
      },
      {
        question: 'Кто может участвовать?',
        answer:
          'У каждого конкурса есть LVL-допуск. Это защищает заказчика от случайных работ — участвуют только исполнители достаточного уровня.',
      },
    ],
  },
  {
    title: 'Уровни и репутация',
    items: [
      {
        question: 'Что такое LVL и XP?',
        answer:
          'XP — это очки опыта, которые исполнитель получает за заполнение профиля, отклики, завершённые заказы и положительные отзывы. Набрав достаточно XP, исполнитель переходит на следующий LVL.',
      },
      {
        question: 'Зачем нужен высокий LVL?',
        answer:
          'Высокий LVL даёт доступ к крупным заказам и Elite-конкурсам, повышает доверие заказчиков и открывает возможность пройти финальное HR-интервью.',
      },
    ],
  },
  {
    title: 'Финансы',
    items: [
      {
        question: 'Как пополнить баланс?',
        answer:
          'В разделе «Финансы» доступна кнопка пополнения. На этапе MVP пополнение происходит в виде симуляции — реальные платёжные системы будут подключены при запуске.',
      },
      {
        question: 'Как вывести заработанные деньги?',
        answer:
          'Вывод средств появится в финальной версии Fastik. Сейчас отображается доступный баланс по завершённым заказам.',
      },
    ],
  },
];

const openKey = ref<string | null>(null);

const toggle = (key: string) => {
  openKey.value = openKey.value === key ? null : key;
};
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">FAQ</p>
        <h1 class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl">
          Частые вопросы
        </h1>
        <p class="mt-4 max-w-xl text-sm font-semibold leading-6 text-paper/68">
          Если ответа нет ниже — напишите в поддержку, мы дополним раздел.
        </p>
      </aside>

      <section
        v-for="group in groups"
        :key="group.title"
        class="mt-4 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-4 sm:p-6"
      >
        <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">{{ group.title }}</p>

        <div class="mt-3 grid gap-2">
          <article
            v-for="(item, index) in group.items"
            :key="`${group.title}-${index}`"
            class="rounded-2xl border border-line bg-paper"
          >
            <button
              class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-black transition hover:bg-[#fffaf0]"
              type="button"
              @click="toggle(`${group.title}-${index}`)"
            >
              <span class="min-w-0">{{ item.question }}</span>
              <ChevronDown
                :size="18"
                class="shrink-0 transition"
                :class="openKey === `${group.title}-${index}` ? 'rotate-180' : ''"
              />
            </button>
            <p
              v-if="openKey === `${group.title}-${index}`"
              class="border-t border-line/70 px-4 py-3 text-sm font-semibold leading-6 text-ink/68"
            >
              {{ item.answer }}
            </p>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
