<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  label: string;
}>();
</script>

<template>
  <label class="block">
    <span class="mb-2 block text-sm font-black">{{ label }}</span>
    <span class="relative block">
      <select
        class="h-12 w-full appearance-none rounded-2xl border border-line bg-paper px-4 pr-11 font-semibold outline-none transition focus:border-ink"
        v-bind="$attrs"
      >
        <slot />
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/55"
        :size="18"
      />
    </span>
  </label>
</template>
