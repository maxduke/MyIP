// Minimal app-wide event bus for domain events — components emit what
// happened ("speed test finished", "whois lookup ran") and decoupled modules
// react to it. Framework-agnostic on purpose: no Vue imports, usable from any
// util / composable / component. Consumed by the achievement engine
// (composables/use-achievement-engine.js) and the report collector
// (composables/use-report-collector.js).

const listeners = new Map(); // event name → Set<handler>

// Subscribe to an event. Returns an unsubscribe function.
export const onAppEvent = (event, handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => {
        const set = listeners.get(event);
        if (!set) return;
        set.delete(handler);
        if (set.size === 0) listeners.delete(event);
    };
};

// Emit an event to all subscribers. Emitting is fire-and-forget: a throwing
// handler must not break the emitter or the remaining handlers.
export const emitAppEvent = (event, payload = {}) => {
    const set = listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
        try {
            handler(payload);
        } catch (error) {
            console.error(`[app-events] handler for "${event}" failed:`, error);
        }
    }
};
