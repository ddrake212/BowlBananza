namespace BowlBananza.Models
{
    public class UserSubmitted
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int Year { get; set; }

        public bool Submitted { get; set; }
        public int? LeagueId { get; set; }
    }
}
