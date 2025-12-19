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
using System.Threading;
using System.Threading.Tasks;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("[controller]")]
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

        [HttpGet("getData")]
        public async Task<ActionResult<SettingsData>> GetData()
        {
            var data = new SettingsData();

            var userId = HttpContext.Session.GetInt32("UserId");
            var prefs = await db.UserPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

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
        public async Task SavePreferencesAsync([FromBody] SettingsData data)
        {
            var color = data.Color;
            var imageBase64 = data.ImageBase64;
            var originalImageBase64 = data.OriginalImageBase64;
            var userId = HttpContext.Session.GetInt32("UserId");
            var prefs = await db.UserPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (prefs == null)
            {
                prefs = new UserPreferences
                {
                    UserId = userId.GetValueOrDefault(-1),
                    Color = color,
                    Image = imageBase64,
                    OriginalImage = originalImageBase64,
                    Zoom = data.Zoom,
                    Cropx = data.Cropx,
                    Cropy = data.Cropy
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
