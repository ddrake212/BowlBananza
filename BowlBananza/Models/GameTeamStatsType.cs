using System.Collections.Generic;

namespace BowlBananza.Models
{
    public class GameTeamStatsType
    {
        public string Team { get; set; } = "";
        public int GamesPlayed { get; set; }

        public int Points { get; set; }
        public int FirstDowns { get; set; }

        public int TotalYards { get; set; }
        public int NetPassingYards { get; set; }
        public int RushingYards { get; set; }
        public int RushingAttempts { get; set; }

        public int PassCompletions { get; set; }
        public int PassAttempts { get; set; }

        public int ThirdDownMade { get; set; }
        public int ThirdDownAttempts { get; set; }
        public int FourthDownMade { get; set; }
        public int FourthDownAttempts { get; set; }

        public int Penalties { get; set; }
        public int PenaltyYards { get; set; }

        public int Turnovers { get; set; }
        public int FumblesLost { get; set; }
        public int InterceptionsThrown { get; set; }

        public int PossessionSeconds { get; set; }

        public int PassesDeflected { get; set; }
        public int QbHurries { get; set; }
        public int Sacks { get; set; }
        public int Tackles { get; set; }
        public int TacklesForLoss { get; set; }
        public int DefensiveTDs { get; set; }

        public int TotalFumbles { get; set; }
        public int FumblesRecovered { get; set; }

        public int InterceptionsMade { get; set; }
        public int InterceptionTDs { get; set; }
        public int InterceptionYards { get; set; }

        public int KickingPoints { get; set; }
        public int KickReturns { get; set; }
        public int KickReturnTDs { get; set; }
        public int KickReturnYards { get; set; }

        public int PuntReturns { get; set; }
        public int PuntReturnTDs { get; set; }
        public int PuntReturnYards { get; set; }

        public int PassingTDs { get; set; }
        public int RushingTDs { get; set; }

        // Derived
        public double YardsPerPass { get; set; }
        public double YardsPerRushAttempt { get; set; }
        public double CompletionPct { get; set; }
        public double ThirdDownPct { get; set; }
        public double FourthDownPct { get; set; }

        // Optional catch-all for categories you didn’t model yet
        public Dictionary<string, string>? UnmappedStats { get; set; }
    }

}
