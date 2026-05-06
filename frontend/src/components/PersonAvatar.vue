<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    src?: string | null;
    online?: boolean;
    tone?: 'ink' | 'ember' | 'moss' | 'bolt' | 'paper';
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    src: null,
    online: false,
    tone: 'paper',
    size: 'md',
  },
);

const initials = computed(() =>
  props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
);

const sizeClass = computed(() => {
  const map = {
    sm: 'h-11 w-11 text-lg rounded-2xl',
    md: 'h-16 w-16 text-2xl rounded-[1.15rem]',
    lg: 'h-20 w-20 text-3xl rounded-[1.35rem]',
  };

  return map[props.size];
});

const statusClass = computed(() => {
  const map = {
    sm: 'right-0 top-0 h-2.5 w-2.5',
    md: 'right-0 top-0 h-3 w-3',
    lg: 'right-0 top-0 h-3.5 w-3.5',
  };

  return map[props.size];
});

const toneClass = computed(() => {
  const map = {
    ink: 'bg-ink text-paper',
    ember: 'bg-ember text-paper',
    moss: 'bg-moss text-paper',
    bolt: 'bg-bolt text-paper',
    paper: 'bg-paper text-ink',
  };

  return map[props.tone];
});
</script>

<template>
  <span
    class="relative inline-grid shrink-0 place-items-center border border-ink font-black uppercase tracking-[-0.04em]"
    :class="[sizeClass, toneClass]"
    :aria-label="name"
  >
    <img v-if="src" class="h-full w-full rounded-[inherit] object-cover" :src="src" :alt="name" />
    <span v-else>{{ initials || 'F' }}</span>
    <span
      v-if="online"
      class="absolute translate-x-[28%] -translate-y-[28%] rounded-full bg-moss ring-2 ring-paper"
      :class="statusClass"
      aria-hidden="true"
    />
  </span>
</template>
