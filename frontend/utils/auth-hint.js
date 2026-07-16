// Sign-in hint: a synchronously readable localStorage flag that lets boot
// decide whether Firebase Auth is worth loading before first render.
// '1' = signed in last we knew · '0' = known signed-out · null = unknown
// (first visit since the flag shipped, or storage cleared/disabled).
const AUTH_HINT_KEY = 'authHint';

export const readAuthHint = () => {
    try {
        const value = localStorage.getItem(AUTH_HINT_KEY);
        return value === '1' || value === '0' ? value : null;
    } catch {
        return null;
    }
};

export const writeAuthHint = (signedIn) => {
    try {
        localStorage.setItem(AUTH_HINT_KEY, signedIn ? '1' : '0');
    } catch {
        /* storage disabled — every boot stays on the unknown path */
    }
};
