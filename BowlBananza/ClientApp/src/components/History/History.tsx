import React, { useEffect, useMemo, useState } from "react";
import MainLoading from "../MainLoading";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable
} from "@tanstack/react-table";

import styles from "./Styles/History.module.css";
import { shouldUseDarkText } from "../../utils/colorUtils";
import { useNavigate } from "react-router";
import { ColorContext } from "../../contexts/ColorContext";

export type History = {
    Id: number;
    UserId: number;
    Year: number;
    Rank: number;
    Points?: number;
    User?: {
        Id: number;
        FirstName: string;
        LastName: string;
        Username: string;
        Password: string;
        Email: string;
        isCom: boolean | null;
    };
    Preferences?: {
        Id: number;
        UserId: number;
        Color?: string;
        Image?: string;
    };
};

type HistoryByYear = Record<number, History[]>;

type ColumnMeta = {
    tdClassName?: (ctx: any) => string | undefined;
    thClassName?: string;
};

function normalizeColor(color?: string | null): string | null {
    if (!color) return null;
    const c = color.trim();
    if (!c) return null;
    // allow "fd6327" or "#fd6327"
    return c.startsWith("#") ? c : `#${c}`;
}

// Handles either:
// 1) Ok(groupedObject)
// 2) Ok(JsonConvert.SerializeObject(groupedObject))
function safeParseHistoryByYear(payload: unknown): HistoryByYear {
    if (typeof payload === "string") {
        try {
            const parsed = JSON.parse(payload);
            return (parsed ?? {}) as HistoryByYear;
        } catch {
            return {};
        }
    }

    if (payload && typeof payload === "object") {
        return payload as HistoryByYear;
    }

    return {};
}

function getUserFullName(h: History): string {
    const u = h.User;
    const first = u?.FirstName?.trim();
    const last = u?.LastName?.trim();
    const full = `${first ?? ""} ${last ?? ""}`.trim();
    return full || u?.Username || "Unknown";
}

function YearSection({ year, rows }: { year: number; rows: History[] }) {
    const data = useMemo(() => {
        const copy = [...(rows ?? [])];
        copy.sort((a, b) => (a.Rank ?? 0) - (b.Rank ?? 0));
        return copy;
    }, [rows]);

    const columns = useMemo<ColumnDef<History>[]>(() => {
        return [
            {
                id: "user",
                header: "Player",
                meta: {
                    tdClassName: () => styles.userTd
                } as ColumnMeta,
                cell: ({ row }) => {
                    const h = row.original;
                    const name = getUserFullName(h);

                    const plateColor = normalizeColor(h.Preferences?.Color);
                    const useDark = plateColor ? shouldUseDarkText(plateColor) : false;

                    const plateStyle: React.CSSProperties | undefined = plateColor
                        ? {
                            background: plateColor,
                            color: useDark ? "#000000" : "#ffffff"
                        }
                        : undefined;

                    return (
                        <div className={styles.userNamePlate} style={plateStyle}>
                            <span className={styles.userName}>{name}</span>
                            {h.Preferences?.Image ? (
                                <img
                                    className={styles.userAvatar}
                                    src={h.Preferences.Image}
                                    alt={`${name} avatar`}
                                    loading="lazy"
                                />
                            ) : <></>}
                        </div>
                    );
                }
            },
            {
                id: "rank",
                header: "Rank",
                accessorKey: "Rank",
                meta: {
                    tdClassName: () => styles.numericTd
                } as ColumnMeta,
                cell: ({ getValue }) => {
                    const v = getValue<number>();
                    return <div className={styles.numericCell}>{!v ? "—" : ''}{v > 3 ? 'Loser' : ''} {v === 1 && <span role="img" aria-label="first">🥇</span>}{v === 2 && <span aria-label="second" role="img">🥈</span>}{v === 3 && <span aria-label="third" role="img">🥉</span>}</div>;
                }
            },
            {
                id: "points",
                header: "Points",
                accessorKey: "Points",
                meta: {
                    tdClassName: () => styles.numericTd
                } as ColumnMeta,
                cell: ({ getValue }) => {
                    const v = getValue<number | undefined>();
                    return <div className={styles.numericCell}>{v ?? "—"}</div>;
                }
            }
        ];
    }, []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <div className={styles.yearCard}>
            <div className={styles.yearHeader}>
                <div className={styles.yearTitle}>{year}</div>
                <div className={styles.yearMeta}>
                    {data.length} {data.length === 1 ? "player" : "players"}
                </div>
            </div>

            <div className={styles.tableScroller}>
                <table className={styles.table}>
                    <thead>
                        {table.getHeaderGroups().map(hg => (
                            <tr key={hg.id}>
                                {hg.headers.map(h => {
                                    const meta = h.column.columnDef.meta as ColumnMeta | undefined;
                                    return (
                                        <th
                                            key={h.id}
                                            className={[styles.th, meta?.thClassName]
                                                .filter(Boolean)
                                                .join(" ")}
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
                                    const extra = meta?.tdClassName?.(cell.getContext());

                                    return (
                                        <td
                                            key={cell.id}
                                            className={[styles.td, extra].filter(Boolean).join(" ")}
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

export default function History() {
    const [historyByYear, setHistoryByYear] = useState<HistoryByYear>({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { setColor } = React.useContext(ColorContext) ?? { setColor: () => { } };

    useEffect(() => {
        setColor('#ffffff00');
        const glowColors = [
            "#00FFFF", // Cyan
            "#008CFF", // Electric Blue
            "#7A00FF", // Royal Purple
            "#FF00FF", // Magenta
            "#FF0099", // Hot Pink
            "#FF0033", // Neon Red
            "#FF7A00", // Amber Orange
            "#F8FF00", // Neon Yellow
            "#32FF00", // Lime Green
            "#00FF99", // Aqua Green
            "#ffffff00"
        ];
        const timeout = setInterval(() => {
            const c = glowColors.shift();
            glowColors.push(c ?? '');
            setColor(c ?? '');
        }, 5000);
        return () => clearInterval(timeout);
    }, [setColor]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/history/getData", {
                    headers: { Accept: "application/json" }
                });

                if (res.status === 401) {
                    navigate('/login', { state: { rtnPage: '/history' } });
                } else {

                    const text = await res.text();

                    let payload: unknown = text;
                    try {
                        payload = JSON.parse(text);
                    } catch {
                        payload = text;
                    }

                    setHistoryByYear(safeParseHistoryByYear(payload));
                }
            } catch (err) {
                console.error("Failed to load history", err);
                setHistoryByYear({});
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    const years = useMemo(() => {
        return Object.keys(historyByYear)
            .map(k => Number(k))
            .filter(n => Number.isFinite(n))
            .sort((a, b) => b - a); // newest first
    }, [historyByYear]);

    const hasAnyRows = useMemo(() => {
        return years.some(y => (historyByYear[y]?.length ?? 0) > 0);
    }, [years, historyByYear]);

    if (loading) return <MainLoading />;

    if (!years.length || !hasAnyRows) {
        return <div className={styles.emptyState}>No History Yet</div>;
    }

    return (
        <div className={styles.wrapper}>
            {years.map(y => (
                <YearSection key={y} year={y} rows={historyByYear[y] ?? []} />
            ))}
        </div>
    );
}
