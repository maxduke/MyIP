<template>
    <div>
        <div class="px-4 pt-3 text-xs text-muted-foreground">
            {{ t('reportPage.Col.Target') }}: <span class="font-mono">{{ section.target }}</span>
        </div>
        <div v-for="(probe, i) in section.probes" :key="i" class="border-b last:border-b-0">
            <div class="flex items-center gap-2 flex-wrap px-4 py-2.5 text-xs font-medium">
                <GeoCell :code="probe.countryCode" :detail="probe.city" />
                <template v-if="probe.network">
                    <span class="text-muted-foreground">·</span>
                    <span class="text-muted-foreground">{{ probe.network }}</span>
                </template>
                <Badge v-if="probe.asn" variant="success" class="font-mono font-normal shadow-none rounded-full">
                    AS{{ probe.asn }}
                </Badge>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="border-y bg-muted/30">
                            <th scope="col" :class="[TH_LEFT, 'w-8']">#</th>
                            <th v-if="probeMeta(probe).hasHost" scope="col" :class="TH_LEFT">{{ t('mtrtest.ColHost') }}</th>
                            <th v-if="probeMeta(probe).hasIp" scope="col" :class="TH_LEFT">{{ t('mtrtest.ColIP') }}</th>
                            <th v-if="probeMeta(probe).hasAsn" scope="col" :class="TH_LEFT">{{ t('mtrtest.ColASN') }}</th>
                            <th v-for="col in probeMeta(probe).columns" :key="col.key" scope="col" :class="TH_RIGHT">
                                {{ t('mtrtest.' + col.labelKey) }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="hop in probe.hops" :key="hop.n" class="hover:bg-muted/50 transition-colors">
                            <td class="px-3 py-2 font-mono tabular-nums text-muted-foreground">{{ hop.n }}</td>
                            <td v-if="probeMeta(probe).hasHost" class="px-3 py-2 font-mono max-w-56">
                                <span v-if="hop.host" class="block truncate" :title="hop.host">{{ hop.host }}</span>
                                <span v-else-if="!hop.ip" class="text-muted-foreground italic font-sans">{{ t('mtrtest.NoReply') }}</span>
                                <span v-else class="text-muted-foreground">—</span>
                            </td>
                            <td v-if="probeMeta(probe).hasIp" class="px-3 py-2 font-mono whitespace-nowrap">
                                <template v-if="hop.ip">{{ hop.ip }}</template>
                                <span v-else-if="!probeMeta(probe).hasHost && !hop.host"
                                    class="text-muted-foreground italic font-sans">{{ t('mtrtest.NoReply') }}</span>
                                <span v-else class="text-muted-foreground">—</span>
                            </td>
                            <td v-if="probeMeta(probe).hasAsn"
                                class="px-3 py-2 font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                                {{ hop.asn ? 'AS' + hop.asn : '—' }}
                            </td>
                            <td v-for="col in probeMeta(probe).columns" :key="col.key"
                                :class="[TD_NUM, hopCellClass(col, hop)]">
                                {{ formatHopCell(col, hop) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
// Read-only renderer for the mtrtest report section — the same adaptive hop
// table MtrTest.vue renders live (columns and identity cells follow whatever
// the probe's parsed hops actually carry).
import { useI18n } from 'vue-i18n';
import { Badge } from '@/components/ui/badge';
import GeoCell from './GeoCell.vue';
import { TH_LEFT, TH_RIGHT, TD_NUM } from './table-classes.js';

defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();

const HOP_COLUMNS = [
    { key: 'lossPct', labelKey: 'ColLoss', kind: 'loss' },
    { key: 'sntCount', labelKey: 'ColSent', kind: 'count' },
    { key: 'drop', labelKey: 'ColDrop', kind: 'count' },
    { key: 'rcv', labelKey: 'ColRecv', kind: 'count' },
    { key: 'lastMs', labelKey: 'ColLast', kind: 'ms' },
    { key: 'avgMs', labelKey: 'ColAvg', kind: 'ms' },
    { key: 'bestMs', labelKey: 'ColBest', kind: 'ms' },
    { key: 'worstMs', labelKey: 'ColWorst', kind: 'ms' },
    { key: 'stdevMs', labelKey: 'ColStDev', kind: 'ms' },
    { key: 'javgMs', labelKey: 'ColJitter', kind: 'ms' },
];

// Memoized per probe object — computed lazily on first render of each probe.
const metaCache = new WeakMap();
const probeMeta = (probe) => {
    if (!metaCache.has(probe)) {
        metaCache.set(probe, {
            columns: HOP_COLUMNS.filter((col) => probe.hops.some((hop) => hop[col.key] !== undefined)),
            hasHost: probe.hops.some((hop) => hop.host !== undefined),
            hasIp: probe.hops.some((hop) => hop.ip !== undefined),
            hasAsn: probe.hops.some((hop) => hop.asn != null),
        });
    }
    return metaCache.get(probe);
};

const formatHopCell = (col, hop) => {
    const value = hop[col.key];
    if (value === undefined) return '—';
    if (col.kind === 'loss') return `${value.toFixed(1)}%`;
    if (col.kind === 'ms') return value.toFixed(1);
    return String(value);
};

const hopCellClass = (col, hop) => {
    if (col.kind === 'loss') return hop[col.key] > 0 ? 'text-warning' : 'text-muted-foreground';
    if (col.kind === 'count') return 'text-muted-foreground';
    return '';
};
</script>
