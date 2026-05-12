<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Compass, Home, Rocket } from 'lucide-vue-next';
</script>

<template>
  <main class="min-h-screen px-4 py-12 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[2rem] border border-ink bg-paper/95 p-6 sm:p-10 lg:p-14"
    >
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-ember">Страница не найдена</p>
          <h1 class="mt-4 text-6xl font-black leading-[0.92] tracking-[-0.07em] sm:text-7xl">
            404
          </h1>
          <p class="mt-5 max-w-md text-sm font-semibold leading-6 text-ink/68">
            Кажется, такого адреса на Fastik нет. Возможно, страницу убрали или вы перешли по
            устаревшей ссылке.
          </p>

          <div class="mt-6 flex flex-wrap gap-2">
            <RouterLink
              class="inline-flex h-[42px] items-center gap-2 rounded-full border border-ink bg-ink px-5 text-sm font-black text-paper transition hover:bg-bolt"
              to="/"
            >
              <Home :size="16" />
              На главную
            </RouterLink>
            <RouterLink
              class="inline-flex h-[42px] items-center gap-2 rounded-full border border-ink bg-paper px-5 text-sm font-black transition hover:bg-[#fffaf0]"
              to="/jobs"
            >
              <Rocket :size="16" />
              Открыть биржу
            </RouterLink>
          </div>
        </div>

        <aside class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-6 sm:p-8">
          <Compass class="text-ember" :size="32" />
          <p class="mt-4 text-xs font-black uppercase tracking-[0.2em] text-ink/50">Что попробовать</p>
          <ul class="mt-3 space-y-2 text-sm font-semibold text-ink/72">
            <li>· Проверьте, что URL написан без опечаток.</li>
            <li>· Откройте каталог заказов или исполнителей с главной.</li>
            <li>· Если перешли из старой ссылки — сообщите нам в поддержку.</li>
          </ul>
        </aside>
      </div>
    </section>
  </main>
</template>
