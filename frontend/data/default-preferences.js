// Default user preferences
//
// When userPreferences key is missing or missing fields in localStorage, use this default value as fallback.
// store.loadPreferences() will merge localStorage override values.

// Versioned localStorage key for userPreferences; bump the suffix when stored
// values shouldn't merge onto a changed default. Shared with locales/i18n.js
// (which reads the active language from storage at boot) so the key can't drift.
export const PREFS_STORAGE_KEY = 'userPreferences_v7';
export const LEGACY_PREFS_KEYS = ['userPreferences_v6', 'userPreferences'];

export const DEFAULT_PREFERENCES = Object.freeze({
  theme: 'auto', // auto | light | dark
  connectivityMultipleTests: false,
  simpleMode: false,
  // Per-module startup auto-run switches. IP info has no switch — it always
  // runs on load. See use-refresh-orchestrator.js.
  autoRunConnectivity: true,
  autoRunWebRTC: true,
  autoRunDnsLeak: true,
  popupConnectivityNotifications: false,
  ipCardsToShow: 2,
  ipGeoSource: 0,
  // Local IP-history recorder (see use-ip-history.js). Days: 1–90.
  ipHistoryEnabled: true,
  ipHistoryDays: 90,
  lang: 'auto', // auto | zh | en | fr | tr
  // User-defined extra targets for the Connectivity test grid. Each entry:
  //   { id: 'custom-<timestamp>', name: string, url: string-with-trailing-? }
  // See ConnectivityTest.vue for how these are merged with the built-in list.
  customConnectivityTargets: [],
});

/**
 * Returns a fresh default preferences object (writable copy).
 * Avoid calling side directly modifying DEFAULT_PREFERENCES (Object.freeze also prevents).
 */
export function createDefaultPreferences() {
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Map a legacy preferences object onto the current schema: expand the single
 * `autoStart` switch into the three per-module switches, pass everything else
 * through. Pure — store.js does the localStorage read.
 *
 * @param {object|null} legacy parsed legacy preferences (or null/undefined)
 * @returns {object} a writable object ready to spread over the defaults
 */
export function migrateLegacyPreferences(legacy) {
  if (!legacy || typeof legacy !== 'object') return {};
  const migrated = { ...legacy };
  if (typeof legacy.autoStart === 'boolean') {
    migrated.autoRunConnectivity = legacy.autoStart;
    migrated.autoRunWebRTC = legacy.autoStart;
    migrated.autoRunDnsLeak = legacy.autoStart;
  }
  delete migrated.autoStart;
  return migrated;
}
