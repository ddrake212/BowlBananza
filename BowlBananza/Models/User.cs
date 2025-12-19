namespace BowlBananza.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; } = "";
        public string Password { get; set; } = ""; // (store hashed ideally, plain is ok for family testing but ill hash it below)
        public string Email { get; set; }
        public bool? isCom { get; set; }
        public bool? Inactive { get; set; }
    }
}
