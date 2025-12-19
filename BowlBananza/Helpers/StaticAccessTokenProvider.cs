using Microsoft.Kiota.Abstractions.Authentication;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public class StaticAccessTokenProvider : IAccessTokenProvider
    {
        private readonly string _token;

        public StaticAccessTokenProvider(string token)
        {
            _token = token;
        }

        // Return allowed hosts (optional but required by the interface)
        public AllowedHostsValidator AllowedHostsValidator { get; }
            = new AllowedHostsValidator(new[] { "*" });

        public Task<string> GetAuthorizationTokenAsync(
            Uri uri,
            Dictionary<string, object>? additionalAuthenticationContext = null,
            CancellationToken cancellationToken = default)
        {
            // Always return the same static token
            return Task.FromResult(_token);
        }
    }
}
