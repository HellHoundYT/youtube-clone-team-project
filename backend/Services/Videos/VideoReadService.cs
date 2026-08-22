using System.Collections.Concurrent;
using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.Services.Videos;

public sealed class VideoReadService : IVideoReadService
{
    private static readonly IReadOnlyList<VideoDetailsDto> Catalog =
    [
        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "11111111-1111-1111-1111-111111111111"),
            ChannelId = Guid.Parse(
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ChannelName = "AMTLIS Music",
            ChannelAvatarPath = null,
            Category = "Music",
            CategorySlug = "music",
            Title = "Midnight City",
            Description =
                "A late night electronic music session.",
            VideoPath =
                "/api/v1/videos/11111111-1111-1111-1111-111111111111/stream",
            ThumbnailPath = null,
            DurationSeconds = 768,
            ViewCount = 2_400_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    8,
                    8,
                    18,
                    0,
                    0,
                    TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "22222222-2222-2222-2222-222222222222"),
            ChannelId = Guid.Parse(
                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ChannelName = "Arena Live",
            ChannelAvatarPath = null,
            Category = "Cybersport",
            CategorySlug = "cybersport",
            Title = "Cyber Arena Finals",
            Description =
                "The final match from the cyber arena.",
            VideoPath =
                "/api/v1/videos/22222222-2222-2222-2222-222222222222/stream",
            ThumbnailPath = null,
            DurationSeconds = 1696,
            ViewCount = 842_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    8,
                    18,
                    20,
                    30,
                    0,
                    TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "33333333-3333-3333-3333-333333333333"),
            ChannelId = Guid.Parse(
                "cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ChannelName = "Movie Space",
            ChannelAvatarPath = null,
            Category = "Films",
            CategorySlug = "films",
            Title = "Beyond The Horizon",
            Description =
                "A cinematic journey beyond the horizon.",
            VideoPath =
                "/api/v1/videos/33333333-3333-3333-3333-333333333333/stream",
            ThumbnailPath = null,
            DurationSeconds = 1122,
            ViewCount = 1_700_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    7,
                    22,
                    18,
                    0,
                    0,
                    TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "44444444-4444-4444-4444-444444444444"),
            ChannelId = Guid.Parse(
                "dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ChannelName = "Deep Waves",
            ChannelAvatarPath = null,
            Category = "Mixes",
            CategorySlug = "mixes",
            Title = "Night Drive Mix",
            Description =
                "Music for a long night drive.",
            VideoPath =
                "/api/v1/videos/44444444-4444-4444-4444-444444444444/stream",
            ThumbnailPath = null,
            DurationSeconds = 2702,
            ViewCount = 956_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    8,
                    16,
                    21,
                    0,
                    0,
                    TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "55555555-5555-5555-5555-555555555555"),
            ChannelId = Guid.Parse(
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ChannelName = "Play Zone",
            ChannelAvatarPath = null,
            Category = "Games",
            CategorySlug = "games",
            Title = "Inside The Game",
            Description =
                "Explore what happens inside the game.",
            VideoPath =
                "/api/v1/videos/55555555-5555-5555-5555-555555555555/stream",
            ThumbnailPath = null,
            DurationSeconds = 1270,
            ViewCount = 634_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    8,
                    19,
                    17,
                    0,
                    0,
                    TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse(
                "66666666-6666-6666-6666-666666666666"),
            ChannelId = Guid.Parse(
                "ffffffff-ffff-ffff-ffff-ffffffffffff"),
            ChannelName = "Next Level",
            ChannelAvatarPath = null,
            Category = "Education",
            CategorySlug = "education",
            Title = "Future Technology",
            Description =
                "Technology that may define the future.",
            VideoPath =
                "/api/v1/videos/66666666-6666-6666-6666-666666666666/stream",
            ThumbnailPath = null,
            DurationSeconds = 936,
            ViewCount = 1_100_000,
            Visibility = "Public",
            PublishedAt =
                new DateTimeOffset(
                    2026,
                    8,
                    15,
                    15,
                    0,
                    0,
                    TimeSpan.Zero)
        }
    ];

    private readonly ConcurrentDictionary<Guid, long>
        _runtimeViewCounts = new();

    public Task<IReadOnlyList<VideoListItemDto>> GetVideosAsync(
        int page,
        int pageSize,
        string? category,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IEnumerable<VideoDetailsDto> query = Catalog;

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(video =>
                string.Equals(
                    video.Category,
                    category,
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    video.CategorySlug,
                    category,
                    StringComparison.OrdinalIgnoreCase));
        }

        var videos = query
            .OrderByDescending(video => video.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToListItemDto)
            .ToList();

        return Task.FromResult<IReadOnlyList<VideoListItemDto>>(
            videos);
    }

    public Task<VideoDetailsDto?> GetVideoByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var video = Catalog.FirstOrDefault(
            item => item.Id == videoId);

        if (video is null)
        {
            return Task.FromResult<VideoDetailsDto?>(null);
        }

        return Task.FromResult<VideoDetailsDto?>(
            ToDetailsDto(video));
    }

    public Task<long?> RegisterViewAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var video = Catalog.FirstOrDefault(
            item => item.Id == videoId);

        if (video is null)
        {
            return Task.FromResult<long?>(null);
        }

        var updatedViewCount =
            _runtimeViewCounts.AddOrUpdate(
                video.Id,
                video.ViewCount + 1,
                (_, current) => current + 1);

        return Task.FromResult<long?>(
            updatedViewCount);
    }

    private long GetViewCount(
        VideoDetailsDto video)
    {
        return _runtimeViewCounts.TryGetValue(
            video.Id,
            out var runtimeViewCount)
            ? runtimeViewCount
            : video.ViewCount;
    }

    private VideoListItemDto ToListItemDto(
        VideoDetailsDto video)
    {
        return new VideoListItemDto
        {
            Id = video.Id,
            ChannelId = video.ChannelId,
            ChannelName = video.ChannelName,
            ChannelAvatarPath =
                video.ChannelAvatarPath,
            Category = video.Category,
            CategorySlug =
                video.CategorySlug,
            Title = video.Title,
            ThumbnailPath =
                video.ThumbnailPath,
            DurationSeconds =
                video.DurationSeconds,
            ViewCount =
                GetViewCount(video),
            PublishedAt =
                video.PublishedAt
        };
    }

    private VideoDetailsDto ToDetailsDto(
        VideoDetailsDto video)
    {
        return new VideoDetailsDto
        {
            Id = video.Id,
            ChannelId = video.ChannelId,
            ChannelName = video.ChannelName,
            ChannelAvatarPath =
                video.ChannelAvatarPath,
            Category = video.Category,
            CategorySlug =
                video.CategorySlug,
            Title = video.Title,
            Description = video.Description,
            VideoPath = video.VideoPath,
            ThumbnailPath =
                video.ThumbnailPath,
            DurationSeconds =
                video.DurationSeconds,
            ViewCount =
                GetViewCount(video),
            Visibility = video.Visibility,
            PublishedAt =
                video.PublishedAt
        };
    }
}