using CFBSharp.Model;
using System.Collections.Generic;
using BowlBananza.Controllers;

namespace BowlBananza.Models
{
    public class TeamInfo
    {
        public List<TeamRecord> Record { get; set; }
        public List<AdvancedSeasonStat> AdvStats { get; set; }
        public List<TeamSeasonStat> Stats { get; set; }
        public List<PregameWP> WinProb { get; set; }
        public List<TeamPPA> PPA { get; set; }
    }
}
