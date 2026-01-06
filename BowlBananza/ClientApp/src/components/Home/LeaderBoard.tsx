import React, { useState, useMemo } from 'react';
import styles from './Styles/Home.module.css';
import { shouldUseDarkText } from '../../utils/colorUtils';
import { HomeData } from '../../types/homeTypes';
import { GameInfo } from '../../types/gameTypes';

interface Props {
    data: HomeData | undefined;
    picksByGameId: Map<number, Record<number, number>>;
    userPropsByUserId: Map<number, { color?: string | null | undefined, image?: string | null | undefined }>
};

function buildRanks<T extends { score: number }>(
    items: T[]
): Array<T & { rank: number; isTied: boolean }> {
    const result: Array<T & { rank: number; isTied: boolean }> = [];
    let lastScore: number | null = null;
    let lastRank = 0;

    const counts = new Map<number, number>();
    for (const it of items) counts.set(it.score, (counts.get(it.score) ?? 0) + 1);

    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const isNewScore = lastScore == null || it.score !== lastScore;

        if (isNewScore) {
            lastRank = i + 1;
            lastScore = it.score;
        }

        result.push({
            ...it,
            rank: lastRank,
            isTied: (counts.get(it.score) ?? 0) > 1
        });
    }

    return result;
}

function getUserDisplayName(user: HomeData['Users'][number]): string {
    const first = user.FirstName?.trim();
    return first ?? user.Username;
}

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function isCompletedWithWinner(g: GameInfo): { winnerTeamId: number } | null {
    if (
        g.HomePoints == null ||
        g.AwayPoints == null ||
        g.HomeId == null ||
        g.AwayId == null
    ) {
        return null;
    }

    if (g.HomePoints === g.AwayPoints) return null;

    const winnerTeamId = g.HomePoints > g.AwayPoints ? g.HomeId : g.AwayId;
    return { winnerTeamId };
}

const LeaderBoard = ({ data, picksByGameId, userPropsByUserId }: Props) => {
    const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);

    const leaderboard = useMemo(() => {
        const users = data?.Users ?? [];
        const games = data?.Games ?? [];

        const completedGameWinners = new Map<number, number>();
        for (const g of games) {
            if (g.Id == null) continue;
            const winner = isCompletedWithWinner(g);
            if (winner) completedGameWinners.set(g.Id, winner.winnerTeamId);
        }

        const gamesCompleted = completedGameWinners.size;

        const scores = users.map(u => {
            let score = 0;
            completedGameWinners.forEach((winnerTeamId, gameId) => {
                const pick = picksByGameId.get(gameId)?.[u.Id];
                if (pick != null && pick === winnerTeamId) score += 1;
            });

            return {
                id: u.Id,
                name: getUserDisplayName(u),
                score
            };
        });

        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });

        const ranked = buildRanks(scores);
        const topScore = ranked.length ? ranked[0].score : 0;

        return { ranked, topScore, gamesCompleted };
    }, [data, picksByGameId]);

    const [firstPlace, rest] = useMemo(() => {
        const ranked = leaderboard.ranked;
        if (!ranked.length) return [[], []] as const;

        let fp = [ranked[0]];
        let _r = ranked.slice(1);

        while (_r.length && _r[0].score === fp[0].score) {
            fp = [...fp, _r[0]];
            _r = _r.slice(1);
        }

        return [fp, _r] as const;
    }, [leaderboard.ranked]);

    const showLeaderboardCard = leaderboard.gamesCompleted > 0 && leaderboard.ranked.length > 0;

    // ✅ Memoize chip styles (avoid recreating style objects every render)
    const chipStyleByUserId = useMemo(() => {
        const out = new Map<number, React.CSSProperties>();

        for (const p of leaderboard.ranked) {
            const raw = userPropsByUserId.get(p.id)?.color ?? 'rgba(0, 255, 255, .2)';
            const useDark = raw !== 'rgba(0, 255, 255, .2)' && shouldUseDarkText(raw);

            out.set(p.id, {
                ['--accentColor' as any]: raw ?? '#ccc',
                color: useDark ? '#111827' : '#e5e7eb'
            } as React.CSSProperties);
        }

        return out;
    }, [leaderboard.ranked, userPropsByUserId]);

    const renderRow = (p: { id: number; name: string; score: number; rank: number }) => {
        const image = userPropsByUserId.get(p.id)?.image ?? null;
        const chipStyle = chipStyleByUserId.get(p.id);

        return (
            <div key={p.id} className={styles.leaderRow}>
                <div className={styles.leaderRank}>{ordinal(p.rank)}</div>

                <div className={styles.leaderMain}>
                    <div className={styles.leaderAvatars}>
                        {image ? (
                            <img
                                className={styles.leaderAvatar}
                                src={image}
                                alt={`${p.name} avatar`}
                                loading="lazy"
                            />
                        ) : (
                            <div className={styles.leaderAvatarFallback} />
                        )}
                    </div>

                    <div className={styles.leaderNames}>
                        <span className={styles.leaderChip} style={chipStyle}>{p.name}</span>
                    </div>
                </div>

                <div className={styles.leaderPoints}>
                    <span className={styles.leaderScoreLabel}>Points</span>
                    <span className={styles.leaderScoreValue}>{p.score}</span>
                </div>
            </div>
        );
    };

    return showLeaderboardCard ? (
        <div className={styles.leaderCard}>
            <div className={styles.leaderHeader}>
                <div className={styles.leaderTitle}>Leaderboard</div>
                <div className={styles.leaderMeta}>
                    {leaderboard.gamesCompleted} completed{' '}
                    {leaderboard.gamesCompleted === 1 ? 'game' : 'games'}
                </div>
            </div>

            <div className={styles.leaderBody}>
                {/* Always show 1st place */}
                {firstPlace.map(p => renderRow(p))}

                {/* Collapsible remainder */}
                {rest.length ? (
                    <>
                        <button
                            type="button"
                            className={styles.leaderToggle}
                            onClick={() => setLeaderboardExpanded(v => !v)}
                            aria-expanded={leaderboardExpanded}
                        >
                            {leaderboardExpanded ? 'Hide Losers' : 'Show Losers'}
                        </button>

                        {/* ✅ Big perf win: don't render the rest list at all unless expanded */}
                        {leaderboardExpanded ? (
                            <div className={[styles.leaderCollapsible, styles.leaderCollapsibleOpen].join(' ')}>
                                {rest.map(p => renderRow(p))}
                            </div>
                        ) : (
                            <div className={[styles.leaderCollapsible, styles.leaderCollapsibleClosed].join(' ')} />
                        )}
                    </>
                ) : null}
            </div>
        </div>
    ) : null;
};

export default React.memo(LeaderBoard);

