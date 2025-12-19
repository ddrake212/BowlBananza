// utils/eventUtils.ts
import { useEffect, RefObject } from "react";

export type SwipeDirection = "left" | "right";

interface UseSwipeOptions {
    threshold?: number;
    lockAxis?: boolean;
    maxVerticalDelta?: number;
}

export function useSwipe<T extends HTMLElement>(
    ref: RefObject<T>,
    onSwipe: (direction: SwipeDirection) => void,
    options: UseSwipeOptions = {},
    enabled: boolean = true
): void {
    const {
        threshold = 50,
        lockAxis = true,
        maxVerticalDelta = 50,
    } = options;

    useEffect(() => {
        if (!enabled) return;

        const el = ref.current;
        if (!el) return;

        let startX = 0;
        let startY = 0;
        let isDown = false;

        const start = (x: number, y: number) => {
            isDown = true;
            startX = x;
            startY = y;
        };

        const end = (x: number, y: number) => {
            if (!isDown) return;
            isDown = false;

            const deltaX = x - startX;
            const deltaY = y - startY;

            if (lockAxis && Math.abs(deltaY) > maxVerticalDelta) return;
            if (Math.abs(deltaX) < threshold) return;

            const direction: SwipeDirection = deltaX > 0 ? "right" : "left";
            onSwipe(direction);
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.buttons !== 1) return;
            start(e.clientX, e.clientY);
        };

        const handlePointerUp = (e: PointerEvent) => {
            end(e.clientX, e.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            start(t.clientX, t.clientY);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const t = e.changedTouches[0];
            end(t.clientX, t.clientY);
        };

        el.addEventListener("pointerdown", handlePointerDown, { passive: true });
        el.addEventListener("pointerup", handlePointerUp);

        el.addEventListener("touchstart", handleTouchStart, { passive: true });
        el.addEventListener("touchend", handleTouchEnd);

        return () => {
            el.removeEventListener("pointerdown", handlePointerDown);
            el.removeEventListener("pointerup", handlePointerUp);

            el.removeEventListener("touchstart", handleTouchStart);
            el.removeEventListener("touchend", handleTouchEnd);
        };
    }, [ref, onSwipe, enabled, threshold, lockAxis, maxVerticalDelta]);
}
