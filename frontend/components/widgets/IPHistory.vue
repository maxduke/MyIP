<template>
    <!-- Floating history button (bottom-right dock, between InfoMask and QueryIP) -->
    <JnTooltip v-if="enabled" :text="t('Tooltips.IPHistory')" side="left">
        <Button size="icon" type="button" variant="default" aria-label="IP History"
            class="rounded-full shadow-lg cursor-pointer" @click="openPanel">
            <History class="size-4" />
        </Button>
    </JnTooltip>

    <!-- History panel: left sheet, same shell as Preferences -->
    <Sheet :open="isOpen && enabled" @update:open="onOpenChange">
        <SheetContent side="left" :title="t('ipHistory.Title')"
            class="flex flex-col p-0 gap-0 w-full max-w-full md:w-[420px] md:max-w-[420px]">
            <!-- Header -->
            <header class="flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0">
                <h2 class="flex items-center gap-2 text-base font-semibold m-0">
                    <History class="size-4 text-muted-foreground" />
                    {{ t('ipHistory.Title') }}
                </h2>
                <SheetClose
                    class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" />
            </header>

            <!-- Content (scrollable) -->
            <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                <!-- Local-only privacy note -->
                <p class="text-xs text-muted-foreground leading-relaxed">
                    {{ t('ipHistory.Notes') }}
                </p>

                <!-- Empty state -->
                <div v-if="!hasHistory"
                    class="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                    <History class="size-8 opacity-40" />
                    {{ t('ipHistory.Empty') }}
                </div>

                <!-- Day groups, newest first -->
                <section v-for="group in sortedDays" :key="group.day">
                    <h3 class="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        {{ formatDay(group.day) }}
                    </h3>
                    <ul class="rounded-lg border bg-card divide-y">
                        <li v-for="entry in group.entries" :key="entry.ip" class="px-3 py-2.5 min-w-0">
                            <!-- IP row: flag + fit-to-width IP, blurred under InfoMask -->
                            <div class="flex items-center gap-2 min-w-0" :data-mask="maskAttr(entry.ip)">
                                <Icon v-if="entry.country" :icon="'circle-flags:' + entry.country.toLowerCase()"
                                    class="size-4 shrink-0" />
                                <Globe v-else class="size-4 shrink-0 text-muted-foreground" />
                                <FitText :text="entry.ip" :tiers="INLINE_TIERS" :title="entry.ip"
                                    class="font-mono min-w-0" />
                            </div>
                            <!-- Detail row: location + ASN -->
                            <div
                                class="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                                <span class="truncate">{{ entry.location || '—' }}</span>
                                <Badge v-if="entry.asn" variant="secondary" class="font-mono shrink-0">
                                    {{ entry.asn }}
                                </Badge>
                            </div>
                        </li>
                    </ul>
                </section>
            </div>

            <!-- Bottom bar: clear-all with two-step confirm. A <div>, not
                <footer> — style.css sizes the footer tag globally (100pt). -->
            <div v-if="hasHistory" class="flex items-center px-4 py-6 border-t shrink-0">
                <Button type="button" size="sm" :variant="confirmingClear ? 'destructive' : 'outline'"
                    class="w-full cursor-pointer" @click="onClearClick">
                    <Trash2 class="size-4" />
                    {{ confirmingClear ? t('ipHistory.ClearConfirm') : t('ipHistory.ClearAll') }}
                </Button>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup>
// IPHistory — local record of every IP detected while using the app.
// Data comes from store.allIPs via use-ip-history (localStorage, grouped by
// day, 90-day retention, never synced to the account). The panel mirrors the
// Preferences left-sheet shell; IPs respect the global InfoMask blur.
import { ref, computed, watch } from 'vue';
import { useMainStore } from '@/store';
import { useI18n } from 'vue-i18n';
import { trackEvent } from '@/utils/analytics';
import { useIpHistory } from '@/composables/use-ip-history.js';
import { createMaskGate } from '@/composables/use-info-mask.js';
import { INLINE_TIERS } from '@/composables/use-fit-text.js';
import FitText from '@/components/widgets/FitText.vue';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { JnTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/vue';
import { Globe, History, Trash2 } from '@lucide/vue';

const { t } = useI18n();
const store = useMainStore();

const { enabled, sortedDays, hasHistory, clearHistory } = useIpHistory({ store });
const maskAttr = createMaskGate(t);

// Sheet open state rides the shared openSheet slot (same as Preferences).
const isOpen = computed(() => store.openSheet === 'ipHistory');
const onOpenChange = (val) => {
    store.setOpenSheet(val ? 'ipHistory' : null);
};

const openPanel = () => {
    trackEvent('SideButtons', 'ToggleClick', 'IPHistory');
    store.toggleSheet('ipHistory');
};

// Localized day header, e.g. "Jul 8, 2026" / "2026年7月8日".
const lang = computed(() => store.lang);
const formatDay = (dayKey) => {
    const [y, m, d] = dayKey.split('-').map(Number);
    const locale = lang.value === 'zh' ? 'zh-CN' : lang.value;
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

// Clear-all is destructive: first click arms, second click within the armed
// window actually clears. Disarms when the panel closes.
const confirmingClear = ref(false);
const onClearClick = () => {
    if (!confirmingClear.value) {
        confirmingClear.value = true;
        return;
    }
    clearHistory();
    confirmingClear.value = false;
    trackEvent('SideButtons', 'Click', 'ClearIPHistory');
};
watch(isOpen, (open) => {
    if (!open) confirmingClear.value = false;
});
</script>
