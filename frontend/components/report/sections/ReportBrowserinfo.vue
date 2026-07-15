<template>
    <ul class="divide-y text-xs">
        <li v-for="row in rows" :key="row.label" class="flex items-center justify-between gap-4 px-4 py-2">
            <span class="text-muted-foreground shrink-0">{{ row.label }}</span>
            <span class="text-right min-w-0 truncate" :title="row.value">{{ row.value }}</span>
        </li>
    </ul>
</template>

<script setup>
// Read-only renderer for the browserinfo report section — a compact
// label/value list reusing the Browser Information tool's field labels.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();

const nameVersion = (part) => (part ? [part.name, part.version].filter(Boolean).join(' ') : '');

const rows = computed(() => {
    const s = props.section;
    return [
        { label: t('browserinfo.browser.browserName'), value: nameVersion(s.browser) },
        { label: t('browserinfo.browser.osName'), value: nameVersion(s.os) },
        { label: t('browserinfo.browser.engineName'), value: nameVersion(s.engine) },
        { label: t('browserinfo.browser.timezone'), value: s.timezone },
        { label: t('browserinfo.browser.languages'), value: s.languages?.join(', ') },
        {
            label: t('browserinfo.browser.display'),
            value: s.display ? `${s.display.width}×${s.display.height} @${s.display.pixelRatio}x` : '',
        },
        {
            label: t('browserinfo.browser.connection'),
            value: s.connection
                ? [s.connection.effectiveType, s.connection.rtt != null ? `RTT ${s.connection.rtt}ms` : '']
                    .filter(Boolean).join(' · ')
                : '',
        },
    ].filter((row) => row.value);
});
</script>
