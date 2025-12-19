using CollegeFootballData;
using CollegeFootballData.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Kiota.Abstractions;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public sealed class CollegeFootballDataHelper
    {
        private readonly ApiClient _client;

        /// <summary>
        /// Construct the helper from an existing ApiClient instance.
        /// </summary>
        public CollegeFootballDataHelper(IConfiguration configuration)
        {
            var authProvider = new BaseBearerTokenAuthenticationProvider(new StaticAccessTokenProvider(configuration["CollegeFootballData:ApiKey"]));

            // Create HTTP client and request adapter with authentication
            var httpClient = new HttpClient();
            var requestAdapter = new HttpClientRequestAdapter(authProvider, httpClient: httpClient);

            // Create the API client
            _client = new CollegeFootballData.ApiClient(requestAdapter);
        }

        public Task<List<GameTeamStats>?> GetTeamGameAsync(int year, string team, CancellationToken cancellationToken = default)
        {
            return _client.Games.Teams.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
                requestConfiguration.QueryParameters.Team = team;
                requestConfiguration.QueryParameters.SeasonTypeAsSeasonType = SeasonType.Regular;
            }, cancellationToken);
        }

        /// <summary>
        /// Get games for a given year and season type (defaults to Postseason since that's what you're using now).
        /// </summary>
        public Task<List<Game>?> GetGamesAsync(
            int year,
            SeasonType seasonType = SeasonType.Postseason,
            CancellationToken cancellationToken = default)
        {
            return _client.Games.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
                requestConfiguration.QueryParameters.SeasonTypeAsSeasonType = seasonType;
            }, cancellationToken);
        }

        /// <summary>
        /// Get all teams (no filters).
        /// </summary>
        public Task<List<Team>?> GetTeamsAsync(int year, CancellationToken cancellationToken = default)
        {
            return _client.Teams.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
            }, cancellationToken: cancellationToken);
        }

        /// <summary>
        /// Get rankings (PollWeek) for a given year.
        /// </summary>
        public Task<List<PollWeek>?> GetRankingsAsync(
            int year,
            CancellationToken cancellationToken = default)
        {
            return _client.Rankings.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
            }, cancellationToken);
        }

        /// <summary>
        /// Get team records for a given year.
        /// </summary>
        public Task<List<TeamRecords>?> GetRecordsAsync(
            int year,
            CancellationToken cancellationToken = default)
        {
            return _client.Records.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
            }, cancellationToken);
        }

        public Task<Matchup?> GetTeamMatchupAsync(int year, string team1, string team2, CancellationToken cancellationToken = default)
        {
            return _client.Teams.Matchup.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.MaxYear = year;
                requestConfiguration.QueryParameters.MinYear = year;
                requestConfiguration.QueryParameters.Team1 = team1;
                requestConfiguration.QueryParameters.Team2 = team2;
            }, cancellationToken);
        }

        public Task<List<TeamSeasonPredictedPointsAdded>?> GetTeamMetricsAsync(int year, string team, CancellationToken cancellationToken = default)
        {
            return _client.Ppa.Teams.GetAsync(requestConfiguration =>
            {
                requestConfiguration.QueryParameters.Year = year;
                requestConfiguration.QueryParameters.Team = team;
            }, cancellationToken);
        }

        /// <summary>
        /// Convenience method: fetch games (postseason), teams, rankings, and records for a year in parallel.
        /// </summary>
        public async Task<SeasonData> GetSeasonDataAsync(
            DateTime StartDate,
            int year,
            SeasonType gamesSeasonType = SeasonType.Postseason,
            CancellationToken cancellationToken = default)
        {
            var gamesTask = GetGamesAsync(year, gamesSeasonType, cancellationToken);
            var teamsTask = GetTeamsAsync(year, cancellationToken);
            var rankingsTask = GetRankingsAsync(year, cancellationToken);
            var recordsTask = GetRecordsAsync(year, cancellationToken);

            await Task.WhenAll(gamesTask, teamsTask, rankingsTask, recordsTask);

            return new SeasonData
            {
                Games = (gamesTask.Result ?? new List<Game>()).Where(x => x.StartDate >= StartDate).OrderBy(x => x.StartDate).ToList(),
                Teams = teamsTask.Result ?? new List<Team>(),
                Rankings = rankingsTask.Result ?? new List<PollWeek>(),
                Records = recordsTask.Result ?? new List<TeamRecords>()
            };
        }
    }

    /// <summary>
    /// Bundle of season data to keep your controller/service code clean.
    /// </summary>
    public sealed class SeasonData
    {
        public List<Game> Games { get; init; } = new();
        public List<Team> Teams { get; init; } = new();
        public List<PollWeek> Rankings { get; init; } = new();
        public List<TeamRecords> Records { get; init; } = new();
    }

}
