import React, { useEffect, useMemo, useState } from 'react';
import { HomeData } from '../../types/homeTypes';
import { GameInfo, TeamInfo } from '../../types/gameTypes';
import MainLoading from '../MainLoading';
import { useLocation, useNavigate } from 'react-router';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable
} from '@tanstack/react-table';

import styles from './Styles/Home.module.css';
import { getBestLogo } from '../../utils/logoUtils';
import { getTeamColor, invertHexColor, shouldUseDarkText } from '../../utils/colorUtils';
import LeaderBoard from './LeaderBoard';
import { useUpdateColor } from '../../hooks/useUpdateColor';

type RowModel = {
    game: GameInfo;
    picksByUserId: Record<number, number | undefined>;

    // ✅ precomputed once per row
    hasScore: boolean;
    winnerTeamId: number | null;
    isFullyPicked: boolean;
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

async function fetchJson<T>(url: string, signal: AbortSignal, onUnauth: () => void): Promise<T> {
    const res = await fetch(url, { signal });
    if (!res.ok) {
        if (res.status === 401) {
            onUnauth();
            throw new Error(`Request failed due to being unauthorized`);
        } else {
            const text = await res.text().catch(() => '');
            throw new Error(`Request failed (${res.status}) for ${url}${text ? `: ${text}` : ''}`);
        }
    }
    return res.json() as Promise<T>;
}

function getSearchParamsAsObject(queryString: string): { [key: string]: string } {
    // Create a URLSearchParams object from the query string
    const searchParams = new URLSearchParams(queryString);

    // Convert the URLSearchParams iterator to a plain object
    const paramsObject: { [key: string]: string } = Object.fromEntries(searchParams.entries());

    return paramsObject;
}

export default function Home() {
    const updateColor = useUpdateColor();

    const [data, setData] = useState<HomeData | undefined>();
    const [userProps, setUserProps] = useState<UserProp[] | undefined>(undefined);

    const navigate = useNavigate();

    // Only block initial render on main data (fast)
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigateTo = getSearchParamsAsObject(location.search).nt;

    useEffect(() => {
        if (navigateTo) {
            navigate(`/${navigateTo}`);
        }
    }, [navigateTo, navigate]);

    useEffect(() => {
        updateColor('#ffffff');

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
            updateColor(c ?? '');
        }, 5000);

        return () => clearInterval(interval);
    }, [updateColor]);

    // ✅ Parallel fetch:
    // - /home/getData (no UserProperties)
    // - /home/userprops (UserId, Color, Image)
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);

        const mainPromise = fetchJson<HomeData>('/api/home/getData', controller.signal, () => navigate('/login'))
            .then(d => setData(d))
            .catch(() => { })
            .finally(() => setLoading(false)); // unblock UI as soon as main data is ready

        const propsPromise = fetchJson<UserProp[]>('/api/home/userprops', controller.signal, () => navigate('/login'))
            .then(p => setUserProps(p))
            .catch(() => setUserProps([])); // fail-soft: no props

        // Fire both simultaneously (no await needed)
        void mainPromise;
        void propsPromise;

        return () => controller.abort();
    }, [navigate]);

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

    const users = data?.Users ?? [];

    // ✅ stable userId list used for row computations (avoids per-cell reduce)
    const userIds = useMemo(() => users.map(u => u.Id), [users]);

    const rows: RowModel[] = useMemo(() => {
        const games = [...(data?.Games ?? [])];

        games.sort((a, b) => {
            const da = safeDate(a.StartDate)?.getTime() ?? Infinity;
            const db = safeDate(b.StartDate)?.getTime() ?? Infinity;
            return da - db;
        });

        return games.map(g => {
            const picks = picksByGameId.get(g.Id ?? -1) ?? {};

            const hasScore = g.AwayPoints != null && g.HomePoints != null;
            const winner = hasScore ? isCompletedWithWinner(g) : null;
            const winnerTeamId = winner?.winnerTeamId ?? null;

            // ✅ compute once per row
            const isFullyPicked = userIds.length
                ? userIds.every(uid => Boolean(picks[uid]))
                : true;

            return {
                game: g,
                picksByUserId: picks,
                hasScore,
                winnerTeamId,
                isFullyPicked
            };
        });
    }, [data, picksByGameId, userIds]);

    const getUserPickTdClass = (
        rowModel: RowModel,
        userId: number,
        isLocked: boolean,
        mainUserId: number
    ): string => {
        const pickedTeamId = rowModel.picksByUserId[userId];
        if (pickedTeamId == null) return !isLocked && mainUserId !== userId ? '' : styles.userCellEmpty;

        if (!rowModel.winnerTeamId) return styles.userCellPending;

        return pickedTeamId === rowModel.winnerTeamId
            ? styles.userCellCorrect
            : styles.userCellIncorrect;
    };

    // ✅ memoize header styles once (stable object references)
    const headerStyleByUserId = useMemo(() => {
        const out = new Map<number, React.CSSProperties>();

        for (const u of users) {
            const props = userPropsByUserId.get(u.Id);
            const color = props?.color ? normalizeHexColor(props.color) : null;
            if (!color) continue;

            const useBlackText = shouldUseDarkText(color);
            out.set(u.Id, {
                background: color,
                color: useBlackText ? '#000000' : '#ffffff'
            });
        }

        return out;
    }, [users, userPropsByUserId]);

    const columns: ColumnDef<RowModel>[] = useMemo(() => {
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
                        const rm = ctx.row.original as RowModel;
                        return rm.hasScore ? styles.scoreCellFinal : styles.scoreCellPending;
                    }
                } as ColumnMeta,
                cell: ({ row }) => {
                    const rm = row.original;
                    const g = rm.game;

                    if (!rm.hasScore) {
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

                // ✅ returns stable object from memoized Map (less GC churn)
                thStyle: () => headerStyleByUserId.get(user.Id)
            } as ColumnMeta,

            cell: ({ row }) => {
                const rm = row.original;

                const pickedTeamId = rm.picksByUserId[user.Id];
                let pickedTeamName =
                    pickedTeamId != null && pickedTeamId !== -1
                        ? teamNameById.get(pickedTeamId) ?? `Team ${pickedTeamId}`
                        : '—';

                // ✅ use precomputed flags
                const shouldHidePick =
                    user.Id !== data?.UserId &&
                    !rm.hasScore &&
                    (!data?.IsLocked || !rm.isFullyPicked);

                if (shouldHidePick) {
                    pickedTeamName = 'Bananza!';
                }

                return (
                    <div
                        className={[
                            styles.userCellContent,
                            shouldHidePick ? styles.userCellBlurred : ''
                        ].filter(Boolean).join(' ')}
                    >
                        {pickedTeamName}
                    </div>
                );
            }
        }));

        return [...base, ...userCols];
    }, [data, users, teamById, teamNameById, headerStyleByUserId]);

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    if (loading) return <MainLoading />;

    if (!rows.length) {
        return <div className={styles.emptyState}>Bananza has not started yet</div>;
    }

    return (
        <>
            <LeaderBoard data={data} picksByGameId={picksByGameId} userPropsByUserId={userPropsByUserId} />
            <div className={styles.wrapper}>
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
        </>
    );
}
