// You can tighten these to specific string unions if you know the values.
export type DivisionClassification = string; // e.g. "fbs" | "fcs" | ...
export type SeasonType = string;            // e.g. "regular" | "postseason" | ...

export interface GameInfo {
    Attendance?: number | null;

    AwayClassification?: DivisionClassification | null;
    AwayConference?: string | null;
    AwayId?: number | null;
    AwayLineScores?: (number | null)[] | null;
    AwayPoints?: number | null;
    AwayPostgameElo?: number | null;
    AwayPostgameWinProbability?: number | null;
    AwayPregameElo?: number | null;
    AwayTeam?: string | null;

    Completed?: boolean | null;
    ConferenceGame?: boolean | null;

    ExcitementIndex?: number | null;
    Highlights?: string | null;

    HomeClassification?: DivisionClassification | null;
    HomeConference?: string | null;
    HomeId?: number | null;
    HomeLineScores?: (number | null)[] | null;
    HomePoints?: number | null;
    HomePostgameElo?: number | null;
    HomePostgameWinProbability?: number | null;
    HomePregameElo?: number | null;
    HomeTeam?: string | null;

    Id?: number | null;
    NeutralSite?: boolean | null;
    Notes?: string | null;

    Season?: number | null;
    SeasonType?: SeasonType | null;

    /**
     * In JSON this will usually be an ISO string (e.g. "2025-11-29T18:00:00Z").
     * If you prefer, you can change this to `Date | string | null`.
     */
    StartDate?: string | null;

    StartTimeTBD?: boolean | null;

    Venue?: string | null;
    VenueId?: number | null;
    Week?: number | null;
}

// Expand this if you have the full Venue fields
export interface Venue {
    Name?: string | null;
    City?: string | null;
    State?: string | null;
    Zip?: string | null;
    CountryCode?: string | null;
    Timezone?: string | null;
    Latitude?: number | null;
    Longitude?: number | null;
    Elevation?: number | null;
    Capacity?: number | null;
    Grass?: boolean | null;
    Dome?: boolean | null;
}

export interface TeamInfo {
    Abbreviation?: string | null;
    AlternateColor?: string | null;
    AlternateNames?: string[] | null;
    Classification?: string | null;
    Color?: string | null;
    Conference?: string | null;
    Division?: string | null;
    Id?: number | null;
    Location?: Venue | null;
    Logos?: string[] | null;
    Mascot?: string | null;
    School?: string | null;
    Twitter?: string | null;
}

export interface TeamRecord {
    Games: number;
    Wins: number;
    Losses: number;
    Ties: number;
}

export interface TeamRecords {
    AwayGames: TeamRecord | null;
    Classification: DivisionClassification | null;
    Conference: string | null;
    ConferenceGames: TeamRecord | null;
    Division: string | null;
    ExpectedWins: number | null;
    HomeGames: TeamRecord | null;
    NeutralSiteGames: TeamRecord | null;
    Postseason: TeamRecord | null;
    RegularSeason: TeamRecord | null;
    Team: string | null;
    TeamId: number | null;
    Total: TeamRecord | null;
    Year: number | null;
}

export interface MatchupGame {
    AwayScore: number | null;
    AwayTeam: string | null;
    Date: string | null;        // original C#: string?
    HomeScore: number | null;
    HomeTeam: string | null;
    NeutralSite: boolean | null;
    Season: number | null;
    SeasonType: string | null;
    Venue: string | null;
    Week: number | null;
    Winner: string | null;
}

export interface Matchup {
    WndYear: number | null;
    Games: MatchupGame[] | null;
    StartYear: number | null;
    Team1: string | null;
    Team1Wins: number | null;
    Team2: string | null;
    Team2Wins: number | null;
    Ties: number | null;
}


// Root model
export type TeamSeasonPredictedPointsAdded = {
    Conference?: string;
    Defense?: TeamSeasonPredictedPointsAdded_Defense;
    Offense?: TeamSeasonPredictedPointsAdded_Offense;
    Season?: number;
    Team?: string;
};

// --------------------
// Defense
// --------------------

