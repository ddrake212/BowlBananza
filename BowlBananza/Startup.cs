using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Linq;

namespace BowlBananza
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // ✅ Response compression (gzip/br when supported by client)
            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;

                // Ensure JSON is compressible (usually included already, but explicit is fine)
                options.MimeTypes = ResponseCompressionDefaults.MimeTypes
                    .Concat(new[] { "application/json" });
            });

            services.AddControllersWithViews();

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"))
            );

            services.AddScoped<ISyncDataService, SyncDataService>();

            services.AddSingleton(TimeProvider.System);

            services.AddScoped<INextRunStrategy>(sp =>
                new DayAfterNextGameStrategy(
                    Configuration,
                    runTimeOfDayEastern: TimeSpan.FromHours(2)
                )
            );

            var schedulerEnabled = Configuration.GetValue<bool>("Scheduler:Enabled");
            if (schedulerEnabled)
            {
                services.AddHostedService<EasternDynamicScheduledWorker>();
            }

            services.AddDistributedMemoryCache();
            services.AddSession(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });

            services.AddScoped<AuthService>();

            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/build";
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            // ✅ Enable compression early so it applies to API responses
            app.UseResponseCompression();

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            app.UseSession();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }
    }
}
