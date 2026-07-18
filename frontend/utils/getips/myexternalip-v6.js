import { isValidIP } from '@/utils/valid-ip.js';
import { fetchWithTimeout } from '@/utils/fetch-with-timeout.js';

// Get IPv6 address from MyExternalIP
const getIPFromMyExternalIP_V6 = async () => {
    try {
        const response = await fetchWithTimeout("https://ipv6.myexternalip.com/json");
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();
        const ip = data.ip;
        const source = "MyExternalIP IPv6";
        if (isValidIP(ip)) {
            return {
                ip: ip,
                source: source
            };
        } else { 
            console.warn("Invalid IP from MyExternalIP IPv6:", ip);
            return {
                ip: null,
                source: source
            };
        }
    } catch (error) {
        console.warn("Error fetching IPv6 address from MyExternalIP:", error);
        return {
            ip: null,
            source: "MyExternalIP IPv6"
        };
    }
};

export { getIPFromMyExternalIP_V6 };