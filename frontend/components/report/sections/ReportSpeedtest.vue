<template>
    <div class="p-4 space-y-4">
        <!-- Core metrics -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="metric in metrics" :key="metric.label" class="rounded-lg border bg-muted/30 px-3 py-2">
                <div class="text-xs text-muted-foreground">{{ metric.label }}</div>
                <div class="font-mono tabular-nums text-sm font-semibold">
                    {{ metric.value ?? '—' }}<span v-if="metric.value != null" class="ml-1 text-xs font-normal text-muted-foreground">{{ metric.unit }}</span>
                </div>
            </div>
        </div>

        <!-- Experience scores -->
        <div v-if="section.scores" class="flex flex-wrap gap-2">
            <Badge v-for="score in scoreItems" :key="score.label" variant="secondary" class="font-normal">
                {{ score.label }}: {{ score.value }}
                <span v-if="score.quality" class="text-muted-foreground">({{ score.quality }})</span>
            </Badge>
        </div>

        <!-- Test endpoint -->
        <div v-if="section.connection" class="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{{ t('reportPage.Col.Server') }}:</span>
            <span v-if="section.connection.colo" class="font-mono">{{ section.connection.colo }}</span>
            <GeoCell :code="section.connection.coloCountryCode" :detail="section.connection.coloCity" />
        </div>
    </div>
</template>

<script setup>
// Read-only renderer for the speedtest report section: metric tiles, the
// experience scores as badges, and the Cloudflare test endpoint.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Badge } from '@/components/ui/badge';
import GeoCell from './GeoCell.vue';

const props = defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();

const round1 = (value) => (typeof value === 'number' ? Math.round(value * 10) / 10 : null);

const metrics = computed(() => [
    { label: t('speedtest.Download'), value: round1(props.section.downloadMbps), unit: 'Mb/s' },
    { label: t('speedtest.Upload'), value: round1(props.section.uploadMbps), unit: 'Mb/s' },
    { label: t('speedtest.Latency'), value: round1(props.section.latencyMs), unit: 'ms' },
    { label: t('speedtest.Jitter'), value: round1(props.section.jitterMs), unit: 'ms' },
    { label: `${t('speedtest.loadedLatency')} ↓`, value: round1(props.section.loadedLatencyDownMs), unit: 'ms' },
    { label: `${t('speedtest.loadedLatency')} ↑`, value: round1(props.section.loadedLatencyUpMs), unit: 'ms' },
]);

const SCORE_LABEL_KEYS = { streaming: 'speedtest.videoStreaming', gaming: 'speedtest.gaming', rtc: 'speedtest.rtc' };
const scoreItems = computed(() => Object.entries(props.section.scores ?? {}).map(([key, value]) => ({
    label: t(SCORE_LABEL_KEYS[key] ?? key),
    value,
    quality: props.section.qualities?.[key] ? t(`speedtest.quality.${props.section.qualities[key]}`) : '',
})));
</script>
