// Contract tests for the Vercel-only dataset preparation gate.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { prepareVercelMaxMind } from '../vercel-prepare.js';

describe('prepareVercelMaxMind', () => {
    it('does not touch datasets outside Vercel builds', async () => {
        let calls = 0;
        assert.deepEqual(
            await prepareVercelMaxMind({}, async () => {
                calls++;
            }),
            { status: 'skipped' },
        );
        assert.equal(calls, 0);
    });

    it('prepares databases during Vercel builds', async () => {
        const expected = { status: 'downloaded' };
        let calls = 0;

        const result = await prepareVercelMaxMind({ VERCEL: '1' }, async () => {
            calls++;
            return expected;
        });

        assert.equal(calls, 1);
        assert.equal(result, expected);
    });
});
