<script setup lang="ts">
import SiteNavigation from './components/SiteNavigation.vue';
</script>

<template>
  <SiteNavigation />
  <div class="pb-24 md:pb-0">
    <RouterView />
  </div>
</template>
