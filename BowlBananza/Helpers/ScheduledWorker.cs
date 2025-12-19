using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public class ScheduledWorker : BackgroundService
    {
        private readonly ILogger<ScheduledWorker> _logger;
        private readonly TimeProvider _timeProvider;
        private readonly TimeZoneInfo _eastern;
        private readonly TimeSpan _period;
        private readonly DateTimeOffset? _startAtEastern;
        private readonly ISyncDataService _syncService;

        public ScheduledWorker(
            ILogger<ScheduledWorker> logger,
            TimeProvider timeProvider,
            ISyncDataService syncService,
            TimeSpan period,
            DateTimeOffset? startAtEastern = null)
        {
            _logger = logger;
            _timeProvider = timeProvider;
            _syncService = syncService;
            _period = period;
            _startAtEastern = startAtEastern;
            _eastern = TimeZones.Eastern;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (_startAtEastern.HasValue)
            {
                var delay = GetDelayUntilEastern(_startAtEastern.Value);
                if (delay > TimeSpan.Zero)
                {
                    _logger.LogInformation(
                        "Waiting {Delay} until first run at {EasternTime} (ET)",
                        delay,
                        _startAtEastern);

                    await Task.Delay(delay, stoppingToken);
                }
            }

            using var timer = new PeriodicTimer(_period);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _syncService.SyncDataAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scheduled sync failed");
                }

                await timer.WaitForNextTickAsync(stoppingToken);
            }
        }

        private TimeSpan GetDelayUntilEastern(DateTimeOffset targetEastern)
        {
            var nowUtc = _timeProvider.GetUtcNow();
            var nowEastern = TimeZoneInfo.ConvertTime(nowUtc, _eastern);
            var delay = targetEastern - nowEastern;
            return delay < TimeSpan.Zero ? TimeSpan.Zero : delay;
        }
    }
}
