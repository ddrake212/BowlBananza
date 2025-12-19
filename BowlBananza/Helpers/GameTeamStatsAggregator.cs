using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using BowlBananza.Models;
using CollegeFootballData.Models;

namespace BowlBananza.Helpers
{
    public static class GameTeamStatsAggregator
    {
        /// <summary>
        /// Aggregates /games/teams results (multiple games) into a single total object for one team.
        /// </summary>
        public static GameTeamStatsType AggregateTeamStats(IEnumerable<GameTeamStats> games, string teamName)
        {
            if (games == null) throw new ArgumentNullException(nameof(games));
            if (string.IsNullOrWhiteSpace(teamName)) throw new ArgumentException("Team name required.", nameof(teamName));

            var totals = new GameTeamStatsType
            {
                Team = teamName
            };

            foreach (var game in games)
            {
                var team = game?.Teams?
                    .FirstOrDefault(t => string.Equals(t.Team, teamName, StringComparison.OrdinalIgnoreCase));

                if (team == null) continue;

                // Points is top-level on the team
                totals.Points += team.Points ?? 0;
                totals.GamesPlayed += 1;

                foreach (var s in team.Stats ?? Enumerable.Empty<GameTeamStatsTeamStat>())
                {
                    var category = s.Category?.Trim();
                    var stat = s.Stat?.Trim();

                    if (string.IsNullOrEmpty(category) || string.IsNullOrEmpty(stat))
                        continue;

                    switch (category)
                    {
                        // Simple ints
                        case "firstDowns": totals.FirstDowns += ParseInt(stat); break;
                        case "totalYards": totals.TotalYards += ParseInt(stat); break;
                        case "netPassingYards": totals.NetPassingYards += ParseInt(stat); break;
                        case "rushingYards": totals.RushingYards += ParseInt(stat); break;
                        case "rushingAttempts": totals.RushingAttempts += ParseInt(stat); break;
                        case "turnovers": totals.Turnovers += ParseInt(stat); break;
                        case "fumblesLost": totals.FumblesLost += ParseInt(stat); break;

                        // NOTE: In your data there are two “interception-ish” categories:
                        // - "interceptions" (thrown by offense) :contentReference[oaicite:4]{index=4}
                        // - "passesIntercepted" (defense INTs) :contentReference[oaicite:5]{index=5}
                        case "interceptions": totals.InterceptionsThrown += ParseInt(stat); break;
                        case "passesIntercepted": totals.InterceptionsMade += ParseInt(stat); break;

                        case "passesDeflected": totals.PassesDeflected += ParseInt(stat); break;
                        case "qbHurries": totals.QbHurries += ParseInt(stat); break;
                        case "sacks": totals.Sacks += ParseInt(stat); break;
                        case "tackles": totals.Tackles += ParseInt(stat); break;
                        case "defensiveTDs": totals.DefensiveTDs += ParseInt(stat); break;
                        case "tacklesForLoss": totals.TacklesForLoss += ParseInt(stat); break;
                        case "totalFumbles": totals.TotalFumbles += ParseInt(stat); break;
                        case "fumblesRecovered": totals.FumblesRecovered += ParseInt(stat); break;

                        case "interceptionTDs": totals.InterceptionTDs += ParseInt(stat); break;
                        case "interceptionYards": totals.InterceptionYards += ParseInt(stat); break;

                        case "kickingPoints": totals.KickingPoints += ParseInt(stat); break;

                        case "kickReturns": totals.KickReturns += ParseInt(stat); break;
                        case "kickReturnTDs": totals.KickReturnTDs += ParseInt(stat); break;
                        case "kickReturnYards": totals.KickReturnYards += ParseInt(stat); break;

                        case "puntReturns": totals.PuntReturns += ParseInt(stat); break;
                        case "puntReturnTDs": totals.PuntReturnTDs += ParseInt(stat); break;
                        case "puntReturnYards": totals.PuntReturnYards += ParseInt(stat); break;

                        case "passingTDs": totals.PassingTDs += ParseInt(stat); break;
                        case "rushingTDs": totals.RushingTDs += ParseInt(stat); break;

                        // Pair stats "made-attempt"
                        case "thirdDownEff":
                            {
                                var (made, att) = ParseMadeAttempt(stat);
                                totals.ThirdDownMade += made;
                                totals.ThirdDownAttempts += att;
                                break;
                            }
                        case "fourthDownEff":
                            {
                                var (made, att) = ParseMadeAttempt(stat);
                                totals.FourthDownMade += made;
                                totals.FourthDownAttempts += att;
                                break;
                            }
                        case "completionAttempts":
                            {
                                var (comp, att) = ParseMadeAttempt(stat);
                                totals.PassCompletions += comp;
                                totals.PassAttempts += att;
                                break;
                            }
                        case "totalPenaltiesYards":
                            {
                                var (pen, yds) = ParseMadeAttempt(stat); // same "X-Y" pattern
                                totals.Penalties += pen;
                                totals.PenaltyYards += yds;
                                break;
                            }

                        // Time "MM:SS"
                        case "possessionTime":
                            totals.PossessionSeconds += ParseTimeToSeconds(stat);
                            break;

                        // Per-play averages: don’t sum; recompute after loop from totals where possible.
                        // (Keep if you want to display “avg of avgs”, but that’s usually misleading.)
                        case "yardsPerPass":
                        case "yardsPerRushAttempt":
                            // intentionally ignored in totals; computed below
                            break;

                        default:
                            // If you want to keep everything, stash unknown stats here:
                            totals.UnmappedStats ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                            totals.UnmappedStats[category] = stat;
                            break;
                    }
                }
            }

            // Derived rates
            totals.YardsPerPass = totals.PassAttempts > 0
                ? (double)totals.NetPassingYards / totals.PassAttempts
                : 0;

            totals.YardsPerRushAttempt = totals.RushingAttempts > 0
                ? (double)totals.RushingYards / totals.RushingAttempts
                : 0;

            totals.ThirdDownPct = totals.ThirdDownAttempts > 0
                ? (double)totals.ThirdDownMade / totals.ThirdDownAttempts
                : 0;

            totals.FourthDownPct = totals.FourthDownAttempts > 0
                ? (double)totals.FourthDownMade / totals.FourthDownAttempts
                : 0;

            totals.CompletionPct = totals.PassAttempts > 0
                ? (double)totals.PassCompletions / totals.PassAttempts
                : 0;

            return totals;
        }

        private static int ParseInt(string s)
            => int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : 0;

        private static (int made, int att) ParseMadeAttempt(string s)
        {
            // Handles "3-10", "22-35", "3-27", "0-0"
            var parts = s.Split('-', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) return (0, 0);
            return (ParseInt(parts[0]), ParseInt(parts[1]));
        }

        private static int ParseTimeToSeconds(string s)
        {
            // Handles "MM:SS"
            var parts = s.Split(':', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) return 0;
            var minutes = ParseInt(parts[0]);
            var seconds = ParseInt(parts[1]);
            return (minutes * 60) + seconds;
        }
    }

}
