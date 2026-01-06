using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Services.Notifications;

public sealed class FcmSender
{
    private static readonly string[] Scopes = ["https://www.googleapis.com/auth/firebase.messaging"];

    private readonly HttpClient _http;
    private readonly FirebaseOptions _options;

    private GoogleCredential? _credential;
    private string? _accessToken;
    private DateTimeOffset _accessTokenExpiryUtc;

    public FcmSender(HttpClient http, IOptions<FirebaseOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<(bool ok, int? statusCode, string rawBody)> SendAsync(FcmSendRequest request, CancellationToken ct = default)
    {
        var token = await GetAccessTokenAsync(ct);
        var url = $"https://fcm.googleapis.com/v1/projects/{_options.ProjectId}/messages:send";

        using var msg = new HttpRequestMessage(HttpMethod.Post, url);
        msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        msg.Content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

        using var resp = await _http.SendAsync(msg, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);

        return (resp.IsSuccessStatusCode, (int)resp.StatusCode, body);
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(_accessToken) && DateTimeOffset.UtcNow < _accessTokenExpiryUtc.AddMinutes(-2))
            return _accessToken!;

        _credential ??= GoogleCredential
            .FromFile(_options.ServiceAccountJsonPath)
            .CreateScoped(Scopes);

        _accessToken = await _credential.UnderlyingCredential.GetAccessTokenForRequestAsync(null, ct);
        _accessTokenExpiryUtc = DateTimeOffset.UtcNow.AddMinutes(50);

        return _accessToken!;
    }
}
