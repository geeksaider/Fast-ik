<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Zap } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const hiddenRoutes = new Set(['login', 'register']);
const showFooter = computed(() => !hiddenRoutes.has(String(route.name ?? '')));

const columns = computed(() => [
  {
    title: 'Платформа',
    links: [
      { to: '/jobs', label: 'Биржа' },
      { to: '/performers', label: 'Исполнители' },
      { to: '/customers', label: 'Заказчики' },
      { to: '/contests', label: 'Конкурсы' },
    ],
  },
  {
    title: 'О Fastik',
    links: [
      { to: '/how-it-works', label: 'Как это работает' },
      { to: '/faq', label: 'Частые вопросы' },
      { to: '/support', label: 'Поддержка' },
      { to: '/legal/contacts', label: 'Контакты' },
    ],
  },
  {
    title: 'Документы',
    links: [
      { to: '/legal/terms', label: 'Условия использования' },
      { to: '/legal/privacy', label: 'Политика конфиденциальности' },
      ...(auth.isAuthenticated
        ? [
            { to: '/dashboard', label: 'Обзор' },
            { to: '/settings', label: 'Настройки' },
          ]
        : [
            { to: '/register', label: 'Создать аккаунт' },
            { to: '/login', label: 'Войти' },
          ]),
    ],
  },
]);
</script>

<template>
  <footer v-if="showFooter" class="hidden px-4 pt-6 text-ink lg:block lg:px-8 lg:pb-8">
    <section
      class="mx-auto max-w-[1044px] border-t border-ink/25 py-6 sm:py-8"
    >
      <div
        class="mx-auto grid max-w-md gap-6 text-center sm:max-w-none sm:text-left lg:grid-cols-[minmax(0,1.05fr)_minmax(0,2fr)] lg:gap-10"
      >
        <div class="min-w-0">
          <RouterLink class="inline-flex items-center justify-center gap-3 sm:justify-start" to="/">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-paper">
              <Zap :size="24" stroke-width="2.7" />
            </span>
            <span class="min-w-0">
              <span class="block font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Fastik
              </span>
              <span class="block text-xs font-black uppercase tracking-[0.2em] text-ink/45">
                Marketplace
              </span>
            </span>
          </RouterLink>
          <p class="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-ink/58 sm:mx-0">
            Быстрые заказы, проверенные исполнители, рабочие диалоги и финансовый гарант.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:gap-x-10">
          <nav
            v-for="column in columns"
            :key="column.title"
            class="grid content-start justify-items-center gap-3 sm:justify-items-start"
            :aria-label="column.title"
          >
            <p class="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
              {{ column.title }}
            </p>
            <RouterLink
              v-for="link in column.links"
              :key="link.to"
              class="text-sm font-bold leading-5 text-ink/68 transition hover:text-ink"
              :to="link.to"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
        </div>
      </div>
    </section>
  </footer>
</template>
