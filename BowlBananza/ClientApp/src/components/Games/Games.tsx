import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import GameContainer from './GameContainer';
import { TeamInfo, GameInfo, TeamRecords, GameTeamStatsType, Matchup } from '../../types/gameTypes';
import TeamHolder from './TeamHolder';
import ProgressBar from './ProgressBar';
import styles from './Styles/GameStyles.module.css';
import { useSwipe } from '../../utils/eventUtils';
import { objectToNumberMap } from '../../utils/mapUtils';
import MainLoading from '../MainLoading';
import SubmitChoices from './SubmitChoices';
import { useNavigate } from 'react-router';
import { TeamMetrics }  from './TeamMetrics';
import { MatchupDialog } from './TeamMatchup';
import { useAuth } from '../../hooks/useAuth';
import { getTeamColor } from '../../utils/colorUtils';
import { useUpdateColor } from '../../hooks/useUpdateColor';

const Games = () => {
    const updateColor = useUpdateColor();
    const navigate = useNavigate();

    const { isSubmitted, isLocked, isInactive, checked } = useAuth();

    useEffect(() => {
        if (checked && isInactive) {
            navigate('/');
        }
    }, [isInactive, checked, navigate]);

    const holderRef = useRef<HTMLDivElement>(null);

    const [teams, setTeams] = useState<{ [key: number]: TeamInfo }>({});
    const [games, setGames] = useState<GameInfo[]>([]);

    const [loading, setLoading] = useState<boolean>(true);

    const [showSubmitOverlay, setShowSubmitOverlay] = useState<boolean>(false);

    const [gameIndex, setGameIndex] = useState<number>(-1);
    const [team1, setTeam1] = useState<TeamInfo | undefined>(undefined);
    const [team2, setTeam2] = useState<TeamInfo | undefined>(undefined);

    const [records, setRecords] = useState<Map<number, TeamRecords>>(new Map());
    const [rankings, setRankings] = useState<Map<number, number>>(new Map());

    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    const [selectedTeams, setSelectedTeams] = useState<Map<number, number>>(new Map());
    const [currentSelectedTeams, setCurrentSelectedTeams] = useState<Map<number, number>>(new Map());

    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [transitionKey, setTransitionKey] = useState(0);

    const [teamMetrics, setTeamMetrics] = useState<GameTeamStatsType | undefined>(undefined);
    const [teamMatchup, setTeamMatchup] = useState<Matchup | undefined>(undefined);

    const today = new Date();

    useEffect(() => {
        updateColor('#ffffff00');
    }, [updateColor]);

    useEffect(() => {
        setLoading(true);
        fetch('bb')
            .then(resp => {
                if (resp.status === 401) {
                    navigate('/login', { state: { rtnPage: '/games'}});
                } else {
                    return resp.json()
                }
            })
            .then(result => {
                setGames(result.games);
                setTeams(result.teams);
                setRecords(objectToNumberMap<TeamRecords>(result.records));
                setRankings(objectToNumberMap<number>(result.rankings));
                const map = new Map<number, number>();
                for (let i = 0; i < result.selections.length; i++) {
                    map.set(result.selections[i].GameId, result.selections[i].TeamId);
                }
                let startIndex = -1;
                setSelectedColors(arr => {
                    const newArr = [...arr];
                    let tempTeamForColor = null;
                    for (let i = 0; i < result.games.length; i++) {
                        const teamId = map.get(result.games[i].Id ?? -1);
                        const team = result.teams[teamId ?? -1];
                        if (team) {
                            newArr[i] = getTeamColor(team);
                            if (i === 0) {
                                tempTeamForColor = team;
                            }
                        } else if (startIndex === -1) {
                            startIndex = i;
                        }
                    }
                    if (startIndex === -1) {
                        updateColor(getTeamColor(tempTeamForColor));
                    }
                    return newArr;
                });

                setSelectedTeams(map);
                setCurrentSelectedTeams(map);
                setGameIndex(Math.max(0, startIndex));
            })
            .catch((e) => { })
            .finally(() => setLoading(false));
    }, [updateColor, navigate]);

    useEffect(() => {
        if (gameIndex > -1) {
            setTeam1(teams[games[gameIndex]?.HomeId ?? 0]);
            setTeam2(teams[games[gameIndex]?.AwayId ?? 0]);
        }
    }, [gameIndex, teams, games]);

    const save = useCallback((game: number, team: number) => {
        fetch(`/bb/SaveSelections?game=${game}&team=${team}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        }).then(resp => {
            if (resp.status === 401) {
                navigate('/login', { state: { rtnPage: '/games' } })
            }
        }).catch(() => { });
    }, [navigate]);

    const onSelect = useCallback((team: TeamInfo) => {
        updateColor(getTeamColor(team));
        setSelectedTeams(m => {
            const newMap = new Map(m);
            if (newMap.size === games.length - 1 && !newMap.has(games[gameIndex]?.Id ?? -1)) {
                setShowSubmitOverlay(true)
            }
            newMap.set(games[gameIndex]?.Id ?? -1, team.Id ?? -1);
            return newMap;
        });

        setSelectedColors(arr => {
            const newArr = [...arr];
            newArr[gameIndex ?? -1] = getTeamColor(team);
            return newArr;
        })

        save(games[gameIndex]?.Id ?? -1, team.Id ?? -1);
    }, [updateColor, setSelectedTeams, gameIndex, games, setSelectedColors, save, setShowSubmitOverlay]);

    const selectedTeamId = useMemo(() => selectedTeams.get(games[gameIndex]?.Id ?? -1) ?? -1, [selectedTeams, games, gameIndex]);

    const colorReset = useCallback((i) => {
        const selectedTeam = teams[selectedTeams.get(games[i]?.Id ?? -1) ?? -1];
        if (selectedTeam) {
            updateColor(getTeamColor(selectedTeam));
        } else {
            updateColor('#ffffff00');
        }
    }, [updateColor, selectedTeams, teams, games]);

    const changeGame = useCallback((dir: number) => {
        if (games.length === 0 || (gameIndex === 0 && dir < 0) || (gameIndex === games.length - 1 && dir > 0)) return;

        // dir > 0: going forward → new content should appear to slide in from the right
        setSlideDirection(dir > 0 ? 'left' : 'right');
        setTransitionKey(k => k + 1); // force remount of TeamHolder

        setGameIndex(ind => {
            const newInd = Math.max(0, Math.min(ind + dir, games.length - 1));
            colorReset(newInd);
            return newInd;
        });
    }, [games.length, gameIndex, colorReset]);

    useEffect(() => {
        const keyDown = (e: KeyboardEvent) => {
            if (showSubmitOverlay || teamMetrics !== undefined || teamMatchup !== undefined) {
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                changeGame(e.key === 'ArrowLeft' ? -1 : 1);
            }
        };

        window.addEventListener('keydown', keyDown);
        return () => window.removeEventListener('keydown', keyDown);
    }, [changeGame, showSubmitOverlay, teamMetrics, teamMatchup]);

    const onSwipe = useCallback((direction: 'left' | 'right') => {
        changeGame(direction === 'left' ? 1 : -1);
    }, [changeGame]);

    const progressGameChange = useCallback((i: number) => {
        setGameIndex(i);
        colorReset(i);
    }, [setGameIndex, colorReset]);

    const isReady = gameIndex >= 0 && !!team1 && !!team2;

    useSwipe(holderRef, onSwipe, {}, isReady);

    const onCompare = useCallback(() => {
        fetch(`/bb/compare?team1=${encodeURIComponent(team1?.School ?? '')}&team2=${encodeURIComponent(team2?.School ?? '')}`)
            .then(resp => {
                if (resp.status === 401) {
                    navigate('/login', { state: { rtnPage: '/games' } });
                } else {
                    return resp.json();
                }
            })
            .then(result => {
                setTeamMatchup(result)
            })
            .catch(() => { });
    }, [team1, team2, navigate]);

    const onStatsClicked = useCallback((team: TeamInfo) => {
        fetch(`/bb/metrics?team=${encodeURIComponent(team.School ?? '')}`)
            .then(resp => {
                if (resp.status === 401) {
                    navigate('/login', { state: { rtnPage: '/games' } })
                } else {
                    return resp.json();
                }
            })
            .then(result => {
                setTeamMetrics({
                    ...result,
                    Color: team.Color,
                    AlternateColor: team.AlternateColor,
                    Logos: team.Logos,
                    Mascot: team.Mascot
                })
            })
            .catch(() => { });
    }, [navigate]);

    const submitChoices = useCallback(() => {
        setLoading(true);
        fetch('/bb/submitChoices').then(resp => {
            if (resp.status === 401) {
                navigate('/login', { state: { rtnPage: '/games' } });
            } else {
                navigate('/home');
            }
        }).catch(() => { });
    }, [navigate]);

    if (loading) {
        return <MainLoading />;
    }

    if (!games.length) {
        return <div className={styles.noGamesLabel}><h3>No Games To Select</h3></div>
    }
    return (
        <>
            <ProgressBar
                selectedColors={selectedColors}
                games={games}
                onClick={progressGameChange}
                gameIndex={gameIndex}
            />
            <GameContainer
                color1={team1?.Color ?? ''}
                color2={team2?.Color ?? ''}
                fRef={holderRef}
            >
                <div className={styles.mainGameHolder}>
                    <button className={styles.Back} disabled={gameIndex <= 0} onClick={() => changeGame(-1)} />
                    <TeamHolder
                        key={transitionKey}
                        team1={team1!}
                        team2={team2!}
                        game={games[gameIndex]}
                        onSelect={onSelect}
                        selectedTeam={selectedTeamId}
                        slideDirection={slideDirection}
                        records={records}
                        rankings={rankings}
                        onCompare={onCompare}
                        onStatsClicked={onStatsClicked}
                        showSubmit={selectedTeams.size === games.length && !showSubmitOverlay && !isSubmitted}
                        onSubmit={submitChoices}
                        locked={new Date((games[gameIndex]?.StartDate ?? today)) <= today || Boolean((isLocked || isSubmitted) && currentSelectedTeams.get(games[gameIndex]?.Id ?? -1))}
                    />
                    <button className={styles.Next} disabled={gameIndex >= games.length - 1} onClick={() => changeGame(1)} />
                </div>
            </GameContainer>
            {
                (showSubmitOverlay || teamMetrics !== undefined || teamMatchup !== undefined) &&
                <div className={`${styles.gamesDialogHolder} ${showSubmitOverlay ? styles.submitOverlay : ''} ${teamMetrics !== undefined ? styles.metricsOverlay : ''} ${teamMatchup !== undefined ? styles.matchupOverlay : ''}`}>
                        {
                            (showSubmitOverlay) &&
                            <SubmitChoices
                                onCancel={() => setShowSubmitOverlay(false)}
                                onSubmit={submitChoices}
                            />
                        }
                        {
                            teamMetrics !== undefined &&
                            <TeamMetrics metrics={teamMetrics} onClose={() => setTeamMetrics(undefined)} />
                        }
                        {
                            teamMatchup !== undefined &&
                            <MatchupDialog matchup={teamMatchup} onClose={() => setTeamMatchup(undefined)} team1={team1!} team2={team2!} />
                        }
                </div>
            }
        </>
    );
};

export default Games;