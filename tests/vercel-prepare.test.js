// Contract tests for Vercel-only dataset preparation and its bundle budget.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DATASET_BUDGET_BYTES, prepareVercelDatasets } from '../vercel/prepare.js';

const row = (id, enabled = true) => ({ id, dir: `/data/${id}`, files: ['data'], enabled: () => enabled });

describe('prepareVercelDatasets', () => {
    it('never downloads datasets during ordinary installs', async () => {
        assert.deepEqual(await prepareVercelDatasets({}, [], () => {
            assert.fail('bootstrap must not run');
        }), { status: 'skipped' });
    });

    it('prepares enabled datasets and counts only published assets', async () => {
        const rows = [row('as2org'), row('maxmind', false)];
        const sizes = [];
        const result = await prepareVercelDatasets({ VERCEL: '1' }, rows, async (selected) => {
            assert.deepEqual(selected, [rows[0]]);
            return [{ status: 'downloaded' }];
        }, (file) => {
            sizes.push(file);
            if (file.includes('maxmind')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
            return 123;
        });
        assert.deepEqual(result, { status: 'prepared', bytes: 123 });
        assert.deepEqual(sizes, ['/data/as2org/data', '/data/maxmind/data']);
    });

    it('fails the build when an enabled dataset could not be prepared', async () => {
        for (const status of ['failed', 'no-op']) {
            await assert.rejects(prepareVercelDatasets({ VERCEL: '1' }, [row('oui')],
                async () => [{ status }], () => 0), /preparation failed: oui/);
        }
    });

    it('rejects missing enabled files and unexpected filesystem errors', async () => {
        for (const [enabled, code] of [[true, 'ENOENT'], [false, 'EACCES']]) {
            await assert.rejects(prepareVercelDatasets({ VERCEL: '1' }, [row('data', enabled)],
                async () => [{ status: 'present' }], () => {
                    throw Object.assign(new Error(code), { code });
                }), { code });
        }
    });

    it('reserves room for code and rejects oversized data, including disabled rows already on disk', async () => {
        const rows = [row('as2org'), row('maxmind', false)];
        await assert.rejects(prepareVercelDatasets({ VERCEL: '1' }, rows,
            async () => [{ status: 'present' }], () => DATASET_BUDGET_BYTES), /exceed.*byte budget/);
    });
});
