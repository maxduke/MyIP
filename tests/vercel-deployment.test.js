// Regression coverage for the single-function Vercel deployment adapter.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';

const config = JSON.parse(
    await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
);

describe('Vercel deployment', () => {
    it('builds exactly one Node function', () => {
        const nodeBuilds = config.builds.filter((build) => build.use === '@vercel/node');

        assert.deepEqual(nodeBuilds, [{
            src: 'vercel-server.js',
            use: '@vercel/node',
        }]);
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
            destination: '/vercel-server',
        });
    });
});

describe('Vercel Express adapter', () => {
    let app;
    let server;
    let baseUrl;

    before(async () => {
        ({ default: app } = await import('../vercel-server.js'));
        server = app.listen(0, '127.0.0.1');
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    after(async () => {
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
        assert.equal(typeof body.reportSharing, 'boolean');
    });
});
