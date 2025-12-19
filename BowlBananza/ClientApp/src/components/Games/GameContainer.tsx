import React, { RefObject, useMemo } from 'react';
import styles from './Styles/GameStyles.module.css';
import NeonPanelOverlay from './ElectricFlow';
import { ColorContext } from '../../contexts/ColorContext';

interface Props {
    children: React.ReactNode | React.ReactElement | React.ReactElement[] | React.ReactNode[];
    color1: string;
    color2: string;
    fRef: RefObject<HTMLDivElement>;
}

const GameContainer = ({ color1, color2, children, fRef }: Props) => {
    const { color } = React.useContext(ColorContext) ?? { color: '#ccc' };

    const borderStyle = useMemo<React.CSSProperties>(
        () => ({
            '--background-border-color': color === '#ffffff00' ? '#ccc' : color,
        } as React.CSSProperties),
        [color]
    );
    return (
        <div className={styles.content}>
            <div className={styles.gameContainer}>
                <div className={styles.background} style={borderStyle}>
                    <NeonPanelOverlay glowColor={color1} />
                    <NeonPanelOverlay glowColor={color2} variant />
                </div>
                <div className={styles.foreground} ref={fRef}>{children}</div>
            </div>
        </div>
    );
};

export default GameContainer;