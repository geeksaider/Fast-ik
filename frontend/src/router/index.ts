import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AdminPage from '../pages/AdminPage.vue';
import ApplicationsPage from '../pages/ApplicationsPage.vue';
import ContestDetailPage from '../pages/ContestDetailPage.vue';
import ContestCreatePage from '../pages/ContestCreatePage.vue';
import ContestSubmitPage from '../pages/ContestSubmitPage.vue';
import ContestsPage from '../pages/ContestsPage.vue';
import CustomerPublicPage from '../pages/CustomerPublicPage.vue';
import CustomersPage from '../pages/CustomersPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import FaqPage from '../pages/FaqPage.vue';
import HomePage from '../pages/HomePage.vue';
import HowItWorksPage from '../pages/HowItWorksPage.vue';
import JobCreatePage from '../pages/JobCreatePage.vue';
import JobDetailPage from '../pages/JobDetailPage.vue';
import JobsPage from '../pages/JobsPage.vue';
import FinancePage from '../pages/FinancePage.vue';
import LegalPage from '../pages/LegalPage.vue';
import LevelRoadmapPage from '../pages/LevelRoadmapPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import ConversationPage from '../pages/ConversationPage.vue';
import MessagesPage from '../pages/MessagesPage.vue';
import MePage from '../pages/MePage.vue';
import NotFoundPage from '../pages/NotFoundPage.vue';
import NotificationsPage from '../pages/NotificationsPage.vue';
import OnboardingPage from '../pages/OnboardingPage.vue';
import OrderDetailPage from '../pages/OrderDetailPage.vue';
import OrdersPage from '../pages/OrdersPage.vue';
import PerformerPublicPage from '../pages/PerformerPublicPage.vue';
import PerformersPage from '../pages/PerformersPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import SearchPage from '../pages/SearchPage.vue';
import SupportPage from '../pages/SupportPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) {
      return false;
    }

    return savedPosition ?? { left: 0, top: 0 };
  },
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
      redirect: '/dashboard',
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
      path: '/contests/new',
      name: 'contests-new',
      component: ContestCreatePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/contests/:id',
      name: 'contests-detail',
      component: ContestDetailPage,
    },
    {
      path: '/contests/:id/submit',
      name: 'contests-submit',
      component: ContestSubmitPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/applications',
      name: 'applications',
      component: ApplicationsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/performers',
      name: 'performers',
      component: PerformersPage,
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
    {
      path: '/invites',
      redirect: '/applications?tab=invites',
    },
    {
      path: '/invites/sent',
      redirect: '/applications?tab=invites',
    },
    {
      path: '/settings',
      redirect: '/onboarding',
    },
    {
      path: '/me',
      name: 'me',
      component: MePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchPage,
    },
    {
      path: '/how-it-works',
      name: 'how-it-works',
      component: HowItWorksPage,
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqPage,
    },
    {
      path: '/support',
      name: 'support',
      component: SupportPage,
    },
    {
      path: '/legal/:slug(terms|privacy|contacts)',
      name: 'legal',
      component: LegalPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && auth.accessToken) {
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
