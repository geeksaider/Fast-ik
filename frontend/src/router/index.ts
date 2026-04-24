import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DashboardPage from '../pages/DashboardPage.vue';
import HomePage from '../pages/HomePage.vue';
import JobCreatePage from '../pages/JobCreatePage.vue';
import JobDetailPage from '../pages/JobDetailPage.vue';
import JobsPage from '../pages/JobsPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import OnboardingPage from '../pages/OnboardingPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: JobsPage,
    },
    {
      path: '/jobs/new',
      name: 'jobs-new',
      component: JobCreatePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/jobs/:id',
      name: 'jobs-detail',
      component: JobDetailPage,
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    await auth.refreshCurrentUser();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }

  return true;
});
