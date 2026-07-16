// Tests for the sign-in hint flag (frontend/utils/auth-hint.js) — the
// synchronous localStorage signal that decides whether boot loads Firebase.

globalThis.localStorage = {
    _data: {},
    _throw: false,
    getItem(k) { if (this._throw) throw new Error('storage disabled'); return this._data[k] ?? null; },
    setItem(k, v) { if (this._throw) throw new Error('storage disabled'); this._data[k] = v; },
    clear() { this._data = {}; this._throw = false; },
};

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { readAuthHint, writeAuthHint } from '../frontend/utils/auth-hint.js';

beforeEach(() => {
    globalThis.localStorage.clear();
});

describe('auth-hint', () => {
    it('returns null when nothing is stored (unknown state)', () => {
        assert.equal(readAuthHint(), null);
    });

    it('round-trips signed-in and signed-out states', () => {
        writeAuthHint(true);
        assert.equal(readAuthHint(), '1');
        writeAuthHint(false);
        assert.equal(readAuthHint(), '0');
    });

    it('coerces truthy / falsy inputs', () => {
        writeAuthHint({});
        assert.equal(readAuthHint(), '1');
        writeAuthHint(undefined);
        assert.equal(readAuthHint(), '0');
    });

    it('treats unexpected stored values as unknown', () => {
        globalThis.localStorage.setItem('jn-auth-hint', 'yes');
        assert.equal(readAuthHint(), null);
    });

    it('degrades to unknown / no-op when storage throws', () => {
        globalThis.localStorage._throw = true;
        assert.equal(readAuthHint(), null);
        assert.doesNotThrow(() => writeAuthHint(true));
    });
});
