import React, { useEffect, useMemo, useState } from 'react';
import { ColorContext } from '../../contexts/ColorContext';
import { HomeData } from '../../types/homeTypes';
import { GameInfo, TeamInfo } from '../../types/gameTypes';
import MainLoading from '../MainLoading';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable
} from '@tanstack/react-table';

import styles from './Styles/Home.module.css';
import { getBestLogo } from '../../utils/logoUtils';
import { getTeamColor, invertHexColor, shouldUseDarkText } from '../../utils/colorUtils';

type RowModel = {
    game: GameInfo;
    picksByUserId: Record<number, number | undefined>;
};

type ColumnMeta = {
    tdClassName?: (ctx: any) => string | undefined;
    thClassName?: string;
    thStyle?: (ctx: any) => React.CSSProperties | undefined;
};

type UserProp = {
    userId: number;
    color?: string | null;
    image?: string | null;
};

function safeDate(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
}

function formatTime(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function getUserDisplayName(user: HomeData['Users'][number]): string {
    const first = user.FirstName?.trim();
    return first ?? user.Username;
}

function buildTeamMaps(teams?: TeamInfo[]) {
    const teamById = new Map<number, TeamInfo>();
    const teamNameById = new Map<number, string>();

    teams?.forEach(t => {
        if (t.Id == null) return;
        teamById.set(t.Id, t);
        teamNameById.set(
            t.Id,
            t.School ?? t.Mascot ?? t.Abbreviation ?? `Team ${t.Id}`
        );
    });

    return { teamById, teamNameById };
}

function normalizeHexColor(color?: string | null): string | null {
    if (!color) return null;
    const c = color.trim();
    if (!c) return null;
    return c.startsWith('#') ? c : `#${c}`;
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

// Standard competition ranking: 1,2,2,4
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

function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
    const res = await fetch(url, { signal });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request failed (${res.status}) for ${url}${text ? `: ${text}` : ''}`);
    }
    return res.json() as Promise<T>;
}

export default function Home() {
    const { setColor } = React.useContext(ColorContext) ?? { setColor: () => { } };

    const [data, setData] = useState<HomeData | undefined>();
    const [userProps, setUserProps] = useState<UserProp[] | undefined>(undefined);

    // Only block initial render on main data (fast)
    const [loading, setLoading] = useState(true);

    const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);

    useEffect(() => {
        setColor('#ffffff');

        const glowColors = [
            '#00FFFF',
            '#008CFF',
            '#7A00FF',
            '#FF00FF',
            '#FF0099',
            '#FF0033',
            '#FF7A00',
            '#F8FF00',
            '#32FF00',
            '#00FF99',
            '#ffffff'
        ];

        const interval = setInterval(() => {
            const c = glowColors.shift();
            glowColors.push(c ?? '');
            setColor(c ?? '');
        }, 5000);

        return () => clearInterval(interval);
    }, [setColor]);

    // ✅ Parallel fetch:
    // - /home/getData (no UserProperties)
    // - /home/userprops (UserId, Color, Image)
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);

        const mainPromise = fetchJson<HomeData>('/home/getData', controller.signal)
            .then(d => setData(d))
            .finally(() => setLoading(false)); // unblock UI as soon as main data is ready

        const propsPromise = fetchJson<UserProp[]>('/home/userprops', controller.signal)
            .then(p => setUserProps(p))
            .catch(() => setUserProps([])); // fail-soft: no props

        // Fire both simultaneously (no await needed)
        void mainPromise;
        void propsPromise;

        return () => controller.abort();
    }, []);

    const { teamById, teamNameById } = useMemo(
        () => buildTeamMaps(data?.Teams),
        [data]
    );

    const userPropsByUserId = useMemo(() => {
        const map = new Map<number, { color?: string | null; image?: string | null }>();

        // Prefer separate /home/userprops call; fall back to data.UserProperties if it still exists
        const list =
            userProps ??
            ((data as any)?.UserProperties as UserProp[] | undefined) ??
            [];

        (list ?? []).forEach(p => {
            map.set(p.userId, { color: p.color ?? null, image: p.image ?? null });
        });

        return map;
    }, [userProps, data]);

    const picksByGameId = useMemo(() => {
        const map = new Map<number, Record<number, number>>();
        data?.UserSelections?.forEach(sel => {
            if (sel.GameId == null || sel.User == null || sel.TeamId == null) return;
            if (!map.has(sel.GameId)) map.set(sel.GameId, {});
            map.get(sel.GameId)![sel.User] = sel.TeamId;
        });
        return map;
    }, [data]);

    const rows: RowModel[] = useMemo(() => {
        const games = [...(data?.Games ?? [])];

        games.sort((a, b) => {
            const da = safeDate(a.StartDate)?.getTime() ?? Infinity;
            const db = safeDate(b.StartDate)?.getTime() ?? Infinity;
            return da - db;
        });

        return games.map(g => ({
            game: g,
            picksByUserId: picksByGameId.get(g.Id ?? -1) ?? {}
        }));
    }, [data, picksByGameId]);

    const getUserPickTdClass = (
        rowModel: RowModel,
        userId: number,
        isLocked: boolean,
        mainUserId: number
    ): string => {
        const pickedTeamId = rowModel.picksByUserId[userId];
        if (pickedTeamId == null) return !isLocked && mainUserId !== userId ? '' : styles.userCellEmpty;

        const winner = isCompletedWithWinner(rowModel.game);
        if (!winner) return styles.userCellPending;

        return pickedTeamId === winner.winnerTeamId
            ? styles.userCellCorrect
            : styles.userCellIncorrect;
    };

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

    const columns: ColumnDef<RowModel>[] = useMemo(() => {
        const users = data?.Users ?? [];

        const base: ColumnDef<RowModel>[] = [
            {
                id: 'date',
                header: 'Date',
                cell: ({ row }) => formatDate(safeDate(row.original.game.StartDate))
            },
            {
                id: 'time',
                header: 'Time',
                cell: ({ row }) => formatTime(safeDate(row.original.game.StartDate))
            },
            {
                id: 'bowl',
                header: 'Bowl Game',
                cell: ({ row }) => row.original.game.Notes ?? '—'
            },
            {
                id: 'teams',
                header: 'Teams',
                cell: ({ row }) => {
                    const g = row.original.game;

                    const awayTeam = g.AwayId != null ? teamById.get(g.AwayId) : undefined;
                    const homeTeam = g.HomeId != null ? teamById.get(g.HomeId) : undefined;

                    const awayName =
                        g.AwayId != null ? teamNameById.get(g.AwayId) : g.AwayTeam ?? 'Away';
                    const homeName =
                        g.HomeId != null ? teamNameById.get(g.HomeId) : g.HomeTeam ?? 'Home';

                    const awayColorRaw = getTeamColor(awayTeam);
                    const homeColorRaw = getTeamColor(homeTeam);

                    const awayColor = normalizeHexColor(awayColorRaw) ?? '#2a3242';
                    const homeColor = normalizeHexColor(homeColorRaw) ?? '#2a3242';

                    const awayAltColor =
                        awayTeam?.Color ?? invertHexColor(awayTeam?.AlternateColor ?? '#000000');
                    const homeAltColor =
                        homeTeam?.Color ?? invertHexColor(homeTeam?.AlternateColor ?? '#000000');

                    const awayLogo =
                        awayTeam?.Logos?.length
                            ? getBestLogo(
                                awayTeam.AlternateColor ?? '',
                                awayTeam.Color ?? '',
                                awayAltColor,
                                awayTeam.Logos
                            )
                            : null;

                    const homeLogo =
                        homeTeam?.Logos?.length
                            ? getBestLogo(
                                homeTeam.AlternateColor ?? '',
                                homeTeam.Color ?? '',
                                homeAltColor,
                                homeTeam.Logos
                            )
                            : null;

                    return (
                        <div
                            className={styles.teamsCell}
                            style={
                                {
                                    '--awayColor': awayColor,
                                    '--homeColor': homeColor
                                } as React.CSSProperties
                            }
                        >
                            <div className={styles.teamsInner}>
                                <div className={styles.teamSide}>
                                    {awayLogo ? (
                                        <img
                                            className={styles.teamLogo}
                                            src={awayLogo}
                                            alt={`${awayName} logo`}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.teamLogoFallback} />
                                    )}
                                </div>

                                <div className={styles.teamsText}>
                                    <span className={styles.teamsTextAway}>{awayName}</span>
                                    <span className={styles.teamsTextVs}>vs</span>
                                    <span className={styles.teamsTextHome}>{homeName}</span>
                                </div>

                                <div className={styles.teamSide}>
                                    {homeLogo ? (
                                        <img
                                            className={styles.teamLogo}
                                            src={homeLogo}
                                            alt={`${homeName} logo`}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.teamLogoFallback} />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }
            },
            {
                id: 'score',
                header: 'Score',
                meta: {
                    tdClassName: (ctx: any) => {
                        const g = (ctx.row.original as RowModel).game;
                        const hasScore = g.AwayPoints != null && g.HomePoints != null;
                        return hasScore ? styles.scoreCellFinal : styles.scoreCellPending;
                    }
                } as ColumnMeta,
                cell: ({ row }) => {
                    const g = row.original.game;
                    const hasScore = g.AwayPoints != null && g.HomePoints != null;

                    if (!hasScore) {
                        return <div className={styles.scoreCellInner}>—</div>;
                    }

                    return (
                        <div className={styles.scoreCellInner}>
                            {g.AwayPoints} - {g.HomePoints}
                        </div>
                    );
                }
            }
        ];

        const userCols: ColumnDef<RowModel>[] = users.map(user => ({
            id: `user_${user.Id}`,
            header: getUserDisplayName(user),

            meta: {
                tdClassName: (ctx: any) =>
                    getUserPickTdClass(
                        ctx.row.original as RowModel,
                        user.Id,
                        data?.IsLocked ?? false,
                        data?.UserId ?? -1
                    ),

                thClassName: styles.userHeaderTh,

                thStyle: () => {
                    const props = userPropsByUserId.get(user.Id);
                    const color = props?.color ? normalizeHexColor(props.color) : null;
                    if (!color) return undefined;

                    const useBlackText = shouldUseDarkText(color);

                    return {
                        background: color,
                        color: useBlackText ? '#000000' : '#ffffff'
                    };
                }
            } as ColumnMeta,

            cell: ({ row }) => {
                const pickedTeamId = row.original.picksByUserId[user.Id];
                let pickedTeamName =
                    pickedTeamId != null
                        ? teamNameById.get(pickedTeamId) ?? `Team ${pickedTeamId}`
                        : '—';

                let addedStyle: React.CSSProperties = {};
                const g = row.original.game;
                const hasScore = g.AwayPoints != null && g.HomePoints != null;

                if (!data?.IsLocked && user.Id !== data?.UserId && !hasScore) {
                    addedStyle = { filter: 'blur(4px)' };
                    pickedTeamName = 'Bananza!';
                }

                return (
                    <div className={styles.userCellContent} style={addedStyle}>
                        {pickedTeamName}
                    </div>
                );
            }
        }));

        return [...base, ...userCols];
    }, [data, teamById, teamNameById, userPropsByUserId]);

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    if (loading) return <MainLoading />;

    if (!rows.length) {
        return <div className={styles.emptyState}>Bananza has not started yet</div>;
    }

    const showLeaderboardCard = leaderboard.gamesCompleted > 0 && leaderboard.ranked.length > 0;

    const firstPlace = leaderboard.ranked[0];
    const rest = leaderboard.ranked.slice(1);

    return (
        <div className={styles.wrapper}>
            {showLeaderboardCard ? (
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
                        {firstPlace ? (
                            <div className={styles.leaderRow}>
                                <div className={styles.leaderRank}>{ordinal(firstPlace.rank)}</div>

                                <div className={styles.leaderMain}>
                                    <div className={styles.leaderAvatars}>
                                        {(() => {
                                            const image = userPropsByUserId.get(firstPlace.id)?.image ?? null;
                                            
                                            return image ? (
                                                <img
                                                    className={styles.leaderAvatar}
                                                    src={image}
                                                    alt={`${firstPlace.name} avatar`}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={styles.leaderAvatarFallback} />
                                            );
                                        })()}
                                    </div>

                                    <div className={styles.leaderNames}>
                                        {(() => {
                                            const color = userPropsByUserId.get(firstPlace.id)?.color ?? "rgba(0, 255, 255, .2)";
                                            const addedStyle = ({
                                                '--accentColor': color ?? '#ccc',
                                                color: color !== 'rgba(0, 255, 255, .2)' && shouldUseDarkText(color) ? '#111827' : "#e5e7eb"
                                            } as React.CSSProperties);
                                            return <span className={styles.leaderChip} style={addedStyle}>{firstPlace.name}</span>
                                        })() }
                                    </div>
                                </div>

                                <div className={styles.leaderPoints}>
                                    <span className={styles.leaderScoreLabel}>Points</span>
                                    <span className={styles.leaderScoreValue}>{firstPlace.score}</span>
                                </div>
                            </div>
                        ) : null}

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

                                <div
                                    className={[
                                        styles.leaderCollapsible,
                                        leaderboardExpanded ? styles.leaderCollapsibleOpen : styles.leaderCollapsibleClosed
                                    ].join(' ')}
                                >
                                    {rest.map(p => {
                                        const image = userPropsByUserId.get(p.id)?.image ?? null;
                                        const color = userPropsByUserId.get(p.id)?.color ?? "rgba(0, 255, 255, .2)";
                                        const addedStyle = ({
                                            '--accentColor': color ?? '#ccc',
                                            color: color !== 'rgba(0, 255, 255, .2)' && shouldUseDarkText(color) ? '#111827' : "#e5e7eb"
                                        } as React.CSSProperties);
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
                                                        <span className={styles.leaderChip} style={addedStyle}>{p.name}</span>
                                                    </div>
                                                </div>

                                                <div className={styles.leaderPoints}>
                                                    <span className={styles.leaderScoreLabel}>Points</span>
                                                    <span className={styles.leaderScoreValue}>{p.score}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <div className={styles.tableScroller}>
                <table className={styles.table}>
                    <thead>
                        {table.getHeaderGroups().map(hg => (
                            <tr key={hg.id}>
                                {hg.headers.map(h => {
                                    const meta = h.column.columnDef.meta as ColumnMeta | undefined;
                                    const thStyle = meta?.thStyle?.(h.getContext());

                                    return (
                                        <th
                                            key={h.id}
                                            className={[styles.th, meta?.thClassName].filter(Boolean).join(' ')}
                                            style={thStyle}
                                        >
                                            {flexRender(h.column.columnDef.header, h.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody className={styles.tbody}>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => {
                                    const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                                    const extraTdClass = meta?.tdClassName?.(cell.getContext());

                                    return (
                                        <td
                                            key={cell.id}
                                            className={[
                                                styles.td,
                                                cell.column.id === 'teams' && styles.tdTeams,
                                                extraTdClass
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
