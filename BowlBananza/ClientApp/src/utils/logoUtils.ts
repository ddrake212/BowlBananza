function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace("#", "");
    const num = parseInt(cleaned, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function luminance(r: number, g: number, b: number): number {
    const toLinear = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    return (
        0.2126 * toLinear(r) +
        0.7152 * toLinear(g) +
        0.0722 * toLinear(b)
    );
}

function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export function getBestLogo(
    teamColor: string,
    teamAlternateColor: string,
    backgroundHex: string,
    logos: string[] | null | undefined
): string {
    if (!logos || logos.length === 0) return "";

    const normalLogo = logos[0];
    const darkLogo = logos[1] ?? logos[0];

    const bg = hexToRgb(backgroundHex);
    const bgLum = luminance(bg.r, bg.g, bg.b);

    const primary = hexToRgb(teamColor);
    const primaryLum = luminance(primary.r, primary.g, primary.b);

    const alternate = hexToRgb(teamAlternateColor);
    const alternateLum = luminance(alternate.r, alternate.g, alternate.b);

    // Contrast between background and team brand colors
    const contrastPrimary = contrastRatio(bgLum, primaryLum);
    const contrastAlternate = contrastRatio(bgLum, alternateLum);

    // If background blends heavily with primary color, dark logo usually helps.
    if (contrastPrimary < 2.5) {
        return darkLogo;
    }

    // If background blends with alternate color, normal logo tends to work better.
    if (contrastAlternate < 2.5) {
        return normalLogo;
    }

    // Otherwise general brightness-based heuristic
    const midpoint = 0.5;
    return bgLum < midpoint ? normalLogo : darkLogo;
}
