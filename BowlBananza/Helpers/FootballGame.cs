using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace BowlBananza.Helpers
{
    public sealed class FootballGame
    {
        public required DateTimeOffset StartTimeUtc { get; init; } // store in UTC
        public string? Description { get; init; }
    }

    public interface IGameProvider
    {
        Task<IReadOnlyList<FootballGame>> GetGamesAsync(CancellationToken ct);
    }
}
