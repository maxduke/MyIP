<template>
    <!-- Bottom-right floating action dock: stacks its slotted buttons in a
        column anchored to the content-area right edge. On mobile the stack
        collapses into a single ellipsis toggle once the page has loaded
        (buttons cover too much content on small screens); desktop keeps the
        full stack. Overlays (Dialog/Sheet) inside the slotted widgets are
        teleported to <body>, so hiding the stack never unmounts them. -->
    <div class="fixed bottom-9 z-1050 flex flex-col items-end gap-2.5" :style="positionStyle">
        <Transition name="dock-stack">
            <div v-show="expanded" class="flex flex-col items-end gap-2.5" @click.capture="onChildClick">
                <slot />
            </div>
        </Transition>

        <!-- Ellipsis / X toggle, mobile only, appears with the first auto-collapse -->
        <Transition name="dock-toggle">
            <Button v-if="controlActive" size="icon" type="button" variant="secondary"
                class="relative rounded-full shadow-lg cursor-pointer"
                :aria-expanded="expanded" aria-label="Toggle floating actions" @click="expanded = !expanded">
                <component :is="expanded ? X : Ellipsis" class="size-4" />
                <!-- InfoMask-on reminder while the mask button is tucked away;
                    same green as the active mask button itself. -->
                <span v-if="maskActive && !expanded"
                    class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success"></span>
            </Button>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useMainStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Ellipsis, X } from '@lucide/vue';

const props = defineProps({
    // Flips true when the page has finished loading (the InfoMask button just
    // appeared) — starts the one-shot auto-collapse countdown on mobile.
    ready: Boolean,
    // InfoMask is on — show a dot on the collapsed toggle so the state stays visible.
    maskActive: Boolean,
});

const store = useMainStore();
const isMobile = computed(() => store.isMobile);

const expanded = ref(true);
// Once true, the ellipsis/X toggle exists and governs the stack (mobile only).
const controlActive = ref(false);

// One-shot: 2s after load completes, tuck the buttons into the ellipsis. The
// delay lets the freshly-appeared InfoMask button register before it hides.
let collapseTimer = null;
watch(() => props.ready, (val) => {
    if (!val || !isMobile.value || controlActive.value) return;
    collapseTimer = setTimeout(() => {
        controlActive.value = true;
        expanded.value = false;
    }, 2000);
}, { immediate: true });
onBeforeUnmount(() => clearTimeout(collapseTimer));

// A tap on any slotted button means the user's intent is served — tuck the
// stack away with it (X remains for "expanded but changed my mind").
const onChildClick = () => {
    if (controlActive.value) expanded.value = false;
};

// Wide screen (>1600px): align to the content area's right edge (max-width
// 1600px); otherwise stick 18px from the viewport's right edge.
const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
const positionStyle = computed(() => {
    if (screenWidth.value > 1600) {
        const spaceOnRight = (screenWidth.value - 1600) / 2;
        return { right: `${spaceOnRight + 18}px` };
    }
    return { right: '18px' };
});
const handleResize = () => { screenWidth.value = window.innerWidth; };

onMounted(() => window.addEventListener('resize', handleResize));
onBeforeUnmount(() => window.removeEventListener('resize', handleResize));
</script>

<style scoped>
/* Stack collapses downward into the toggle: shrink toward the bottom edge. */
.dock-stack-enter-active,
.dock-stack-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
    transform-origin: bottom center;
}

.dock-stack-enter-from,
.dock-stack-leave-to {
    transform: translateY(16px) scale(0.5);
    opacity: 0;
}

.dock-toggle-enter-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.dock-toggle-enter-from {
    transform: scale(0.5);
    opacity: 0;
}
</style>
