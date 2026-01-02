using BowlBananza.Data;
using BowlBananza.Models;
using BowlBananza.TestData;
using CollegeFootballData.Models;
using Mailjet.Client.Resources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Identity.Client;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public class DataSyncHelper
    {
        private static async Task<(string Team, List<GameTeamStats> Stats)> FetchTeamStatsAsync(CollegeFootballDataHelper cfbClient, int year, string team)
        {
            var stats = await cfbClient.GetTeamGameAsync(year, team);
            return (team, stats);
        }

        private static async Task SendTieBreakerEmail(List<Models.User> users)
        {
            var sender = new MailKitEmailSender();
            foreach (var user in users)
            {
                var html = @"
<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Tie-Breaker Needed</title>
  </head>

  <body style=""margin:0;padding:0;background:rgb(53,56,66);font-family:Arial,Helvetica,sans-serif;color:#ffffff;"">
    <!-- Preheader (hidden preview text) -->
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      You’re tied for first. Pick the National Championship winner to break the tie.
    </div>

    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:rgb(53,56,66);padding:26px 12px;"">
      <tr>
        <td align=""center"">
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""650"" style=""width:650px;max-width:650px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:#0f1116;"">
            <!-- Header with background logo -->
            <tr>
              <td style=""padding:0;position:relative;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:-1px;"">
                  <tr>
                    <td style=""padding:18px 18px 16px;background:rgba(15,17,22,0.82);border-top:1px solid rgba(255,255,255,0.08);"">
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
                              Tie-Breaker
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style=""margin-top:12px;font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;"">
                        {{firstName}}, you’re Tied for 1st 🥇
                      </div>

                      <div style=""margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.80);"">
                        We’ve got a tie at the top. To break it, you need to pick the winner of the
                        <span style=""font-weight:900;color:#ffffff;"">National Championship</span>.
                      </div>

                      <div style=""margin-top:14px;height:4px;width:100%;border-radius:999px;background:linear-gradient(90deg, rgb(253,99,39), rgb(204,69,32));""></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style=""padding:18px;background:#0f1116;"">
                <!-- Action card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);"">
                  <tr>
                    <td style=""padding:16px 16px 14px;"">
                      <div style=""font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.70);"">
                        Action required
                      </div>

                      <div style=""margin-top:8px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.88);"">
                        Please select your National Championship winner as soon as possible so we can finalize the results.
                      </div>

                      <div style=""margin-top:10px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.70);"">
                        If you already made your pick, you can ignore this email.
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
                    Pick the National Champion
                  </a>
                </div>

                <!-- Reminder / urgency card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(253,99,39,0.25);background:rgba(204,69,32,0.12);"">
                  <tr>
                    <td style=""padding:14px 14px;"">
                      <div style=""font-size:14px;font-weight:900;color:#ffffff;"">
                        Why this matters
                      </div>
                      <div style=""margin-top:6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.82);"">
                        If multiple users finish with the same points, the National Championship pick is used to break the tie.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Fallback link -->
                <div style=""margin-top:14px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.65);"">
                  If the button doesn’t work, copy and paste this link into your browser:<br />
                  <span style=""word-break:break-all;color:rgba(255,255,255,0.85);"">
                    https://www.bowlbananza.com
                  </span>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style=""padding:16px 18px;background:#0b0d11;border-top:1px solid rgba(255,255,255,0.08);"">
                <div style=""font-size:11px;line-height:1.55;color:rgba(255,255,255,0.55);"">
                  You’re receiving this email because you have an active entry for this season’s BowlBananza pool.
                </div>
              </td>
            </tr>
          </table>

          <div style=""width:650px;max-width:650px;margin-top:10px;font-size:11px;line-height:1.5;color:rgba(255,255,255,0.45);text-align:center;"">
            © BowlBananza
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>

