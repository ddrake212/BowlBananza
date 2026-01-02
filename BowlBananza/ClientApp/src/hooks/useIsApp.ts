export function useIsApp(): boolean {
  // Standard PWA display-mode check
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches === true;

  // iOS Safari "Add to Home Screen" legacy flag
  const isIOSStandalone =
    (window.navigator as any).standalone === true;

    return isStandalone || isIOSStandalone;
}
