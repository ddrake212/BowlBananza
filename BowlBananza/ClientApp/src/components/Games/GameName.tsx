import React from 'react';
import { GameInfo } from '../../types/gameTypes';
import styles from './Styles/GameStyles.module.css';
import { formatDate, formatTime } from '../../utils/DateUtils';

interface Props {
    game: GameInfo;
    onCompare: () => void;
    showSubmit: boolean;
    onSubmit: () => void;
}

const GameName = ({ game, onCompare, showSubmit, onSubmit }: Props) => {
    const date = new Date(game.StartDate ?? '');
    return (
        <div className={styles.gameTitle}>
            <div>
                <div>
                    <h3>{game.Notes?.toUpperCase()}</h3>
                    <p style={{ marginBottom: '0' }}>{formatDate(date)}</p>
                    <p>{formatTime(date)}</p>
                </div>
                <button className={styles.saveBtn} onClick={onCompare}><span>Past Games</span></button>
            </div>
            {
                showSubmit &&
                <div>
                    <button className={styles.saveBtn} onClick={onSubmit}>
                        <span>Submit Choices</span>
                    </button>
                </div>
            }
        </div>
    );
};

export default GameName;