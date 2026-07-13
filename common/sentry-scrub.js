// Scrubbing helpers for backend Sentry telemetry. Query strings on
// upstream calls carry API keys — redact those param values everywhere
// (breadcrumbs, spans, event request contexts) before sending. The rest
// of the query is kept on purpose: it is debugging context. Wired into
// Sentry.init hooks in sentry-instrument.js;
// kept here as pure functions so they stay testable without loading the SDK.

// Param names whose values must never reach Sentry.
const SENSITIVE_PARAMS = /^(key|api[-_]?key|token|secret|password|auth)$/i;

// Span / trace attributes that may hold a URL, or a bare query string.
const URL_ATTRS = ['url.full', 'http.url', 'http.target'];
const QUERY_ATTRS = ['url.query', 'http.query'];

// Redact sensitive values in a bare query string ("q=1&key=abc").
export const redactQueryString = (query) => {
    if (typeof query !== 'string') return query;
    return query.split('&').map((pair) => {
        const eq = pair.indexOf('=');
        if (eq === -1) return pair;
        const name = pair.slice(0, eq);
        return SENSITIVE_PARAMS.test(name) ? `${name}=[redacted]` : pair;
    }).join('&');
};

// Redact sensitive query params in a full or relative URL. Anything
// before the first `?` passes through untouched.
export const redactUrlQuery = (value) => {
    if (typeof value !== 'string') return value;
    const q = value.indexOf('?');
    if (q === -1) return value;
    return value.slice(0, q + 1) + redactQueryString(value.slice(q + 1));
};

const scrubAttributes = (data) => {
    if (!data) return;
    for (const attr of URL_ATTRS) {
        if (typeof data[attr] === 'string') data[attr] = redactUrlQuery(data[attr]);
    }
    for (const attr of QUERY_ATTRS) {
        if (typeof data[attr] === 'string') data[attr] = redactQueryString(data[attr]);
    }
};

// beforeBreadcrumb: the http integration records the full outgoing URL.
export const scrubBreadcrumb = (breadcrumb) => {
    if (typeof breadcrumb?.data?.url === 'string') {
        breadcrumb.data.url = redactUrlQuery(breadcrumb.data.url);
    }
    return breadcrumb;
};

// beforeSendSpan: http client spans carry the URL both in attributes and
// in the description ("GET https://host/path?query").
export const scrubSpan = (span) => {
    if (!span) return span;
    if (typeof span.description === 'string') {
        span.description = redactUrlQuery(span.description);
    }
    scrubAttributes(span.data);
    return span;
};

// beforeSend / beforeSendTransaction: inbound request context plus the
// root span's trace attributes.
export const scrubEventRequest = (event) => {
    if (!event) return event;
    if (event.request) {
        if (typeof event.request.url === 'string') {
            event.request.url = redactUrlQuery(event.request.url);
        }
        if (typeof event.request.query_string === 'string') {
            event.request.query_string = redactQueryString(event.request.query_string);
        }
    }
    scrubAttributes(event.contexts?.trace?.data);
    return event;
};
