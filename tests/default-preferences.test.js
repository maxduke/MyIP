import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_PREFERENCES,
  createDefaultPreferences,
  migrateLegacyPreferences,
} from '../frontend/data/default-preferences.js';

describe('DEFAULT_PREFERENCES', () => {
  it('is frozen', () => {
    assert.equal(Object.isFrozen(DEFAULT_PREFERENCES), true);
  });

  it('contains the full preference shape with expected defaults', () => {
    assert.deepEqual(DEFAULT_PREFERENCES, {
      theme: 'auto',
      connectivityMultipleTests: false,
      simpleMode: false,
      autoRunConnectivity: true,
      autoRunWebRTC: true,
      autoRunDnsLeak: true,
      popupConnectivityNotifications: false,
      ipCardsToShow: 2,
      ipGeoSource: 0,
      lang: 'auto',
      customConnectivityTargets: [],
    });
  });
});

describe('migrateLegacyPreferences()', () => {
  it('maps a retired autoStart=false onto all three per-module switches', () => {
    const out = migrateLegacyPreferences({ lang: 'zh', autoStart: false });
    assert.equal(out.autoRunConnectivity, false);
    assert.equal(out.autoRunWebRTC, false);
    assert.equal(out.autoRunDnsLeak, false);
    assert.equal(out.lang, 'zh', 'other keys carry over');
    assert.ok(!('autoStart' in out), 'retired key is dropped');
  });

  it('maps autoStart=true onto all three per-module switches', () => {
    const out = migrateLegacyPreferences({ autoStart: true });
    assert.equal(out.autoRunConnectivity, true);
    assert.equal(out.autoRunWebRTC, true);
    assert.equal(out.autoRunDnsLeak, true);
  });

  it('leaves the per-module switches unset when autoStart is absent', () => {
    const out = migrateLegacyPreferences({ theme: 'dark' });
    assert.ok(!('autoRunConnectivity' in out), 'falls through to defaults later');
    assert.equal(out.theme, 'dark');
  });

  it('returns an empty object for null / non-object input', () => {
    assert.deepEqual(migrateLegacyPreferences(null), {});
    assert.deepEqual(migrateLegacyPreferences(undefined), {});
    assert.deepEqual(migrateLegacyPreferences('nope'), {});
  });
});

describe('createDefaultPreferences()', () => {
  it('returns a writable copy with the same values', () => {
    const p = createDefaultPreferences();
    assert.deepEqual(p, DEFAULT_PREFERENCES);
    assert.equal(Object.isFrozen(p), false);
  });

  it('does not share reference with DEFAULT_PREFERENCES', () => {
    const p = createDefaultPreferences();
    assert.notEqual(p, DEFAULT_PREFERENCES);
    p.theme = 'dark';
    assert.equal(DEFAULT_PREFERENCES.theme, 'auto');
  });
});
