import assert from 'node:assert/strict';
import { describe, it, afterEach, beforeEach } from 'node:test';

import { refererCheck } from '../common/referer-check.js';

const ENV_KEYS = [
  'ALLOWED_DOMAINS',
  'VERCEL_URL',
  'VERCEL_BRANCH_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
];
let envBackup;
beforeEach(() => {
  envBackup = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  ENV_KEYS.forEach((key) => delete process.env[key]);
});
afterEach(() => {
  for (const [key, value] of Object.entries(envBackup)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('refererCheck — base cases', () => {
  it('returns false for missing referer', () => {
    assert.equal(refererCheck(), false);
    assert.equal(refererCheck(undefined), false);
    assert.equal(refererCheck(null), false);
  });

  it('returns false for empty string referer', () => {
    // Falsy short-circuit: not a URL parse attempt, just false
    assert.equal(refererCheck(''), false);
  });

  it('always whitelists localhost regardless of ALLOWED_DOMAINS', () => {
    delete process.env.ALLOWED_DOMAINS;
    assert.equal(refererCheck('http://localhost/'), true);
    assert.equal(refererCheck('http://localhost:5173/tools'), true);
    assert.equal(refererCheck('https://localhost:443/'), true);
  });
});

describe('refererCheck — ALLOWED_DOMAINS parsing', () => {
  it('accepts a single configured domain', () => {
    process.env.ALLOWED_DOMAINS = 'example.com';
    assert.equal(refererCheck('https://example.com/'), true);
    assert.equal(refererCheck('https://example.com/sub/path?q=1'), true);
  });

  it('accepts any of several comma-separated domains', () => {
    process.env.ALLOWED_DOMAINS = 'a.com,b.net,c.org';
    assert.equal(refererCheck('https://a.com/'), true);
    assert.equal(refererCheck('https://b.net/'), true);
    assert.equal(refererCheck('https://c.org/'), true);
  });

  it('rejects subdomains that are not explicitly listed', () => {
    // Current implementation uses exact hostname match, not suffix match
    process.env.ALLOWED_DOMAINS = 'example.com';
    assert.equal(refererCheck('https://sub.example.com/'), false);
  });

  it('rejects look-alike / unknown domains', () => {
    process.env.ALLOWED_DOMAINS = 'example.com';
    assert.equal(refererCheck('https://example.net/'), false);
    assert.equal(refererCheck('https://evil.example.com.attacker.xyz/'), false);
  });

  it('trims URL properly (hostname extraction ignores port, path, query)', () => {
    process.env.ALLOWED_DOMAINS = 'example.com';
    assert.equal(refererCheck('https://example.com:8443/deep/path?x=1#frag'), true);
  });

  it('treats unset ALLOWED_DOMAINS as "only localhost allowed"', () => {
    delete process.env.ALLOWED_DOMAINS;
    assert.equal(refererCheck('https://example.com/'), false);
    assert.equal(refererCheck('http://localhost/'), true);
  });

  it('empty ALLOWED_DOMAINS still permits localhost', () => {
    process.env.ALLOWED_DOMAINS = '';
    assert.equal(refererCheck('http://localhost/'), true);
    assert.equal(refererCheck('https://example.com/'), false);
  });

  it('trims configured domains', () => {
    process.env.ALLOWED_DOMAINS = ' example.com , another.example ';
    assert.equal(refererCheck('https://example.com/'), true);
    assert.equal(refererCheck('https://another.example/'), true);
  });
});

describe('refererCheck — Vercel system domains', () => {
  it('accepts deployment, branch, and production URLs by exact hostname', () => {
    process.env.VERCEL_URL = 'myip-git-sha-maxduke.vercel.app';
    process.env.VERCEL_BRANCH_URL = 'myip-git-dev-maxduke.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'myip.vercel.app';

    assert.equal(refererCheck('https://myip-git-sha-maxduke.vercel.app/'), true);
    assert.equal(refererCheck('https://myip-git-dev-maxduke.vercel.app/'), true);
    assert.equal(refererCheck('https://myip.vercel.app/'), true);
  });

  it('does not trust look-alike or subdomain variants', () => {
    process.env.VERCEL_URL = 'myip.vercel.app';

    assert.equal(refererCheck('https://evil-myip.vercel.app/'), false);
    assert.equal(refererCheck('https://sub.myip.vercel.app/'), false);
  });
});

describe('refererCheck — malformed inputs', () => {
  it('returns false on non-URL strings instead of throwing', () => {
    // Scanners send garbage Referer headers; parse failure means denial,
    // not an exception bubbling up to a 500.
    assert.equal(refererCheck('not-a-url'), false);
    assert.equal(refererCheck('http://'), false);
    assert.equal(refererCheck('%%%'), false);
  });
});
