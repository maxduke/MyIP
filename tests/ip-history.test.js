// Tests for the pure IP-history helpers behind the local (browser-only)
// IP detection history: parsing/sanitizing the localStorage payload, per-day
// merge with field back-fill, retention pruning, and render-order sorting.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    IP_HISTORY_RETENTION_DAYS,
    localDayKey,
    clampRetentionDays,
    createEmptyHistory,
    parseHistory,
    mergeIntoHistory,
    pruneHistory,
    sortedHistoryDays,
} from '../frontend/utils/ip-history.js';

const entry = (ip, extra = {}) => ({ ip, country: '', location: '', asn: '', org: '', ...extra });

describe('localDayKey', () => {
    it('formats a date as local YYYY-MM-DD', () => {
        assert.equal(localDayKey(new Date(2026, 6, 8)), '2026-07-08');
        assert.equal(localDayKey(new Date(2026, 0, 1)), '2026-01-01');
    });
});

describe('clampRetentionDays', () => {
    it('clamps to [1, 90] and rounds to whole days', () => {
        assert.equal(clampRetentionDays(30), 30);
        assert.equal(clampRetentionDays(0), 1);
        assert.equal(clampRetentionDays(-5), 1);
        assert.equal(clampRetentionDays(365), 90);
        assert.equal(clampRetentionDays(7.6), 8);
    });

    it('falls back to the default for non-numeric input', () => {
        assert.equal(clampRetentionDays(undefined), IP_HISTORY_RETENTION_DAYS);
        assert.equal(clampRetentionDays('abc'), IP_HISTORY_RETENTION_DAYS);
        assert.equal(clampRetentionDays(NaN), IP_HISTORY_RETENTION_DAYS);
    });
});

describe('parseHistory', () => {
    it('returns an empty history for null / empty input', () => {
        assert.deepEqual(parseHistory(null), createEmptyHistory());
        assert.deepEqual(parseHistory(''), createEmptyHistory());
    });

    it('returns an empty history for malformed JSON', () => {
        assert.deepEqual(parseHistory('{not json'), createEmptyHistory());
    });

    it('returns an empty history for wrong top-level shapes', () => {
        assert.deepEqual(parseHistory('"a string"'), createEmptyHistory());
        assert.deepEqual(parseHistory('{"version":1}'), createEmptyHistory());
        assert.deepEqual(parseHistory('{"days":[]}').days, {});
    });

    it('keeps well-formed entries and drops junk ones', () => {
        const raw = JSON.stringify({
            version: 1,
            days: {
                '2026-07-08': [
                    { ip: '1.1.1.1', country: 'us', location: 'United States', asn: 'AS13335', org: 'Cloudflare' },
                    { ip: 'not-an-ip' },
                    { country: 'de' },
                    null,
                ],
                'garbage-key': [{ ip: '8.8.8.8' }],
                '2026-07-07': 'not an array',
            },
        });
        const history = parseHistory(raw);
        assert.deepEqual(Object.keys(history.days), ['2026-07-08']);
        assert.deepEqual(history.days['2026-07-08'], [
            { ip: '1.1.1.1', country: 'us', location: 'United States', asn: 'AS13335', org: 'Cloudflare' },
        ]);
    });

    it('normalizes missing detail fields to empty strings', () => {
        const history = parseHistory(JSON.stringify({ days: { '2026-07-08': [{ ip: '1.1.1.1' }] } }));
        assert.deepEqual(history.days['2026-07-08'], [entry('1.1.1.1')]);
    });
});

describe('mergeIntoHistory', () => {
    it('adds new IPs to the given day', () => {
        const { history, changed } = mergeIntoHistory(
            createEmptyHistory(),
            [{ ip: '1.1.1.1', country: 'us' }],
            '2026-07-08',
        );
        assert.equal(changed, true);
        assert.deepEqual(history.days['2026-07-08'], [entry('1.1.1.1', { country: 'us' })]);
    });

    it('dedupes by IP within a day and back-fills empty fields', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-08'));
        const { history, changed } = mergeIntoHistory(
            state,
            [{ ip: '1.1.1.1', country: 'us', asn: 'AS13335' }],
            '2026-07-08',
        );
        assert.equal(changed, true);
        assert.deepEqual(history.days['2026-07-08'], [
            entry('1.1.1.1', { country: 'us', asn: 'AS13335' }),
        ]);
    });

    it('does not overwrite fields that already have a value', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1', org: 'First ISP' }], '2026-07-08'));
        const { history } = mergeIntoHistory(state, [{ ip: '1.1.1.1', org: 'Second ISP' }], '2026-07-08');
        assert.equal(history.days['2026-07-08'][0].org, 'First ISP');
    });

    it('reports changed=false when nothing new lands', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1', country: 'us' }], '2026-07-08'));
        const { history, changed } = mergeIntoHistory(state, [{ ip: '1.1.1.1', country: 'us' }], '2026-07-08');
        assert.equal(changed, false);
        assert.equal(history, state); // same reference — no needless persist
    });

    it('ignores invalid IPs and empty payloads', () => {
        const empty = createEmptyHistory();
        assert.equal(mergeIntoHistory(empty, [], '2026-07-08').changed, false);
        assert.equal(mergeIntoHistory(empty, [{ ip: 'Fetch Failed' }], '2026-07-08').changed, false);
        assert.equal(mergeIntoHistory(empty, null, '2026-07-08').changed, false);
    });

    it('keeps the same IP as separate records on different days', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-07'));
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-08'));
        assert.deepEqual(Object.keys(state.days).sort(), ['2026-07-07', '2026-07-08']);
    });

    it('does not mutate the input history', () => {
        const original = createEmptyHistory();
        mergeIntoHistory(original, [{ ip: '1.1.1.1' }], '2026-07-08');
        assert.deepEqual(original, createEmptyHistory());
    });
});

describe('pruneHistory', () => {
    it('keeps days inside the retention window, today included', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-08'));
        ({ history: state } = mergeIntoHistory(state, [{ ip: '8.8.8.8' }], '2026-04-10')); // 89 days before
        ({ history: state } = mergeIntoHistory(state, [{ ip: '9.9.9.9' }], '2026-04-09')); // 90 days before
        const { history, changed } = pruneHistory(state, '2026-07-08', IP_HISTORY_RETENTION_DAYS);
        assert.equal(changed, true);
        assert.deepEqual(Object.keys(history.days).sort(), ['2026-04-10', '2026-07-08']);
    });

    it('reports changed=false when nothing expires', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-08'));
        const { history, changed } = pruneHistory(state, '2026-07-08');
        assert.equal(changed, false);
        assert.equal(history, state);
    });

    it('handles a window crossing a year boundary', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2025-12-31'));
        const { history } = pruneHistory(state, '2026-01-05', 30);
        assert.deepEqual(Object.keys(history.days), ['2025-12-31']);
    });
});

describe('sortedHistoryDays', () => {
    it('returns day groups newest-first', () => {
        let state = createEmptyHistory();
        ({ history: state } = mergeIntoHistory(state, [{ ip: '1.1.1.1' }], '2026-07-06'));
        ({ history: state } = mergeIntoHistory(state, [{ ip: '8.8.8.8' }], '2026-07-08'));
        ({ history: state } = mergeIntoHistory(state, [{ ip: '9.9.9.9' }], '2026-07-07'));
        assert.deepEqual(sortedHistoryDays(state).map((g) => g.day), ['2026-07-08', '2026-07-07', '2026-07-06']);
    });
});
