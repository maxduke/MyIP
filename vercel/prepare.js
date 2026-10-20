// Prepare immutable offline datasets before the Vercel Node Function is traced.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'url';

// Reserve 50 MB of the standard 250 MB Function limit for traced code/runtime.
export const DATASET_BUDGET_BYTES = 200_000_000;

export const prepareVercelDatasets = async (
    env = process.env,
    rows,
    bootstrap,
    sizeOf = (file) => fs.statSync(file).size,
) => {
    if (env.VERCEL !== '1') {
        return { status: 'skipped' };
    }

    const { initUpstreamUserAgent } = await import('../common/upstream-ua.js');
    initUpstreamUserAgent();
    const { bootstrapDatasets, isRowEnabled } = await import('../common/dataset-updater.js');
    rows ??= (await import('../common/datasets.js')).datasets;
    bootstrap ??= bootstrapDatasets;
    const enabled = rows.filter(isRowEnabled);
    const results = await bootstrap(enabled);
    const failed = enabled.filter((row, i) => (
        results[i].status === 'failed' || results[i].status === 'no-op'
    ));
    if (failed.length) {
        throw new Error(`Vercel dataset preparation failed: ${failed.map((row) => row.id).join(', ')}`);
    }

    // Count published data only; archives, locks and updater state are not bundled.
    let bytes = 0;
    for (const row of rows) {
        for (const file of row.files) {
            try {
                bytes += sizeOf(path.join(row.dir, file));
            } catch (error) {
                if (error.code !== 'ENOENT' || isRowEnabled(row)) throw error;
            }
        }
    }
    if (bytes > DATASET_BUDGET_BYTES) {
        throw new Error(`Vercel datasets exceed the ${DATASET_BUDGET_BYTES} byte budget (${bytes} bytes)`);
    }
    return { status: 'prepared', bytes };
};

const isDirectExecution = process.argv[1]
    && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
    await prepareVercelDatasets();
}
