// Shared language allow-list for handlers that accept a ?lang query param.
// Each consumer keeps its own default; pickLang validates against this list.

// Mirrors the UI's locale list (zh maps to zh-CN before hitting the API).
// Unknown values — including stale clients still sending lang=tr — fall
// back to the caller's default via pickLang.
export const SUPPORTED_LANGS = ['zh-CN', 'en', 'fr', 'ru'];

// Return raw if it's a supported language, otherwise the given fallback.
export function pickLang(raw, fallback) {
    return SUPPORTED_LANGS.includes(raw) ? raw : fallback;
}
