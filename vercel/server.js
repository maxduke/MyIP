// Single Vercel Function adapter for the complete Express API.
//
// vercel.json explicitly builds only this Node entry, so the handler modules
// under api/ remain ordinary dependencies instead of separate Functions.
import dotenv from 'dotenv';
import { configureVercelEnvironment, createSnapshotHydrator, vercelCacheHeaders } from './runtime.js';

// Also fits Hobby projects that have not enabled Fluid Compute.
export const config = { maxDuration: 60 };

// Environment and Sentry loader hooks must be set before importing the backend.
dotenv.config({ quiet: true });
configureVercelEnvironment();
await import('../sentry-instrument.js');
const { default: express } = await import('express');
const { default: backend } = await import('../backend-server.js');
const { getMaxMindDbPaths, reloadMaxMindDatabases } = await import('../common/maxmind-service.js');
const { refreshServiceStatus } = await import('../common/service-status-store.js');
const { requireReferer, requireValidProviderId } = await import('../common/guards.js');
const { existsSync } = await import('node:fs');

// Build-prepared databases are immutable deployment assets. Open them once per
// warm Function instance; missing or invalid files leave MaxMind feature-gated.
const { cityDbPath, asnDbPath } = getMaxMindDbPaths();
if (existsSync(cityDbPath) && existsSync(asnDbPath)) {
    await reloadMaxMindDatabases('serverless startup').catch(() => {});
}

const app = express();
app.use('/api', vercelCacheHeaders);

// The standalone backend owns its polling timer; the Function refreshes only
// on a valid status request, sharing one in-flight refresh per warm instance.
const hydrateStatus = createSnapshotHydrator(refreshServiceStatus);
app.get('/api/service-status', requireReferer, hydrateStatus);
app.get('/api/service-status/detail', requireReferer, requireValidProviderId(), hydrateStatus);
app.use(backend);

export default app;
