// Sentry Cron check-in wrapper for the backend's periodic jobs (MaxMind /
// CAIDA / service-status). Same gating as sentry-instrument.js: without
// SENTRY_DSN_BACKEND this is a pure passthrough and @sentry/node is never
// loaded, so job modules can call it unconditionally.
//
// The monitor is upserted from the monitorConfig on first check-in — nothing
// to pre-create in the Sentry UI. A rejected job promise reports an "error"
// check-in and rethrows, so callers keep their own .catch logging.

let sentryWithMonitor = null;
if (process.env.SENTRY_DSN_BACKEND) {
    ({ withMonitor: sentryWithMonitor } = await import('@sentry/node'));
}

export const withCronMonitor = (slug, fn, monitorConfig) => {
    if (!sentryWithMonitor) return fn();
    return sentryWithMonitor(slug, fn, monitorConfig);
};
