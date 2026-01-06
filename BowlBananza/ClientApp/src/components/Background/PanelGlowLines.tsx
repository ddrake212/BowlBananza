// PanelGlowLines.tsx
import React, { useMemo } from "react";
import { GlowPoint, Point } from "../../types/glowUtils";
import styles from '../Shared.module.css';

export interface PanelGlowLinesProps {
    strokeWidth?: number;
    originalWidth: number;
    originalHeight: number;
    containerWidth?: number;
    containerHeight?: number;
    lines: GlowPoint[];
    poly: Point[][];
    cir: Point[];
    fillOpacity?: number;
}

const PanelGlowLines: React.FC<PanelGlowLinesProps> = ({
    strokeWidth = .8,
    originalWidth,
    originalHeight,
    lines,
    poly,
    cir,
    fillOpacity = .2,
}) => {
    const lineStyle = useMemo<React.CSSProperties>(
        () => ({
            strokeWidth,
        } as React.CSSProperties),
        [strokeWidth]
    );

    const polygonStyle = useMemo<React.CSSProperties>(
        () => ({
            strokeWidth,
            fillOpacity,
        }),
        [strokeWidth, fillOpacity]
    );

    const toPointsAttr = (poly: Point[]): string =>
        poly.map(p => `${p[0]},${p[1]}`).join(" ");

    return (
        <svg
            className={styles.panelGlowSVG}
            viewBox={`0 0 ${originalWidth} ${originalHeight}`}
            preserveAspectRatio="xMidYMid slice"  // <- important
        >
            {lines.map((line, i) => (
                <line
                    key={`glow_line_${i}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    style={
                        {
                            ...lineStyle,
                            strokeWidth: line.sw ?? strokeWidth
                        }
                    }
                />
            ))}
            {cir.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={5} style={polygonStyle} />
            ))}
            {poly.map((p, i) => (
                <polygon
                    key={i}
                    points={toPointsAttr(p)}
                    style={polygonStyle}
                />
            ))}
        </svg>
    );
};

export default PanelGlowLines;
