import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { TeamInfo } from './TeamInfo';
import {
    generateNeonDivStyle,
    generateMetallicCSS
} from '../utils/colorUtils';

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd() {
    touchStartX = null; // Reset on touch end as well
}

const ProgressBar = (gamesSelected, gameIndex) => {
    const getColor = (x, i) => {
        if (i == gameIndex) {
            return 'rgb(19,147,232)';
        } else if (x === 1) {
            return 'rgb(83,230,149)';
        } else if (x === -1) {
            return 'rgb(175,1,14)';
        } else {
            return 'transparent'
        }
    };

    return <div className="ProgressBarHolder">
        {gamesSelected.map((x, i) => {
            return <div style={{ background: getColor(x, i) }} key={i}></div>
        })}
    </div>
}

const formatDate = (date) => {
    var suffix = 'th';
    if (date.endsWith('1')) {
        suffix = 'st';
    } else if (date.endsWith('2')) {
        suffix = 'nd';
    } else if (date.endsWith('3')) {
        suffix = 'rd';
    }
    return date + suffix;
}

const formatGameDate = (date) => {
    var dateStr = (new Date(date)).toString();
    var dateParts = dateStr.split(' ').slice(0, 4);
    return `${dateParts[0]} ${dateParts[1]}. ${formatDate(dateParts[2])}, ${dateParts[3]}`;
}

var teamClicked = false;
var backClicked = false;
var forwardClicked = false;

