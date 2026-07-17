// /api/monitoring — first-party relay ("tunnel") for frontend Sentry
// envelopes, so ad/privacy blockers that block *.ingest.sentry.io don't
// silence error reporting. The browser SDK posts envelopes here (see
// `tunnel` in frontend/sentry-init.js); we validate that the envelope is
// addressed to OUR project and forward it, passing the visitor's real IP
// along in Sentry's forwarded-for header. backend-server.js mounts the
// route only when VITE_SENTRY_DSN_FRONTEND is set.
import { fetchUpstream } from '../common/fetch-with-timeout.js';
import { isValidIP } from '../common/valid-ip.js';
import logger from '../common/logger.js';

// The envelope header is the first newline-delimited JSON line and carries
// the DSN the SDK was configured with. Returns a URL or null. Exported for
// tests.
export const parseEnvelopeDsn = (rawBody) => {
    try {
        const text = rawBody.toString('utf8');
        const newline = text.indexOf('\n');
        const header = JSON.parse(newline === -1 ? text : text.slice(0, newline));
        return header?.dsn ? new URL(header.dsn) : null;
    } catch {
        return null;
    }
};

// Resolves the visitor's real IP from the incoming tunnel request.
export const visitorIpFrom = (headers) => {
    const ip = headers?.['cf-connecting-ip'];
    return isValidIP(ip) ? ip : null;
};

export default async (req, res) => {
    // Defensive method gate (route already POST-only) — covered by tests.
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Only the DSN this deployment was built with may be relayed — anything
    // else would make us an open proxy to arbitrary Sentry accounts.
    const allowedDsn = process.env.VITE_SENTRY_DSN_FRONTEND;
    if (!allowedDsn) {
        return res.status(404).json({ error: 'Tunnel not configured' });
    }

    const dsn = parseEnvelopeDsn(req.body);
    if (!dsn) {
        return res.status(400).json({ error: 'Invalid envelope' });
    }
    if (dsn.href !== new URL(allowedDsn).href) {
        return res.status(403).json({ error: 'DSN not allowed' });
    }

    const visitorIp = visitorIpFrom(req.headers);

    try {
        const projectId = dsn.pathname.replace(/^\//, '');
        const upstream = `https://${dsn.host}/api/${projectId}/envelope/`;
        const apiRes = await fetchUpstream(upstream, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-sentry-envelope',
                ...(visitorIp ? { 'X-Sentry-Forwarded-For': visitorIp } : {}),
            },
            body: req.body,
        });
        res.status(apiRes.status).send(await apiRes.text());
    } catch (error) {
        // warn, not error: a transient relay failure is infra noise, not an
        // application defect worth a grouped Issue of its own.
        logger.warn({ err: error }, 'sentry tunnel forward failed');
        res.status(502).json({ error: 'Relay failed' });
    }
};
