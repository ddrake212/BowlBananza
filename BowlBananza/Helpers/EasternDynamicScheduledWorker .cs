using BowlBananza.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public class EasternDynamicScheduledWorker : BackgroundService
    {
        private readonly ILogger<EasternDynamicScheduledWorker> _logger;
        private readonly TimeProvider _time;
        private readonly TimeZoneInfo _eastern;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;

        public EasternDynamicScheduledWorker(
            ILogger<EasternDynamicScheduledWorker> logger,
            TimeProvider timeProvider,
            IConfiguration config,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _time = timeProvider;
            _scopeFactory = scopeFactory;
            _eastern = TimeZones.Eastern;
            _config = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var nowUtc = _time.GetUtcNow();
                    var nowEastern = TimeZoneInfo.ConvertTime(nowUtc, _eastern);

                    DateTimeOffset? nextRunEastern;

                    // Scope: compute next run
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var strategy = scope.ServiceProvider.GetRequiredService<INextRunStrategy>();
                        nextRunEastern = TimeZoneInfo.ConvertTime((await strategy.GetNextRunEasternAsync(nowEastern, dbContext, stoppingToken)).ToUniversalTime(),_eastern);
                    }

                    if (nextRunEastern is null)
                    {
                        _logger.LogInformation("No more upcoming games found. Scheduler stopping.");
                        return;
                    }

                    var delay = nextRunEastern.Value - nowEastern;

                    // Enforce minimum delay of 1 day
                    if (delay < TimeSpan.FromDays(1))
                    {
                        delay = TimeSpan.FromDays(1);
                    }

                    _logger.LogInformation(
                        "Next run scheduled for {NextRun} (ET) in {Delay}.",
                        nextRunEastern,
                        delay
                    );

                    await Task.Delay(delay, stoppingToken);


                    // Scope: run the job
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        // If you still need this helper, pass the scoped db
                        await DataSyncHelper.SyncData(_config, db);

                        var sync = scope.ServiceProvider.GetRequiredService<ISyncDataService>();
                        await sync.SyncDataAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scheduler error. Retrying in 60 seconds.");
                    await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
                }
            }
        }
    }
}
