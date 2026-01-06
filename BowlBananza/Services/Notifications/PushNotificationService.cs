using BowlBananza.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace BowlBananza.Services.Notifications
{
    public sealed class PushNotificationService
    {
        private readonly AppDbContext _db;
        private readonly FcmSender _fcm;

        public PushNotificationService(AppDbContext db, FcmSender fcm)
        {
            _db = db;
            _fcm = fcm;
        }

        /// <summary>
        /// Sends a push notification to all active device tokens for a user.
        /// Data-only payload; your firebase-messaging-sw.js renders + handles click.
        /// </summary>
        public async Task<PushSendSummary> SendToUserAsync(
            List<int> userIds,
            string title,
            string body,
            string url = "",
            string iconPath = "/favIcon.png",
            string badgePath = "/pushBadge.png",
            Dictionary<string, string>? extraData = null)
        {
            var idTable = userIds.ToHashSet();
            var tokens = await _db.NotificationTokens
                .Where(x => idTable.Contains(x.UserId) && x.IsActive)
                .OrderByDescending(x => x.Id)
                .Select(x => new { x.Id, x.Token })
                .ToListAsync();

            if (tokens.Count == 0)
                return new PushSendSummary(userIds.FirstOrDefault(), Attempted: 0, Succeeded: 0, Failed: 0, Deactivated: 0);

            var attempted = 0;
            var succeeded = 0;
            var failed = 0;
            var deactivated = 0;

            foreach (var t in tokens)
            {
                attempted++;

                var data = new Dictionary<string, string>
                {
                    ["title"] = title,
                    ["body"] = body,
                    ["url"] = $"?nt={url}",               // keep relative for PWA open-in-app
                    ["icon"] = iconPath,
                    ["badge"] = badgePath
                };

                if (extraData != null)
                {
                    foreach (var kv in extraData)
                        data[kv.Key] = kv.Value;
                }

                var payload = new FcmSendRequest
                {
                    Message = new FcmMessage
                    {
                        Token = t.Token,
                        Notification = null,
                        Webpush = null,
                        Data = data
                    }
                };

                var (ok, statusCode, rawBody) = await _fcm.SendAsync(payload);

                if (ok)
                {
                    succeeded++;
                    continue;
                }

                failed++;

                // Optional: deactivate dead tokens so you stop spamming FCM with junk
                if (IsDeadTokenResponse(statusCode, rawBody))
                {
                    var entity = await _db.NotificationTokens.FindAsync(t.Id);
                    if (entity != null)
                    {
                        entity.IsActive = false;
                        deactivated++;
                    }
                }
            }

            if (deactivated > 0)
                await _db.SaveChangesAsync();

            return new PushSendSummary(userIds.FirstOrDefault(), attempted, succeeded, failed, deactivated);
        }

        private static bool IsDeadTokenResponse(int? statusCode, string rawBody)
        {
            // Common FCM v1 invalid token signals:
            // - 404 + UNREGISTERED
            // - 400 + INVALID_ARGUMENT
            if (statusCode is null) return false;

            if (statusCode == 404 && rawBody.Contains("UNREGISTERED", StringComparison.OrdinalIgnoreCase))
                return true;

            if (statusCode == 400 && rawBody.Contains("INVALID_ARGUMENT", StringComparison.OrdinalIgnoreCase))
                return true;

            // Sometimes status is only in "status": "NOT_FOUND" etc.
            // Keep conservative to avoid disabling good tokens.
            return false;
        }
    }

    public sealed record PushSendSummary(int UserId, int Attempted, int Succeeded, int Failed, int Deactivated);
}
