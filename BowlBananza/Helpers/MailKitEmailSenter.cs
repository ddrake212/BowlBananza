using System;
using System.Threading;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace BowlBananza.Helpers
{
    public sealed class MailKitEmailSender
    {
        private readonly SmtpOptions _options;

        public MailKitEmailSender()
        {
            SmtpOptions options = new SmtpOptions
            {
                Host = "smtp.gmail.com",
                Port = 587,
                UseSsl = false,
                Username = "[EMAIL]",
                Password = "[PASSWORD]"
            };
            _options = options ?? throw new ArgumentNullException(nameof(options));
        }

        public async Task<bool> SendHtmlEmailAsync(
            string fromEmail,
            string toEmail,
            string subject,
            string htmlBody,
            string? fromName = null,
            string? plainTextBody = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(fromEmail)) throw new ArgumentException("fromEmail is required", nameof(fromEmail));
            if (string.IsNullOrWhiteSpace(toEmail)) throw new ArgumentException("toEmail is required", nameof(toEmail));
            if (string.IsNullOrWhiteSpace(subject)) throw new ArgumentException("subject is required", nameof(subject));
            if (string.IsNullOrWhiteSpace(htmlBody)) throw new ArgumentException("htmlBody is required", nameof(htmlBody));

            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                fromName ?? string.Empty,
                fromEmail));

            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody,
                TextBody = string.IsNullOrWhiteSpace(plainTextBody)
                    ? StripHtmlToBasicText(htmlBody)
                    : plainTextBody
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                _options.Host,
                _options.Port,
                _options.UseSsl
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTlsWhenAvailable,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.Username))
            {
                await smtp.AuthenticateAsync(
                    _options.Username,
                    _options.Password,
                    cancellationToken);
            }

            await smtp.SendAsync(message, cancellationToken);
            await smtp.DisconnectAsync(true, cancellationToken);

            return true;
        }

        private static string StripHtmlToBasicText(string html)
        {
            return html
                .Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase)
                .Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase)
                .Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase)
                .Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase)
                .Replace("</div>", "\n", StringComparison.OrdinalIgnoreCase)
                .Replace("&nbsp;", " ", StringComparison.OrdinalIgnoreCase);
        }
    }

    public sealed class SmtpOptions
    {
        public string Host { get; init; } = "";
        public int Port { get; init; } = 587;
        public bool UseSsl { get; init; } = false;
        public string? Username { get; init; }
        public string? Password { get; init; }
    }
}
