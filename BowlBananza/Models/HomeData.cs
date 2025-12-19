using BowlBananza.Models.BowlBananza.Data;
using CollegeFootballData.Models;
using System.Collections.Generic;

namespace BowlBananza.Models
{
    public class HomeData
    {
        public List<Game> Games { get; set; }
        public List<User> Users { get; set; }
        public List<GameSelection> UserSelections { get; set; }
        public List<Team> Teams { get; set; }
        public bool IsLocked { get; set; }
        public List<UserPreferences> UserProperties { get; set; }
        public int UserId { get; set; }
    }
}
