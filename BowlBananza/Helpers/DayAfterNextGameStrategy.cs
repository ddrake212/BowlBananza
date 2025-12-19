using BowlBananza.Data;
using Microsoft.Extensions.Configuration;
using System;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public interface INextRunStrategy
    {
        Task<DateTimeOffset> GetNextRunEasternAsync(DateTimeOffset nowEastern, AppDbContext db, CancellationToken ct);
    }

    public sealed class DayAfterNextGameStrategy : INextRunStrategy
    {
        private readonly TimeZoneInfo _eastern;
        private readonly TimeSpan _runTimeOfDayEastern; // e.g. 02:00
        private readonly CollegeFootballDataTestHelper cfbClient;

        public DayAfterNextGameStrategy(IConfiguration configuration, TimeSpan runTimeOfDayEastern)
        {
            cfbClient = new CollegeFootballDataTestHelper(configuration);
            _eastern = TimeZones.Eastern;
            _runTimeOfDayEastern = runTimeOfDayEastern;
        }

        private DateTime GetNextOffSeasonDate(DateTimeOffset nowEastern)
        {
            if (nowEastern.Month < 11)
            {
                return new DateTime(nowEastern.Year, 11, 20);
            }
            else
            {
                return nowEastern.Date.AddDays(4);
            }
        }

        public async Task<DateTimeOffset> GetNextRunEasternAsync(DateTimeOffset nowEastern, AppDbContext db, CancellationToken ct)
        {
            var year = SeasonHelper.GetCurrentSeasonYear();

            var bowlData = db.BowlData.FirstOrDefault(x => x.Year == year);

            if (bowlData == null)
            {
                return GetNextOffSeasonDate(nowEastern);
            }

            var games = await cfbClient.GetGamesAsync(year, CollegeFootballData.Models.SeasonType.Postseason);

            var nextGameUtc = games
                .Where(g => g.StartDate > nowEastern)
                .OrderBy(g => g.StartDate)
                .FirstOrDefault();

            if (nextGameUtc is null)
            {
                return GetNextOffSeasonDate(nowEastern);
            }

            var nextGameEastern = nextGameUtc.StartDate.GetValueOrDefault(new DateTime());

            // Schedule: day after the game, at configured ET time
            var targetDateEastern = nextGameEastern.Date;
            if (nextGameEastern.Hour > 6)
            {
                targetDateEastern = targetDateEastern.AddDays(1);
            }

            targetDateEastern = targetDateEastern.AddHours(6);

            return targetDateEastern;

            /*var targetLocal = targetDateEastern + _runTimeOfDayEastern;

            // Convert local Eastern "wall clock" to a DateTimeOffset that respects DST
            // Use TimeZoneInfo to get the correct offset for that local time.
            var unspecified = DateTime.SpecifyKind(targetLocal, DateTimeKind.Unspecified);
            var offset = _eastern.GetUtcOffset(unspecified);
            var targetEastern = new DateTimeOffset(unspecified, offset);

            // If for some reason that's already passed, bump to next day (rare, but safe)
            if (targetEastern <= nowEastern)
            {
                var bumped = targetLocal.AddDays(1);
                var bumpedUnspec = DateTime.SpecifyKind(bumped, DateTimeKind.Unspecified);
                var bumpedOffset = _eastern.GetUtcOffset(bumpedUnspec);
                targetEastern = new DateTimeOffset(bumpedUnspec, bumpedOffset);
            }

            return targetEastern;*/
        }
    }
}
