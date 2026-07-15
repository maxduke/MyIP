<template>
    <div>
        <div class="px-4 pt-3 text-xs text-muted-foreground">
            {{ t('reportPage.Col.UniqueIPs') }}:
            <span class="font-mono font-semibold text-foreground">{{ section.uniqueIPCount }}</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs">
                <thead>
                    <tr class="border-b">
                        <th scope="col" :class="[TH_LEFT, 'w-8']">#</th>
                        <th scope="col" :class="TH_LEFT">{{ t('reportPage.Col.IP') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('reportPage.Col.Location') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('reportPage.Col.ISP') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="worker in section.workers" :key="worker.id" class="hover:bg-muted/50 transition-colors">
                        <td class="px-3 py-2 font-mono tabular-nums text-muted-foreground">{{ worker.id }}</td>
                        <td class="px-3 py-2 font-mono whitespace-nowrap">{{ worker.ip }}</td>
                        <td class="px-3 py-2"><GeoCell :code="worker.countryCode" /></td>
                        <td class="px-3 py-2 text-muted-foreground">{{ worker.org || '—' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
// Read-only renderer for the ruletest report section: per-endpoint egress
// IPs and the unique-IP headline (the split-routing signal).
import { useI18n } from 'vue-i18n';
import GeoCell from './GeoCell.vue';
import { TH_LEFT } from './table-classes.js';

defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();
</script>
