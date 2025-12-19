namespace BowlBananza.Models
{
    public class History
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int Year { get; set; }
        public int Rank { get; set; }
        public int? Points { get; set; }
    }
}
