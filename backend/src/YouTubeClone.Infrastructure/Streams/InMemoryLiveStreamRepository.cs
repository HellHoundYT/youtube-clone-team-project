using YouTubeClone.Application.Features.Streams;
using YouTubeClone.Domain.Streams;

namespace YouTubeClone.Infrastructure.Streams;

public sealed class InMemoryLiveStreamRepository :
    ILiveStreamRepository
{
    private static readonly Guid
        DevelopmentVideoId =
            Guid.Parse(
                "11111111-1111-1111-1111-111111111111");

    private readonly IReadOnlyList<
        LiveStream> _streams;

    public InMemoryLiveStreamRepository()
    {
        var now =
            DateTimeOffset.UtcNow;

        _streams =
        [
            new LiveStream
            {
                Id =
                    Guid.Parse(
                        "81111111-1111-1111-1111-111111111111"),
                ChannelId =
                    Guid.Parse(
                        "81111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ChannelName =
                    "AMTLIS Live",
                ChannelAvatarPath =
                    null,
                Title =
                    "Night Arena Ranked",
                Description =
                    "Late-night ranked session with live commentary and community chat.",
                Category =
                    "Games",
                CategorySlug =
                    "games",
                ThumbnailPath =
                    "/demo/thumbnails/ranked-night.webp",
                PlaybackUrl =
                    $"/api/v1/videos/{DevelopmentVideoId}/stream",
                Tags =
                [
                    "Ranked",
                    "Gaming",
                    "Live"
                ],
                ViewerCount =
                    12540,
                IsLive =
                    true,
                StartedAt =
                    now.AddMinutes(-47)
            },

            new LiveStream
            {
                Id =
                    Guid.Parse(
                        "82222222-2222-2222-2222-222222222222"),
                ChannelId =
                    Guid.Parse(
                        "82222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ChannelName =
                    "Cyber Arena",
                ChannelAvatarPath =
                    null,
                Title =
                    "CS2 Championship Watch Party",
                Description =
                    "Championship watch party, match discussion and live reactions.",
                Category =
                    "Cybersport",
                CategorySlug =
                    "cybersport",
                ThumbnailPath =
                    "/demo/thumbnails/watch-party-live.webp",
                PlaybackUrl =
                    $"/api/v1/videos/{DevelopmentVideoId}/stream",
                Tags =
                [
                    "CS2",
                    "Esports",
                    "Championship"
                ],
                ViewerCount =
                    8930,
                IsLive =
                    true,
                StartedAt =
                    now.AddHours(-1)
                       .AddMinutes(-18)
            },

            new LiveStream
            {
                Id =
                    Guid.Parse(
                        "83333333-3333-3333-3333-333333333333"),
                ChannelId =
                    Guid.Parse(
                        "83333333-cccc-cccc-cccc-cccccccccccc"),
                ChannelName =
                    "Next Level Dev",
                ChannelAvatarPath =
                    null,
                Title =
                    "Late Night Coding Session",
                Description =
                    "Building a web application live and answering development questions.",
                Category =
                    "Programming",
                CategorySlug =
                    "programming",
                ThumbnailPath =
                    "/demo/thumbnails/late-night-coding.webp",
                PlaybackUrl =
                    $"/api/v1/videos/{DevelopmentVideoId}/stream",
                Tags =
                [
                    "Programming",
                    "Web",
                    "Development"
                ],
                ViewerCount =
                    2180,
                IsLive =
                    true,
                StartedAt =
                    now.AddMinutes(-32)
            },

            new LiveStream
            {
                Id =
                    Guid.Parse(
                        "84444444-4444-4444-4444-444444444444"),
                ChannelId =
                    Guid.Parse(
                        "84444444-dddd-dddd-dddd-dddddddddddd"),
                ChannelName =
                    "Deep Waves Live",
                ChannelAvatarPath =
                    null,
                Title =
                    "Night Drive Radio",
                Description =
                    "Continuous late-night music stream for work, games and relaxation.",
                Category =
                    "Music",
                CategorySlug =
                    "music",
                ThumbnailPath =
                    "/demo/thumbnails/live-now.webp",
                PlaybackUrl =
                    $"/api/v1/videos/{DevelopmentVideoId}/stream",
                Tags =
                [
                    "Music",
                    "Night",
                    "Radio"
                ],
                ViewerCount =
                    5740,
                IsLive =
                    true,
                StartedAt =
                    now.AddHours(-2)
                       .AddMinutes(-11)
            }
        ];
    }

    public Task<IReadOnlyList<LiveStream>>
        GetAllAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<LiveStream> result =
            _streams
                .Select(
                    CreateSnapshot)
                .ToList();

        return Task.FromResult(
            result);
    }

    private static LiveStream
        CreateSnapshot(
            LiveStream stream)
    {
        return new LiveStream
        {
            Id =
                stream.Id,

            ChannelId =
                stream.ChannelId,

            ChannelName =
                stream.ChannelName,

            ChannelAvatarPath =
                stream.ChannelAvatarPath,

            Title =
                stream.Title,

            Description =
                stream.Description,

            Category =
                stream.Category,

            CategorySlug =
                stream.CategorySlug,

            ThumbnailPath =
                stream.ThumbnailPath,

            PlaybackUrl =
                stream.PlaybackUrl,

            Tags =
                stream.Tags.ToArray(),

            ViewerCount =
                stream.ViewerCount,

            IsLive =
                stream.IsLive,

            StartedAt =
                stream.StartedAt
        };
    }
}