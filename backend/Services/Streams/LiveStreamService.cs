using YouTubeClone.Api.DTOs.Streams;

namespace YouTubeClone.Api.Services.Streams;

public sealed class LiveStreamService :
    ILiveStreamService
{
    private static readonly Guid
        DevelopmentVideoId =
            Guid.Parse(
                "11111111-1111-1111-1111-111111111111");

    private readonly IReadOnlyList<
        LiveStreamDetailsDto> _streams;

    public LiveStreamService()
    {
        var now =
            DateTimeOffset.UtcNow;

        _streams =
        [
            new LiveStreamDetailsDto
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
                    null,
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

            new LiveStreamDetailsDto
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
                    null,
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

            new LiveStreamDetailsDto
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
                    null,
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

            new LiveStreamDetailsDto
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
                    null,
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

    public Task<IReadOnlyList<LiveStreamListItemDto>>
        GetLiveStreamsAsync(
            string? category = null,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IEnumerable<LiveStreamDetailsDto> query =
            _streams.Where(
                stream =>
                    stream.IsLive);

        if (!string.IsNullOrWhiteSpace(
                category))
        {
            var normalizedCategory =
                category.Trim();

            query =
                query.Where(
                    stream =>
                        string.Equals(
                            stream.Category,
                            normalizedCategory,
                            StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(
                            stream.CategorySlug,
                            normalizedCategory,
                            StringComparison.OrdinalIgnoreCase));
        }

        var result =
            query
                .OrderByDescending(
                    stream =>
                        stream.ViewerCount)
                .Select(
                    ToListItem)
                .ToList();

        return Task.FromResult<
            IReadOnlyList<LiveStreamListItemDto>>(
                result);
    }

    public Task<LiveStreamDetailsDto?>
        GetLiveStreamByIdAsync(
            Guid streamId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var stream =
            _streams.FirstOrDefault(
                item =>
                    item.Id == streamId &&
                    item.IsLive);

        return Task.FromResult(
            stream);
    }

    public Task<IReadOnlyList<StreamCategoryDto>>
        GetCategoriesAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var result =
            _streams
                .Where(
                    stream =>
                        stream.IsLive)
                .GroupBy(
                    stream =>
                        new
                        {
                            stream.Category,
                            stream.CategorySlug
                        })
                .Select(
                    group =>
                        new StreamCategoryDto
                        {
                            Name =
                                group.Key.Category,
                            Slug =
                                group.Key.CategorySlug,
                            LiveStreamCount =
                                group.Count(),
                            ViewerCount =
                                group.Sum(
                                    stream =>
                                        stream.ViewerCount)
                        })
                .OrderByDescending(
                    category =>
                        category.ViewerCount)
                .ToList();

        return Task.FromResult<
            IReadOnlyList<StreamCategoryDto>>(
                result);
    }

    private static LiveStreamListItemDto
        ToListItem(
            LiveStreamDetailsDto stream)
    {
        return new LiveStreamListItemDto
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
            Category =
                stream.Category,
            CategorySlug =
                stream.CategorySlug,
            ThumbnailPath =
                stream.ThumbnailPath,
            ViewerCount =
                stream.ViewerCount,
            IsLive =
                stream.IsLive,
            StartedAt =
                stream.StartedAt
        };
    }
}