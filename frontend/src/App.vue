<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowUp } from 'lucide-vue-next';
import AppFooter from './components/AppFooter.vue';
import SiteNavigation from './components/SiteNavigation.vue';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const scrollY = ref(0);
const showScrollTop = computed(() => scrollY.value > 640);

const handleSessionExpired = () => {
  auth.logout();

  if (route.meta.requiresAuth) {
    void router.push({ name: 'login', query: { redirect: route.fullPath } });
  }
};

const updateScrollY = () => {
  scrollY.value = window.scrollY;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  window.addEventListener('fastik:session-expired', handleSessionExpired);
  window.addEventListener('scroll', updateScrollY, { passive: true });
  updateScrollY();
});

onBeforeUnmount(() => {
  window.removeEventListener('fastik:session-expired', handleSessionExpired);
  window.removeEventListener('scroll', updateScrollY);
});
</script>

<template>
  <SiteNavigation />
  <div class="pb-24 lg:pb-0">
    <RouterView />
  </div>
  <AppFooter />
  <button
    v-if="showScrollTop"
    class="fixed bottom-24 right-4 z-50 grid h-12 w-12 place-items-center rounded-2xl border border-ink bg-ink text-paper shadow-[0_12px_28px_rgba(23,23,23,0.18)] transition hover:bg-bolt sm:right-6 lg:bottom-6 lg:right-8"
    type="button"
    aria-label="Наверх"
    title="Наверх"
    @click="scrollToTop"
  >
    <ArrowUp :size="20" stroke-width="2.5" />
  </button>
</template>
