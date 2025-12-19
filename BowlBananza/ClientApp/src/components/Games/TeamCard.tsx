import React, { CSSProperties, useCallback, useMemo } from 'react';
import { TeamInfo, TeamRecords } from '../../types/gameTypes';
import { generateMetallicCSS, generateNeonDivStyle, invertHexColor } from '../../utils/colorUtils';
import styles from './Styles/GameStyles.module.css';
import { getBestLogo } from '../../utils/logoUtils';

interface Props {
    team: TeamInfo;
    onSelect: (team: TeamInfo) => void;
    isAway?: boolean;
    selected: boolean;
    record: TeamRecords | undefined;
    ranking: number | undefined;
    onStatsClicked: (team: TeamInfo) => void;
    locked: boolean;
}

const TeamCard = ({ team, onSelect, isAway, selected, record, ranking, onStatsClicked, locked }: Props) => {
    const altColor = team.Color ?? invertHexColor(team.AlternateColor ?? '#000000');
    const color = useMemo(() => generateMetallicCSS(altColor, isAway), [altColor, isAway]);
    const colorSx: CSSProperties = {};
    if (selected) {
        const neonColor = generateNeonDivStyle(altColor, 20);
        colorSx.boxShadow = neonColor.boxShadow;
        colorSx.borderColor = neonColor.borderColor;
    }

    const hoverStyle = useMemo<React.CSSProperties>(
        () => ({
            '--stats-border-color': team.Color ?? '#ccc',
        } as React.CSSProperties),
        [team.Color]
    );

    const statsClicked = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        onStatsClicked(team);
    }, [onStatsClicked, team]);

    const handleClick = useCallback(() => {
        if (!locked) {
            onSelect(team);
        }
    }, [locked, onSelect, team]);

    return (
        <button className={`${styles.teamCard} ${locked ? styles.cardLocked : ''}`} style={{ ...color, borderColor: team.AlternateColor ?? '', color: team.AlternateColor ?? '', ...colorSx, ...(selected ? { transform: 'scale(1.04)', zIndex: 2 } : {}) }} onClick={handleClick}>
            <div className={`${styles.teamBackground} ${isAway ? styles.awayBackground : ''}`} />
            <div style={{
                height: '100%',
                width: '100%',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div className={styles.flexStack}>
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(transparent, ${team.AlternateColor}, transparent)`, width: '100%' }}>
                        <img src={getBestLogo(team.AlternateColor ?? '', team.Color ?? '', altColor, team.Logos)} alt={team.Mascot ?? ''} />
                    </div>
                    <div className={styles.gameNameHolder}>
                        <h3>{`${team.School?.toUpperCase()}${ranking ? ` (${ranking})` : ''}`}</h3>
                        <p>{record ? `${record.Total?.Wins}-${record.Total?.Losses}${record.Total?.Ties ? `-${record.Total?.Ties}` : ''}` : ''}</p>
                        <h4>{team.Mascot?.toUpperCase()}</h4>
                    </div>
                </div>
                <button className={styles.statsBtn} style={{ borderColor: team.AlternateColor ?? '', ...hoverStyle }} onClick={statsClicked}><span>View Stats</span></button>
            </div>
        </button>
    );
};

export default TeamCard;