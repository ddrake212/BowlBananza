using System;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public interface ISyncDataService
    {
        Task SyncDataAsync(CancellationToken ct);
    }

    public sealed class SyncDataService : ISyncDataService
    {
        public async Task SyncDataAsync(CancellationToken ct)
        {
            var sender = new MailKitEmailSender();

            var html = """
<h1 style='color: green;'>Welcome To Scheduled Stuff!${date}</h1>
<p>This is an <b>HTML</b> email.</p>
""";

            var utcNow = DateTime.UtcNow;

            var eastern = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); // Windows
            var easternTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, eastern);

            var success = await EmailHelper.SendEmail("ddrake212@gmail.com", "ddrake212@gmail.com", "Bowl Bananza", html.Replace("${date}", easternTime.ToString()), "Test Email");

            /*var success = await sender.SendHtmlEmailAsync(
                fromEmail: "BowlBananza@gmail.com",
                toEmail: "ddrake212@gmail.com",
                subject: "Test HTML Email",
                htmlBody: html.Replace("${date}", DateTime.Now.ToString()),
                fromName: "Bowl Bananza"
            );*/

            await Task.CompletedTask;
        }
    }
}
