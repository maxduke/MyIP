<template>
  <!-- Standalone privacy page at /privacy (shareable + crawlable) -->
  <div class="flex min-h-screen flex-col">
    <!-- Slim header -->
    <header class="sticky top-0 z-40 border-b bg-background/80 supports-[backdrop-filter:blur(0px)]:bg-background/60 backdrop-blur">
      <div class="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 h-14">
        <RouterLink to="/"
          class="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-lg font-semibold text-foreground no-underline hover:opacity-80 transition-opacity"
          aria-label="IPCheck.ing">
          <brandIcon />
          <span class="tracking-tight">
            <span class="font-bold">IP</span><span class="font-extralight">Check.</span><span
              class="font-extralight">ing</span>
          </span>
        </RouterLink>
        <span class="text-muted-foreground" aria-hidden="true">/</span>
        <span class="min-w-0 truncate font-medium">{{ t('about.Privacy') }}</span>
        <Button as-child variant="default" class="ml-auto shrink-0 cursor-pointer">
          <RouterLink to="/">
            <ArrowLeft class="size-4" /> {{ t('advancedtools.BackToHome') }}
          </RouterLink>
        </Button>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1">
      <!-- Brief loading state while the locale pack is fetched on first paint. -->
      <div v-if="!ready" class="flex justify-center py-20">
        <Spinner />
      </div>

      <article v-else class="mx-auto w-full max-w-[760px] px-4 md:px-6 py-8">
        <h1 class="mb-1 text-2xl md:text-3xl font-semibold tracking-tight">{{ t('privacy.Title') }}</h1>
        <p class="mb-6 text-xs text-muted-foreground">{{ t('privacy.UpdatedLabel') }}: {{ LAST_UPDATED }}</p>

        <p class="mb-8 leading-relaxed text-foreground/90">{{ t('privacy.Intro') }}</p>

        <!-- Sections are driven by `order` (computed from the feature flags).
             Each id maps to a privacy.sections.<id> block; paragraphs() and
             bullets() pull the arrays via tm() and resolve them with rt(). -->
        <section v-for="id in order" :key="id" class="mb-8">
          <h2 class="mb-2 text-lg font-semibold">{{ t(`privacy.sections.${id}.title`) }}</h2>
          <p v-for="(p, i) in paragraphs(id)" :key="i" class="mb-2 leading-relaxed text-foreground/85">
            {{ p }}
          </p>
          <ul v-if="bullets(id).length" class="mt-2 list-disc space-y-1.5 pl-5 text-foreground/85">
            <li v-for="(b, i) in bullets(id)" :key="i" class="leading-relaxed">{{ b }}</li>
          </ul>
        </section>
      </article>
    </main>

    <Footer />
  </div>
</template>

<script setup>
// Privacy page: assembles its sections from a feature-gated id list. The copy is
// a separate locale pack so it stays out of the main language bundle and is
// easier to maintain on its own.
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMainStore } from '@/store';
import { isAnalyticsEnabled } from '@/utils/analytics';
import { useDocumentMeta } from '@/composables/use-document-meta.js';
import Footer from '@/components/Footer.vue';
import brandIcon from '@/components/svgicons/Brand.vue';
import { ArrowLeft } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const { t, tm, rt, locale, mergeLocaleMessage } = useI18n();
const store = useMainStore();
const { isFireBaseSet } = storeToRefs(store);

// Bump when the policy text changes materially.
const LAST_UPDATED = '2026-06-28';

// Privacy copy is loaded on demand per locale (mirrors the security-checklist
// dataset pattern), then merged into i18n so t() / tm() can resolve it.
const privacyLoaders = {
    en: () => import('@/locales/privacy/en.json'),
    zh: () => import('@/locales/privacy/zh.json'),
    fr: () => import('@/locales/privacy/fr.json'),
    tr: () => import('@/locales/privacy/tr.json'),
};

const loaded = new Set();
const ready = ref(false);

async function loadPrivacy(loc) {
    if (!loaded.has(loc)) {
        const load = privacyLoaders[loc] || privacyLoaders.en;
        const { default: msgs } = await load();
        mergeLocaleMessage(loc, msgs);
        loaded.add(loc);
    }
    ready.value = true;
}

// Load the active locale (plus en as the i18n fallback) before showing copy, and
// re-load when the user switches language while on the page.
watch(locale, (loc) => {
    ready.value = false;
    Promise.all([loadPrivacy(loc), loc === 'en' ? null : loadPrivacy('en')]);
}, { immediate: true });

// Ordered section ids, gated on which collection actually happens here. The
// "why" section explains the reason for whichever collection is active.
const order = computed(() => {
    const ids = ['tools'];
    if (isAnalyticsEnabled) ids.push('analytics');
    if (isFireBaseSet.value) ids.push('account');
    if (isAnalyticsEnabled || isFireBaseSet.value) ids.push('why');
    ids.push('cookies');
    if (isAnalyticsEnabled) ids.push('eu');
    return ids;
});

// Resolve a section's paragraphs to display strings. Two sections are assembled
// per-flag rather than from a fixed array: "why" carries a reason per collection
// type, and "cookies" mentions the GA cookie only when analytics is on.
function paragraphs(id) {
    if (id === 'why') {
        const out = [];
        if (isAnalyticsEnabled) out.push(t('privacy.sections.why.analytics'));
        if (isFireBaseSet.value) out.push(t('privacy.sections.why.account'));
        return out;
    }
    if (id === 'cookies') {
        const out = [];
        if (isAnalyticsEnabled) out.push(t('privacy.sections.cookies.analytics'));
        out.push(t('privacy.sections.cookies.local'));
        return out;
    }
    const arr = tm(`privacy.sections.${id}.paragraphs`);
    return Array.isArray(arr) ? arr.map(rt) : [];
}

function bullets(id) {
    const arr = tm(`privacy.sections.${id}.bullets`);
    return Array.isArray(arr) ? arr.map(rt) : [];
}

// Page head: localized title + description, self-referential canonical. Title
// uses the always-loaded about.Privacy key; the description (from the on-demand
// pack) fills in once ready — watchEffect re-runs when it loads.
useDocumentMeta(() => ({
    title: `${t('about.Privacy')} · IPCheck.ing`,
    description: ready.value ? t('privacy.Intro') : '',
    canonical: `${window.location.origin}/privacy`,
}));
</script>
