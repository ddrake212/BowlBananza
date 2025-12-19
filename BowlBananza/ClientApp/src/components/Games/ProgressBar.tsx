import React, { useCallback } from 'react';
import { GameInfo } from '../../types/gameTypes';
import styles from './Styles/GameStyles.module.css';

interface Props {
    games: GameInfo[];
    onClick: (i: number) => void;
    selectedColors: string[];
    gameIndex: number;
}

const ProgressBar = ({ games, onClick, selectedColors, gameIndex }: Props) => {
    return (
        <div className={styles.progressBar}>
            {games.map((x, i) => {
                return (
                    <div
                        key={`progress_bar_${i}`}
                        style={{ backgroundColor: selectedColors[i] ?? '#ffffff08' }}
                        onClick={() => onClick(i)}
                        className={i===gameIndex ? styles.currentProgress : ''}
                    />
                );
            })}
        </div>
    )
};

export default ProgressBar;