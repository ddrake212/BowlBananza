import React, { useCallback, useMemo, useState } from "react";
import styles from "./Styles/GameStyles.module.css";
import { Matchup, MatchupGame, TeamInfo } from "../../types/gameTypes";
import { getBestLogo } from "../../utils/logoUtils";
import { invertHexColor } from "../../utils/colorUtils";


type Props = {
    matchup: Matchup;
    team1: TeamInfo | undefined;
    team2: TeamInfo | undefined;
    onClose: () => void;
};

export function MatchupDialog({ matchup, onClose, team1, team2 }: Props) {
    const team1Name = team1?.School ?? "Team 1";
    const team2Name = team2?.School ?? "Team 2";

    const [closing, setClosing] = useState<boolean>(false);

    const closeClicked = useCallback(() => {
        setClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    const games = useMemo(() => {
        const raw = matchup.Games ?? [];
        return [...raw].sort((a, b) => {
            const ad = a.Date ? Date.parse(a.Date) : 0;
            const bd = b.Date ? Date.parse(b.Date) : 0;
            return bd - ad; // newest first
        });
    }, [matchup.Games]);

    const hasNoData = useMemo(() => {
        const gamesEmpty = games.length === 0;
        const topLevelNull =
            matchup.StartYear == null &&
            matchup.WndYear == null &&
            matchup.Team1 == null &&
            matchup.Team2 == null &&
            matchup.Team1Wins == null &&
            matchup.Team2Wins == null &&
            matchup.Ties == null;

        return topLevelNull && gamesEmpty;
    }, [matchup, games.length]);

    const yearLabel = useMemo(() => {
        return matchup.StartYear;
    }, [matchup]);

    const recordLabel = useMemo(() => {
        if (matchup.Team1Wins == null && matchup.Team2Wins == null && matchup.Ties == null) {
            return "No games yet";
        }

        return `${team1Name}: ${matchup.Team1Wins ?? 0} - ${team2Name}: ${matchup.Team2Wins ?? 0}${matchup.Ties ? ` - Ties: ${matchup.Ties}` : ""
            }`;
    }, [matchup, team1Name, team2Name]);

    const altColor1 = team1?.Color ?? invertHexColor(team1?.AlternateColor ?? '#000000');
    const altColor2 = team2?.Color ?? invertHexColor(team2?.AlternateColor ?? '#000000');

    const matchupHeaderStyle = useMemo<React.CSSProperties>(
        () => ({
            '--matchup-cA': team1?.Color ?? '#ccc',
            '--matchup-cB': team1?.AlternateColor ?? '#ccc',
            '--matchup-cC': team2?.Color ?? '#ccc',
            '--matchup-cD': team2?.AlternateColor ?? '#ccc',
        } as React.CSSProperties),
        [team1, team2]
    );

    return (
        <div className={`${styles.matchupContainer} ${closing ? styles.closing : ''}`} style={{background: `linear-gradient(90deg, ${team1?.Color}, ${team2?.Color})`}} role="dialog" aria-modal="true" aria-label="Matchup details">
            <div className={styles.matchupHeader} style={matchupHeaderStyle}>
                <div className={styles.matchupTitleWrap}>
                    <div className={styles.matchupTitle}>
                        <div style={{ fontSize: '16pt', position: 'relative' }}><img src={getBestLogo(team1?.AlternateColor ?? '', team1?.Color ?? '', altColor1, team1?.Logos)} alt={team1?.Mascot ?? ''} /><span>{team1Name}</span></div> vs <div style={{ fontSize: '16pt', position: 'relative' }}><span>{team2Name}</span><img src={getBestLogo(team2?.AlternateColor ?? '', team2?.Color ?? '', altColor2, team2?.Logos)} alt={team2?.Mascot ?? ''} /></div>
                    </div>
                    <div className={styles.matchupSubtitle}>
                        Season: {yearLabel}
                    </div>
                </div>

                <button
                    className={styles.matchupCloseButton}
                    onClick={closeClicked}
                    type="button"
                    aria-label="Close"
                >
                </button>
            </div>

            <div className={styles.matchupBody}>
                {hasNoData ? (
                    <div className={styles.matchupEmptyState}>
                        <div className={styles.matchupEmptyTitle}>No matchup data</div>
                        <div className={styles.matchupEmptyText}>
                            These teams have not played each other yet.
                        </div>
                    </div>
                ) : (
                    <div className={styles.matchupContentGrid}>
                        <div className={styles.matchupCard}>
                            <div className={styles.matchupCardLabel}>Record</div>
                            <div className={styles.matchupCardValue}>{recordLabel}</div>
                        </div>

                        <div className={styles.matchupSection}>
                            <div className={styles.matchupSectionTitle}>Games</div>

                            {games.length === 0 ? (
                                <div className={styles.matchupEmptyInline}>No games found.</div>
                            ) : (
                                <div className={styles.matchupGamesList}>
                                    {games.map((g, idx) => {
                                        const empty = isEmptyGame(g);

                                        if (empty) {
                                            return (
                                                <div key={`empty-${idx}`} className={styles.matchupGameRow}>
                                                    <div className={styles.matchupGameTop}>
                                                        <div className={styles.matchupGameDate}>{formatDate(g.Date)}</div>
                                                        <div className={styles.matchupGameBadges}>
                                                            {g.SeasonType && <span className={styles.matchupBadge}>{g.SeasonType}</span>}
                                                            {g.Week != null && <span className={styles.matchupBadge}>Week {g.Week}</span>}
                                                            {g.NeutralSite && <span className={styles.matchupBadge}>Neutral</span>}
                                                        </div>
                                                    </div>

                                                    <div className={styles.matchupNotPlayed}>Not played yet</div>
                                                </div>
                                            );
                                        }

                                        const away = g.AwayTeam ?? "Away";
                                        const home = g.HomeTeam ?? "Home";
                                        const played = g.AwayScore != null && g.HomeScore != null;
                                        const winner = g.Winner ?? (played ? pickWinner(home, away, g.HomeScore!, g.AwayScore!) : null);

                                        return (
                                            <div key={`${g.Date ?? "nodate"}-${idx}`} className={styles.matchupGameRow}>
                                                <div className={styles.matchupGameTop}>
                                                    <div className={styles.matchupGameDate}>{formatDate(g.Date)}</div>

                                                    <div className={styles.matchupGameBadges}>
                                                        {g.SeasonType && <span className={styles.matchupBadge}>{g.SeasonType}</span>}
                                                        {g.Week != null && <span className={styles.matchupBadge}>Week {g.Week}</span>}
                                                        {g.NeutralSite && <span className={styles.matchupBadge}>Neutral</span>}
                                                    </div>
                                                </div>

                                                <div className={styles.matchupScoreGrid}>
                                                    <div className={styles.matchupTeamLine}>
                                                        <span className={styles.matchupTeamName}>{away}</span>
                                                        <span className={styles.matchupTeamScore}>{g.AwayScore ?? "—"}</span>
                                                    </div>

                                                    <div className={styles.matchupTeamLine}>
                                                        <span className={styles.matchupTeamName}>{home}</span>
                                                        <span className={styles.matchupTeamScore}>{g.HomeScore ?? "—"}</span>
                                                    </div>

                                                    <div className={styles.matchupGameFooter}>
                                                        <span className={styles.matchupVenue}>
                                                            {g.Venue ?? ""}
                                                        </span>
                                                        <span className={styles.matchupWinner}>
                                                            {winner ? `Winner: ${winner}` : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function isEmptyGame(g: MatchupGame): boolean {
    // all null => not played / no data
    return (
        g.AwayScore == null &&
        g.AwayTeam == null &&
        g.Date == null &&
        g.HomeScore == null &&
        g.HomeTeam == null &&
        g.NeutralSite == null &&
        g.Season == null &&
        g.SeasonType == null &&
        g.Venue == null &&
        g.Week == null &&
        g.Winner == null
    );
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    });
}

function pickWinner(home: string, away: string, homeScore: number, awayScore: number): string | null {
    if (homeScore === awayScore) return null;
    return homeScore > awayScore ? home : away;
}
