import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AdminPage from '../pages/AdminPage.vue';
import AnalyticsPage from '../pages/AnalyticsPage.vue';
import ContestDetailPage from '../pages/ContestDetailPage.vue';
import ContestsPage from '../pages/ContestsPage.vue';
import CustomerPublicPage from '../pages/CustomerPublicPage.vue';
import CustomersPage from '../pages/CustomersPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import HomePage from '../pages/HomePage.vue';
import JobCreatePage from '../pages/JobCreatePage.vue';
import JobDetailPage from '../pages/JobDetailPage.vue';
import JobsPage from '../pages/JobsPage.vue';
import FinancePage from '../pages/FinancePage.vue';
import LevelRoadmapPage from '../pages/LevelRoadmapPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import ConversationPage from '../pages/ConversationPage.vue';
import MessagesPage from '../pages/MessagesPage.vue';
import NotificationsPage from '../pages/NotificationsPage.vue';
import OnboardingPage from '../pages/OnboardingPage.vue';
import OrderDetailPage from '../pages/OrderDetailPage.vue';
import OrdersPage from '../pages/OrdersPage.vue';
import PerformerPublicPage from '../pages/PerformerPublicPage.vue';
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
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/level-roadmap',
      name: 'level-roadmap',
      component: LevelRoadmapPage,
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
    {
      path: '/contests',
      name: 'contests',
      component: ContestsPage,
    },
    {
      path: '/contests/:id',
      name: 'contests-detail',
      component: ContestDetailPage,
    },
    {
      path: '/performers/:id',
      name: 'performers-detail',
      component: PerformerPublicPage,
    },
    {
      path: '/customers',
      name: 'customers',
      component: CustomersPage,
    },
    {
      path: '/customers/:id',
      name: 'customers-detail',
      component: CustomerPublicPage,
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      name: 'orders-detail',
      component: OrderDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/finance',
      name: 'finance',
      component: FinancePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: MessagesPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/messages/:id',
      name: 'messages-detail',
      component: ConversationPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsPage,
      meta: { requiresAuth: true },
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
