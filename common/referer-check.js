// dotenv.config() is called once in backend-server.js before any handler
// imports this module, so process.env.ALLOWED_DOMAINS is already populated.
// Avoid the duplicate call to keep this a pure, fast function.

function refererCheck(referer) {
    const vercelDomains = [
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ];
    const allowedDomains = new Set([
        'localhost',
        ...(process.env.ALLOWED_DOMAINS || '').split(','),
        ...vercelDomains,
    ].map((domain) => domain?.trim()).filter(Boolean));

    if (referer) {
        // Scanners send garbage Referer headers; a parse failure means
        // "not an allowed origin", never a thrown 500.
        let domain;
        try {
            domain = new URL(referer).hostname;
        } catch {
            return false;
        }
        return allowedDomains.has(domain);
    }
    return false;  // if no referer is provided, return false
}

export { refererCheck };
