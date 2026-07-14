// Share-link creation flow for the report dialog: POST the assembled report
// to /api/report and expose the resulting /r/:id link plus creating/error
// state. Feature availability (configs.reportSharing) is the dialog's check,
// not this composable's.

import { ref } from 'vue';
import { fetchWithTimeout } from '../utils/fetch-with-timeout.js';

export const useReportShare = () => {
    const creating = ref(false);
    const shareLink = ref('');
    const expiresAt = ref('');
    const shareError = ref(false);

    const createShareLink = async (report, ttlDays) => {
        creating.value = true;
        shareError.value = false;
        shareLink.value = '';
        expiresAt.value = '';
        try {
            const response = await fetchWithTimeout('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report, ttlDays }),
                timeoutMs: 15000,
            });
            if (!response.ok) throw new Error(`report create responded ${response.status}`);
            const data = await response.json();
            shareLink.value = `${window.location.origin}/r/${data.id}`;
            expiresAt.value = data.expiresAt;
        } catch (error) {
            console.error('Creating share link failed:', error);
            shareError.value = true;
        } finally {
            creating.value = false;
        }
    };

    const resetShareLink = () => {
        shareLink.value = '';
        expiresAt.value = '';
        shareError.value = false;
    };

    return { creating, shareLink, expiresAt, shareError, createShareLink, resetShareLink };
};
