<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

defineOptions({
  inheritAttrs: false,
});

defineProps<{
  modelValue?: string | number | boolean | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const updateValue = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
};
</script>

<template>
  <span class="relative block">
    <select
      :value="modelValue ?? ''"
      class="h-12 w-full appearance-none rounded-2xl border border-line bg-paper px-4 pr-11 font-semibold outline-none transition focus:border-ink"
      v-bind="$attrs"
      @change="updateValue"
    >
      <slot />
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/55"
      :size="18"
    />
  </span>
</template>
