using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BowlBananza.Models
{

    namespace BowlBananza.Data
    {
        [Table("UserPreferences")]
        public class UserPreferences
        {
            [Key]
            public int Id { get; set; }

            [Required]
            public int UserId { get; set; }

            [MaxLength(20)]
            public string? Color { get; set; }

            // Base64 string (e.g. "data:image/png;base64,...")
            public string? Image { get; set; }

            public string? OriginalImage { get; set; }
            public decimal? Zoom { get; set; }
            public decimal? Cropx { get; set; }
            public decimal? Cropy { get; set; }

            // Optional navigation property if you have a Users table
            // public User User { get; set; }
        }
    }

}
