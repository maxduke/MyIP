// Single Vercel Function adapter for the complete Express API.
//
// vercel.json explicitly builds only this Node entry, so the handler modules
// under api/ remain ordinary dependencies instead of separate Functions.
import app from './backend-server.js';

export default app;
