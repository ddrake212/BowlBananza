using Azure.Core;
using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using BowlBananza.Models.BowlBananza.Data;
using CollegeFootballData;
using CollegeFootballData.Models;
using Mailjet.Client.Resources;
using MailKit.Search;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : Controller
    {
        private readonly ISyncDataService _syncService;
        private readonly CollegeFootballDataHelper cfbClient;
        private readonly AppDbContext db;
        private readonly IConfiguration _config;
        public SettingsController(ISyncDataService syncService, AppDbContext dbContext, IConfiguration configuration)
        {
            _config = configuration;
            db = dbContext;
            _syncService = syncService;

            // Create the API client
            cfbClient = new CollegeFootballDataHelper(configuration);
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

        [HttpGet("getData")]
        public async Task<ActionResult<SettingsData>> GetData()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
            var data = new SettingsData();

            int userId = -1;
            int.TryParse(User.FindFirstValue("UserId"), out userId);
            var leagueId = LeagueId();
            var prefs = await db.UserPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LeagueId == leagueId);

            if (prefs != null)
            {
                data.Color = prefs.Color;
                data.ImageBase64 = prefs.Image;
                data.OriginalImageBase64 = prefs.OriginalImage;
                data.Zoom = prefs.Zoom;
                data.Cropy = prefs.Cropy;
                data.Cropx = prefs.Cropx;
            }

            return Ok(JsonConvert.SerializeObject(data));
        }

        [HttpPost("savePreferences")]
        public async Task<ActionResult> SavePreferencesAsync([FromBody] SettingsData data)
        {
            if (NotAuth())
            {
                return Unauthorized();
            }
            var color = data.Color;
            var imageBase64 = data.ImageBase64;
            var originalImageBase64 = data.OriginalImageBase64;
            int userId = -1;
            int.TryParse(User.FindFirstValue("UserId"), out userId);
            var leagueId = LeagueId();
            var prefs = await db.UserPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LeagueId == leagueId);

            if (prefs == null)
            {
                prefs = new UserPreferences
                {
                    UserId = userId,
                    Color = color,
                    Image = imageBase64,
                    OriginalImage = originalImageBase64,
                    Zoom = data.Zoom,
                    Cropx = data.Cropx,
                    Cropy = data.Cropy,
                    LeagueId = leagueId
                };

                db.UserPreferences.Add(prefs);
            }
            else
            {
                prefs.Color = color;
                prefs.Image = imageBase64;
                prefs.OriginalImage = originalImageBase64;
                prefs.Zoom = data.Zoom;
                prefs.Cropy = data.Cropy;
                prefs.Cropx = data.Cropx;
                db.UserPreferences.Update(prefs);
            }

            await db.SaveChangesAsync();
            return Ok();
        }
    }

    public class SettingsData
    {
        public string Color { get; set; }
        public string ImageBase64 { get; set; }
        public string OriginalImageBase64 { get; set; }
        public decimal? Zoom { get; set; }
        public decimal? Cropx { get; set; }
        public decimal? Cropy { get; set; }
    }
}
