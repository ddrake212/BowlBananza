import React from "react";
import { GlowPoints } from "../../constants/glowConstants";
import PanelGlowLines from "./PanelGlowLines";
import { useLocation } from "react-router";

const GlowOverlay = () => {
    const { pathname } = useLocation();
    const path = pathname.toLowerCase().substring(1) || 'home';
    const glowData = GlowPoints[path];

    return glowData ? (
        <div style={{ position: 'fixed', height: '100%', width: '100%', top: 0, left: 0 }}>
            <PanelGlowLines
                originalHeight={glowData.size[1]}
                originalWidth={glowData.size[0]}
                lines={glowData.lines}
                poly={glowData.poly}
                cir={glowData.cir} />
        </div>
    ) : <></>;
};

export default GlowOverlay;