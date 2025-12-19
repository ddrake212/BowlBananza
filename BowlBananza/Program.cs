using BowlBananza.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using Serilog;
using Serilog.Events;

namespace BowlBananza
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Build Serilog early so startup failures are captured too.
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.File(
                    path: "Logs/MyLogs/bowlbananza-.log",
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 14,
                    shared: true,
                    flushToDiskInterval: TimeSpan.FromSeconds(2))
                .CreateLogger();

            try
            {
                Log.Information("Starting BowlBananza host");
                CreateHostBuilder(args).Build().Run();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Host terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                // Use Serilog for Microsoft ILogger<T>
                .UseSerilog((context, services, loggerConfig) =>
                {
                    loggerConfig
                        .ReadFrom.Configuration(context.Configuration) // optional: respects appsettings overrides
                        .ReadFrom.Services(services)
                        .Enrich.FromLogContext()
                        .MinimumLevel.Information()
                        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                        .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                        .WriteTo.Console()
                        .WriteTo.File(
                            path: "Logs/MyLogs/bowlbananza-.log",
                            rollingInterval: RollingInterval.Day,
                            retainedFileCountLimit: 14,
                            shared: true,
                            flushToDiskInterval: TimeSpan.FromSeconds(2));
                })
                .ConfigureServices((context, services) =>
                {
                    services.AddSingleton(TimeProvider.System);

                    // Your existing schedule calculation (kept as-is)
                    var period = TimeSpan.FromSeconds(30);

                    var eastern = TimeZones.Eastern;
                    var nowUtc = TimeProvider.System.GetUtcNow();
                    var nowEastern = TimeZoneInfo.ConvertTime(nowUtc, eastern);
                    var startAtEastern = nowEastern.AddSeconds(10);

                    // If you meant to register your scheduler here, do it here too:
                    // services.AddHostedService<EasternDynamicScheduledWorker>();
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
