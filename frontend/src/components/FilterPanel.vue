<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    title?: string;
    columns?: string;
    resetLabel?: string;
    showReset?: boolean;
  }>(),
  {
    title: 'Фильтры',
    columns: 'lg:grid-cols-3',
    resetLabel: 'Сбросить',
    showReset: true,
  },
);

defineEmits<{
  reset: [];
}>();
</script>

<template>
  <section
    class="grid gap-3 rounded-[1.35rem] border border-ink bg-[#fffaf0] p-5 sm:p-6"
    :class="columns"
  >
    <div class="flex min-h-10 items-center justify-between gap-3 lg:col-span-full">
      <h3 class="text-sm font-black uppercase tracking-[0.22em] text-ink/60">{{ title }}</h3>
      <button
        v-if="showReset"
        class="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-black text-ink/62 transition hover:border-ink hover:text-ink"
        type="button"
        @click="$emit('reset')"
      >
        <RotateCcw :size="14" />
        {{ resetLabel }}
      </button>
    </div>

    <slot />
  </section>
</template>
