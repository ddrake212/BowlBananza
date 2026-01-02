using Azure.Core;
using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using CollegeFootballData;
using CollegeFootballData.Models;
using Mailjet.Client.Resources;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Microsoft.VisualBasic;
using Newtonsoft.Json;
using Org.BouncyCastle.Bcpg;
using Org.BouncyCastle.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommishController : Controller
    {
        private readonly ISyncDataService _syncService;
        private readonly CollegeFootballDataHelper cfbClient;
        private readonly CollegeFootballDataTestHelper cfbClientTest;
        private readonly AppDbContext db;
        private readonly ILogger<EasternDynamicScheduledWorker> _logger;
        private readonly IConfiguration _config;
        public CommishController(ISyncDataService syncService, AppDbContext dbContext, IConfiguration configuration, ILogger<EasternDynamicScheduledWorker> logger)
        {
            _config = configuration;
            db = dbContext;
            _syncService = syncService;
            _logger = logger;

            // Create the API client
            cfbClient = new CollegeFootballDataHelper(configuration);
            cfbClientTest = new CollegeFootballDataTestHelper(configuration);
        }

        private int LeagueId()
        {
            var leagueId = -1;
            int.TryParse(User.FindFirstValue("LeagueId"), out leagueId);
            return leagueId;
        }

        public bool NotAuth()
        {
            int userId = -1;
            int.TryParse(User.FindFirstValue("UserId"), out userId);
            var username = User.FindFirstValue("Email");

            if (userId == -1 || string.IsNullOrEmpty(username))
            {
                return true;
            }
            return false;
        }

        private async Task SendNudgeEmail(List<UserMissingGames> users)
        {
            foreach (var user in users)
            {
                var html = @"
<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Missing Picks Reminder</title>
  </head>

  <body style=""margin:0;padding:0;background:rgb(53,56,66);font-family:Arial,Helvetica,sans-serif;color:#ffffff;"">
    <!-- Preheader (hidden preview text) -->
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      You’ve got upcoming games with no pick yet. Lock them in before kickoff.
    </div>

    <!-- Full-width wrapper -->
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:rgb(53,56,66);padding:26px 12px;"">
      <tr>
        <td align=""center"">
          <!-- Main container -->
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""650"" style=""width:650px;max-width:650px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:#0f1116;"">
            <!-- Header -->
            <tr>
              <td style=""padding:0;position:relative;"">
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
                              Heads up, {{firstName}}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style=""margin-top:12px;font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;"">
                        {{firstName}}, you’re missing a few picks 🏈
                      </div>

                      <div style=""margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.80);"">
                        There are games coming up that you haven’t selected a team for yet.
                        Picks lock at kickoff, so now’s the time to get them in.
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
                <!-- Alert card -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""border-radius:16px;overflow:hidden;border:1px solid rgba(253,99,39,0.25);background:rgba(204,69,32,0.12);"">
                  <tr>
                    <td style=""padding:16px 16px 14px;"">
                      <div style=""font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.78);"">
                        Action needed
                      </div>

                      <div style=""margin-top:8px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.86);"">
                        <span style=""color:rgb(253,99,39);font-weight:900;"">•</span>
                        You have <span style=""font-weight:900;color:#ffffff;"">{{missingPickCount}}</span> upcoming
                        <span style=""font-weight:900;color:#ffffff;"">{{missingPickLabel}}</span> with no pick.
                        <br />
                        <span style=""color:rgb(253,99,39);font-weight:900;"">•</span>
                        Picks lock at kickoff and can’t be changed after.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Optional list of games (render only if you have data) -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:14px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);"">
                  <tr>
                    <td style=""padding:16px 16px 14px;"">
                      <div style=""font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.70);"">
                        Upcoming games without a pick
                      </div>

                      <div style=""margin-top:10px;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.86);"">";

                var gamesHTML = "";
                        foreach(var game in user.MissingGames)
                        {
                            if (gamesHTML != "")
                            {
                                gamesHTML += @"<div style=""height:10px;""></div>";
                            }
                            var gameHtml = @"
                                <div style=""padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.18);"">
                                  <div style=""font-weight:900;color:#ffffff;"">{{game1HomeTeam}} vs {{game1AwayTeam}}</div>
                                  <div style=""margin-top:4px;color:rgba(255,255,255,0.70);font-size:12px;"">
                                    Kickoff: {{game1KickoffEastern}} (ET)
                                  </div>
                                </div>
                            ";
                    var date = TimeZones.GetTime(game.StartDate.GetValueOrDefault(DateTime.UtcNow).DateTime);

                            gamesHTML += gameHtml.Replace("{{game1AwayTeam}}", game.AwayTeam).Replace("{{game1HomeTeam}}", game.HomeTeam).Replace("{{game1KickoffEastern}}", date.ToString("MM/dd/yyyy hh:mm tt"));
                        }
                        html += gamesHTML;
                      html += @"</div>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <div style=""margin-top:16px;"">
                  <a
                    href=""https://www.bowlbananza.com""
                    style=""display:inline-block;background:rgb(253,99,39);color:#0f1116;text-decoration:none;font-weight:900;font-size:14px;padding:12px 16px;border-radius:14px;border:1px solid rgba(0,0,0,0.12);""
                  >
                    Finish My Picks
                  </a>

                  <span style=""display:inline-block;width:10px;""></span>
                </div>

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
                  You’re receiving this email because you’re in this season’s BowlBananza pool.
                  If you already fixed your picks, ignore this and carry on like the champion you are. 😉
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
                var success = await EmailHelper.SendEmail(user.User.Email, "ddrake212@gmail.com", "Bowl Bananza", html.Replace("{{firstName}}", user.User.FirstName).Replace("{{missingPickCount}}", user.MissingGames.Count.ToString()).Replace("{{missingPickLabel}}", user.MissingGames.Count == 1 ? "game" : "games"), "Unfinished Picks!");
            }
        }

        private async Task SendStarterEmail()
        {
            var leagueId = LeagueId();
            var year = SeasonHelper.GetCurrentSeasonYear();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
            var users = db.BBUsers.Where(u => u.Inactive != true && LeagueUsers.Contains(u.Id)).ToList();
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
            if (NotAuth())
            {
                return Unauthorized();
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var BowlData = db.BowlData.First(x => x.Year == year && x.LeagueId == leagueId);
            BowlData.TieBreakerDate = TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZones.Eastern);

            db.BowlData.Update(BowlData);
            await db.SaveChangesAsync();
            return Ok(true);
        }

        [HttpGet("lockData")]
        public async Task<ActionResult<bool>> LockData()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
            var users = db.BBUsers.Where(u => u.Inactive != true && LeagueUsers.Contains(u.Id)).ToList();
            
            var userToLock = db.UserSubmitted.Where(x => x.Year == year && x.LeagueId == leagueId).ToList();
            
            var games = await cfbClientTest.GetGamesAsync(year);
            var gamesSelected = db.GameSelections
                    .Where(g => g.Year == year && g.LeagueId == leagueId)
                    .GroupBy(g => g.User)
                    .ToDictionary(
                        g => g.Key,
                        g => g.ToList()
                    );
            var bowlData = db.BowlData.FirstOrDefault(d => d.Year == year && d.LeagueId == leagueId);
            var startDate = bowlData != null ? bowlData.StartDate : DateTime.UtcNow;
            foreach (var user in users)
            {
                List<GameSelection> gamesToFillforUserList = gamesSelected.ContainsKey(user.Id) ? gamesSelected[user.Id] : null;

                if (gamesToFillforUserList == null)
                {
                    gamesToFillforUserList = new List<GameSelection>();
                }

                var gamesToFillForUser = gamesToFillforUserList.Select(g => g.GameId).ToHashSet();

                var selectionsToAdd = games.Where(g => g.StartDate >= startDate && !gamesToFillForUser.Contains(g.Id.Value)).Select(g => new GameSelection
                {
                    Year = year,
                    User = user.Id,
                    GameId = g.Id.Value,
                    TeamId = -1
                }).ToList();

                db.GameSelections.AddRange(selectionsToAdd);
            }

            bowlData.IsLocked = true;
            db.BowlData.Update(bowlData);

            List<CookieUpdate> updates = new List<CookieUpdate>();
            updates.Add(new CookieUpdate()
            {
                key = "isSubmitted",
                value = "true"
            });
            updates.Add(new CookieUpdate()
            {
                key = "isLocked",
                value = "true"
            });

            await UpdateAuthClaim(HttpContext, updates);


            await db.SaveChangesAsync();
            return Ok(true);
        }

        public static async Task UpdateAuthClaim(
            HttpContext context,
            List<CookieUpdate> updates
        )
        {
            var identity = (ClaimsIdentity)context.User.Identity!;
            var claims = identity.Claims.ToList();

            foreach(var update in updates)
            {
                claims.RemoveAll(c => c.Type == update.key);
                claims.Add(new Claim(update.key, update.value));
            }

            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(claims, "Cookies")
            );

            await context.SignInAsync("Cookies", principal);

            // reflect immediately in this request
            context.User = principal;
        }


        [HttpGet("updateCommish")]
        public async Task<ActionResult<bool>> UpdateCommish(int userId)
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
            int currentCommishId = 0;
            int.TryParse(User.FindFirstValue("UserId"), out currentCommishId);
            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
            var currentCommish = db.BBUsers.FirstOrDefault(x => LeagueUsers.Contains(x.Id) && x.Inactive != true && x.Id == currentCommishId && x.isCom == true);
            if (currentCommish == null)
            {
                return Unauthorized("You are not authorized to perform this action.");
            }
            var newCommish = db.BBUsers.FirstOrDefault(x => LeagueUsers.Contains(x.Id) && x.Id == userId && x.Inactive != true);
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
            if (NotAuth())
            {
                return Unauthorized();
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var bowlData = db.BowlData.FirstOrDefault(x => x.Year == year && x.LeagueId == leagueId);
            
            if(bowlData != null)
            {
                var gameSelections = db.GameSelections.Where(g => g.Year == year && g.TeamId == -1 && g.LeagueId == leagueId).ToList();
                db.GameSelections.RemoveRange(gameSelections);

                bowlData.IsLocked = false;
                db.BowlData.Update(bowlData);
                await db.SaveChangesAsync();
            }
            return Ok(true);
        }

        [HttpGet("nudgeUsers")]
        public async Task<ActionResult<bool>> NudgeUsers()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }

            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
            var users = db.BBUsers.Where(u => LeagueUsers.Contains(u.Id) && u.Inactive != true).ToList();

            var games = await cfbClientTest.GetGamesAsync(year, SeasonType.Postseason);

            // Games that still need picks (future games)
            var pendingGames = games.Where(g => g.StartDate > DateTime.UtcNow).ToList();
            var pendingGameIds = pendingGames.Select(g => g.Id).ToHashSet();

            // Pull selections for only those pending games
            var selectionsByUser = db.GameSelections
                .Where(s => s.Year == year && s.LeagueId == leagueId && pendingGameIds.Contains(s.GameId))
                .GroupBy(s => s.User)
                .ToDictionary(
                    g => g.Key,                               // userId
                    g => g.Select(x => x.GameId).Distinct().ToHashSet()
                );

            // Users missing picks + which games they’re missing
            var usersMissing = users
                .Select(u =>
                {
                    selectionsByUser.TryGetValue(u.Id, out var selectedGameIds);
                    selectedGameIds ??= new HashSet<int>();

                    var missingGameIds = pendingGameIds
                        .Where(gameId => !selectedGameIds.Contains(gameId.Value))
                        .ToList();

                    return new UserMissingGames
                    {
                        User = u,
                        MissingGames = pendingGames.Where(g => missingGameIds.Contains(g.Id)).ToList()
                    };
                })
                .Where(x => x.MissingGames.Count > 0)
                .ToList();

            // If your email function can take the missing games per user:
            await SendNudgeEmail(usersMissing);


            return Ok(true);
        }

        [HttpGet("getData")]
        public async Task<ActionResult<CommishData>> GetData()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
            var year = SeasonHelper.GetCurrentSeasonYear();
            var leagueId = LeagueId();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId && x.Year == year).Select(x => x.UserId).ToHashSet();
            var users = db.BBUsers.Where(u => LeagueUsers.Contains(u.Id) && u.Inactive != true).ToList();
            var dataSynced = db.BowlData.FirstOrDefault(x => x.Year == year && x.LeagueId == leagueId);
            var submittedUsers = db.UserSubmitted.Where(x => x.Year == year && x.LeagueId == leagueId).ToList();
            var isLockedDown = dataSynced != null ? dataSynced.IsLocked.GetValueOrDefault(false) : false;

            var games = await cfbClientTest.GetGamesAsync(year, SeasonType.Postseason);

            var gameIds = games.Where(x => x.StartDate > DateTime.UtcNow).Select(g => g.Id).ToHashSet();
            var totalGames = gameIds.Count;

            // Count how many distinct valid games each user has selected
            var selectedCountsByUser = db.GameSelections
                .Where(s => s.Year == year && s.LeagueId == leagueId && gameIds.Contains(s.GameId))
                .GroupBy(s => s.User)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.GameId).Distinct().Count()
                );

            // Users who are missing at least one pick
            var userIdsMissingPicks = users
                .Any(user => !selectedCountsByUser.TryGetValue(user.Id, out var count) || count < totalGames);

            int userId = 0;
            int.TryParse(User.FindFirstValue("UserId"), out userId);

            CommishData data = new CommishData
            {
                Users = users.Select(x => new CommishUser { UserId = x.Id, UserName = String.Format("{0} {1}", x.FirstName, x.LastName) }).ToList(),
                CanSyncData = dataSynced == null,
                CurrentCommish = userId,
                CanLockDown = !isLockedDown && dataSynced != null,
                CanLoadTieBreak = true,
                CanUnlock = isLockedDown,
                CanForceUpdate = dataSynced != null,
                CanNudgeUsers = userIdsMissingPicks && dataSynced != null
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
            if (NotAuth())
            {
                return Unauthorized();
            }
            List<int> ids = new List<int>();
            ids.Add(LeagueId());
            await DataSyncHelper.SyncData(_config, db, _logger, ids);
            return Ok(true);
        }

        [HttpGet("scheduledSync")]
        public async Task<ActionResult<bool>> ScheduledSync(string v)
        {
            if (v != _config["DataRefreshKey"])
            {
                return Unauthorized();
            }
            var Leagues = db.Leagues.ToList();
            await DataSyncHelper.SyncData(_config, db, _logger, Leagues.Select(l => l.Id).ToList());
            return Ok(true);
        }


        [HttpGet("dataSync")]
        public async Task<ActionResult<bool>> DataSync()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
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
            var leagueId = LeagueId();
            var BowlData = db.BowlData.First(x => x.Year == year && x.LeagueId == leagueId);
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
            if (NotAuth())
            {
                return Unauthorized();
            }
            await _syncService.SyncDataAsync(ct);

            return Ok(true);
        }
    }

    public sealed class UserMissingGames
    {
        public BowlBananza.Models.User User { get; set; } = default!;
        public List<Game> MissingGames { get; set; } = new();
    }

    public class CookieUpdate
    {
        public string key { get; set; }
        public string value { get; set; }
    }
}