export type TeamSeasonPredictedPointsAdded_Defense = {
    Cumulative?: TeamSeasonPredictedPointsAdded_Defense_Cumulative;
    FirstDown?: number;
    Overall?: number;
    Passing?: number;
    Rushing?: number;
    SecondDown?: number;
    ThirdDown?: number;
    AdditionalData?: Record<string, unknown>;
};

// Placeholder – definition not included in provided C#
// Add fields here if you have the class later
export type TeamSeasonPredictedPointsAdded_Defense_Cumulative = {
    AdditionalData?: Record<string, unknown>;
};

// --------------------
// Offense
// --------------------

export type TeamSeasonPredictedPointsAdded_Offense = {
    Cumulative?: TeamSeasonPredictedPointsAdded_Offense_Cumulative;
    FirstDown?: number;
    Overall?: number;
    Passing?: number;
    Rushing?: number;
    SecondDown?: number;
    ThirdDown?: number;
    AdditionalData?: Record<string, unknown>;
};

// --------------------
// Offense Cumulative
// --------------------

export type TeamSeasonPredictedPointsAdded_Offense_Cumulative = {
    Passing?: number;
    Rushing?: number;
    Total?: number;
    AdditionalData?: Record<string, unknown>;
};

export class GameTeamStatsType {
    AlternateColor?: string | null;
    Color?: string | null;
    Logos?: string[] | null;
    Mascot?: string | null;

    // Identity
    Team: string = "";
    GamesPlayed: number = 0;

    // Scoring
    Points: number = 0;
    PassingTDs: number = 0;
    RushingTDs: number = 0;
    DefensiveTDs: number = 0;
    KickingPoints: number = 0;

    // First downs & yardage
    FirstDowns: number = 0;
    TotalYards: number = 0;
    NetPassingYards: number = 0;
    RushingYards: number = 0;

    // Passing
    PassCompletions: number = 0;
    PassAttempts: number = 0;
    InterceptionsThrown: number = 0;

    // Rushing
    RushingAttempts: number = 0;

    // Turnovers
    Turnovers: number = 0;
    TotalFumbles: number = 0;
    FumblesLost: number = 0;
    FumblesRecovered: number = 0;

    // Defensive impact
    Sacks: number = 0;
    Tackles: number = 0;
    TacklesForLoss: number = 0;
    QbHurries: number = 0;
    PassesDeflected: number = 0;
    InterceptionsMade: number = 0;
    InterceptionTDs: number = 0;
    InterceptionYards: number = 0;

    // Returns
    KickReturns: number = 0;
    KickReturnYards: number = 0;
    KickReturnTDs: number = 0;

    PuntReturns: number = 0;
    PuntReturnYards: number = 0;
    PuntReturnTDs: number = 0;

    // Penalties
    Penalties: number = 0;
    PenaltyYards: number = 0;

    // Possession
    /**
     * Total possession time in seconds (converted from MM:SS)
     */
    PossessionSeconds: number = 0;

    // Third / Fourth down
    ThirdDownMade: number = 0;
    ThirdDownAttempts: number = 0;

    FourthDownMade: number = 0;
    FourthDownAttempts: number = 0;

    // =====================
    // Derived / Computed
    // =====================

    get CompletionPct(): number {
        return this.PassAttempts > 0
            ? this.PassCompletions / this.PassAttempts
            : 0;
    }

    get YardsPerPass(): number {
        return this.PassAttempts > 0
            ? this.NetPassingYards / this.PassAttempts
            : 0;
    }

    get YardsPerRushAttempt(): number {
        return this.RushingAttempts > 0
            ? this.RushingYards / this.RushingAttempts
            : 0;
    }

    get ThirdDownPct(): number {
        return this.ThirdDownAttempts > 0
            ? this.ThirdDownMade / this.ThirdDownAttempts
            : 0;
    }

    get FourthDownPct(): number {
        return this.FourthDownAttempts > 0
            ? this.FourthDownMade / this.FourthDownAttempts
            : 0;
    }

    // =====================
    // Optional / Debug
    // =====================

    /**
     * Any stat categories returned by CFBD that are not explicitly modeled
     */
    UnmappedStats?: Record<string, string>;
}
