using Azure.Core;
using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using BowlBananza.Models.BowlBananza.Data;
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
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HomeController : Controller
    {
        private readonly CollegeFootballDataTestHelper cfbClient;
        private readonly AppDbContext db;
        public HomeController(AppDbContext dbContext, IConfiguration configuration)
        {
            db = dbContext;

            // Create the API client
            cfbClient = new CollegeFootballDataTestHelper(configuration);
        }

        [HttpGet("userprops")]
        [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, NoStore = false)]
        public async Task<ActionResult<List<UserPropsDto>>> UserProps()
        {
            var userProps = await db.UserPreferences
                .AsNoTracking()
                .Select(p => new UserPropsDto
                {
                    UserId = p.UserId,
                    Color = p.Color,
                    // If you want to keep Image out entirely, set to null and omit from DTO
                    Image = p.Image
                })
                .ToListAsync();

            return Ok(userProps); // ✅ no JsonConvert
        }


        [HttpGet("getData")]
        public async Task<ActionResult<HomeData>> GetData()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var games = cfbClient.GetGamesAsync(year, SeasonType.Postseason);
            var users = db.BBUsers.Where(u => u.Inactive != true).ToList();
            var userSelections = db.GameSelections.Where(x => x.Year == year).ToList();
            var teams = cfbClient.GetTeamsAsync(year);
            var locked = await db.BowlData.FirstOrDefaultAsync(u =>
                u.IsLocked == true
                && u.Year == year
            );
            await Task.WhenAll(games, teams);

            var BowlData = db.BowlData.FirstOrDefault(x => x.Year == year);

            var data = new HomeData();

            if (BowlData == null)
            {
                return Ok(JsonConvert.SerializeObject(data));
            }
        
            data.Games = games.Result.Where(g => g.StartDate >= BowlData.StartDate)
                .OrderBy(g => g.StartDate)
                .ToList();

            var UserId = HttpContext.Session.GetInt32("UserId").GetValueOrDefault(1);
            data.Users = users
                .Select(u => new Models.User
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName
                })
                .OrderByDescending(u => u.Id == UserId)
                .ToList();

            var uProps = new List<UserPreferences>();// db.UserPreferences.ToList();

            data.UserSelections = userSelections;
            data.Teams = teams.Result;
            data.Teams.ForEach(t =>
            {
                if (t.AlternateColor == "#null")
                {
                    t.AlternateColor = null;
                }
                if (t.Color == "#null")
                {
                    t.Color = null;
                }
            });
            data.IsLocked = locked != null;
            data.UserProperties = uProps;
            data.UserId = UserId;

            return Ok(JsonConvert.SerializeObject(data));
        }
    }

    public sealed class UserPropsDto
    {
        public int UserId { get; set; }
        public string? Color { get; set; }
        public string? Image { get; set; } // optional: see note below
    }

}
