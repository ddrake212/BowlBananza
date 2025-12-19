import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./Styles/GameStyles.module.css";
import { GameTeamStatsType } from "../../types/gameTypes";
import { generateMetallicCSS, invertHexColor, shouldUseDarkText } from "../../utils/colorUtils";
import { getBestLogo } from "../../utils/logoUtils";

type Props = {
    metrics: GameTeamStatsType;
    onClose: () => void;
};

type TabKey = "offense" | "situational" | "defense" | "specialTeams" | "other";

function formatPct(value: number): string {
    if (!Number.isFinite(value)) return "—";
    return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString();
}

function formatOneDecimal(value: number): string {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(1);
}

function formatPossession(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function StatRow(props: { Label: string; Value: React.ReactNode; Hint?: string }) {
    const { Label, Value, Hint } = props;
    return (
        <div className={styles.metricStatRow}>
            <div className={styles.metricStatLabel}>
                <span className={styles.metricStatLabelText}>{Label}</span>
                {Hint ? <span className={styles.metricStatHint}>{Hint}</span> : null}
            </div>
            <div className={styles.metricStatValue}>{Value}</div>
        </div>
    );
}

export function TeamMetrics({ metrics, onClose }: Props) {
    const hasOther = !!metrics.UnmappedStats && Object.keys(metrics.UnmappedStats).length > 0;

    const [activeTab, setActiveTab] = useState<TabKey>("offense");

    const [closing, setClosing] = useState<boolean>(false);

    const closeClicked = useCallback(() => {
        setClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    useEffect(() => {
        // If Other tab isn't available but was selected, bounce to Offense
        if (activeTab === "other" && !hasOther) setActiveTab("offense");
    }, [activeTab, hasOther]);

    const title = useMemo(() => `${metrics.Team} Metrics`, [metrics.Team]);

    const altColor = metrics.Color ?? invertHexColor(metrics.AlternateColor ?? '#000000');
    const color = useMemo(() => generateMetallicCSS(altColor, true), [altColor]);

    const hoverStyle = useMemo<React.CSSProperties>(
        () => ({
            '--stats-border-color': metrics.Color ?? '#ccc',
        } as React.CSSProperties),
        [metrics.Color]
    );

    const shouldUseDark = useMemo(() => shouldUseDarkText(altColor), [altColor]);

    const matchupHeaderStyle = useMemo<React.CSSProperties>(
        () => ({
            '--metricHeaderA': metrics.Color ?? '#ccc',
            '--metricHeaderB': metrics.AlternateColor ?? '#ccc',
        } as React.CSSProperties),
        [metrics.Color, metrics.AlternateColor]);

    return (
        <div className={`${styles.metricModal} ${closing ? styles.closing : ''}`} style={{ ...color, color: metrics.AlternateColor ?? '' }} role="dialog" aria-modal="true" aria-label={title}>
            <div className={styles.metricHeader} style={matchupHeaderStyle}>
                <div className={styles.metricHeaderText}>
                    <div style={{flexGrow: 1}}>
                        <div className={`${styles.metricTitle} ${shouldUseDark ? styles.metricDark : ''}`}>{title}</div>
                        <div className={`${styles.metricSubTitle} ${shouldUseDark ? styles.metricDark : ''}`}>
                            Games: {formatNumber(metrics.GamesPlayed)} · Points: {formatNumber(metrics.Points)} · Total Yards:{" "}
                            {formatNumber(metrics.TotalYards)}
                        </div>
                    </div>
                    <img src={getBestLogo(metrics.AlternateColor ?? '', metrics.Color ?? '', altColor, metrics.Logos)} alt={metrics.Mascot ?? ''} />
                </div>
            </div>

            <div className={styles.metricTabs}>
                <button
                    type="button"
                    className={`${styles.metricTabButton} ${activeTab === "offense" ? styles.metricTabButtonActive : ""} ${shouldUseDark ? styles.metricDark : ''}`}
                    onClick={() => setActiveTab("offense")}
                    style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}
                >
                    <span>Offense</span>
                </button>

                <button
                    type="button"
                    className={`${styles.metricTabButton} ${activeTab === "defense" ? styles.metricTabButtonActive : ""} ${shouldUseDark ? styles.metricDark : ''}`}
                    onClick={() => setActiveTab("defense")}
                    style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}
                >
                    <span>Defense</span>
                </button>

                <button
                    type="button"
                    className={`${styles.metricTabButton} ${activeTab === "specialTeams" ? styles.metricTabButtonActive : ""} ${shouldUseDark ? styles.metricDark : ''}`}
                    onClick={() => setActiveTab("specialTeams")}
                    style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}
                >
                    <span>Special Teams</span>
                </button>

                <button
                    type="button"
                    className={`${styles.metricTabButton} ${activeTab === "situational" ? styles.metricTabButtonActive : ""} ${shouldUseDark ? styles.metricDark : ''}`}
                    onClick={() => setActiveTab("situational")}
                    style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}
                >
                    <span>Situational</span>
                </button>

                {hasOther ? (
                    <button
                        type="button"
                        className={`${styles.metricTabButton} ${activeTab === "other" ? styles.metricTabButtonActive : ""} ${shouldUseDark ? styles.metricDark : ''}`}
                        onClick={() => setActiveTab("other")}
                        style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}
                    >
                        <span>Other</span>
                    </button>
                ) : null}
            </div>

            <div className={styles.metricContent}>
                {activeTab === "offense" ? (
                    <div className={styles.metricPanel}>
                        <div className={styles.metricPanelTitle}>Offense</div>

                        <StatRow Label="Total Yards" Value={formatNumber(metrics.TotalYards)} />
                        <StatRow
                            Label="Passing"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.NetPassingYards)} yds · {formatNumber(metrics.PassCompletions)}-
                                    {formatNumber(metrics.PassAttempts)}
                                </span>
                            }
                            Hint={`Comp% ${formatPct(metrics.CompletionPct)}`}
                        />
                        <StatRow Label="Yards/Pass Attempt" Value={formatOneDecimal(metrics.YardsPerPass)} />
                        <StatRow
                            Label="Rushing"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.RushingYards)} yds · {formatNumber(metrics.RushingAttempts)} att
                                </span>
                            }
                            Hint={`Yds/Att ${formatOneDecimal(metrics.YardsPerRushAttempt)}`}
                        />
                        <StatRow
                            Label="Touchdowns"
                            Value={
                                <span className={styles.metricCompact}>
                                    Pass {formatNumber(metrics.PassingTDs)} · Rush {formatNumber(metrics.RushingTDs)}
                                </span>
                            }
                        />
                    </div>
                ) : null}

                {activeTab === "situational" ? (
                    <div className={styles.metricPanel}>
                        <div className={styles.metricPanelTitle}>Situational</div>

                        <StatRow
                            Label="3rd Down"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.ThirdDownMade)}-{formatNumber(metrics.ThirdDownAttempts)}
                                </span>
                            }
                            Hint={formatPct(metrics.ThirdDownPct)}
                        />
                        <StatRow
                            Label="4th Down"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.FourthDownMade)}-{formatNumber(metrics.FourthDownAttempts)}
                                </span>
                            }
                            Hint={formatPct(metrics.FourthDownPct)}
                        />
                        <StatRow Label="Possession" Value={formatPossession(metrics.PossessionSeconds)} Hint="MM:SS" />
                        <StatRow
                            Label="Penalties"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.Penalties)} for {formatNumber(metrics.PenaltyYards)} yds
                                </span>
                            }
                        />
                        <StatRow
                            Label="Turnovers"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.Turnovers)} (INT {formatNumber(metrics.InterceptionsThrown)} · FL{" "}
                                    {formatNumber(metrics.FumblesLost)})
                                </span>
                            }
                        />
                    </div>
                ) : null}

                {activeTab === "defense" ? (
                    <div className={styles.metricPanel}>
                        <div className={styles.metricPanelTitle}>Defense</div>

                        <StatRow
                            Label="Disruption"
                            Value={
                                <span className={styles.metricCompact}>
                                    Sacks {formatNumber(metrics.Sacks)} · TFL {formatNumber(metrics.TacklesForLoss)} · Hurries{" "}
                                    {formatNumber(metrics.QbHurries)}
                                </span>
                            }
                        />
                        <StatRow Label="Tackles" Value={formatNumber(metrics.Tackles)} />
                        <StatRow
                            Label="Coverage"
                            Value={
                                <span className={styles.metricCompact}>
                                    INT {formatNumber(metrics.InterceptionsMade)} · PD {formatNumber(metrics.PassesDeflected)}
                                </span>
                            }
                            Hint={
                                metrics.InterceptionYards || metrics.InterceptionTDs
                                    ? `${formatNumber(metrics.InterceptionYards)} INT yds · ${formatNumber(metrics.InterceptionTDs)} INT TD`
                                    : undefined
                            }
                        />
                        <StatRow Label="Defensive TDs" Value={formatNumber(metrics.DefensiveTDs)} />
                    </div>
                ) : null}

                {activeTab === "specialTeams" ? (
                    <div className={styles.metricPanel}>
                        <div className={styles.metricPanelTitle}>Special Teams</div>

                        <StatRow Label="Kicking Points" Value={formatNumber(metrics.KickingPoints)} />
                        <StatRow
                            Label="Kick Returns"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.KickReturns)} · {formatNumber(metrics.KickReturnYards)} yds · TD{" "}
                                    {formatNumber(metrics.KickReturnTDs)}
                                </span>
                            }
                        />
                        <StatRow
                            Label="Punt Returns"
                            Value={
                                <span className={styles.metricCompact}>
                                    {formatNumber(metrics.PuntReturns)} · {formatNumber(metrics.PuntReturnYards)} yds · TD{" "}
                                    {formatNumber(metrics.PuntReturnTDs)}
                                </span>
                            }
                        />
                    </div>
                ) : null}

                {activeTab === "other" && hasOther ? (
                    <div className={styles.metricPanel}>
                        <div className={styles.metricPanelTitle}>Other</div>

                        <div className={styles.metricUnmappedGrid}>
                            {Object.entries(metrics.UnmappedStats ?? {}).map(([k, v]) => (
                                <div className={styles.metricUnmappedItem} key={k}>
                                    <div className={styles.metricUnmappedKey}>{k}</div>
                                    <div className={styles.metricUnmappedValue}>{v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className={styles.metricFooter}>
                    <button className={`${styles.metricPrimaryButton} ${shouldUseDark ? styles.metricDark : ''}`} type="button" onClick={closeClicked} style={{ borderColor: metrics.AlternateColor ?? '', ...hoverStyle }}>
                        <span>Close</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
