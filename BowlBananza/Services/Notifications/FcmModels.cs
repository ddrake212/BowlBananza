using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace BowlBananza.Services.Notifications;

public sealed class FcmSendRequest
{
    [JsonPropertyName("message")]
    public FcmMessage Message { get; set; } = new();
}

public sealed class FcmMessage
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = "";

    [JsonPropertyName("notification")]
    public FcmNotification? Notification { get; set; }

    [JsonPropertyName("data")]
    public Dictionary<string, string>? Data { get; set; }

    [JsonPropertyName("webpush")]
    public FcmWebpushConfig? Webpush { get; set; }
}

public sealed class FcmNotification
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("body")]
    public string Body { get; set; } = "";
}

public sealed class FcmWebpushConfig
{
    [JsonPropertyName("fcm_options")]
    public FcmWebpushFcmOptions? FcmOptions { get; set; }
}

public sealed class FcmWebpushFcmOptions
{
    [JsonPropertyName("link")]
    public string? Link { get; set; }
}
