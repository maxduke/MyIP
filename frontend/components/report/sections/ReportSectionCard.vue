<template>
    <Card>
        <CardContent class="p-0">
            <div class="flex items-center justify-between gap-2 px-4 py-3 border-b">
                <h2 class="text-sm font-semibold m-0">{{ t(SECTION_TITLE_KEYS[sectionId]) }}</h2>
                <span class="text-xs text-muted-foreground shrink-0">{{ testedAtDisplay }}</span>
            </div>
            <slot />
        </CardContent>
    </Card>
</template>

<script setup>
// Shared shell for every read-only report section: the section's usual site
// title on the left, its test timestamp (viewer's locale) on the right.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Card, CardContent } from '@/components/ui/card';
import { SECTION_TITLE_KEYS } from '@/utils/report-export.js';

const props = defineProps({
    sectionId: { type: String, required: true },
    testedAt: { type: String, default: '' },
});

const { t } = useI18n();
const testedAtDisplay = computed(() => {
    const stamp = Date.parse(props.testedAt);
    return Number.isNaN(stamp) ? '' : new Date(stamp).toLocaleString();
});
</script>
