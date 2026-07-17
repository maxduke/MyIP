// PWA display-mode detection.
//
// "standalone" is overloaded in this codebase: `/tools/:slug` are the app's
// "standalone tool pages", while the web platform separately calls an installed
// PWA's chromeless window "standalone" (CSS `display-mode: standalone`, plus
// iOS Safari's legacy `navigator.standalone`). To avoid that clash, the PWA
// concept lives here under an explicit name — callers use `isRunningAsPwa()` and
// a local `isPwa`, never a bare `isStandalone` (which means the tool page).
//
// Not reactive: the display mode is fixed for a session, so callers read it once
// into a const.
export function isRunningAsPwa() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

// Proactive install-prompt eligibility, checked by App.vue BEFORE mounting
// the PWA widget — ineligible visits never load pwa-install or its manifest
// fetch. Counts this visit as a side effect: the prompt skips the very first
// visit and is capped at 2 shows ever (PWA.vue bumps pwaPopupCount when the
// dialog actually opens).
export const shouldOfferPwaInstall = () => {
    try {
        const visits = parseInt(localStorage.getItem('pwaVisitCount') || '0', 10) + 1;
        localStorage.setItem('pwaVisitCount', visits);
        const popups = parseInt(localStorage.getItem('pwaPopupCount') || '0', 10);
        return !isRunningAsPwa() && visits >= 2 && popups < 2;
    } catch {
        return false; // storage disabled — never prompt
    }
};
