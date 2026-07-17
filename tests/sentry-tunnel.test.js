// api/sentry-tunnel.js — envelope-header parsing, visitor-IP resolution,
// and the guard branches that return before any upstream forward (method
// gate / unconfigured / invalid envelope / foreign DSN). No real Sentry
// traffic is ever sent.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert';

import tunnelHandler, { parseEnvelopeDsn, visitorIpFrom } from '../api/sentry-tunnel.js';

const OUR_DSN = 'https://publickey@o111.ingest.sentry.io/222';

const makeRes = () => {
    const res = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
        send(payload) { this.body = payload; return this; },
    };
    return res;
};

const envelopeFor = (dsn) => Buffer.from(`${JSON.stringify({ dsn })}\n{"type":"event"}\n{}`);

beforeEach(() => {
    delete process.env.VITE_SENTRY_DSN_FRONTEND;
});

test('parseEnvelopeDsn extracts the DSN from the envelope header', () => {
    const dsn = parseEnvelopeDsn(envelopeFor(OUR_DSN));
    assert.strictEqual(dsn.host, 'o111.ingest.sentry.io');
    assert.strictEqual(dsn.pathname, '/222');
});

test('parseEnvelopeDsn returns null for garbage input', () => {
    assert.strictEqual(parseEnvelopeDsn(Buffer.from('not json')), null);
    assert.strictEqual(parseEnvelopeDsn(Buffer.from('{"no_dsn":1}\n{}')), null);
});

test('rejects non-POST methods with 405', async () => {
    const res = makeRes();
    await tunnelHandler({ method: 'GET' }, res);
    assert.strictEqual(res.statusCode, 405);
});

test('returns 404 when no frontend DSN is configured', async () => {
    const res = makeRes();
    await tunnelHandler({ method: 'POST', body: envelopeFor(OUR_DSN) }, res);
    assert.strictEqual(res.statusCode, 404);
});

test('returns 400 on an unparseable envelope', async () => {
    process.env.VITE_SENTRY_DSN_FRONTEND = OUR_DSN;
    const res = makeRes();
    await tunnelHandler({ method: 'POST', body: Buffer.from('garbage') }, res);
    assert.strictEqual(res.statusCode, 400);
});

test('returns 403 when the envelope targets a foreign DSN', async () => {
    process.env.VITE_SENTRY_DSN_FRONTEND = OUR_DSN;
    const res = makeRes();
    const foreign = envelopeFor('https://otherkey@o999.ingest.sentry.io/888');
    await tunnelHandler({ method: 'POST', body: foreign }, res);
    assert.strictEqual(res.statusCode, 403);
});

// -- visitorIpFrom -----------------------------------------------------------

test('visitorIpFrom returns the Cloudflare connecting IP when valid', () => {
    assert.strictEqual(visitorIpFrom({ 'cf-connecting-ip': '203.0.113.7' }), '203.0.113.7');
    assert.strictEqual(visitorIpFrom({ 'cf-connecting-ip': '2001:db8::1' }), '2001:db8::1');
});

test('visitorIpFrom returns null without a trustworthy header', () => {
    assert.strictEqual(visitorIpFrom({}), null);
    assert.strictEqual(visitorIpFrom(undefined), null);
    assert.strictEqual(visitorIpFrom({ 'cf-connecting-ip': 'not-an-ip' }), null);
    // Spoofable generic headers are deliberately ignored.
    assert.strictEqual(visitorIpFrom({ 'x-forwarded-for': '203.0.113.7' }), null);
});
