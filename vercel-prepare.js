// Prepare licensed runtime datasets during Vercel dependency installation.
import { pathToFileURL } from 'url';
import { bootstrapMaxMindIfMissing } from './common/maxmind-updater.js';

export const prepareVercelMaxMind = async (
    env = process.env,
    bootstrap = bootstrapMaxMindIfMissing,
) => {
    if (env.VERCEL !== '1') {
        return { status: 'skipped' };
    }

    return bootstrap();
};

const isDirectExecution = process.argv[1]
    && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
    await prepareVercelMaxMind();
}
