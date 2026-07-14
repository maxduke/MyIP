// Tests for the report collector (frontend/composables/use-report-collector.js):
// event-driven accumulation of schema-shaped section snapshots, latest-wins
// overwrites, null-builder payloads ignored, and unsubscribe on scope dispose.
// Unlike the achievement engine it needs no Pinia store — just Vue reactivity.

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { effectScope } from 'vue';

import {
    useReportCollector,
    useCollectedReport,
    resetCollectedReport,
} from '../frontend/composables/use-report-collector.js';
import { emitAppEvent } from '../frontend/utils/app-events.js';

const SPEEDTEST_PAYLOAD = {
    downloadSpeed: 100, uploadSpeed: 20, latency: 15, jitter: 2,
    downLoadedLatency: 40, upLoadedLatency: 60,
    scores: null, qualities: null,
    connection: { ip: '104.16.0.1', colo: 'HKG', coloCountryCode: 'HK', coloCity: 'Hong Kong' },
};

let scope;

beforeEach(() => {
    resetCollectedReport();
    scope = effectScope();
    scope.run(() => useReportCollector());
});

afterEach(() => {
    scope.stop();
    resetCollectedReport();
});

describe('report collector', () => {
    it('stores a schema-shaped snapshot with testedAt when a test finishes', () => {
        emitAppEvent('speedtest:finished', SPEEDTEST_PAYLOAD);
        const { sections, availableSectionIds } = useCollectedReport();
        assert.deepEqual(availableSectionIds.value, ['speedtest']);
        assert.equal(sections.speedtest.downloadMbps, 100);
        assert.equal(Number.isNaN(Date.parse(sections.speedtest.testedAt)), false);
    });

    it('latest emit wins', () => {
        emitAppEvent('speedtest:finished', SPEEDTEST_PAYLOAD);
        emitAppEvent('speedtest:finished', { ...SPEEDTEST_PAYLOAD, downloadSpeed: 250 });
        const { sections } = useCollectedReport();
        assert.equal(sections.speedtest.downloadMbps, 250);
    });

    it('ignores payloads the builder rejects, keeping the previous snapshot', () => {
        emitAppEvent('speedtest:finished', SPEEDTEST_PAYLOAD);
        emitAppEvent('speedtest:finished', {}); // builder → null
        const { sections } = useCollectedReport();
        assert.equal(sections.speedtest.downloadMbps, 100);
    });

    it('ignores unrelated bus events entirely', () => {
        emitAppEvent('whois:lookup', { query: 'example.com' });
        emitAppEvent('ip-source:exhausted', { source: 'ipip', ipVersion: 'v4' });
        const { availableSectionIds } = useCollectedReport();
        assert.deepEqual(availableSectionIds.value, []);
    });

    it('accumulates independent sections side by side', () => {
        emitAppEvent('speedtest:finished', SPEEDTEST_PAYLOAD);
        emitAppEvent('ruletest:finished', {
            uniqueIPCount: 1,
            workers: [{ id: 1, ip: '1.2.3.4', country_code: 'US', org: 'CF' }],
        });
        const { availableSectionIds } = useCollectedReport();
        assert.deepEqual([...availableSectionIds.value].sort(), ['ruletest', 'speedtest']);
    });

    it('stops listening once its scope is disposed', () => {
        scope.stop();
        emitAppEvent('speedtest:finished', SPEEDTEST_PAYLOAD);
        const { availableSectionIds } = useCollectedReport();
        assert.deepEqual(availableSectionIds.value, []);
        // beforeEach of the next test re-creates a scope; afterEach's stop
        // on an already-stopped scope is a no-op.
        scope = effectScope();
    });
});
