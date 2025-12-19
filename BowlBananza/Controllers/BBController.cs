using Azure.Core;
using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using CollegeFootballData;
using CollegeFootballData.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BBController : Controller
    {
        private readonly AppDbContext db;
        private readonly CollegeFootballDataTestHelper cfbClient;
        public BBController(AppDbContext dbContext, IConfiguration configuration) { 
            db = dbContext;

            // Create the API client
            cfbClient = new CollegeFootballDataTestHelper(configuration);
        }

        public bool NotAuth()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var username = HttpContext.Session.GetString("Email");

            if (userId == null || string.IsNullOrEmpty(username))
            {
                return true;
            }
            return false;
        }

        [HttpGet("metrics")]
        public async Task<ActionResult<List<GameTeamStatsType>>> Metrics(string team)
        {
            if (NotAuth())
            {
                return Redirect("/");
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var metrics = await cfbClient.GetTeamMetricsAsync(year, team);

            return Ok(JsonConvert.SerializeObject(metrics));
        }

        [HttpGet("compare")]
        public async Task<ActionResult<Matchup>> Compare(string team1, string team2)
        {
            if (NotAuth())
            {
                return Redirect("/");
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var matchup = await cfbClient.GetTeamMatchupAsync(year, team1, team2);
            if (matchup == null)
            {
                matchup = new Matchup();
            }
            return Ok(JsonConvert.SerializeObject(matchup));
        }

        [HttpGet("submitChoices")]
        public async Task<ActionResult<bool>> SubmitChoices()
        {
            if (NotAuth())
            {
                return Redirect("/");
            }
            var userId = HttpContext.Session.GetInt32("UserId");
            var year = SeasonHelper.GetCurrentSeasonYear();
            var cS = db.UserSubmitted.FirstOrDefault(x => x.Year == year && x.UserId == userId);

            if (cS == null)
            {
                UserSubmitted selection = new UserSubmitted
                {
                    Year = year,
                    UserId = userId.GetValueOrDefault(),
                    Submitted = true
                };
                db.UserSubmitted.Add(selection);
            } else
            {
                cS.Submitted = true;
                db.UserSubmitted.Update(cS);
            }

                await db.SaveChangesAsync();

            return Ok(true);
        }

        [HttpPost("SaveSelections")]
        public async Task<ActionResult<bool>> SaveSelections(int game, int team)
        {
            if (NotAuth())
            {
                return Redirect("/");
            }
            var userId = HttpContext.Session.GetInt32("UserId");
            var year = SeasonHelper.GetCurrentSeasonYear();

            var alreadySubmitted = db.UserSubmitted.Any(x => x.Year == year && x.UserId == userId && x.Submitted);

            if (!alreadySubmitted)
            {
                var cS = db.GameSelections.FirstOrDefault(x => x.Year == year && x.User == userId && x.GameId == game);

                if (cS == null)
                {
                    GameSelection selection = new GameSelection
                    {
                        Year = year,
                        User = userId.GetValueOrDefault(),
                        GameId = game,
                        TeamId = team
                    };
                    db.GameSelections.Add(selection);
                }
                else
                {
                    cS.TeamId = team;
                    db.GameSelections.Update(cS);
                }

                await db.SaveChangesAsync();
            }

            return Ok(true);
        }

        [HttpGet]
        public async Task<ActionResult<string>> Get()  // Use ActionResult<T>
        {
            if (NotAuth())
            {
                return Redirect("/");
            }
            try
            {
                List<Game> games = new List<Game>();
                Dictionary<int, Team> teams = new Dictionary<int, Team>();
                List<GameSelection> selections = new List<GameSelection>();
                Dictionary<int, TeamRecords> records = new Dictionary<int, TeamRecords>();
                Dictionary<int, int> rankings = new Dictionary<int, int>();

                GetGameData data = new GetGameData();

                try
                {
                    var year = SeasonHelper.GetCurrentSeasonYear();

                    var userId = HttpContext.Session.GetInt32("UserId");
                    selections = db.GameSelections.Where(x => x.Year == year && x.User == userId).ToList();

                    var BowlData = db.BowlData.FirstOrDefault(x => x.Year == year);

                    if (BowlData == null)
                    {
                        return Ok(JsonConvert.SerializeObject(data));
                    }

                    var seasonData = await cfbClient.GetSeasonDataAsync(BowlData.TieBreakerDate.GetValueOrDefault(BowlData.StartDate), year, SeasonType.Postseason);

                    var submitted = db.UserSubmitted.Any(u =>
                        u.UserId == userId && u.Submitted
                        && u.Year == year
                    );

                    games = seasonData.Games;
                    ICollection<Team> tResult = seasonData.Teams;
                    ICollection<TeamRecords> recordResult = seasonData.Records;
                    ICollection<PollWeek> rankResults = seasonData.Rankings;

                    rankings = RankingsCalculator.BuildCompositeRankings(rankResults);

                    var rankingT = RankingsCalculator.BuildCompositeRankings(rankResults);

                    foreach (var g in games)
                    {
                        var hT = tResult.FirstOrDefault(x => x.Id == g.HomeId);
                        var aT = tResult.FirstOrDefault(x => x.Id == g.AwayId);

                        var recordT = recordResult.Where(x => (x.TeamId == hT.Id || x.TeamId == aT.Id) && x.Year == year);

                        foreach (var record in recordT)
                        {
                            if (recordT != null && !records.ContainsKey(record.TeamId.GetValueOrDefault(0)))
                            {
                                records.Add(record.TeamId.GetValueOrDefault(0), record);
                            }
                        }

                        if (hT != null && !teams.ContainsKey(hT.Id.GetValueOrDefault(0))) // Check for null!
                        {
                            if (hT.Color == "#null")
                            {
                                hT.Color = null;
                            }
                            if (hT.AlternateColor == "#null")
                            {
                                hT.AlternateColor = null;
                            }
                            teams.Add(hT.Id.GetValueOrDefault(0), hT);
                        }
                        if (aT != null && !teams.ContainsKey(aT.Id.GetValueOrDefault(0))) // Check for null!
                        {
                            if (aT.Color == "#null")
                            {
                                aT.Color = null;
                            }
                            if (aT.AlternateColor == "#null")
                            {
                                aT.AlternateColor = null;
                            }
                            teams.Add(aT.Id.GetValueOrDefault(0), aT);
                        }
                    }
                }
                catch (Exception e)
                {
                    return StatusCode(345, $"Internal Server Error: {e.Message}"); // Return 500 with error details (for debugging)
                }

                data.games = games;
                data.teams = teams;
                data.rankings = rankings;
                data.records = records;
                data.selections = selections;

                string jsonData = JsonConvert.SerializeObject(data); // Explicitly serialize

                return Ok(jsonData); // Return the JSON string
            }catch(Exception e)
            {
                return StatusCode(500, $"Internal Server Error: {e.Message}");
            }
        }
    }

    public class GetGameData
    {
        public List<Game> games { get; set; }
        public Dictionary<int, Team> teams { get; set; }
        public List<GameSelection> selections { get; set; }
        public Dictionary<int, TeamRecords> records { get; set; }
        public Dictionary<int, int> rankings { get; set; }
    }
}
