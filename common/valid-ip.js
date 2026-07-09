// Validate if IP address is valid
function isValidIP(ip) {
    if (typeof ip !== 'string') {
        return false;
    }

    // IPv4
    const ipv4Pattern =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (ipv4Pattern.test(ip)) {
        return true;
    }

    const doubleColonParts = ip.split('::');
    if (doubleColonParts.length > 2) {
        return false;
    }
    
    // IPv6
    const hasCompressedGroup = doubleColonParts.length === 2;
    const groups = doubleColonParts.flatMap(part => part === '' ? [] : part.split(':'));

    if (groups.some(group => !/^[0-9a-fA-F]{1,4}$/.test(group))) {
        return false;
    }

    return hasCompressedGroup ? groups.length < 8 : groups.length === 8;
};

// Distinguish IPv6 from IPv4 for an already-validated IP string (the ':'
// separator only exists in v6). This is the codebase-wide idiom formalized —
// it does NOT validate; run isValidIP first for untrusted input.
function isIPv6(ip) {
    return typeof ip === 'string' && ip.includes(':');
}

// Validate if a string is a syntactically plausible domain name.
// Matches the hostname pattern used by DnsResolver / Whois / CensorshipCheck:
// lowercase-only labels of [a-z0-9-], at least one dot, and a TLD of 2+
// letters. This is intentionally a surface-level check — it accepts
// "foo.example" and doesn't know about public suffixes — because every
// caller also routes through `new URL()` parsing before landing here.
function isValidDomain(domain) {
    if (typeof domain !== 'string') return false;
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(domain);
}

export { isValidIP, isIPv6, isValidDomain };
