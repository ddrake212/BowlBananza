import React from 'react';
import { TeamInfo, GameInfo, TeamRecords } from '../../types/gameTypes';
import TeamCard from './TeamCard';
import styles from './Styles/GameStyles.module.css';
import GameName from './GameName';

interface Props {
    team1: TeamInfo;
    team2: TeamInfo;
    game: GameInfo;
    onSelect: (team: TeamInfo) => void;
    selectedTeam: number;
    slideDirection: 'left' | 'right' | null;
    records: Map<number, TeamRecords>;
    rankings: Map<number, number>;
    onCompare: () => void;
    onStatsClicked: (team: TeamInfo) => void;
    showSubmit: boolean;
    onSubmit: () => void;
    locked: boolean;
}

const TeamHolder = ({ team1, team2, game, onSelect, selectedTeam, slideDirection, records, rankings, onCompare, onStatsClicked, showSubmit, onSubmit, locked }: Props) => {
    const slideClass =
        slideDirection === 'left'
            ? styles.slideFromRight   // content moves left, so enters from right
            : slideDirection === 'right'
                ? styles.slideFromLeft
                : '';
    return (
        <div className={`${styles.teamHolder} ${slideClass}`}>
            <TeamCard
                team={team1}
                onSelect={onSelect}
                selected={selectedTeam === team1.Id}
                record={records?.get(team1.Id ?? -1)}
                ranking={rankings?.get(team1.Id ?? -1)}
                onStatsClicked={onStatsClicked}
                locked={locked}
            />
            <GameName game={game} onCompare={onCompare} showSubmit={showSubmit} onSubmit={onSubmit} />
            <TeamCard
                team={team2}
                isAway
                onSelect={onSelect}
                selected={selectedTeam === team2.Id}
                record={records?.get(team2.Id ?? -1)}
                ranking={rankings?.get(team2.Id ?? -1)}
                onStatsClicked={onStatsClicked}
                locked={locked}
            />
        </div>
    );
};

export default TeamHolder;
