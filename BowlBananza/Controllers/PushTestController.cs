using BowlBananza.Data;
using BowlBananza.Services.Notifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BowlBananza.Controllers
{
    [ApiController]
    [Route("api/push")]
    public class PushTestController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly FcmSender _fcm;
        private readonly PushNotificationService _push;

        public PushTestController(AppDbContext db, FcmSender fcm, PushNotificationService push)
        {
            _db = db;
            _fcm = fcm;
            _push = push;
        }

        // GET /api/push/test
        [HttpGet("test")]
        public async Task<IActionResult> SendTestPush()
        {
            var token = await _db.NotificationTokens
                .Where(x => x.UserId == 1 && x.IsActive)
                .OrderByDescending(x => x.Id)
                .Select(x => x.Token)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(token))
                return NotFound("No active notification token found for that user.");

            var response = await _push.SendToUserAsync(
                    userIds: new List<int>([1]),
                    title: "Test Push",
                    body: $"Test push at {DateTime.Now:t}",
                    url: "games"
                );

            if (response.Succeeded == 0)
                return StatusCode(500);

            return Ok(response);
        }
    }
}
