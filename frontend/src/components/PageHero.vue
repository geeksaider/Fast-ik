<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow: string;
    title: string;
    subtitle?: string | null;
    text?: string | null;
  }>(),
  {
    subtitle: null,
    text: null,
  },
);
</script>

<template>
  <article class="min-w-0 rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
    <div
      class="grid gap-5 lg:items-start lg:justify-between"
      :class="$slots.actions ? 'lg:grid-cols-2' : 'lg:grid-cols-1'"
    >
      <div class="flex min-w-0 items-start gap-4">
        <slot name="media" />

        <div class="min-w-0" :class="$slots.actions ? 'lg:max-w-[30rem]' : 'max-w-3xl'">
          <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">
            {{ eyebrow }}
          </p>
          <h1 class="mt-3 text-[2.55rem] font-black leading-[1.03] tracking-[-0.04em] sm:text-5xl">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="mt-4 max-w-2xl text-sm font-semibold leading-6 text-paper/78">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div v-if="$slots.actions" class="grid w-full self-center gap-2 lg:justify-self-end">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>
