using BowlBananza.Models;
using BowlBananza.TestData;
using CollegeFootballData;
using CollegeFootballData.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    /// <summary>
    /// Test helper that mimics CollegeFootballDataHelper but uses in-memory data
    /// instead of calling the CollegeFootballData API.
    ///
    /// Filtering rules:
    /// - Games: only games with StartDate > 2025-12-11
    /// - Teams: only teams that appear in the filtered games
    /// - Rankings: (left as-provided for now; see TODO)
    /// - Records: only records for filtered teams
    /// - Metrics (PPA): only metrics for filtered teams
    /// - Matchups: generated from filtered games, with some pairs having data,
    ///   and at least 5 pairs having explicit "no data" matchups.
    /// </summary>
    public sealed class CollegeFootballDataTestHelper
    {
        private readonly List<Game> _games;
        private readonly List<Team> _teams;
        private readonly List<PollWeek> _rankings;
        private readonly List<TeamRecords> _records;
        private readonly List<GameTeamStatsType> _metrics;
        private readonly Dictionary<string, Matchup> _matchups;

        private const int TestYear = 2025;

        public CollegeFootballDataTestHelper(IConfiguration configuration)
        {
            IEnumerable<Game> games = new SampleData<Game>().Load("TestData/sampleGameData.json");
            IEnumerable<Team> teams = new SampleData<Team>().Load("TestData/sampleTeamData.json");
            IEnumerable<PollWeek> rankings = new SampleData<PollWeek>().Load("TestData/sampleRankingsData.json");
            IEnumerable<TeamRecords> records = new SampleData<TeamRecords>().Load("TestData/sampleRecordData.json");
            IEnumerable<GameTeamStatsType> metrics = new SampleData<GameTeamStatsType>().Load("TestData/sampleMetricData.json");
            IEnumerable<Matchup> matchups = new SampleData<Matchup>().Load("TestData/sampleMatchupData.json");

            if (games is null) throw new ArgumentNullException(nameof(games));
            if (teams is null) throw new ArgumentNullException(nameof(teams));
            if (rankings is null) throw new ArgumentNullException(nameof(rankings));
            if (records is null) throw new ArgumentNullException(nameof(records));
            if (metrics is null) throw new ArgumentNullException(nameof(metrics));

            // 1) Filter games: only games that occur after 12/11/2025
            //    (using UTC to match API "Z" timestamps)
            var cutoff = new DateTimeOffset(2025, 12, 11, 0, 0, 0, TimeSpan.Zero);

            _games = games.ToList();

            _teams = teams.ToList();

            // 3) Rankings: keep as-is for now (all 2025),
            //    since the nested Kiota types are a bit awkward to filter here.
            //    If you want, you can further trim to only FBS polls & these teams.
            _rankings = rankings.ToList();

            // 4) Records: only records for filtered teams
            _records = records.ToList();

            // 5) Metrics (PPA): only metrics for filtered teams
            _metrics = metrics.ToList();

            var teamNameSet = _games
                .SelectMany(g => new[] { g.HomeTeam, g.AwayTeam })
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // 6) Build matchup data from the filtered games.
            //    We will:
            //    - Choose some pairs to have "data" (non-zero wins).
            //    - Choose at least 5 pairs to be explicit "no data" matchups (0-0-0).
            _matchups = BuildMatchups(matchups);
        }

        #region Public API – same signatures as original helper

        public Task<List<Game>?> GetGamesAsync(
            int year,
            SeasonType seasonType = SeasonType.Postseason,
            CancellationToken cancellationToken = default)
        {
            // _games are already postseason-only in your data, but we keep the seasonType check
            // to mimic the original semantics.
            return Task.FromResult<List<Game>?>(_games.ToList());
        }

        public Task<List<Team>?> GetTeamsAsync(
            int year,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<List<Team>?>(_teams.ToList());
        }

        public Task<List<PollWeek>?> GetRankingsAsync(
            int year,
            CancellationToken cancellationToken = default)
        {
            // Already filtered to 2025 in the ctor
            return Task.FromResult<List<PollWeek>?>(_rankings.ToList());
        }

        public Task<List<TeamRecords>?> GetRecordsAsync(
            int year,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<List<TeamRecords>?>(_records.ToList());
        }

        public Task<Matchup?> GetTeamMatchupAsync(
            int year,
            string team1,
            string team2,
            CancellationToken cancellationToken = default)
        {
            var key = NormalizeKey(team1, team2);

            if (_matchups.ContainsKey(key))
            {
                return Task.FromResult<Matchup?>(_matchups[key]);
            }

            // If there's no entry for this pair at all, we simulate "no matchup exists"
            // by returning null (slightly different from your second sample which is a 0-0-0 object).
            return Task.FromResult<Matchup?>(null);
        }

        public Task<GameTeamStatsType?> GetTeamMetricsAsync(
            int year,
            string team,
            CancellationToken cancellationToken = default)
        {
            var result = _metrics
                .FirstOrDefault(m => m.Team.Equals(team, StringComparison.OrdinalIgnoreCase));

            return Task.FromResult<GameTeamStatsType?>(result);
        }

        public Task<SeasonData> GetSeasonDataAsync(
            DateTime startDate,
            int year,
            SeasonType gamesSeasonType = SeasonType.Postseason,
            CancellationToken cancellationToken = default)
        {
            // Convert the provided startDate to DateTimeOffset in UTC for comparison
            var start = TimeZones.GetTime(startDate);

            var games = _games
                .Where(g => g.StartDate >= start)
                .OrderBy(g => g.StartDate)
                .ToList();

            // Teams / rankings / records have already been pre-filtered in the ctor
            var result = new SeasonData
            {
                Games = games,
                Teams = _teams.ToList(),
                Rankings = _rankings.ToList(),
                Records = _records.ToList()
            };

            return Task.FromResult(result);
        }

        #endregion

        #region Internal helpers – matchup building, key normalization

        private Dictionary<string, Matchup> BuildMatchups(IEnumerable<Matchup> matchups)
        {
            var dict = new Dictionary<string, Matchup>(StringComparer.OrdinalIgnoreCase);

            foreach(Matchup matchup in matchups)
            {
                var key = NormalizeKey(matchup.Team1, matchup.Team2);
                dict[key] = matchup;
            }

            return dict;
        }

        private static string NormalizeKey(string team1, string team2)
        {
            if (team1 == null) team1 = string.Empty;
            if (team2 == null) team2 = string.Empty;

            var t1 = team1.Trim();
            var t2 = team2.Trim();

            return string.Compare(t1, t2, StringComparison.OrdinalIgnoreCase) <= 0
                ? $"{t1.ToLowerInvariant()}|{t2.ToLowerInvariant()}"
                : $"{t2.ToLowerInvariant()}|{t1.ToLowerInvariant()}";
        }

        #endregion
    }
}