";

                var success = await EmailHelper.SendEmail(user.Email, "ddrake212@gmail.com", "Bowl Bananza", html.Replace("{{firstName}}", user.FirstName), "Tie Breaker!");
            }
        }

        public static async Task SendNewGamesEmail(AppDbContext db, int gameCount, int LeagueId)
        {
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == LeagueId).Select(x => x.UserId).ToHashSet();
            var users = db.BBUsers.Where(u => LeagueUsers.Contains(u.Id) && u.Inactive != true).ToList();
            foreach(var user in users)
            {
                var html = @"
<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>More Games Added</title>
  </head>

  <body style=""margin:0;padding:0;background:rgb(53,56,66);font-family:Arial,Helvetica,sans-serif;color:#ffffff;"">
    <!-- Preheader (hidden preview text) -->
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      New bowl games were added. Log in and make your picks before kickoff.
    </div>

    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:rgb(53,56,66);padding:26px 12px;"">
      <tr>
        <td align=""center"">
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""650"" style=""width:650px;max-width:650px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:#0f1116;"">
            <!-- Header -->
            <tr>
              <td style=""padding:0;position:relative;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:-1px;"">
                  <tr>
                    <td style=""padding:18px 18px 16px;background:rgba(15,17,22,0.82);border-top:1px solid rgba(255,255,255,0.08);"">
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
                              New Games Added
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style=""margin-top:12px;font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;"">
                        {{firstName}}, more games just dropped 🏈
                      </div>

                      <div style=""margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.80);"">
                        We added more games to this season’s pool. Make your selections so you don’t miss any points.
                      </div>

                      <div style=""margin-top:14px;height:4px;width:100%;border-radius:999px;background:linear-gradient(90deg, rgb(253,99,39), rgb(204,69,32));""></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style=""padding:18px;background:#0f1116;"">
                <!-- Action card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);"">
                  <tr>
                    <td style=""padding:16px 16px 14px;"">
                      <div style=""font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.70);"">
                        Action required
                      </div>

                      <div style=""margin-top:8px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.88);"">
                        Please log in and make picks for the newly added games before kickoff.
                      </div>

                      <div style=""margin-top:10px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.70);"">
                        If you already updated your picks, you can ignore this email.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Optional details card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.03);"">
                  <tr>
                    <td style=""padding:14px 14px;"">
                      <div style=""font-size:14px;font-weight:900;color:#ffffff;"">
                        What changed
                      </div>
                      <div style=""margin-top:6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.82);"">
                        More matchups were added to the pool, and any missing picks will count as unselected until you choose.
                      </div>
                      <div style=""margin-top:8px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.75);"">
                        New games added: <span style=""font-weight:900;color:#ffffff;"">{{newGamesCount}}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <div style=""margin-top:16px;"">
                  <a
                    href=""https://www.bowlbananza.com""
                    style=""display:inline-block;background:rgb(253,99,39);color:#0f1116;text-decoration:none;font-weight:900;font-size:14px;padding:12px 16px;border-radius:14px;border:1px solid rgba(0,0,0,0.12);""
                  >
                    Make My Picks
                  </a>
                </div>

                <!-- Urgency card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(253,99,39,0.25);background:rgba(204,69,32,0.12);"">
                  <tr>
                    <td style=""padding:14px 14px;"">
                      <div style=""font-size:14px;font-weight:900;color:#ffffff;"">
                        Don’t wait
                      </div>
                      <div style=""margin-top:6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.82);"">
                        Picks lock at kickoff. Any games you miss are points you can’t get back.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Fallback link -->
                <div style=""margin-top:14px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.65);"">
                  If the button doesn’t work, copy and paste this link into your browser:<br />
                  <span style=""word-break:break-all;color:rgba(255,255,255,0.85);"">
                    https://www.bowlbananza.com
                  </span>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style=""padding:16px 18px;background:#0b0d11;border-top:1px solid rgba(255,255,255,0.08);"">
                <div style=""font-size:11px;line-height:1.55;color:rgba(255,255,255,0.55);"">
                  You’re receiving this email because you have an active entry for this season’s BowlBananza pool.
                </div>
              </td>
            </tr>
          </table>

          <div style=""width:650px;max-width:650px;margin-top:10px;font-size:11px;line-height:1.5;color:rgba(255,255,255,0.45);text-align:center;"">
            © BowlBananza
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>

