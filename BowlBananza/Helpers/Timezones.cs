using System;

namespace BowlBananza.Helpers
{
    public static class TimeZones
    {
        public static TimeZoneInfo Eastern
        {
            get
            {
                try
                {
                    // Windows
                    return TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Linux / macOS
                    return TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
                }
            }
        }

        public static DateTime GetTime(DateTime date)
        {
            return TimeZoneInfo.ConvertTime(date.ToUniversalTime(), Eastern);
        }
    }
}
