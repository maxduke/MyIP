// Vercel-only environment, snapshot hydration and CDN response adaptation.

export const configureVercelEnvironment = (env = process.env) => {
    env.LOG_FORMAT = 'json';
    const domains = [
        ...(env.ALLOWED_DOMAINS || '').split(','),
        env.VERCEL_URL,
        env.VERCEL_BRANCH_URL,
        env.VERCEL_PROJECT_PRODUCTION_URL,
    ];
    env.ALLOWED_DOMAINS = [...new Set(domains.map((domain) => domain?.trim()).filter(Boolean))].join(',');
};

// Successful refreshes are reused for five minutes. Rejections clear the
// in-flight slot and stay retryable on the next request.
export const createSnapshotHydrator = (refresh, now = Date.now) => {
    let refreshedAt = null;
    let pending = null;
    return async (req, res, next) => {
        try {
            if (refreshedAt === null || now() - refreshedAt >= 5 * 60 * 1000) {
                pending ??= Promise.resolve().then(refresh).then(() => {
                    refreshedAt = now();
                }).finally(() => {
                    pending = null;
                });
                await pending;
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Honor the backend's public-cache opt-ins on Vercel's CDN as well as in the
// browser. Auth-context routes, degraded no-store answers and errors stay out.
export const vercelCacheHeaders = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const writeHead = res.writeHead.bind(res);
    res.writeHead = (...args) => {
        const policy = res.getHeader('Cache-Control');
        const ttl = typeof policy === 'string' && /^public, max-age=(\d+)$/.exec(policy)?.[1];
        if (req.method === 'GET' && args[0] >= 200 && args[0] < 300 && ttl) {
            res.setHeader('Vercel-CDN-Cache-Control', `public, s-maxage=${ttl}`);
        }
        return writeHead(...args);
    };
    next();
};
