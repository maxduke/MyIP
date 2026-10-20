// Contracts for isolated Vercel environment, request hydration and CDN caching.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureVercelEnvironment, createSnapshotHydrator, vercelCacheHeaders } from '../vercel/runtime.js';

describe('Vercel environment', () => {
    it('uses JSON logging and exact system hosts alongside operator domains', () => {
        const env = {
            LOG_FORMAT: 'pretty',
            ALLOWED_DOMAINS: ' example.com, ,preview.vercel.app ',
            VERCEL_URL: 'preview.vercel.app',
            VERCEL_BRANCH_URL: 'branch.vercel.app',
            VERCEL_PROJECT_PRODUCTION_URL: 'production.vercel.app',
        };
        configureVercelEnvironment(env);
        assert.equal(env.LOG_FORMAT, 'json');
        assert.equal(env.ALLOWED_DOMAINS, 'example.com,preview.vercel.app,branch.vercel.app,production.vercel.app');
        configureVercelEnvironment(env);
        assert.equal(env.ALLOWED_DOMAINS, 'example.com,preview.vercel.app,branch.vercel.app,production.vercel.app');
    });
});

describe('Vercel status hydration', () => {
    it('shares a concurrent refresh, then refreshes once when the five minute TTL expires', async () => {
        let time = 0;
        let calls = 0;
        let nexts = 0;
        const hydrate = createSnapshotHydrator(async () => { calls++; }, () => time);
        const run = () => hydrate({}, {}, (error) => { assert.ifError(error); nexts++; });
        await Promise.all([run(), run(), run()]);
        assert.equal(calls, 1);
        time = 5 * 60 * 1000 - 1;
        await run();
        assert.equal(calls, 1);
        time++;
        await Promise.all([run(), run()]);
        assert.equal(calls, 2);
        assert.equal(nexts, 6);
    });

    it('forwards a failed refresh and retries on the next request', async () => {
        const failure = new Error('refresh failed');
        let calls = 0;
        const hydrate = createSnapshotHydrator(async () => { if (++calls === 1) throw failure; });
        await hydrate({}, {}, (error) => assert.equal(error, failure));
        await hydrate({}, {}, (error) => assert.ifError(error));
        assert.equal(calls, 2);
    });
});

describe('Vercel CDN headers', () => {
    const headersFor = (policy, status = 200, method = 'GET') => {
        const headers = {};
        const res = {
            setHeader(name, value) { headers[name] = value; },
            getHeader(name) { return headers[name]; },
            writeHead(code) { assert.equal(this, res); return code; },
        };
        vercelCacheHeaders({ method }, res, () => {});
        res.setHeader('Cache-Control', policy);
        assert.equal(res.writeHead(status), status);
        return headers;
    };

    it('adds CDN TTL only to successful GET answers explicitly marked public', () => {
        const headers = headersFor('public, max-age=300');
        assert.equal(headers['Cache-Control'], 'public, max-age=300');
        assert.equal(headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=300');
    });

    it('keeps private, degraded, error and mutation responses out of the CDN', () => {
        for (const [policy, status, method] of [
            ['no-store', 200, 'GET'],
            ['private, max-age=300', 200, 'GET'],
            ['public, max-age=300', 403, 'GET'],
            ['public, max-age=300', 503, 'GET'],
            ['public, max-age=300', 200, 'POST'],
        ]) {
            assert.equal(headersFor(policy, status, method)['Vercel-CDN-Cache-Control'], undefined);
        }
    });
});
