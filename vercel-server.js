// Single Vercel Function adapter for the complete Express API.
//
// vercel.json explicitly builds only this Node entry, so the handler modules
// under api/ remain ordinary dependencies instead of separate Functions.
import app from './backend-server.js';
import { initializeMaxMindIfPresent } from './common/maxmind-service.js';

// Build-prepared databases are immutable deployment assets. Open them once per
// warm Function instance; missing or invalid files leave MaxMind feature-gated.
await initializeMaxMindIfPresent('serverless startup');

export default app;
