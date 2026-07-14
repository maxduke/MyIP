<template>
    <div>
        <div class="px-4 pt-3 text-xs text-muted-foreground">
            {{ t('reportPage.Col.Target') }}: <span class="font-mono">{{ section.target }}</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs">
                <thead>
                    <tr class="border-b">
                        <th scope="col" :class="TH_LEFT">{{ t('pingtest.Region') }}</th>
                        <th scope="col" :class="TH_RIGHT">{{ t('pingtest.MinDelay') }}</th>
                        <th scope="col" :class="TH_RIGHT">{{ t('pingtest.AvgDelay') }}</th>
                        <th scope="col" :class="TH_RIGHT">{{ t('pingtest.MaxDelay') }}</th>
                        <th scope="col" :class="TH_RIGHT">{{ t('pingtest.PacketLoss') }}</th>
                        <th scope="col" :class="TH_RIGHT">{{ t('pingtest.ReceivedPackets') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="(probe, i) in section.probes" :key="i" class="hover:bg-muted/50 transition-colors">
                        <td class="px-3 py-2"><GeoCell :code="probe.countryCode" /></td>
                        <td :class="TD_NUM">{{ fmt(probe.stats.min) }}</td>
                        <td :class="TD_NUM">{{ fmt(probe.stats.avg) }}</td>
                        <td :class="TD_NUM">{{ fmt(probe.stats.max) }}</td>
                        <td :class="[TD_NUM, (probe.stats.loss ?? 0) > 0 ? 'text-warning' : 'text-muted-foreground']">
                            {{ probe.stats.loss != null ? Math.round(probe.stats.loss) + '%' : '—' }}
                        </td>
                        <td :class="[TD_NUM, 'text-muted-foreground']">
                            {{ probe.stats.rcv ?? '—' }}/{{ probe.stats.total ?? '—' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
// Read-only renderer for the pingtest report section — same table language
// as the live Global Latency tool.
import { useI18n } from 'vue-i18n';
import GeoCell from './GeoCell.vue';
import { TH_LEFT, TH_RIGHT, TD_NUM } from './table-classes.js';

defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();
const fmt = (value) => (typeof value === 'number' ? value.toFixed(1) : '—');
</script>
