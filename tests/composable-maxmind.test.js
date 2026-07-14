// Tests for the module-level lookup dedup in
// frontend/composables/use-maxmind.js: concurrent same-key calls share one
// doLookup run, successful results cache for the session, null results and
// rejections stay retryable. Each test uses its own keys — the cache is
// module-global and never reset.
//
// Importing the composable pulls in the real Pinia store, which needs the
// same globalThis stubs as store.test.js — installed before the import below.

globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; },
};
globalThis.window = {
  location: { search: '' },
  addEventListener() {},
  innerWidth: 1024,
};
globalThis.document = {
  addEventListener() {},
  title: '',
  querySelector() { return null; },
  // @vue/runtime-dom (pulled in by vue-i18n) creates a <template> container
  // at module scope — a bare object satisfies the import-time call.
  createElement() { return {}; },
  documentElement: { classList: { toggle() {} } },
};

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { dedupedLookup } = await import('../frontend/composables/use-maxmind.js');

describe('dedupedLookup — in-flight sharing', () => {
  it('concurrent calls with the same key share one doLookup run', async () => {
    let calls = 0;
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const doLookup = async () => {
      calls++;
      await gate;
      return { asn: 'AS1' };
    };

    const first = dedupedLookup('inflight-key', doLookup);
    const second = dedupedLookup('inflight-key', doLookup);
    release();
    const [a, b] = await Promise.all([first, second]);

    assert.equal(calls, 1);
    assert.deepEqual(a, { asn: 'AS1' });
    assert.equal(a, b); // same shared result object
  });

  it('distinct keys run separate lookups', async () => {
    let calls = 0;
    const doLookup = async () => { calls++; return { asn: `AS${calls}` }; };

    const [a, b] = await Promise.all([
      dedupedLookup('distinct-key-1', doLookup),
      dedupedLookup('distinct-key-2', doLookup),
    ]);

    assert.equal(calls, 2);
    assert.notEqual(a.asn, b.asn);
  });
});

describe('dedupedLookup — result caching', () => {
  it('caches a non-null result for later calls', async () => {
    let calls = 0;
    const doLookup = async () => { calls++; return { asn: 'AS64500' }; };

    const first = await dedupedLookup('cached-key', doLookup);
    const second = await dedupedLookup('cached-key', doLookup);

    assert.equal(calls, 1);
    assert.equal(second, first);
  });

  it('does not cache null — a failed lookup is retried', async () => {
    let calls = 0;
    const doLookup = async () => {
      calls++;
      return calls === 1 ? null : { asn: 'AS64501' };
    };

    assert.equal(await dedupedLookup('null-key', doLookup), null);
    assert.deepEqual(await dedupedLookup('null-key', doLookup), { asn: 'AS64501' });
    assert.equal(calls, 2);
  });

  it('does not cache a rejection — the pending slot clears and retries', async () => {
    let calls = 0;
    const doLookup = async () => {
      calls++;
      if (calls === 1) throw new Error('boom');
      return { asn: 'AS64502' };
    };

    await assert.rejects(() => dedupedLookup('reject-key', doLookup), /boom/);
    assert.deepEqual(await dedupedLookup('reject-key', doLookup), { asn: 'AS64502' });
    assert.equal(calls, 2);
  });
});
