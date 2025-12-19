import { CSSProperties } from "react";
import { TeamInfo } from "../types/gameTypes";

export function generateMetallicCSS(hexColor: string, isSecond?: boolean): CSSProperties {
    // 1. Convert hex → RGB
    let r = parseInt(hexColor.slice(1, 3), 16);
    let g = parseInt(hexColor.slice(3, 5), 16);
    let b = parseInt(hexColor.slice(5, 7), 16);

    // 2. Slightly brighten for a metallic sheen
    r = Math.min(255, Math.max(0, Math.round(r * 1.1)));
    g = Math.min(255, Math.max(0, Math.round(g * 1.1)));
    b = Math.min(255, Math.max(0, Math.round(b * 1.1)));

    const bi1 = "rgba(255, 255, 255, 0.3)";
    const bi2 = "rgba(0, 0, 0, 0.1)";

    // 3. Build metallic CSS style
    const metallicCSS: CSSProperties = {
        backgroundColor: `rgb(${r}, ${g}, ${b})`,
        backgroundImage: isSecond
            ? `linear-gradient(${bi2}, ${bi1})`
            : `linear-gradient(${bi1}, ${bi2})`,
        boxShadow:
            `0 0 10px rgba(255, 255, 255, 0.2),
             0 2px 5px rgba(0, 0, 0, 0.6),
             3px 6px 8px rgba(0, 0, 0, 0.6)`
    };

    return metallicCSS;
}


export function generateNeonDivStyle(hexColor: string, size: number = 10): CSSProperties {
    // Convert hex → RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Brightened RGB values for glow
    const brighterR = Math.min(255, Math.round(r * 1.2));
    const brighterG = Math.min(255, Math.round(g * 1.2));
    const brighterB = Math.min(255, Math.round(b * 1.2));

    const neonStyle: CSSProperties = {
        backgroundColor: "transparent",
        borderColor: `rgb(${brighterR}, ${brighterG}, ${brighterB})`,
        boxShadow: `
            0 0 ${size}px rgba(${brighterR}, ${brighterG}, ${brighterB}, 0.5),
            0 0 ${size * 2}px rgba(${brighterR}, ${brighterG}, ${brighterB}, 0.3),
            0 0 ${size * 3}px rgba(${brighterR}, ${brighterG}, ${brighterB}, 0.2)
        `
    };

    return neonStyle;
}

export const getTeamColor = (team: TeamInfo | undefined) => {
    return team?.Color ?? invertHexColor(team?.AlternateColor ?? '#000000');
};
export function invertHexColor(hex: string): string {
    // Remove leading # if present
    let cleanHex = hex.replace(/^#/, "");

    // Expand shorthand (#abc → #aabbcc)
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map(ch => ch + ch)
            .join("");
    }

    if (cleanHex.length !== 6) {
        throw new Error(`Invalid hex color: ${hex}`);
    }

    // Convert to RGB values
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    // Invert the values
    const invR = (255 - r).toString(16).padStart(2, "0");
    const invG = (255 - g).toString(16).padStart(2, "0");
    const invB = (255 - b).toString(16).padStart(2, "0");

    return `#${invR}${invG}${invB}`;
}

export function shouldUseDarkText(backgroundColor: string): boolean {
    const rgb = parseColorToRgb(backgroundColor);
    if (!rgb) {
        // Fallback: assume dark background to avoid unreadable light text
        return false;
    }

    const { r, g, b } = rgb;

    // Relative luminance (WCAG)
    const luminance =
        0.2126 * normalize(r) +
        0.7152 * normalize(g) +
        0.0722 * normalize(b);

    // Threshold: tweakable, 0.5 is a solid default
    return luminance > 0.5;
}

function normalize(value: number): number {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
    // HEX: #RGB or #RRGGBB
    if (color.startsWith("#")) {
        const hex = color.slice(1);

        const fullHex =
            hex.length === 3
                ? hex.split("").map(c => c + c).join("")
                : hex;

        if (fullHex.length !== 6) return null;

        const num = parseInt(fullHex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        };
    }

    // rgb() or rgba()
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3]),
        };
    }

    return null;
}
