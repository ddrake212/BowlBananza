using BowlBananza.Data;
using BowlBananza.Models;
using BowlBananza.Models.BowlBananza.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.Xml;
using System.Threading.Tasks;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : Controller
    {
        private readonly AppDbContext db;
        public HistoryController(AppDbContext dbContext)
        {
            db = dbContext;
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
        public async Task<ActionResult<Dictionary<int, List<HistoryWithUser>>>> GetData()
        {
            if (NotAuth())
            {
                return Unauthorized();
            }

            var historyData = new List<History>
{
    new History { Id = 1, UserId = 1, Year = 2022, Rank = 1, Points = 145 },
    new History { Id = 2, UserId = 2, Year = 2022, Rank = 2, Points = 132 },
    new History { Id = 3, UserId = 3, Year = 2022, Rank = 3, Points = 118 },
    new History { Id = 4, UserId = 2, Year = 2023, Rank = 1, Points = 158 },
    new History { Id = 5, UserId = 1, Year = 2023, Rank = 2, Points = 149 },
    new History { Id = 6, UserId = 3, Year = 2023, Rank = 3, Points = 121 },
    new History { Id = 7, UserId = 3, Year = 2024, Rank = 1, Points = 162 },
    new History { Id = 8, UserId = 1, Year = 2024, Rank = 2, Points = 150 },
    new History { Id = 9, UserId = 2, Year = 2024, Rank = 3, Points = 142 },
};

            var leagueId = LeagueId();
            var LeagueUsers = db.LeagueUsers.Where(x => x.LeagueId == leagueId).Select(x => x.UserId).ToHashSet();
            var rows = (
                from h in db.History.AsNoTracking().Where(x => LeagueUsers.Contains(x.Id) && x.LeagueId == leagueId)
                join u in db.BBUsers.Where(u => u.Inactive != true).AsNoTracking() on h.UserId equals u.Id
                join p in db.UserPreferences.AsNoTracking().Where(x => x.LeagueId == leagueId) on u.Id equals p.UserId into up
                select new HistoryWithUser
                {
                    Id = h.Id,
                    UserId = h.UserId,
                    Year = h.Year,
                    Rank = h.Rank,
                    Points = h.Points, // include if you added it to the model
                    User = new User
                    {
                        Id = u.Id,
                        FirstName = u.FirstName,
                        LastName = u.LastName
                    },
                    Preferences = up.FirstOrDefault()
                }
            ).ToList();

            // Best (lowest rank) per year, deterministic tie-breaker on Id
            var data = rows
                .GroupBy(x => x.Year)
                .OrderBy(g => g.Key)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(x => x.Rank).ThenBy(x => x.User.FirstName).ThenBy(x => x.User.LastName).ToList()
                );


            return Ok(JsonConvert.SerializeObject(data));
        }
    }

    public class HistoryWithUser : History
    {
        public User User { get; set; }
        public UserPreferences? Preferences { get; set; }
    }
}
