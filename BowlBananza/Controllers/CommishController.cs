using Azure.Core;
using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using CollegeFootballData;
using CollegeFootballData.Models;
using Mailjet.Client.Resources;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
using System.Threading;
using System.Threading.Tasks;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CommishController : Controller
    {
        private readonly ISyncDataService _syncService;
        private readonly CollegeFootballDataHelper cfbClient;
        private readonly CollegeFootballDataTestHelper cfbClientTest;
        private readonly AppDbContext db;
        private readonly IConfiguration _config;
        public CommishController(ISyncDataService syncService, AppDbContext dbContext, IConfiguration configuration)
        {
            _config = configuration;
            db = dbContext;
            _syncService = syncService;

            // Create the API client
            cfbClient = new CollegeFootballDataHelper(configuration);
            cfbClientTest = new CollegeFootballDataTestHelper(configuration);
        }

        private async Task SendStarterEmail()
        {
            var users = db.BBUsers.Where(u => u.Inactive != true).ToList();
            foreach(var user in users) { 
            var html = @"
<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Welcome to BowlBananza</title>
  </head>

  <body style=""margin:0;padding:0;background:rgb(53,56,66);font-family:Arial,Helvetica,sans-serif;color:#ffffff;"">
    <!-- Preheader (hidden preview text) -->
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      Welcome to BowlBananza. Lock in your picks and watch the games.
    </div>

    <!-- Full-width wrapper -->
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:rgb(53,56,66);padding:26px 12px;"">
      <tr>
        <td align=""center"">
          <!-- Main container -->
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""650"" style=""width:650px;max-width:650px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:#0f1116;"">
            <!-- Header area with “background logo” -->
            <tr>
              <td style=""padding:0;position:relative;"">
                <!-- Overlay content -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:-1px;"">
                  <tr>
                    <td style=""padding:18px 18px 16px;background:rgba(15,17,22,0.82);border-top:1px solid rgba(255,255,255,0.08);"">
                      <!-- Small logo top-left -->
                      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
                        <tr>
                          <td align=""left"" style=""vertical-align:middle;"">
                            <img
                              src=""https://www.bowlbananza.com/static/media/logo.e4ac6bc18deab7b76480.webp""
                              width=""54""
                              height=""54""
                              alt=""BowlBananza""
                              style=""display:block;width:54px;height:54px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.20);""
                            />
                          </td>
                          <td align=""right"" style=""vertical-align:middle;"">
                            <div style=""font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);"">
                              Welcome, {{firstName}}!
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style=""margin-top:12px;font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;"">
                        Welcome to BowlBananza 🏈
                      </div>

                      <div style=""margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.80);"">
                        You’re in. The bowls are coming fast, and the games wait for no one.
                        Jump in, make your picks, and let’s see who really knows ball.
                      </div>

                      <!-- Accent bar -->
                      <div style=""margin-top:14px;height:4px;width:100%;border-radius:999px;background:linear-gradient(90deg, rgb(253,99,39), rgb(204,69,32));""></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style=""padding:18px;background:#0f1116;"">
                <!-- Info card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);"">
                  <tr>
                    <td style=""padding:16px 16px 14px;"">
                      <div style=""font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.70);"">
                        Get started
                      </div>

                      <div style=""margin-top:8px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.86);"">
                        <span style=""color:rgb(253,99,39);font-weight:800;"">1)</span> Visit the Games page<br />
                        <span style=""color:rgb(253,99,39);font-weight:800;"">2)</span> Pick winners before the first kickoff<br />
                        <span style=""color:rgb(253,99,39);font-weight:800;"">3)</span> Watch the games and talk your trash (responsibly 😄)
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <div style=""margin-top:16px;"">
                  <!-- Replace href with your real link -->
                  <a
                    href=""https://www.bowlbananza.com""
                    style=""display:inline-block;background:rgb(253,99,39);color:#0f1116;text-decoration:none;font-weight:900;font-size:14px;padding:12px 16px;border-radius:14px;border:1px solid rgba(0,0,0,0.12);""
                  >
                    Make My Picks
                  </a>

                  <span style=""display:inline-block;width:10px;""></span>
                </div>

                <!-- Tip -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(253,99,39,0.25);background:rgba(204,69,32,0.12);"">
                  <tr>
                    <td style=""padding:14px 14px;"">
                      <div style=""font-size:14px;font-weight:900;color:#ffffff;"">
                        Pro tip
                      </div>
                      <div style=""margin-top:6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.82);"">
                        Picks lock at kickoff. If you’re unsure, pick early and adjust later (before kickoff, of course).
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Fallback link -->
                <div style=""margin-top:14px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.65);"">
                  If the buttons don’t work, copy and paste this link into your browser:<br />
                  <span style=""word-break:break-all;color:rgba(255,255,255,0.85);"">https://www.bowlbananza.com</span>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style=""padding:16px 18px;background:#0b0d11;border-top:1px solid rgba(255,255,255,0.08);"">
                <div style=""font-size:11px;line-height:1.55;color:rgba(255,255,255,0.55);"">
                  You’re receiving this email because you joined this season’s BowlBananza pool.
                  If you already made your picks, you’re a legend. If not, go fix that. 😉
                </div>
              </td>
            </tr>
          </table>

          <!-- Outer footer -->
          <div style=""width:650px;max-width:650px;margin-top:10px;font-size:11px;line-height:1.5;color:rgba(255,255,255,0.45);text-align:center;"">
            © BowlBananza
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
";
            var success = await EmailHelper.SendEmail(user.Email, "ddrake212@gmail.com", "Bowl Bananza", html.Replace("{{firstName}}", user.FirstName), "Let The Games Begin!");
            }
        }

        [HttpGet("loadTieBreak")]
        public async Task<ActionResult<bool>> LoadTieBreak()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            
            var BowlData = db.BowlData.First(x => x.Year == year);
            BowlData.TieBreakerDate = TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZones.Eastern);

            db.BowlData.Update(BowlData);
            await db.SaveChangesAsync();
            return Ok(true);
        }

        [HttpGet("lockData")]
        public async Task<ActionResult<bool>> LockData()
        {
            var users = db.BBUsers.Where(u => u.Inactive != true).ToList();
            var userToLock = db.UserSubmitted.ToList();
            var year = SeasonHelper.GetCurrentSeasonYear();
            var games = await cfbClientTest.GetGamesAsync(year);
            var gamesSelected = db.GameSelections
                    .Where(g => g.Year == year)
                    .GroupBy(g => g.User)
                    .ToDictionary(
                        g => g.Key,
                        g => g.ToList()
                    );
            foreach (var user in users)
            {
                var lockUser = userToLock.FirstOrDefault(x => x.UserId == user.Id);

                var gamesToFillforUserList = gamesSelected[user.Id];

                if (gamesToFillforUserList == null)
                {
                    gamesToFillforUserList = new List<GameSelection>();
                }

                var gamesToFillForUser = gamesToFillforUserList.Select(g => g.GameId).ToHashSet();

                var selectionsToAdd = games.Where(g => !gamesToFillForUser.Contains(g.Id.Value)).Select(g => new GameSelection
                {
                    Year = year,
                    User = user.Id,
                    GameId = g.Id.Value,
                    TeamId = -1
                }).ToList();

                db.GameSelections.AddRange(selectionsToAdd);

                if (lockUser == null)
                {
                    UserSubmitted data = new UserSubmitted
                    {
                        Year = year,
                        Submitted = true,
                        UserId = user.Id
                    };
                    db.UserSubmitted.Add(data);
                    await db.SaveChangesAsync();
                }
                else if (!lockUser.Submitted)
                {
                    lockUser.Submitted = true;
                    db.UserSubmitted.Update(lockUser);
                }
            }

            var bowlData = db.BowlData.FirstOrDefault(x => x.Year == year);
            bowlData.IsLocked = true;
            db.BowlData.Update(bowlData);

            HttpContext.Session.SetString("isSubmitted", "true");
            HttpContext.Session.SetString("isLocked", "true");

            await db.SaveChangesAsync();
            return Ok(true);
        }

        [HttpGet("updateCommish")]
        public async Task<ActionResult<bool>> UpdateCommish(int userId)
        {
            var currentCommishId = HttpContext.Session.GetInt32("UserId").GetValueOrDefault(0);
            var currentCommish = db.BBUsers.FirstOrDefault(x => x.Inactive != true && x.Id == currentCommishId && x.isCom == true);
            if (currentCommish == null)
            {
                return Unauthorized("You are not authorized to perform this action.");
            }
            var newCommish = db.BBUsers.FirstOrDefault(x => x.Id == userId && x.Inactive != true);
            if (newCommish == null)
            {
                return BadRequest("The specified user does not exist.");
            }
            currentCommish.isCom = false;
            newCommish.isCom = true;
            db.BBUsers.Update(currentCommish);
            db.BBUsers.Update(newCommish);
            await db.SaveChangesAsync();
            return Ok(true);
        }

        [HttpGet("unlock")]
        public async Task<ActionResult<bool>> Unlock()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var bowlData = db.BowlData.FirstOrDefault(x => x.Year == year);
            
            if(bowlData != null)
            {
                var gameSelections = db.GameSelections.Where(g => g.Year == year && g.TeamId == -1).ToList();
                db.GameSelections.RemoveRange(gameSelections);

                bowlData.IsLocked = false;
                db.BowlData.Update(bowlData);
                await db.SaveChangesAsync();
            }
            return Ok(true);
        }

        [HttpGet("getData")]
        public async Task<ActionResult<CommishData>> GetData()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var users = db.BBUsers.Where(u => u.Inactive != true).ToList();
            var dataSynced = db.BowlData.FirstOrDefault(x => x.Year == year);
            var submittedUsers = db.UserSubmitted.ToList();
            var isLockedDown = dataSynced != null ? dataSynced.IsLocked.GetValueOrDefault(false) : false;
            CommishData data = new CommishData
            {
                Users = users.Select(x => new CommishUser { UserId = x.Id, UserName = String.Format("{0} {1}", x.FirstName, x.LastName) }).ToList(),
                CanSyncData = dataSynced == null,
                CurrentCommish = HttpContext.Session.GetInt32("UserId").GetValueOrDefault(0),
                CanLockDown = !isLockedDown && dataSynced != null,
                CanLoadTieBreak = true,
                CanUnlock = isLockedDown,
                CanForceUpdate = dataSynced != null
            };
            string jsonData = JsonConvert.SerializeObject(data);
            return Ok(jsonData);
        }

        private async Task<(string Team, List<GameTeamStats> Stats)> FetchTeamStatsAsync(int year, string team)
        {
            var stats = await cfbClient.GetTeamGameAsync(year, team);
            return (team, stats);
        }

        [HttpGet("forceSync")]
        public async Task<ActionResult<bool>> ForceSync()
        {
            await DataSyncHelper.SyncData(_config, db);
            return Ok(true);
        }


        [HttpGet("dataSync")]
        public async Task<ActionResult<bool>> DataSync()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var games = cfbClient.GetGamesAsync(year, SeasonType.Postseason);
            var teams = cfbClient.GetTeamsAsync(year);
            var ranks = cfbClient.GetRankingsAsync(year);
            var records = cfbClient.GetRecordsAsync(year);

            await Task.WhenAll(games, ranks, teams, records);

            JsonFileWriter.WriteToJsonFile<List<Game>>(games.Result, "TestData/sampleGameData.json");
            JsonFileWriter.WriteToJsonFile<List<Team>>(teams.Result, "TestData/sampleTeamData.json");
            JsonFileWriter.WriteToJsonFile<List<PollWeek>>(ranks.Result, "TestData/sampleRankingsData.json");
            JsonFileWriter.WriteToJsonFile<List<TeamRecords>>(records.Result, "TestData/sampleRecordData.json");

            var metricTasks = new List<Task<(string Team, List<GameTeamStats> Stats)>>();
            var matchupTasks = new List<Task<Matchup>>();

            foreach (var game in games.Result)
            {
                metricTasks.Add(FetchTeamStatsAsync(year, game.HomeTeam));
                metricTasks.Add(FetchTeamStatsAsync(year, game.AwayTeam));

                matchupTasks.Add(cfbClient.GetTeamMatchupAsync(year, game.HomeTeam, game.AwayTeam));
            }

            var metricResults = await Task.WhenAll(metricTasks);
            var matchupResults = await Task.WhenAll(matchupTasks);

            var metricData = metricResults.Select(x => GameTeamStatsAggregator.AggregateTeamStats(x.Stats,x.Team)).ToList();
            var matchupData = matchupResults.ToList();

            JsonFileWriter.WriteToJsonFile(metricData, "TestData/sampleMetricData.json");
            JsonFileWriter.WriteToJsonFile(matchupData, "TestData/sampleMatchupData.json");

            var BowlData = db.BowlData.First(x => x.Year == year);
            if (BowlData == null)
            {
                BowlData data = new BowlData
                {
                    Year = year,
                    StartDate = TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZones.Eastern)
                };
                db.BowlData.Add(data);
                await db.SaveChangesAsync();
                await SendStarterEmail();
            }

            return Ok(true);
        }

        [HttpGet("sendEmail")]
        public async Task<ActionResult<bool>> SendEmail(CancellationToken ct)
        {
            await _syncService.SyncDataAsync(ct);

            return Ok(true);
        }
    }
}
