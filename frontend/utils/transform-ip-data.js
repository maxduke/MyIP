// The static map renders at zoom 3 (continent scale), where ~0.176° spans a
// single pixel. Quantizing the request coords to 1 decimal (~0.1°, sub-pixel)
// leaves the marker visually unchanged while collapsing every IP in the same
// 0.1° grid cell onto one CF edge-cache key — the cache key is the client URL,
// so this rounding must happen here, not in the backend handler. The full-
// precision lat/lon are still kept on baseData for display.
function mapCoord(value) {
    return Number(value).toFixed(1);
}

// Parse IP data
function transformDataFromIPapi(data, ipGeoSource, t, mapLanguage) {
    if (data.error) {
        throw new Error(data.reason);
    }

    const hasCoords = data.latitude && data.longitude;
    const mapLat = hasCoords ? mapCoord(data.latitude) : "";
    const mapLon = hasCoords ? mapCoord(data.longitude) : "";

    const baseData = {
        country_name: data.country_name || "",
        country_code: data.country === 'N/A' ? '' : data.country,
        region: data.region || "",
        city: data.city || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        isp: data.org || "",
        asn: data.asn || "",
        asnlink: data.asn ? data.asn.startsWith('AS') ? `https://bgp.tools/as/${data.asn}` : false : false,
        mapUrl: hasCoords ? `/api/map?latitude=${mapLat}&longitude=${mapLon}&language=${mapLanguage}` : "",
        mapUrl_dark: hasCoords ? `/api/map?latitude=${mapLat}&longitude=${mapLon}&language=${mapLanguage}&CanvasMode=Dark` : ""
    };

    if (ipGeoSource === 0) {
        const advancedData = extractAdvancedData(data.advancedData, t);
        return {
            ...baseData,
            ...advancedData,
        };
    }

    return baseData;
};

// Parse proxy data
function extractAdvancedData(advancedData = {}, t) {
    const isProxy = determineIsProxy(advancedData, t);
    const type = determineType(advancedData, t);
    const qualityScore = advancedData.score === 'sign_in_required' ? 'sign_in_required' : advancedData.score;
    const proxyProtocol = advancedData.proxyProtocol || "";
    const proxyProvider = advancedData.proxyProvider || "";
    const isNativeIP = advancedData.tags === 'sign_in_required' ? 'sign_in_required' : advancedData.tags.isNative;

    return { isProxy, type, qualityScore, proxyProtocol, proxyProvider, isNativeIP };
}

// Determine if it is a proxy
function determineIsProxy(advancedData, t) {

    if (advancedData.tags === 'sign_in_required') {
        return 'sign_in_required';
    } else if (advancedData.tags.isProxyOrVPN && advancedData.proxyProtocol !== 'unknown') {
        return t('ipInfos.advancedData.proxyYes');
    } else if (advancedData.tags.isProxyOrVPN) {
        return t('ipInfos.advancedData.proxyMaybe');
    } else if (!advancedData.tags.isProxyOrVPN) {
        return t('ipInfos.advancedData.proxyNo');
    } else {
        return t('ipInfos.advancedData.proxyUnknown');
    }
}

// Determine proxy type
function determineType(advancedData, t) {
    if (advancedData.operatorType === 'sign_in_required') {
        return 'sign_in_required';
    }
    switch (advancedData.operatorType) {
        case 'Business':
            return t('ipInfos.advancedData.type.Business');
        case 'Residential':
            return t('ipInfos.advancedData.type.Residential');
        case 'Wireless':
            return t('ipInfos.advancedData.type.Wireless');
        case 'Hosting':
            return t('ipInfos.advancedData.type.Hosting');
        default:
            return t('ipInfos.advancedData.type.unknownType');
    }
}

export { transformDataFromIPapi, extractAdvancedData };