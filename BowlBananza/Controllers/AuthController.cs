using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using BowlBananza.Services;
using Mailjet.Client.Resources;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using Org.BouncyCastle.Crypto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly AppDbContext db;

        public AuthController(AuthService authService, AppDbContext dbContext)
        {
            _authService = authService;
            db = dbContext;
        }

        [HttpGet("changepw")]
        public async Task<IActionResult> ChangePW(string pw, int userId, string key)
        {
            var success = await _authService.UpdatePassword(pw, userId);
            return Ok(success);
        }

        [HttpGet("checkchagepw")]
        public async Task<ActionResult<int>> CheckChangePW(string key)
        {
            var keyGuid = Guid.Parse(key);
            var request = db.ForgotPW.FirstOrDefault(r => r.Key == keyGuid);
            if (request == null || request.ExpirationDate <= DateTime.UtcNow)
            {
                return BadRequest("Request has expired");
            }

            return Ok(request.UserId);
        }

        [HttpGet("forgotpw")]
        public async Task<IActionResult> ForgotPW(string email)
        {
            var user = db.BBUsers.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());

            if (user == null)
            {
                return BadRequest("Invalid email.");
            }

            var currentRequest = db.ForgotPW.Where(r => r.UserId == user.Id).ToList();

            var guid = Guid.NewGuid();

            var newFPWRequest = new ForgotPW
            {
                UserId = user.Id,
                Key = guid,
                ExpirationDate = DateTime.UtcNow.AddDays(1)
            };

            db.ForgotPW.RemoveRange(currentRequest);
            db.ForgotPW.Add(newFPWRequest);

            await db.SaveChangesAsync();

            var html = @"
