<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  BriefcaseBusiness,
  Edit3,
  ExternalLink,
  Loader2,
  LogOut,
  Star,
  UserRound,
} from 'lucide-vue-next';
import PersonAvatar from '../components/PersonAvatar.vue';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';
import { formatAmount, formatDisplayText } from '../lib/format';

const auth = useAuthStore();
const profile = useProfileStore();
const router = useRouter();

const summary = computed(() => profile.summary);
const isPerformer = computed(() => auth.user?.role === 'performer');
const isCustomer = computed(() => auth.user?.role === 'customer');
const headline = computed(() => {
  if (isPerformer.value) {
    return (
      summary.value?.performerProfile?.headline || summary.value?.performerProfile?.specialization
    );
  }

  if (isCustomer.value) {
    return summary.value?.customerProfile?.companyName;
  }

  return null;
});
const details = computed(() => {
  const items: Array<{ label: string; value: string | null | undefined }> = [
    { label: 'Email', value: auth.user?.email },
    { label: 'Город', value: summary.value?.profile?.city },
    { label: 'Telegram', value: summary.value?.profile?.telegram },
    { label: 'Сайт', value: summary.value?.profile?.websiteUrl },
  ];

  if (isPerformer.value) {
    items.push(
      { label: 'Специализация', value: summary.value?.performerProfile?.specialization },
      {
        label: 'Ставка',
        value: summary.value?.performerProfile?.hourlyRate
          ? formatAmount(summary.value.performerProfile.hourlyRate)
          : null,
      },
    );
  }

  if (isCustomer.value) {
    items.push(
      { label: 'Компания', value: summary.value?.customerProfile?.companyName },
      { label: 'Сайт компании', value: summary.value?.customerProfile?.companySite },
    );
  }

  return items.filter((item) => item.value);
});

const load = async () => {
  if (!auth.accessToken) {
    await router.push('/login');
    return;
  }

  await profile.load(auth.accessToken);
};

const logout = async () => {
  auth.logout();
  await router.push('/');
};

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
    <section
      class="mx-auto max-w-[1044px] rounded-[1.75rem] border border-ink bg-paper/95 p-4 sm:p-5 lg:p-6"
    >
      <div v-if="profile.isLoading" class="grid min-h-[420px] place-items-center">
        <span
          class="inline-flex items-center gap-3 rounded-full border border-ink bg-[#fffaf0] px-5 py-3 font-black"
        >
          <Loader2 class="animate-spin" :size="20" />
          Загружаем профиль
        </span>
      </div>

      <section v-else-if="summary" class="space-y-4">
        <article class="rounded-[1.5rem] border border-ink bg-ink p-5 text-paper sm:p-6">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 items-start gap-4">
              <PersonAvatar
                :name="summary.user.displayName"
                :src="summary.profile?.avatarUrl"
                tone="paper"
                size="lg"
              />
              <div class="min-w-0">
                <p class="text-sm font-black uppercase tracking-[0.2em] text-paper/55">
                  {{
                    isPerformer
                      ? 'Профиль исполнителя'
                      : isCustomer
                        ? 'Профиль заказчика'
                        : 'Профиль'
                  }}
                </p>
                <h1
                  class="mt-3 text-[2.55rem] font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl"
                >
                  {{ summary.user.displayName }}
                </h1>
                <p v-if="headline" class="mt-4 text-sm font-semibold leading-6 text-paper/78">
                  {{ headline }}
                </p>
                <p
                  class="mt-5 max-w-2xl whitespace-pre-line text-sm font-semibold leading-6 text-paper/68"
                >
                  {{
                    formatDisplayText(
                      summary.profile?.bio ||
                        'Профиль пока заполнен частично. Добавьте описание, фото и рабочие данные.',
                    )
                  }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 sm:justify-end">
              <RouterLink
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper bg-paper px-4 py-2 text-sm font-black text-ink transition hover:bg-ember hover:text-paper"
                to="/onboarding"
              >
                <Edit3 :size="16" />
                Редактировать
              </RouterLink>
              <button
                class="inline-flex items-center justify-center gap-2 rounded-full border border-paper/30 px-4 py-2 text-sm font-black text-paper/75 transition hover:border-paper hover:text-paper"
                type="button"
                @click="logout"
              >
                <LogOut :size="16" />
                Выйти
              </button>
            </div>
          </div>
        </article>

        <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <UserRound :size="22" class="text-ember" />
              Данные аккаунта
            </h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="item in details"
                :key="item.label"
                class="rounded-2xl border border-line bg-paper p-4"
              >
                <p class="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                  {{ item.label }}
                </p>
                <p class="mt-2 break-words text-sm font-black text-ink/80">{{ item.value }}</p>
              </div>
            </div>
          </article>

          <article class="rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink/50">Готовность</p>
            <p class="mt-2 text-5xl font-black tracking-[-0.07em]">
              {{ summary.progress.percentage }}%
            </p>
            <div class="mt-4 h-3 overflow-hidden rounded-full border border-line bg-paper">
              <div class="h-full bg-ember" :style="{ width: `${summary.progress.percentage}%` }" />
            </div>
            <RouterLink
              class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 text-sm font-black text-paper transition hover:bg-bolt"
              to="/onboarding"
            >
              Заполнить профиль
            </RouterLink>
          </article>
        </section>

        <section
          v-if="isPerformer"
          class="grid gap-4 rounded-[1.5rem] border border-ink bg-[#fffaf0] p-5 sm:p-6 lg:grid-cols-2"
        >
          <article>
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <Star :size="22" class="text-ember" />
              Навыки
            </h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="skill in summary.skills"
                :key="skill.id"
                class="rounded-full border border-line bg-paper px-3 py-1 text-sm font-black"
              >
                {{ skill.name }}
              </span>
              <span v-if="!summary.skills.length" class="text-sm font-semibold text-ink/60">
                Навыки пока не выбраны.
              </span>
            </div>
          </article>
          <article>
            <h2 class="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
              <BriefcaseBusiness :size="22" class="text-ember" />
              Портфолио
            </h2>
            <div class="mt-4 grid gap-2">
              <a
                v-for="item in summary.portfolio"
                :key="item.id"
                class="rounded-2xl border border-line bg-paper p-4 font-black transition hover:border-ink"
                :href="item.projectUrl || '#'"
                target="_blank"
                rel="noreferrer"
              >
                {{ item.title }}
                <ExternalLink v-if="item.projectUrl" class="ml-2 inline" :size="14" />
              </a>
              <span v-if="!summary.portfolio.length" class="text-sm font-semibold text-ink/60">
                Проекты пока не добавлены.
              </span>
            </div>
          </article>
        </section>
      </section>
    </section>
  </main>
</template>
