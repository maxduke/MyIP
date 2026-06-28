// Browser-timezone collection for analytics.
// GA4 derives Country from the request IP and Language from navigator.language,
// but it never captures the browser's own timezone.

// Format a UTC offset given in minutes (east-positive) as "+08:00" / "-05:00".
// 480 → "+08:00", -300 → "-05:00", 0 → "+00:00".
export const formatUtcOffset = (offsetMinutes) => {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
};

// Read the browser's timezone
export const getTimezoneInfo = () => {
    let timezone = '';
    let offset = '';
    try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch { /* leave empty */ }
    try {
        // getTimezoneOffset() is UTC-minus-local in minutes; negate it so the
        // result is east-positive, matching how offsets are written (+08:00).
        offset = formatUtcOffset(-new Date().getTimezoneOffset());
    } catch { /* leave empty */ }
    return { timezone, offset };
};