<!doctype html>
<html lang=""en"">
  <head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Password Reset Request</title>
  </head>

  <body style=""margin:0;padding:0;background:rgb(53,56,66);font-family:Arial,Helvetica,sans-serif;color:#ffffff;"">
    <!-- Preheader (hidden preview text) -->
    <div style=""display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"">
      Reset your BowlBananza password. This link expires soon.
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
                              Password Reset
                            </div>
                          </td>
                        </tr>
                      </table>

                      <div style=""margin-top:12px;font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;"">
                        {{firstName}}, reset your password 🔐
                      </div>

                      <div style=""margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.80);"">
                        We received a request to reset your BowlBananza password.
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
                        Click the button below to create a new password. This link will expire for security reasons.
                      </div>

                      <div style=""margin-top:10px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.70);"">
                        If you didn’t request a password reset, you can safely ignore this email.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <div style=""margin-top:16px;"">
                  <a
                    href=""https://www.bowlbananza.com/changepw?key={{resetLink}}""
                    style=""display:inline-block;background:rgb(253,99,39);color:#0f1116;text-decoration:none;font-weight:900;font-size:14px;padding:12px 16px;border-radius:14px;border:1px solid rgba(0,0,0,0.12);""
                  >
                    Reset My Password
                  </a>
                </div>

                <!-- Security notice -->
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-top:16px;border-radius:16px;overflow:hidden;border:1px solid rgba(253,99,39,0.25);background:rgba(204,69,32,0.12);"">
                  <tr>
                    <td style=""padding:14px 14px;"">
                      <div style=""font-size:14px;font-weight:900;color:#ffffff;"">
                        Security reminder
                      </div>
                      <div style=""margin-top:6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.82);"">
                        This password reset link expires in <strong>24 hours</strong>. After that, you’ll need to request a new one.
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Fallback link -->
                <div style=""margin-top:14px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.65);"">
                  If the button doesn’t work, copy and paste this link into your browser:<br />
                  <span style=""word-break:break-all;color:rgba(255,255,255,0.85);"">
                    https://www.bowlbananza.com/changepw?key={{resetLink}}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style=""padding:16px 18px;background:#0b0d11;border-top:1px solid rgba(255,255,255,0.08);"">
                <div style=""font-size:11px;line-height:1.55;color:rgba(255,255,255,0.55);"">
                  You’re receiving this email because a password reset was requested for your BowlBananza account.
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

            var Success = await EmailHelper.SendEmail(user.Email, "ddrake212@gmail.com", "Bowl Bananza", html.Replace("{{firstName}}", user.FirstName).Replace("{{resetLink}}", guid.ToString()), "Reset Password");

            return Ok(new
            {
                Success
            });
        }

        private async Task SetCookies(BowlBananza.Models.User user)
        {
            var leagues = await _authService.GetLeagues(user.Id);
            var league = leagues.FirstOrDefault(-1);
            var isSubmitted = await _authService.IsUserSubmitted(user.Id, league);
            var bowlData = await _authService.GetBowlData(league);
            var permissionRequired = await _authService.GetNotificationPermissionRequired(user.Id);


            var isLocked = bowlData != null ? bowlData.IsLocked.GetValueOrDefault(false) : false;

            var claims = new List<Claim>
            {
                new Claim("UserId", user.Id.ToString()),
                new Claim("Email", user.Email),
                new Claim("isCom", user.isCom.HasValue && user.isCom.Value ? "true" : "false"),
                new Claim("isSubmitted", isSubmitted ? "true" : "false"),
                new Claim("isLocked", isLocked ? "true" : "false"),
                new Claim("isBowlActive", bowlData != null ? "true" : "false"),
                new Claim("isInactive", user.Inactive.GetValueOrDefault(false) ? "true" : "false"),
                new Claim("LeagueId", league.ToString()),
                new Claim("permissionRequired", permissionRequired ? "true" : "false")
            };

            var identity = new ClaimsIdentity(claims, "Cookies");
            var principal = new ClaimsPrincipal(identity);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true, // survives browser close
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(14000),
                AllowRefresh = true,
                IssuedUtc = DateTimeOffset.UtcNow,
                RedirectUri = "/"
            };

            await HttpContext.SignInAsync(
                "Cookies",
                principal,
                authProperties
            );

        }

        [HttpGet("applogin")]
        public async Task<IActionResult> AppLogin(string userName)
        {
            var user = await _authService.ValidateAppLoginAsync(userName);
            if (user == null)
            {
                return Unauthorized("Invalid username or password.");
            }

            await SetCookies(user);

            return Ok(new
            {
                user.Id,
                user.Username
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("Invalid request.");
            }

            var user = await _authService.ValidateLoginAsync(request.Username, request.Password);
            if (user == null)
            {
                return Unauthorized("Invalid username or password.");
            }

            await SetCookies(user);

            return Ok(new
            {
                user.Id,
                user.Username
            });
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("Cookies");
            return Ok("Logged out.");
        }

        // GET: api/auth/me
        [HttpGet("me")]
        public IActionResult Me()
        {
            int userId = -1;
            int.TryParse(User.FindFirstValue("UserId"), out userId);
            var username = User.FindFirstValue("Email");
            var isCommish = User.FindFirstValue("isCom");
            var isSubmitted = User.FindFirstValue("isSubmitted");
            var isLocked = User.FindFirstValue("isLocked");
            var isBowlActive = User.FindFirstValue("isBowlActive");
            var isInactive = User.FindFirstValue("isInactive");
            var permissionRequired = User.FindFirstValue("permissionRequired");

            if (userId == -1 || string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            return Ok(new
            {
                UserId = userId,
                Username = username,
                IsCommish = isCommish == "true",
                isSubmitted = isSubmitted == "true",
                isLocked = isLocked == "true",
                isInactive = isInactive == "true",
                isBowlActive = isBowlActive == "true",
                permissionRequired = permissionRequired == "true"
            });
        }

        [HttpPost("logNotificationKey")]
        public async Task<IActionResult> LogNotificationKey(string key, string platform)
        {
            int userId = -1;
            int.TryParse(User.FindFirstValue("UserId"), out userId);
            var notificationToken = db.NotificationTokens.FirstOrDefault(n => n.UserId == userId && n.Platform == platform);
            if (notificationToken == null)
            {
                notificationToken = new NotificationToken()
                {
                    UserId = userId,
                    Token = key,
                    Platform = platform,
                    CreatedUtc = DateTime.UtcNow,
                    IsActive = true
                };
                db.NotificationTokens.Add(notificationToken);
            } else
            {
                notificationToken.Token = key;
                notificationToken.Platform = platform;
                notificationToken.LastSeenUtc = DateTime.UtcNow;
                notificationToken.IsActive = true;
                db.NotificationTokens.Update(notificationToken);
            }
            db.SaveChanges();

            var identity = (ClaimsIdentity)HttpContext.User.Identity!;
            var claims = identity.Claims.ToList();

            claims.RemoveAll(c => c.Type == "permissionRequired");
            claims.Add(new Claim("permissionRequired", "false"));

            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(claims, "Cookies")
            );

            await HttpContext.SignInAsync("Cookies", principal);

            // reflect immediately in this request
            HttpContext.User = principal;

            return Ok();
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] BowlBananza.Models.User request)
        {
            if ((string.IsNullOrWhiteSpace(request.Username) && string.IsNullOrWhiteSpace(request.Email)) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Invalid input");
            }

            var userCheck = await _authService.CheckUserAsync(request.Email);

            if (userCheck != null)
            {
                return BadRequest("User already registered");
            }

            var user = await _authService.AddUser(request);

            return Ok(new
            {
                user.Id,
                username = user.Username,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email
            });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Unauthorized("Missing email.");
            }

            var user = await _authService.CheckUserAsync(request.Email);

            if (user == null)
            {
                // IMPORTANT: return failure instead of creating user
                return NotFound("User does not exist.");
            }

            await SetCookies(user);

            return Ok(new
            {
                userId = user.Id,
                username = user.Username
            });
        }
    }

    public class GoogleLoginRequest
    {
        public string Email { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string GoogleId { get; set; } = "";
    }

    // Simple DTO for login requests
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
