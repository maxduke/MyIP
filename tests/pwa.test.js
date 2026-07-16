// Tests for the PWA install-prompt eligibility gate (frontend/utils/pwa.js).

globalThis.localStorage = {
    _data: {},
    _throw: false,
    getItem(k) { if (this._throw) throw new Error('storage disabled'); return this._data[k] ?? null; },
    setItem(k, v) { if (this._throw) throw new Error('storage disabled'); this._data[k] = String(v); },
    clear() { this._data = {}; this._throw = false; },
};
globalThis.window = {
    matchMedia: () => ({ matches: globalThis.__pwaDisplayMode }),
    navigator: {},
};
globalThis.__pwaDisplayMode = false;

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { shouldOfferPwaInstall } from '../frontend/utils/pwa.js';

beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.__pwaDisplayMode = false;
});

describe('shouldOfferPwaInstall', () => {
    it('skips the very first visit but still counts it', () => {
        assert.equal(shouldOfferPwaInstall(), false);
        assert.equal(globalThis.localStorage.getItem('pwaVisitCount'), '1');
    });

    it('offers from the second visit onward', () => {
        shouldOfferPwaInstall();
        assert.equal(shouldOfferPwaInstall(), true);
        assert.equal(globalThis.localStorage.getItem('pwaVisitCount'), '2');
    });

    it('stops offering once the popup cap (2) is reached', () => {
        globalThis.localStorage.setItem('pwaVisitCount', '5');
        globalThis.localStorage.setItem('pwaPopupCount', '2');
        assert.equal(shouldOfferPwaInstall(), false);
    });

    it('never offers inside an installed PWA window', () => {
        globalThis.localStorage.setItem('pwaVisitCount', '5');
        globalThis.__pwaDisplayMode = true;
        assert.equal(shouldOfferPwaInstall(), false);
        // The visit still counts even when running as a PWA.
        assert.equal(globalThis.localStorage.getItem('pwaVisitCount'), '6');
    });

    it('returns false when storage is unavailable', () => {
        globalThis.localStorage._throw = true;
        assert.equal(shouldOfferPwaInstall(), false);
    });
});