";

                var success = await EmailHelper.SendEmail(user.Email, "ddrake212@gmail.com", "Bowl Bananza", html.Replace("{{firstName}}", user.FirstName).Replace("{{newGamesCount}}", gameCount.ToString()), "Games Added!");
            }
        }

        public static async Task SetScores(List<Game> games, int year, AppDbContext db, int LeagueId)
        {
            var current = db.History.Any(h => h.Year == year && h.LeagueId == LeagueId);
            if (current)
            {
                return;
            }

            var pointsByUserId = await CalculateScores(games, year, db, LeagueId);

            if (pointsByUserId == null)
            {
                return;
            }

            var orderedList = pointsByUserId
                                .OrderByDescending(kvp => kvp.Value)   // points DESC
                                .ThenBy(kvp => kvp.Key)                // stable tie-breaker
                                .Select((kvp, index) => (
                                    id: kvp.Key,
                                    points: kvp.Value,
                                    rank: index + 1
                                ))
                                .ToList();

            foreach (var pBU in orderedList)
            {
                var historyEntry = new History
                {
                    UserId = pBU.id,
                    Year = year,
                    Points = pBU.points,
                    Rank = pBU.rank,
                    LeagueId = LeagueId
                };
                db.History.Add(historyEntry);
            }
            await db.SaveChangesAsync();
        }

        public static async Task<Dictionary<int, int>?> CalculateScores(List<Game> games, int year, AppDbContext db, int LeagueId)
        {
            if (games == null) throw new ArgumentNullException(nameof(games));
            if (db == null) throw new ArgumentNullException(nameof(db));

            // Only consider games that have been played (both scores present) and are not ties.
            // Map: GameId -> WinningTeamId
            var winnersByGameId = new Dictionary<int, int>();

            foreach (var g in games)
            {
                // If your Game.Id is nullable or named differently, adjust here.
                var gameId = g.Id;

                if (!g.HomePoints.HasValue || !g.AwayPoints.HasValue)
                    continue;

                if (g.HomePoints.Value == g.AwayPoints.Value)
                    continue; // no winner (tie) -> no points awarded

                var winningTeamId = g.HomePoints.Value > g.AwayPoints.Value
                    ? g.HomeId
                    : g.AwayId;

                if (gameId.HasValue)
                {
                    winnersByGameId[gameId.Value] = winningTeamId.GetValueOrDefault(-1);
                }
            }

            if (winnersByGameId.Count == 0)
                return null;

            var gameIds = winnersByGameId.Keys.ToList();

            // Pull selections for this year + relevant games
            var selections = await db.GameSelections
                .AsNoTracking()
                .Where(s => s.Year == year && s.LeagueId == LeagueId && gameIds.Contains(s.GameId))
                .Select(s => new { s.User, s.GameId, s.TeamId })
                .ToListAsync();

            // Score users: +1 when their TeamId matches the winner for that GameId
            var pointsByUserId = new Dictionary<int, int>();

            foreach (var s in selections)
            {
                if (!winnersByGameId.TryGetValue(s.GameId, out var winnerTeamId))
                    continue;

                if (s.TeamId != winnerTeamId)
                    continue;

                pointsByUserId.TryGetValue(s.User, out var current);
                pointsByUserId[s.User] = current + 1;
            }

            if (pointsByUserId.Count == 0)
                return null;

            return pointsByUserId;
        }

        public static async Task CalculateTieBreaker(List<Game> games, int year, AppDbContext db, int LeagueId)
        {
            var pointsByUserId = await CalculateScores(games, year, db, LeagueId);

            if (pointsByUserId == null || db.BowlData.Any(b => b.Year == year && b.TieBreakerDate != null && b.LeagueId == LeagueId))
            {
                return;
            }

            // Determine if 2+ users are tied for the lead
            var maxPoints = pointsByUserId.Values.Max();
            var tiedLeaderUserIds = pointsByUserId
                .Where(kvp => kvp.Value == maxPoints)
                .Select(kvp => kvp.Key)
                .ToList();

            var isTieForLead = tiedLeaderUserIds.Count >= 2;

            if (isTieForLead)
            {
                var bowlData = db.BowlData.FirstOrDefault(x => x.Year == year && x.LeagueId == LeagueId);

                if (bowlData != null)
                {
                    bowlData.TieBreakerDate = DateTime.UtcNow;
                    db.BowlData.Update(bowlData);
                    await db.SaveChangesAsync();
                }


                var idHash = tiedLeaderUserIds.ToHashSet();
                var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == LeagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
                var userToSendTo = await db.BBUsers.Where(u => LeagueUsers.Contains(u.Id) && idHash.Contains(u.Id) && u.Inactive != true).ToListAsync();
                SendTieBreakerEmail(userToSendTo);
            }
        }


        public static async Task<bool> SyncData(IConfiguration config, AppDbContext db, ILogger<EasternDynamicScheduledWorker> _logger, List<int> LeagueIds)
        {
            _logger.LogInformation(
                        "Data synced at {currentTime} (UTC).",
                        DateTime.UtcNow
                    );
            var cfbTestClient = new CollegeFootballDataTestHelper(config);
            var cfbClient = new CollegeFootballDataHelper(config);

            var year = SeasonHelper.GetCurrentSeasonYear();
            var gamesTask = cfbClient.GetGamesAsync(year, SeasonType.Postseason);
            var currentGamesTask = cfbTestClient.GetGamesAsync(year, SeasonType.Postseason);

            await Task.WhenAll(gamesTask, currentGamesTask);

            var games = gamesTask.Result;
            var currentGames = currentGamesTask.Result;

            var gamesRemaining = games.Where(g => g.StartDate > DateTime.UtcNow).ToList();

            foreach (int LeagueId in LeagueIds)
            {

                var bowlData = db.BowlData.FirstOrDefault(b => b.Year == year && b.LeagueId == LeagueId);

                if (gamesRemaining.Count == 1 && gamesRemaining.Any(g => g.Notes.IndexOf("National Championship") > -1))
                {
                    _logger.LogInformation("Calculating Tie Breaker");
                    await CalculateTieBreaker(games, year, db, LeagueId);
                }
                else if (gamesRemaining.Count == 0 && games.Any(g => g.Notes.IndexOf("National Championship") > -1))
                {
                    _logger.LogInformation("Set Scores");
                    await SetScores(games, year, db, LeagueId);
                }
                else if (bowlData != null && games.Count > currentGames.Count)
                {
                    _logger.LogInformation("Send new games email");
                    await SendNewGamesEmail(db, games.Count - currentGames.Count, LeagueId);
                }
            }

            JsonFileWriter.WriteToJsonFile(games, "TestData/sampleGameData.json");

            var currentTeamsById = (await cfbTestClient.GetTeamsAsync(year))
                .ToDictionary(t => t.Id);

            var knownTeamIds = currentTeamsById.Keys.ToHashSet();

            var missingTeamIds = games
                .SelectMany(g => new[] { g.HomeId, g.AwayId })
                .Distinct()
                .Where(id => !knownTeamIds.Contains(id))
                .ToList();

            if (missingTeamIds.Count == 0) return true;

            // Bulk fetch (you said this is okay)
            var teamsTask = cfbClient.GetTeamsAsync(year);
            var ranksTask = cfbClient.GetRankingsAsync(year);
            var recordsTask = cfbClient.GetRecordsAsync(year);

            await Task.WhenAll(teamsTask, ranksTask, recordsTask);

            var teams = teamsTask.Result;
            JsonFileWriter.WriteToJsonFile(teams, "TestData/sampleTeamData.json");
            JsonFileWriter.WriteToJsonFile(ranksTask.Result, "TestData/sampleRankingsData.json");
            JsonFileWriter.WriteToJsonFile(recordsTask.Result, "TestData/sampleRecordData.json");

            // Map missing IDs -> canonical names from the fresh teams list
            var teamsById = teams.ToDictionary(t => t.Id);
            var missingTeamNames = missingTeamIds
                .Where(id => teamsById.ContainsKey(id))
                .Select(id => teamsById[id].School /* or .Name */)
                .Distinct()
                .ToList();

            // Fetch metrics once per missing team
            var metricResults = await Task.WhenAll(
                missingTeamNames.Select(teamName => FetchTeamStatsAsync(cfbClient, year, teamName))
            );

            // Fetch matchups for scheduled games that involve a missing team (dedup by pair)
            var matchupPairs = games
                .Where(g => missingTeamIds.Contains(g.HomeId) || missingTeamIds.Contains(g.AwayId))
                .Select(g => (A: g.HomeTeam, B: g.AwayTeam))
                .Distinct()
                .ToList();

            var matchupResults = await Task.WhenAll(
                matchupPairs.Select(p => cfbClient.GetTeamMatchupAsync(year, p.A, p.B))
            );

            var existingMetricData = new SampleData<GameTeamStatsType>().Load("TestData/sampleMetricData.json");
            var existingMatchupData = new SampleData<Matchup>().Load("TestData/sampleMatchupData.json");

            var newMetricData = metricResults
                .Select(x => GameTeamStatsAggregator.AggregateTeamStats(x.Stats, x.Team))
                .ToList();

            // TODO: replace these keys with your real unique properties
            var metricData = existingMetricData
                .Concat(newMetricData)
                .GroupBy(m => m.Team /* or TeamId */)
                .Select(g => g.Last())
                .ToList();

            var matchupData = existingMatchupData
                .Concat(matchupResults)
                .GroupBy(m => (m.Team1, m.Team2, m.StartYear, m.EndYear) /* adjust */)
                .Select(g => g.Last())
                .ToList();

            JsonFileWriter.WriteToJsonFile(metricData, "TestData/sampleMetricData.json");
            JsonFileWriter.WriteToJsonFile(matchupData, "TestData/sampleMatchupData.json");

            _logger.LogInformation(
                        "Data sync completed at {currentTime} (UTC).",
                        DateTime.UtcNow
                    );
            return true;
        }

    }
}
