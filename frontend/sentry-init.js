// Sentry error monitoring for the SPA. This module is loaded on demand by
// main.js ONLY when VITE_SENTRY_DSN_FRONTEND is set at build time — a build
// without the env var never ships nor requests this chunk, so self-hosted
// deployments stay completely Sentry-free.
//
// App code must never import Sentry directly (it would drag the SDK back into
// the main bundle and bypass the gating). For explicit signals, emit a domain
// event on utils/app-events.js and subscribe to it here instead.
import * as Sentry from '@sentry/vue';
import { onAppEvent } from '@/utils/app-events';

const env = import.meta.env ?? {};

const initSentry = (app, router) => {
    Sentry.init({
        app,
        dsn: env.VITE_SENTRY_DSN_FRONTEND,
        // Distinguish local `pnpm dev` events from production ones in the
        // Sentry UI ("development" / "production")
        environment: env.MODE,
        integrations: [
            // Route-change performance tracing via vue-router → Web Vitals
            // (LCP / CLS / INP) and per-route load metrics under Insights
            Sentry.browserTracingIntegration({ router }),
            // Session Replay, error-only: nothing is uploaded unless an error event fires
            Sentry.replayIntegration(),
            // console.error() → grouped Issues (tagged logger:console).
            Sentry.captureConsoleIntegration({ levels: ['error'] }),
        ],
        // 100% trace sampling — Should change based on plan quota
        tracesSampleRate: 1.0,
        // Replay: never record plain sessions, always keep the buffer that
        // gets flushed when an error occurs
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // MyIP is a privacy tool: never attach user IP / headers to events
        sendDefaultPii: false,
        // Relay envelopes through our own backend (api/sentry-tunnel.js)
        tunnel: '/api/monitoring',
        // Console-captured events group by the console message instead of
        // the exception stack. The fallback chains all surface the same
        // "TypeError: Failed to fetch" from fetchWithTimeout, so stack
        // grouping would collapse every source's degradation into ONE issue
        // — indistinguishable per source, and a single archive/discard on it
        // silently hides them all.
        beforeSend(event) {
            if (event.logger === 'console') {
                const firstArg = event.extra?.arguments?.[0];
                if (typeof firstArg === 'string' && firstArg.trim()) {
                    const msg = firstArg.trim();
                    // Pure-v6 chain failures are the visitor's network stack
                    // (IPv4-only users are common), not a defect — drop them.
                    // The dual-stack "IPv6/4" source is exempt from the drop:
                    // it must succeed even for IPv4-only visitors, so its
                    // failures are a real signal.
                    if (/IPv6(?!\/4)/.test(msg)) return null;
                    event.fingerprint = [msg.slice(0, 200)];
                }
            }
            return event;
        },
    });

    // Explicit product signals arrive via the app-events bus — business code
    // stays Sentry-free and just emits domain events (see frontend/AGENTS.md).

    // A whole IP source chain (primary + every fallback) failed. v6
    // exhaustion is routine for IPv4-only visitors, so only v4 is reported;
    // per-hop degradation inside a chain is already covered by the
    // console.error capture above.
    onAppEvent('ip-source:exhausted', ({ source, ipVersion }) => {
        if (ipVersion !== 'v4') return;
        Sentry.captureMessage(`IP source chain exhausted: ${source}`, {
            level: 'error',
            tags: { source, ipVersion },
        });
    });
};

export { initSentry };