export const Games = () => {
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [gameName, setGameName] = useState('');
    const [gameIndex, setGameIndex] = useState(0);
    const [selectedTeams, setSelectedTeams] = useState({});
    const [teamInfoTeam, setTeamInfoTeam] = useState(null);
    const [gameInfoId, setGameInfoId] = useState('');
    const [currentSelectedTeam, setCurrentSelectedTeam] = useState(null);
    const [gamesSelected, setGamesSelected] = useState([]);
    const [sidePanelColor, setSidePanelColor] = useState({});
    const [sidePanelColorLeft, setSidePanelColorLeft] = useState({});
    const [sidePanelColorRight, setSidePanelColorRight] = useState({});

    var onSwipeLeft = useCallback(() => {
        setGameIndex(index => Math.max(0, index - 1));
    }, [setGameIndex]);

    var onSwipeRight = useCallback(() => {
        setGameIndex(index => {
            setGamesSelected(selected => {
                var arr = [...selected];
                arr[index] = !!currentSelectedTeam ? 1 : -1;
                return arr;
            });
            return Math.min(games.length - 1, index + 1)
        });
    }, [setGameIndex, setGamesSelected, currentSelectedTeam, games]);

    var handleTouchMove = useCallback((event) => {
        if (!touchStartX) return; // Not started yet

        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;

        const diffX = touchX - touchStartX;
        const diffY = touchY - touchStartY;

        // Set a threshold for swipe detection (adjust as needed)
        const threshold = 50;  // in pixels

        if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) { // Prioritize horizontal swipes
            if (diffX < 0) {
                // Call your swipe right function here
                onSwipeRight();
            } else {
                // Call your swipe left function here
                onSwipeLeft();
            }
            touchStartX = null; // Reset for the next swipe
        }

    }, [onSwipeLeft, onSwipeRight]);

    useEffect(() => {
        var neonColor = currentSelectedTeam ? generateNeonDivStyle(currentSelectedTeam.color ?? '#000000') : {};
        setSidePanelColor(neonColor);

        if (currentSelectedTeam) {
            if (currentSelectedTeam.id == games[gameIndex].home_id) {
                setSidePanelColorLeft(neonColor);
                setSidePanelColorRight({});
            } else {
                setSidePanelColorLeft({});
                setSidePanelColorRight(neonColor);
            }
        } else {
            setSidePanelColorLeft({});
            setSidePanelColorRight({});
        }

    }, [setSidePanelColor, currentSelectedTeam, setSidePanelColorLeft, setSidePanelColorRight, games, gameIndex]);

    useEffect(() => {
        setGamesSelected(Array.from({ length: games.length }, () => 0));
    }, [games, setGamesSelected]);

    const selectedTeamsString = JSON.stringify(selectedTeams);

    useEffect(() => {
        setCurrentSelectedTeam(null);
    }, [gameIndex, setCurrentSelectedTeam]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' || event.code === 'ArrowRight') {
                setGameIndex(index => {
                    setGamesSelected(selected => {
                        var arr = [...selected];
                        arr[index] = !!currentSelectedTeam ? 1 : -1;
                        return arr;
                    });
                    return Math.min(games.length - 1, index + 1)
                });
            } else if (event.code === 'ArrowLeft') {
                setGameIndex(index => Math.max(0, index - 1));
            }
        };

        // Add the event listener when the component mounts
        window.addEventListener('keydown', handleKeyDown);

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [currentSelectedTeam, setGameIndex, games, handleTouchMove]);

    const populateGameData = useCallback(async () => {
        const response = await fetch('bb');
        const data = await response.json();
        setGames(data.games);
        setTeams(data.teams);
        setLoading(false);
    }, [setGames, , setLoading]);

    useEffect(() => {
        populateGameData();
    }, [populateGameData]);

    useEffect(() => {
        if (!loading) {
            setGameName(games[gameIndex]?.notes ?? 'Loading');
        }
    }, [setGameName, games, gameIndex, loading]);

    const FormatTeamInfo = useCallback((team, gameId, isAway, addedClassName = "") => {
        var onClick = () => {
            setTeamInfoTeam(team);
            setGameInfoId(gameId);
        };
        const color = generateMetallicCSS(team.alt_color ?? '#000000', isAway);
        return (
            <div onClick={onClick} style={color} className={`teamStatsBtn ${addedClassName}`}>
                <img src={team.logos[0] ?? team.logos[1]} />
                <span style={{ color: team.color ?? '#ffffff' }}>Team Stats</span>
            </div>
        );
    }, [setTeamInfoTeam]);

    const FormatTeam = useCallback((team, opId, gameId, isAway) => {
        const color = generateMetallicCSS(team.color ?? '#000000', isAway); // Grey color
        
        const onClick = () => {
            setSelectedTeams(teams => {
                var obj = { ...teams };
                obj[`${gameId}-${team.id}`] = true;
                obj[`${gameId}-${opId}`] = false;

                return obj
            });
            if (teamClicked) {
                setGameIndex(index => {
                    return index + 1;
                });
            }
            teamClicked = true;
            setTimeout(() => { teamClicked = false }, 400);
        };

        if (selectedTeams[`${gameId}-${team.id}`]) {
            const neonColor = generateNeonDivStyle(team.color ?? '#000000', 20);
            color.boxShadow = neonColor.boxShadow;
            color.borderColor = neonColor.borderColor;
            setCurrentSelectedTeam(team);
            setGamesSelected(selected => {
                var arr = [...selected];
                arr[gameIndex] = 1;
                return arr;
            });
        }
        return (
            <>
                <div onClick={onClick} className={'team'} style={color}>
                    <img className="teamLogo" src={team.logos[1] ?? team.logos[0]} />
                    <div className="teamSx">
                        <label className="teamLabel">{team.school}</label><label>{team.mascot}</label>
                    </div>
                </div>
                {FormatTeamInfo(team, gameId, isAway)}
            </>
        );
    }, [setSelectedTeams, selectedTeamsString, selectedTeams, setGameIndex, setGamesSelected, gameIndex, setCurrentSelectedTeam, FormatTeamInfo]);

    const FormatGame = useCallback(() => {
        const game = games[gameIndex];
        var ht = teams[game.home_id];
        var at = teams[game.away_id];

        var onClick = () => {
            if (backClicked) {
                setGameIndex(index => {
                    return Math.max(0,index - 1);
                });
            }
            backClicked = true;
            setTimeout(() => {
                backClicked = false
            }, 400);
        };

        var onClickRight = () => {
            if (forwardClicked) {
                setGameIndex(index => {
                    return Math.min(games.length - 1, index + 1);
                });
            }
            forwardClicked = true;
            setTimeout(() => {
                forwardClicked = false
            }, 400);
        };

        return (
            <div className="MainGameHolder">
                <div onClick={onClick} className="lightSideSx" style={sidePanelColorLeft} ></div>
                <div onClick={onClickRight} className="darkSideSx" style={sidePanelColorRight}></div>
                <div className="gameHolderSx">
                    <div className="gameNameSx">
                        {gameName}
                    </div>
                    <div className="teamsHolderSx">
                        <div className="leftShadowSx" style={sidePanelColor}></div>
                        <div className="rightShadowSx" style={sidePanelColor}></div>
                        <div className="teamSubHolder">
                            {FormatTeam(ht, at.id, game.id, false)}
                            <div className="logo"></div>
                            {FormatTeam(at, ht.id, game.id, true)}
                            <div className="gameFooter">
                                {FormatTeamInfo(ht, game.id, false)}
                                <div className="gameDate">{formatGameDate(game.start_date)}</div>
                                {FormatTeamInfo(at, game.id, true)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [games, teams, gameIndex, setGameIndex, gameName, FormatTeam, sidePanelColor, sidePanelColorLeft, sidePanelColorRight]);

    const renderGamesTable = useCallback(() => {
        return (
            <div>{FormatGame()}</div>
        );
    }, [FormatGame]);

    let contents = useMemo(() => loading
        ? <div className="loading"></div>
        : renderGamesTable()
        , [loading, renderGamesTable]);

    let progress = useMemo(() => {
        return loading ? <></> : ProgressBar(gamesSelected, gameIndex);
    }, [loading, gamesSelected, gameIndex])

    return (
        <>
            <div className="gamesBackground"></div>
            <div className="gamesHolder">
            {!loading && progress}
                {contents}
            </div>
            {teamInfoTeam && gameInfoId &&
                <TeamInfo
                    team={teamInfoTeam}
                    gameInfoId={gameInfoId}
                    onClose={() => setTeamInfoTeam(null)}
                />
            }
        </>
    );
}
