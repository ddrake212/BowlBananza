using System.Collections.Generic;

namespace BowlBananza.Models
{
    public class CommishData
    {
        public List<CommishUser> Users { get; set; }
        public bool CanSyncData { get; set; }
        public int CurrentCommish { get; set; }
        public bool CanLockDown { get; set; }
        public bool CanLoadTieBreak { get; set; }
        public bool CanUnlock { get; set; }
        public bool CanForceUpdate { get; set; }
        public bool CanNudgeUsers { get; set; }
    }

    public class CommishUser
    {
        public string UserName { get; set; }
        public int UserId { get; set; }
    }
}
