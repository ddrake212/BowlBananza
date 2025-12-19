using System;

namespace BowlBananza.Models
{
    public class ForgotPW
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        // Matches SQL UNIQUEIDENTIFIER
        public Guid Key { get; set; }

        // Matches SQL DATETIME2
        public DateTime ExpirationDate { get; set; }
    }
}
