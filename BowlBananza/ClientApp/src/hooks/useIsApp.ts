import { useEffect, useState } from "react";

function computeIsApp(): boolean {
    if (typeof window === "undefined") return false;

    // iOS legacy (works when launched from Home Screen)
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // Standard PWA display-mode
    const isStandalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches === true;

    return isStandalone || isIOSStandalone;
}

export function useIsApp(): boolean {
    const [isApp, setIsApp] = useState<boolean>(() => computeIsApp());

    useEffect(() => {
        const update = () => setIsApp(computeIsApp());

        update(); // re-check after mount

        const mql = window.matchMedia?.("(display-mode: standalone)");
        // Some browsers support addEventListener; older use addListener
        if (mql) {
            if ("addEventListener" in mql) (mql as any).addEventListener("change", update);
            else (mql as any).addListener(update);
        }

        window.addEventListener("visibilitychange", update);
        window.addEventListener("pageshow", update); // important on iOS bfcache

        return () => {
            if (mql) {
                if ("removeEventListener" in mql) (mql as any).removeEventListener("change", update);
                else (mql as any).removeListener(update);
            }
            window.removeEventListener("visibilitychange", update);
            window.removeEventListener("pageshow", update);
        };
    }, []);

    return isApp;
}
