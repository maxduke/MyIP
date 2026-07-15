// Sentry error monitoring for the SPA. This module is loaded on demand by
// main.js ONLY when VITE_SENTRY_DSN_FRONTEND is set at build time — a build
// without the env var never ships nor requests this chunk, so self-hosted
// deployments stay completely Sentry-free.
//
// App code must never import Sentry directly (it would drag the SDK back into
// the main bundle and bypass the gating). For explicit signals, emit a domain
// event on utils/app-events.js and subscribe to it here instead.
import * as Sentry from '@sentry/vue';

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
            // (LCP / CLS / INP) and per-route load metrics under Insights.
            // Speed-test endpoints are excluded from span creation:
            // deliberately-huge downloads are the FEATURE there, and they
            // both trip the "Large HTTP Payload" performance detector and
            // flood traces with dozens of meaningless spans per run.
            Sentry.browserTracingIntegration({
                router,
                shouldCreateSpanForRequest: (url) => {
                    try {
                        return new URL(url, window.location.origin).hostname !== 'speed.cloudflare.com';
                    } catch {
                        return true;
                    }
                },
            }),
            // Session Replay, error-only: nothing is uploaded unless an error
            // event fires. Page text is deliberately UNMASKED — this site's
            // whole UI is the visitor's own network info (IPs, ASN, DNS), and
            // seeing it in an error replay is exactly the debugging context
            // we need; disclosed in the privacy policy. Typed input stays
            // masked (maskAllInputs default).
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
                // Plain-JSON recordings travel more reliably through edge
                // proxies than opaque binary; error-only mode keeps the
                // bandwidth cost negligible.
                useCompression: false,
            }),
            // console.error() → grouped Issues (tagged logger:console).
            Sentry.captureConsoleIntegration({ levels: ['error'] }),
        ],
        // 10% trace sampling: pageload / navigation transactions and Web
        // Vitals are statistical, so a sample keeps Insights meaningful
        tracesSampleRate: 0.1,
        // Discard-outcome client reports are quota bookkeeping we never
        // reconcile — don't spend tunnel POSTs on them. (Release Health
        // sessions stay on: browserSessionIntegration is a default.)
        sendClientReports: false,
        // Replay: never record plain sessions, always keep the buffer that
        // gets flushed when an error occurs
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        // No IP / headers attached to event data. Debugging context that
        // needs the visitor's network info comes from the unmasked
        // error-replays instead — the page itself displays those details.
        sendDefaultPii: false,
        // Relay envelopes through our own backend (api/sentry-tunnel.js)
        tunnel: '/api/monitoring',
        // Force a Content-Type on every envelope POST.
        transportOptions: {
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        },
        // Ignore visitor-side noise: DNS-leak providers answering empty,
        // auth endpoints unreachable from the visitor's network, the visitor
        // dismissing / re-triggering the sign-in popup, and a known
        // firebase-js-sdk popup race (its internal assertion, not our state).
        ignoreErrors: [
            'auth/network-request-failed',
            'auth/popup-closed-by-user',
            'auth/popup-blocked',
            'auth/cancelled-popup-request',
            'INTERNAL ASSERTION FAILED',
            // Stale-deploy chunk loads: a client from before the latest
            // deploy lazy-loads a hashed asset that no longer exists.
            // Self-heals on reload, not a defect. One entry per browser
            // wording (Chrome / Firefox / Safari), plus Vite's CSS preload.
            'Failed to fetch dynamically imported module',
            'error loading dynamically imported module',
            'Importing a module script failed',
            'Unable to preload CSS',
        ],
        // Console-captured events group by the console message instead of
        // the exception stack. The fallback chains all surface the same
        // "TypeError: Failed to fetch" from fetchWithTimeout, so stack
        // grouping would collapse every source's degradation into ONE issue
        // — indistinguishable per source, and a single archive/discard on it
        // silently hides them all.
        beforeSend(event, hint) {
            // Timeout aborts (our own fetchWithTimeout firing on slow links)
            // are visitor connectivity, not defects — drop them wherever
            // they were logged from.
            if (hint?.originalException?.name === 'AbortError') return null;
            // "All sources failed to fetch IP details for IP: <ip>" only sums
            // up the per-source failures logged right before it, embeds the
            // queried IP (unbounded fingerprints), and in practice means
            // visitor network trouble or an edge-side block — drop it. The
            // per-source console.error lines remain the health signal.
            if (String(hint?.originalException?.message ?? '')
                .startsWith('All sources failed to fetch IP details')) return null;
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
                    // Filter out DNS-leak probe chain errors.
                    if (msg.startsWith('Error fetching leak test data:')) return null;
                    event.fingerprint = [msg.slice(0, 200)];
                }
            }
            return event;
        },
    });

    // Explicit product signals would arrive via the app-events bus — business
    // code stays Sentry-free and just emits domain events (see
    // frontend/AGENTS.md). No signal is currently captured: chain exhaustion
    // (`ip-source:exhausted`) proved to be pure visitor-network noise —
    // clients that block every third-party request — and was dropped.
};

export { initSentry };
