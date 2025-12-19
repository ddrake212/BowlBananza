namespace BowlBananza.Models
{
    public class GameSelection
    {
        public int Id { get; set; }        // Primary key
        public int Year { get; set; }
        public int User { get; set; }      // Consider renaming to UserId if desired
        public int GameId { get; set; }
        public int TeamId { get; set; }
    }

}
