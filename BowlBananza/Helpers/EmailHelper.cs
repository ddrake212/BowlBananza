using BowlBananza.Models;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Newtonsoft.Json.Linq;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public static class EmailHelper
    {
        public static async Task<bool> SendEmailMessage(string Email, string From, string FromName, string Subject, string Message, byte[] attachment = null, string fileName = "", string ContentType = "")
        {
            bool success = false;

            string code = CreateGUIDCode();

            string Body = Message;
            string Text = "";

            // Setup the email message
            EmailMessage args = new EmailMessage()
            {
                AttachmentData = attachment,
                AttachmentName = fileName,
                FromAddress = From,
                FromName = FromName,
                MessageBodyHtml = Body,
                MessageBodyText = Text,
                Subject = Subject,
                ToAddress = Email
            };

            if (attachment != null)
            {
                success = await SendGridEmailWithAttachment(args, ContentType).ConfigureAwait(false);
            }
            else
            {
                success = await SendGridEmail(args)
                    .ConfigureAwait(false);
            }

            return success;
        }

        public static async Task<bool> SendEmail(string Email, string From, string FromName, string body, string subject, params string[] otherParams)
        {
            bool success = false;

            string code = CreateGUIDCode();

            string Text = StripHtmlToBasicText(body);

            // Setup the email message
            EmailMessage args = new EmailMessage()
            {
                AttachmentData = null,
                FromAddress = From,
                FromName = FromName,
                MessageBodyHtml = body,
                MessageBodyText = Text,
                Subject = subject,
                ToAddress = Email
            };

            success = await SendGridEmail(args)
                .ConfigureAwait(false);

            return success;
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
        public static async Task<bool> SendEmailWithAttachment(string Email, string From, string FromName, string subject, string body, string fileName, string ContentType, byte[] attachment, params string[] otherParams)
        {
            bool success = false;

            string code = CreateGUIDCode();

            string Body = body;
            string Text = StripHtmlToBasicText(body);

            // Setup the email message
            EmailMessage args = new EmailMessage()
            {
                AttachmentData = attachment,
                AttachmentName = fileName,
                FromAddress = From,
                FromName = FromName,
                MessageBodyHtml = Body,
                MessageBodyText = Text,
                Subject = subject,
                ToAddress = Email
            };

            if (attachment != null)
            {
                success = await SendGridEmailWithAttachment(args, ContentType).ConfigureAwait(false);
            }
            else
            {
                success = await SendGridEmail(args)
                    .ConfigureAwait(false);
            }

            return success;
        }

        public static string CreateGUIDCode()
        {
            string code = "";

            for (int i = 0; i < 4; i++)
            {
                code += Guid.NewGuid().ToString().Replace("-", "");
            }

            return code;
        }

        public static async Task<bool> SendGridEmailWithAttachment(EmailMessage mailArgs, string contentType)
        {
            bool success = false;

            MailjetClient client = GetMailJetClient();
            MailjetRequest request = new MailjetRequest
            {
                Resource = Send.Resource,
            }
               .Property(Send.FromEmail, mailArgs.FromAddress)
               .Property(Send.FromName, mailArgs.FromName)
               .Property(Send.Subject, mailArgs.Subject)
               .Property(Send.TextPart, mailArgs.MessageBodyText)
               .Property(Send.HtmlPart, mailArgs.MessageBodyHtml)
               .Property(Send.Recipients, new JArray {
                    new JObject {
                        {"Email", mailArgs.ToAddress}
                    }
                })
               .Property(Send.Attachments, new JArray {
                new JObject {
                 {"Content-type", contentType},
                 {"Filename", mailArgs.AttachmentName},
                 {"content", mailArgs.AttachmentData}
                 }
                });
            MailjetResponse response = await client.PostAsync(request);


            success = response.IsSuccessStatusCode;
            
            return success;
        }

        private static MailjetClient GetMailJetClient()
        {
            return new MailjetClient("dab1eecbccf3fa48e884cf7a1bba1574", "9645e882afe4f04d32adf7b5ab4deab6");
        }

        public static async Task<bool> SendGridEmail(EmailMessage mailArgs)
        {
            bool success = false;
            try
            {
                MailjetClient client = GetMailJetClient();

                MailjetRequest request = new MailjetRequest
                {
                    Resource = SendV31.Resource,
                }
                .Property(Send.Messages, new JArray {
                    new JObject {
                        {
                            "From", new JObject {
                                { "Email", "noreply@bowlbananza.com" },
                                { "Name", mailArgs.FromName }
                            }
                        },
                        {
                            "To", new JArray {
                                new JObject {
                                    { "Email", mailArgs.ToAddress }
                                }
                            }
                        },
                        { "Subject", mailArgs.Subject },
                        { "TextPart", mailArgs.MessageBodyText },
                        { "HTMLPart", mailArgs.MessageBodyHtml }
                    }
                });

                MailjetResponse response = await client.PostAsync(request);

                success = response.IsSuccessStatusCode;
            }
            catch (Exception e)
            {
                int x = 5;
            }
            return success;
        }

        private static EmailAddress ParseAddress(string Address)
        {
            EmailAddress value = null;

            try
            {
                MailAddress email = new MailAddress(Address);
                value = new EmailAddress(email.Address);
            }
            catch (Exception ex) { }

            return value;
        }

        private static List<EmailAddress> ParseAddresses(string Addresses)
        {
            List<EmailAddress> values = null;

            try
            {
                // Allow the built in methods to parse the email addresses
                MailAddressCollection coll = new MailAddressCollection();

                // Split the emails into components and add to the collection
                List<string> emails = SplitEmailAddress(Addresses);
                emails.ForEach(x => coll.Add(x));

                // Return the clean list
                values = coll.Select(x => new EmailAddress(x.Address)).ToList();
            }
            catch { }

            return values;
        }

        public static List<string> SplitEmailAddress(string EmailAddress)
        {
            List<string> values = null;

            if (!string.IsNullOrWhiteSpace(EmailAddress))
            {
                // Make sure we handle semi-colon separated emails
                string normalized = EmailAddress.Replace(";", ",");

                if (!string.IsNullOrWhiteSpace(normalized))
                {
                    // Split accordingly
                    values = normalized.Split(',').ToList();
                }
            }

            return values;
        }
    }
}