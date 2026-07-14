// Tests for the achievement engine (frontend/composables/use-achievement-engine.js):
// signed-in / already-achieved guards, rule evaluation against real app events,
// and the spaced dispatch queue into the store's single-slot pipeline.
//
// The engine pulls in the real Pinia store, which needs the same globalThis
// stubs as store.test.js — installed before the import below.

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
  documentElement: { classList: { toggle() {} } },
};

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope } from 'vue';

const { useMainStore } = await import('../frontend/store.js');
const { useAchievementEngine } = await import('../frontend/composables/use-achievement-engine.js');
const { emitAppEvent } = await import('../frontend/utils/app-events.js');

// Make the drain queue synchronous: the engine spaces dispatches with
// setTimeout, which we collapse so a whole queue flushes in one emit.
const realSetTimeout = globalThis.setTimeout;

let scope;
let store;
let dispatched;

beforeEach(() => {
  globalThis.setTimeout = (fn) => { fn(); return 0; };
  setActivePinia(createPinia());
  store = useMainStore();
  // Record every slug pushed into the single-slot pipeline.
  dispatched = [];
  store.$onAction(({ name, args }) => {
    if (name === 'setTriggerUpdateAchievements') dispatched.push(args[0]);
  });
  // Run the engine inside a scope so onScopeDispose unsubscribes between tests.
  scope = effectScope();
  scope.run(() => useAchievementEngine());
});

afterEach(() => {
  scope.stop();
  globalThis.setTimeout = realSetTimeout;
});

describe('useAchievementEngine — guards', () => {
  it('ignores events while signed out', () => {
    store.isSignedIn = false;
    emitAppEvent('shortcut:help-opened');
    assert.deepEqual(dispatched, []);
  });

  it('dispatches a matching rule when signed in', () => {
    store.isSignedIn = true;
    emitAppEvent('shortcut:help-opened');
    assert.deepEqual(dispatched, ['CleverTrickery']);
  });

  it('skips achievements that are already achieved', () => {
    store.isSignedIn = true;
    store.userAchievements.CleverTrickery.achieved = true;
    emitAppEvent('shortcut:help-opened');
    assert.deepEqual(dispatched, []);
  });

  it('respects the rule predicate', () => {
    store.isSignedIn = true;
    emitAppEvent('censorship:tested', { blocked: false });
    assert.deepEqual(dispatched, []);
    emitAppEvent('censorship:tested', { blocked: true });
    assert.deepEqual(dispatched, ['ItIsOpen']);
  });
});

describe('useAchievementEngine — queue', () => {
  it('one event can unlock several achievements, dispatched in rule order', () => {
    store.isSignedIn = true;
    emitAppEvent('speedtest:finished', { downloadSpeed: 1200, uploadSpeed: 260 });
    assert.deepEqual(dispatched, [
      'BarelyEnough', 'RapidPace', 'TorrentFlow', 'SteadyGoing', 'TooFastTooSimple',
    ]);
  });

  it('filters already-achieved slugs when several rules match at once', () => {
    store.isSignedIn = true;
    store.userAchievements.RapidPace.achieved = true;
    emitAppEvent('speedtest:finished', { downloadSpeed: 600, uploadSpeed: 0 });
    assert.deepEqual(dispatched, ['BarelyEnough']);
  });

  it('stops listening after the scope is disposed', () => {
    store.isSignedIn = true;
    scope.stop();
    emitAppEvent('shortcut:help-opened');
    assert.deepEqual(dispatched, []);
    scope = effectScope(); // afterEach stops it again harmlessly
  });
});
