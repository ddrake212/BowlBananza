using BowlBananza.Models;
using BowlBananza.Models.BowlBananza.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace BowlBananza.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> BBUsers => Set<User>();
        public DbSet<BowlData> BowlData => Set<BowlData>();
        public DbSet<GameSelection> GameSelections => Set<GameSelection>();
        public DbSet<UserSubmitted> UserSubmitted => Set<UserSubmitted>();
        public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();
        public DbSet<History> History => Set<History>();
        public DbSet<ForgotPW> ForgotPW => Set<ForgotPW>();
    }
}
