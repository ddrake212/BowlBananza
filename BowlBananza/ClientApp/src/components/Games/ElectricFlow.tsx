import React, { useMemo } from "react";

type LineDef = { id: string; x1: number; y1: number; x2: number; y2: number };

type NeonPanelOverlayProps = {
    glowColor?: string;
    strokeWidth?: number;
    opacity?: number;
    pulseDuration?: number;
    className?: string;
    /** FALSE = Variant A, TRUE = Variant B */
    variant?: boolean;
};

/* -----------------------------------------
   PANEL SEAMS (inset from edges)
------------------------------------------ */
const panelLines: LineDef[] = [
    // Top-left angled panel (previously 0,12 → 12,0)
    { id: "tl1", x1: 3, y1: 13, x2: 13, y2: 3 },

    // Upper mid seam (pulled slightly down)
    { id: "um1", x1: 13, y1: 3, x2: 45, y2: 8 },
    { id: "um2", x1: 45, y1: 8, x2: 75, y2: 8 },

    // Right upper angled panel (previously ending at x=100)
    { id: "ru1", x1: 75, y1: 8, x2: 97, y2: 19 },

    // Right vertical seam (already away from edges)
    { id: "rv1", x1: 95, y1: 19, x2: 95, y2: 75 },

    // Lower L-shaped seam (already away from edges)
    { id: "ll1", x1: 7, y1: 60, x2: 7, y2: 85 },
    { id: "ll2", x1: 7, y1: 85, x2: 40, y2: 85 },

    // Lower right angled seam
    { id: "lr1", x1: 40, y1: 85, x2: 60, y2: 75 },
];

/* -----------------------------------------
   VARIANT A — tight angular cluster (upper)
------------------------------------------ */
const accentA: LineDef[] = [
    { id: "A1", x1: 25, y1: 18, x2: 45, y2: 5 },
    { id: "A2", x1: 45, y1: 5, x2: 65, y2: 18 },
    { id: "A3", x1: 65, y1: 18, x2: 55, y2: 35 },
    { id: "A4", x1: 55, y1: 35, x2: 32, y2: 32 },
    { id: "A5", x1: 40, y1: 42, x2: 58, y2: 42 },
    { id: "A6", x1: 48, y1: 30, x2: 48, y2: 52 },
];

/* -----------------------------------------
   VARIANT B — wide diagonal conduits (lower)
------------------------------------------ */
const accentB: LineDef[] = [
    { id: "B1", x1: 5, y1: 70, x2: 40, y2: 45 },
    { id: "B2", x1: 40, y1: 45, x2: 80, y2: 20 },
    { id: "B3", x1: 12, y1: 85, x2: 60, y2: 60 },
    { id: "B4", x1: 70, y1: 72, x2: 88, y2: 78 },
    { id: "B5", x1: 52, y1: 28, x2: 70, y2: 22 },
];

const NeonPanelOverlay: React.FC<NeonPanelOverlayProps> = ({
    glowColor = "#00ffff",
    strokeWidth = 1,
    opacity = 1,
    pulseDuration = 3,
    className,
    variant = false,
}) => {
    const outerWidth = strokeWidth * 3;

    const styles = useMemo(
        () => ({
            core: {
                stroke: glowColor,
                strokeWidth,
                strokeLinecap: "round" as const,
                strokeLinejoin: "round" as const,
            },
            outer: {
                stroke: glowColor,
                strokeWidth: outerWidth,
                strokeLinecap: "round" as const,
                strokeLinejoin: "round" as const,
            },
        }),
        [glowColor, strokeWidth, outerWidth]
    );

    const accents = variant ? accentB : accentA;

    return (
        <svg
            className={className}
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ opacity }}
        >
            <style>
                {`
          .neon-outer {
            filter: url(#neonGlow);
            opacity: 0.75;
          }

          .neon-core {
            filter: url(#neonGlow);
            stroke-dasharray: 140 40;
          }

          .neon-accent-core {
            filter: url(#neonGlow);
            stroke-dasharray: 55 35;
          }

          @keyframes neonFlow {
            to { stroke-dashoffset: -220; }
          }

          @keyframes neonPulse {
            0%   { opacity: 0.55; }
            50%  { opacity: 1; }
            100% { opacity: 0.7; }
          }
        `}
            </style>

            <defs>
                <filter id="neonGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b" />
                    <feColorMatrix
                        in="b"
                        type="matrix"
                        values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 1.6 0"
                        result="g"
                    />
                    <feMerge>
                        <feMergeNode in="g" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Panel seams */}
            {panelLines.map((l) => (
                <line
                    key={`pOut-${l.id}`}
                    className="neon-outer"
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    {...styles.outer}
                />
            ))}
            {panelLines.map((l) => (
                <line
                    key={`pCore-${l.id}`}
                    className="neon-core"
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    {...styles.core}
                />
            ))}

            {/* Variant-specific accents */}
            {accents.map((l) => (
                <line
                    key={`aOut-${l.id}`}
                    className="neon-outer"
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    {...styles.outer}
                    strokeWidth={outerWidth * 0.85}
                />
            ))}
            {accents.map((l) => (
                <line
                    key={`aCore-${l.id}`}
                    className="neon-accent-core"
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    {...styles.core}
                />
            ))}
        </svg>
    );
};

export default NeonPanelOverlay;
