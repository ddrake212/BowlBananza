using System;

namespace BowlBananza.Helpers
{
    public static class SeasonHelper
    {
        public static int GetCurrentSeasonYear()
        {
            var now = DateTime.Now;
            var year = now.Year;

            if (now.Month < 9)
            {
                year--;
            }

            return year;
        }
    }
}
