<template>
    <div>
        <!-- Summary line: resolver count + DNSSEC posture -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs border-b">
            <span class="text-muted-foreground">
                {{ t('reportPage.Col.Resolvers') }}:
                <span class="font-mono font-semibold text-foreground">{{ section.resolverCount }}</span>
            </span>
            <span :class="section.dnssec === 'ok' ? 'text-success' : 'text-warning'">
                {{ t(`reportPage.Dnssec.${section.dnssec}`) }}
            </span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs">
                <thead>
                    <tr class="border-b">
                        <th scope="col" :class="TH_LEFT">{{ t('enhanceddnsleaktest.Fields.ResolverIP') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('reportPage.Col.Location') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('reportPage.Col.ISP') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('enhanceddnsleaktest.Fields.Transport') }}</th>
                        <th scope="col" :class="TH_LEFT">{{ t('enhanceddnsleaktest.Fields.ECS') }}</th>
                        <th scope="col" :class="TH_RIGHT">DO</th>
                        <th scope="col" :class="TH_RIGHT">CD</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="(query, i) in section.queries" :key="i" class="hover:bg-muted/50 transition-colors">
                        <td class="px-3 py-2 font-mono whitespace-nowrap">{{ query.ip }}</td>
                        <td class="px-3 py-2"><GeoCell :code="query.countryCode" /></td>
                        <td class="px-3 py-2 text-muted-foreground">
                            {{ [query.asn, query.org].filter(Boolean).join(' · ') || '—' }}
                        </td>
                        <td class="px-3 py-2 uppercase text-muted-foreground">{{ query.transport || '—' }}</td>
                        <td class="px-3 py-2 font-mono">{{ query.ecs || '—' }}</td>
                        <td class="px-3 py-2 text-right" :class="query.do ? 'text-success' : 'text-warning'">
                            {{ query.do ? '✓' : '✗' }}
                        </td>
                        <td class="px-3 py-2 text-right" :class="query.cd ? 'text-warning' : 'text-muted-foreground'">
                            {{ query.cd ? '✓' : '—' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
// Read-only renderer for the enhanceddnsleak report section: resolver-level
// query rows plus the derived DNSSEC posture.
import { useI18n } from 'vue-i18n';
import GeoCell from './GeoCell.vue';
import { TH_LEFT, TH_RIGHT } from './table-classes.js';

defineProps({ section: { type: Object, required: true } });
const { t } = useI18n();
</script>
