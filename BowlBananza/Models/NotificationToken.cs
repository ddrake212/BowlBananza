using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BowlBananza.Models
{
    [Table("NotificationTokens")]
    public class NotificationToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        /// <summary>
        /// 'android', 'ios', or 'web'
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Platform { get; set; } = string.Empty;

        /// <summary>
        /// Firebase Cloud Messaging registration token
        /// </summary>
        [Required]
        [MaxLength(512)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        public DateTime? LastSeenUtc { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;
    }
}
