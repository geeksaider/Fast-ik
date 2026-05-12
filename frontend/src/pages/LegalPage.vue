<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

type LegalSection = { heading: string; body: string };
type LegalContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? 'terms'));

const content: Record<string, LegalContent> = {
  terms: {
    eyebrow: 'Юридическое',
    title: 'Условия использования',
    intro:
      'Документ описывает правила работы с сервисом Fastik для заказчиков, исполнителей и менеджеров платформы.',
    sections: [
      {
        heading: 'Регистрация',
        body: 'Регистрируясь, пользователь подтверждает достоверность указанных данных и согласие с публичной офертой. Один аккаунт может принадлежать одной роли — заказчику или исполнителю.',
      },
      {
        heading: 'Использование сервиса',
        body: 'Размещение заказов, откликов и публикации профиля производится в рамках действующего законодательства. Запрещены незаконные услуги, спам, обход гаранта, передача аккаунта третьим лицам.',
      },
      {
        heading: 'Финансовый гарант',
        body: 'Платформа обеспечивает удержание средств заказчика до приёмки результата работы. Все операции фиксируются в журнале транзакций.',
      },
      {
        heading: 'Споры и модерация',
        body: 'Стороны могут открыть спор по заказу. Решение принимается командой Fastik на основании переписки, материалов сделки и условий публичной оферты.',
      },
      {
        heading: 'Ограничение ответственности',
        body: 'Fastik выступает площадкой и не несёт ответственности за качество работ, выполненных исполнителями. Однако платформа обеспечивает справедливое разрешение спорных ситуаций.',
      },
      {
        heading: 'Контакты',
        body: 'По вопросам исполнения условий обращайтесь через раздел «Поддержка» или email, указанный в контактах.',
      },
    ],
  },
  privacy: {
    eyebrow: 'Юридическое',
    title: 'Политика конфиденциальности',
    intro:
      'Мы обрабатываем минимальный объём персональных данных, необходимый для работы сервиса, и не передаём их третьим лицам без согласия пользователя.',
    sections: [
      {
        heading: 'Какие данные собираем',
        body: 'Имя, email, заполненные поля профиля, история действий внутри сервиса, IP-адрес и техническая информация о браузере для безопасности.',
      },
      {
        heading: 'Зачем собираем',
        body: 'Для авторизации, отображения публичного профиля, расчёта уровней и истории сделок, а также для технической поддержки и развития платформы.',
      },
      {
        heading: 'Хранение и защита',
        body: 'Данные хранятся на защищённой инфраструктуре в Российской Федерации. Пароли — в виде криптографических хешей. Доступ к персональным данным ограничен.',
      },
      {
        heading: 'Cookie и аналитика',
        body: 'Мы используем технические cookie для авторизации. Маркетинговая и сторонняя аналитика подключаются только с согласия пользователя.',
      },
      {
        heading: 'Права пользователя',
        body: 'Вы можете запросить выгрузку или удаление своих данных через раздел «Настройки» либо через службу поддержки.',
      },
    ],
  },
  contacts: {
    eyebrow: 'Контакты',
    title: 'Связаться с Fastik',
    intro:
      'Мы открыты к сотрудничеству, обратной связи и техническим вопросам. Выберите удобный канал ниже.',
    sections: [
      {
        heading: 'Поддержка пользователей',
        body: 'Email: admin@fastik.local. Среднее время ответа — несколько часов в рабочее время.',
      },
      {
        heading: 'Партнёрство и интеграции',
        body: 'Email: partners@fastik.local. Расскажите о компании и идее сотрудничества — мы ответим в течение пары рабочих дней.',
      },
      {
        heading: 'Юридические вопросы',
        body: 'Email: legal@fastik.local. Для запросов в рамках публичной оферты, политики конфиденциальности и обработки персональных данных.',
      },
      {
        heading: 'Адрес',
        body: 'Юридический адрес и реквизиты компании появятся здесь после регистрации юридического лица.',
      },
    ],
  },
};

const current = computed<LegalContent>(() => content[slug.value] ?? content.terms);
</script>

<template>
  <main class="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-4 sm:p-6 lg:p-10"
    >
      <aside class="rounded-[1.5rem] border border-ink bg-ink p-6 text-paper sm:p-8">
        <p class="text-xs font-black uppercase tracking-[0.24em] text-paper/55">
          {{ current.eyebrow }}
        </p>
        <h1 class="mt-3 text-[2.45rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl">
          {{ current.title }}
        </h1>
        <p class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/68">
          {{ current.intro }}
        </p>
      </aside>

      <section class="mt-4 grid gap-3">
        <article
          v-for="section in current.sections"
          :key="section.heading"
          class="rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
        >
          <h2 class="text-xl font-black tracking-[-0.04em]">{{ section.heading }}</h2>
          <p class="mt-2 text-sm font-semibold leading-6 text-ink/68">{{ section.body }}</p>
        </article>
      </section>
    </section>
  </main>
</template>
