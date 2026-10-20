// Regression coverage for the single-function Vercel deployment adapter.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { datasets } from '../common/datasets.js';

const config = JSON.parse(
    await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
);
const adapterPackage = JSON.parse(
    await readFile(new URL('../vercel/package.json', import.meta.url), 'utf8'),
);

describe('Vercel deployment', () => {
    it('builds exactly one Node function', () => {
        const nodeBuilds = config.builds.filter((build) => build.use === '@vercel/node');

        assert.equal(config.builds.length, 2);
        assert.equal(nodeBuilds.length, 1);
        assert.equal(nodeBuilds[0].src, 'vercel/server.js');
        const root = fileURLToPath(new URL('../', import.meta.url));
        const published = datasets.flatMap((row) => row.files.map((file) => path.relative(root, path.join(row.dir, file))));
        assert.deepEqual(nodeBuilds[0].config.includeFiles.toSorted(), published.toSorted());
    });

    it('prepares offline data before tracing even with a cached dependency install', () => {
        assert.equal(adapterPackage.scripts['vercel-build'], 'node prepare.js');
    });

    it('builds the Vite output as static assets with an SPA fallback', () => {
        assert.deepEqual(config.builds[0], {
            src: 'package.json',
            use: '@vercel/static-build',
            config: { distDir: 'dist' },
        });
        assert.deepEqual(config.rewrites.at(-1), {
            source: '/(.*)',
            destination: '/index.html',
        });
    });

    it('routes every API path through the single Express function', () => {
        assert.deepEqual(config.rewrites[0], {
            source: '/api/:path*',
            destination: '/vercel/server.js',
        });
    });
});

describe('Vercel Express adapter', () => {
    let app;
    let server;
    let baseUrl;
    let originalFetch;
    const upstreamCalls = [];
    const previewHost = 'myip-adapter-test.vercel.app';
    const previousPreview = process.env.VERCEL_URL;

    before(async () => {
        process.env.VERCEL_URL = previewHost;
        ({ default: app } = await import('../vercel/server.js'));
        server = app.listen(0, '127.0.0.1');
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        originalFetch = globalThis.fetch;
        globalThis.fetch = async (url, init) => {
            if (String(url).startsWith(baseUrl)) return originalFetch(url, init);
            upstreamCalls.push(String(url));
            const body = String(url).endsWith('/summary.json')
                ? { status: { indicator: 'none' }, components: [{ id: 'api', name: 'API', status: 'operational' }] }
                : { incidents: [] };
            return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
        };
    });

    after(async () => {
        globalThis.fetch = originalFetch;
        if (previousPreview === undefined) delete process.env.VERCEL_URL;
        else process.env.VERCEL_URL = previousPreview;
        if (!server) return;
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    });

    it('serves an existing API route without starting the standalone backend', async () => {
        assert.equal(typeof app, 'function');

        const response = await fetch(`${baseUrl}/api/configs`, {
            headers: { referer: 'http://localhost/' },
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(typeof body.originalSite, 'boolean');
        assert.equal(typeof body.maxmind, 'boolean');
        assert.equal(typeof body.reportSharing, 'boolean');
        assert.equal(response.headers.get('vercel-cdn-cache-control'), 'public, s-maxage=3600');
    });

    it('rejects unauthorized and invalid status requests before hydration', async () => {
        const denied = await fetch(`${baseUrl}/api/service-status`, {
            headers: { referer: `https://${previewHost}.attacker.example/` },
        });
        assert.equal(denied.status, 403);
        assert.equal(denied.headers.get('cache-control'), 'no-store');
        assert.equal(denied.headers.get('vercel-cdn-cache-control'), null);
        const invalid = await fetch(`${baseUrl}/api/service-status/detail?id=unknown-provider`, {
            headers: { referer: `https://${previewHost}/` },
        });
        assert.equal(invalid.status, 400);
        assert.equal(upstreamCalls.length, 0);
    });

    it('hydrates status through the adapter and shares the result across concurrent and warm requests', async () => {
        const options = { headers: { referer: `https://${previewHost}/` } };
        const responses = await Promise.all([
            fetch(`${baseUrl}/api/service-status`, options),
            fetch(`${baseUrl}/api/service-status`, options),
        ]);
        const [first, concurrent] = await Promise.all(responses.map((response) => response.json()));
        assert.ok(first.updatedAt);
        assert.ok(first.providers.length);
        assert.deepEqual(concurrent, first);
        assert.equal(upstreamCalls.length, first.providers.length * 2);
        const detail = await fetch(`${baseUrl}/api/service-status/detail?id=${first.providers[0].id}`, options);
        assert.deepEqual((await detail.json()).components, [{ name: 'API', status: 'operational' }]);
        assert.equal(upstreamCalls.length, first.providers.length * 2);
        assert.equal(responses[0].headers.get('vercel-cdn-cache-control'), 'public, s-maxage=300');
    });

    it('serves new upstream routes and preserves their input guards', async () => {
        const response = await fetch(`${baseUrl}/api/asn-profile?asn=invalid`, {
            headers: { referer: `https://${previewHost}/` },
        });
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: 'Invalid ASN' });
        assert.equal(response.headers.get('vercel-cdn-cache-control'), null);
    });
});
