using CollegeFootballData.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace BowlBananza.Helpers
{
    public static class RankingsCalculator
    {
        private const string PlayoffPollName = "Playoff Committee Rankings";

        public static Dictionary<int, int> BuildCompositeRankings(IEnumerable<PollWeek> allWeeks, int max = 25)
        {
            if (allWeeks == null)
            {
                return new Dictionary<int, int>();
            }

            // Only weeks that have the playoff committee poll at all
            var weeksWithPlayoffPoll = allWeeks
                .Where(w => w != null && w.Polls != null && w.Polls.Any(p => p.PollProp == PlayoffPollName))
                .ToList();

            if (weeksWithPlayoffPoll.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            // Latest season among those weeks
            var latestSeason = weeksWithPlayoffPoll.Max(w => w.Season ?? 0);

            var latestSeasonWeeks = weeksWithPlayoffPoll
                .Where(w => (w.Season ?? 0) == latestSeason)
                .ToList();

            if (latestSeasonWeeks.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            // Latest week in that season
            var latestWeekNumber = latestSeasonWeeks.Max(w => w.Week ?? 0);

            var latestWeek = latestSeasonWeeks
                .FirstOrDefault(w => (w.Week ?? 0) == latestWeekNumber);

            if (latestWeek == null || latestWeek.Polls == null)
            {
                return new Dictionary<int, int>();
            }

            // Get the actual Playoff Committee Rankings poll from that week
            var playoffPoll = latestWeek.Polls
                .FirstOrDefault(p => p.PollProp == PlayoffPollName);

            if (playoffPoll == null || playoffPoll.Ranks == null)
            {
                return new Dictionary<int, int>();
            }

            // Use the ranks from that latest poll directly
            var rankedTeams = playoffPoll.Ranks
                .Where(r => r.TeamId.HasValue && r.Rank.HasValue)
                .OrderBy(r => r.Rank!.Value)
                .Take(max)
                .ToList();

            if (rankedTeams.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            // Build dictionary: TeamId → PollRank (from committee)
            var result = rankedTeams.ToDictionary(
                r => r.TeamId!.Value,
                r => r.Rank!.Value
            );

            return result;
        }
    }
}
