// Authenticated fetch wrapper: attaches the Firebase ID token for /api/* proxy
// calls and enforces a client-side timeout so a hung backend can't pin the
// request open indefinitely. Every caller hits an /api/* proxy whose upstream is
// capped at 8s (fetchUpstream); the 10s client default sits just above that so
// the server's own error surfaces instead of the browser aborting first.
import { useMainStore } from '../store';
import { fetchWithTimeout } from './fetch-with-timeout.js';

export async function authenticatedFetch(url, method = 'GET', body = null, timeoutMs = 10000) {
    const store = useMainStore();
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null, // If body is provided, convert it to a JSON string
        timeoutMs,
    };

    // Check if the URL is a proxy API that needs authentication
    const isProxyApi = url.startsWith('/api/');

    if (isProxyApi && store.user) {
        const idToken = await store.user.getIdToken();
        options.headers.Authorization = `Bearer ${idToken}`;
    }

    try {
        // fetchWithTimeout aborts at timeoutMs; the AbortError lands in the catch
        // below, so a stuck request fails fast and the caller can fail over.
        const response = await fetchWithTimeout(url, options);

        if (!response.ok) {
            let errorDetail = '';
            try {
                // Get specific error information
                const errorData = await response.json();
                errorDetail = errorData.message || JSON.stringify(errorData);
            } catch {
                errorDetail = response.statusText;
            }
            throw new Error(`HTTP error! Status: ${response.status} - ${errorDetail}`);
        }

        return response.json();
    } catch (error) {
        // Timeout aborts keep their identity: rewrapping would hide the
        // AbortError name from sentry-init's beforeSend filter, which drops
        // them as visitor connectivity noise rather than defects.
        if (error.name === 'AbortError') throw error;
        throw new Error(`Fetch failed: ${error.message}`);
    }
}
