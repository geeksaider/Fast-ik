<script setup lang="ts">
import AppFooter from './components/AppFooter.vue';
import SiteNavigation from './components/SiteNavigation.vue';
</script>

<template>
  <SiteNavigation />
  <div class="pb-24 lg:pb-0">
    <RouterView />
  </div>
  <AppFooter />
</template>
