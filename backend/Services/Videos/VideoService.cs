using System.Collections.Concurrent;
using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.Services.Videos;

public sealed class VideoService : IVideoService
{
    private readonly ConcurrentDictionary<Guid, VideoDetailsDto>
        _catalog;

    private readonly ConcurrentDictionary<Guid, long>
        _runtimeViewCounts = new();

    public VideoService()
    {
        _catalog =
            new ConcurrentDictionary<Guid, VideoDetailsDto>(
                CreateSeedCatalog()
                    .ToDictionary(
                        video => video.Id,
                        video => video));
    }

    public Task<IReadOnlyList<VideoListItemDto>> GetVideosAsync(
        int page,
        int pageSize,
        string? category,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IEnumerable<VideoDetailsDto> query =
            _catalog.Values;

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

        return Task.FromResult<
            IReadOnlyList<VideoListItemDto>>(videos);
    }

    public Task<VideoDetailsDto?> GetVideoByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_catalog.TryGetValue(
                videoId,
                out var video))
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

        if (!_catalog.TryGetValue(
                videoId,
                out var video))
        {
            return Task.FromResult<long?>(null);
        }

        var updatedViewCount =
            _runtimeViewCounts.AddOrUpdate(
                videoId,
                video.ViewCount + 1,
                (_, current) => current + 1);

        return Task.FromResult<long?>(
            updatedViewCount);
    }

    public Task<VideoDetailsDto> CreateVideoAsync(
        VideoDetailsDto video,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_catalog.TryAdd(
                video.Id,
                video))
        {
            throw new InvalidOperationException(
                "A video with this identifier already exists.");
        }

        return Task.FromResult(
            ToDetailsDto(video));
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
            Description =
                video.Description,
            VideoPath =
                video.VideoPath,
            ThumbnailPath =
                video.ThumbnailPath,
            DurationSeconds =
                video.DurationSeconds,
            ViewCount =
                GetViewCount(video),
            Visibility =
                video.Visibility,
            PublishedAt =
                video.PublishedAt
        };
    }

    private static IReadOnlyList<VideoDetailsDto>
        CreateSeedCatalog()
    {
        return
        [
            CreateSeedVideo(
                "11111111-1111-1111-1111-111111111111",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "AMTLIS Music",
                "Music",
                "music",
                "Midnight City",
                "A late night electronic music session.",
                131,
                2_400_000,
                new DateTimeOffset(
                    2026, 8, 8, 18, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "22222222-2222-2222-2222-222222222222",
                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "Arena Live",
                "Cybersport",
                "cybersport",
                "Cyber Arena Finals",
                "The final match from the cyber arena.",
                1696,
                842_000,
                new DateTimeOffset(
                    2026, 8, 18, 20, 30, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "33333333-3333-3333-3333-333333333333",
                "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "Movie Space",
                "Films",
                "films",
                "Beyond The Horizon",
                "A cinematic journey beyond the horizon.",
                1122,
                1_700_000,
                new DateTimeOffset(
                    2026, 7, 22, 18, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "44444444-4444-4444-4444-444444444444",
                "dddddddd-dddd-dddd-dddd-dddddddddddd",
                "Deep Waves",
                "Mixes",
                "mixes",
                "Night Drive Mix",
                "Music for a long night drive.",
                2702,
                956_000,
                new DateTimeOffset(
                    2026, 8, 16, 21, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "55555555-5555-5555-5555-555555555555",
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                "Play Zone",
                "Games",
                "games",
                "Inside The Game",
                "Explore what happens inside the game.",
                1270,
                634_000,
                new DateTimeOffset(
                    2026, 8, 19, 17, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "66666666-6666-6666-6666-666666666666",
                "ffffffff-ffff-ffff-ffff-ffffffffffff",
                "Next Level",
                "Education",
                "education",
                "Future Technology",
                "Technology that may define the future.",
                936,
                1_100_000,
                new DateTimeOffset(
                    2026, 8, 15, 15, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "77777777-7777-7777-7777-777777777777",
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                "Play Zone",
                "Games",
                "games",
                "Pro Game Moments",
                "A collection of intense competitive gaming moments.",
                12,
                1_350_000,
                new DateTimeOffset(
                    2026, 8, 20, 19, 15, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "88888888-8888-8888-8888-888888888888",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "AMTLIS Music",
                "Music",
                "music",
                "Wave Session",
                "A neon electronic music session for the night.",
                12,
                1_280_000,
                new DateTimeOffset(
                    2026, 8, 21, 20, 0, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "99999999-9999-9999-9999-999999999999",
                "12121212-1212-1212-1212-121212121212",
                "AMTLIS Talks",
                "Podcasts",
                "podcasts",
                "Talk Session",
                "A relaxed conversation about ideas, technology and culture.",
                12,
                720_000,
                new DateTimeOffset(
                    2026, 8, 17, 16, 30, 0,
                    TimeSpan.Zero)),

            CreateSeedVideo(
                "10101010-1010-1010-1010-101010101010",
                "ffffffff-ffff-ffff-ffff-ffffffffffff",
                "Next Level",
                "Education",
                "education",
                "Learn Fast",
                "A short visual guide focused on faster and smarter learning.",
                12,
                1_520_000,
                new DateTimeOffset(
                    2026, 8, 22, 14, 0, 0,
                    TimeSpan.Zero))
        ];
    }

    private static string? GetSeedThumbnailPath(
        Guid videoId)
    {
        return videoId.ToString() switch
        {
            "11111111-1111-1111-1111-111111111111" =>
                "/demo/thumbnails/midnight-city.webp",

            "22222222-2222-2222-2222-222222222222" =>
                "/demo/thumbnails/cyber-arena-finals.webp",

            "33333333-3333-3333-3333-333333333333" =>
                "/demo/thumbnails/beyond-the-horizon.webp",

            "44444444-4444-4444-4444-444444444444" =>
                "/demo/thumbnails/night-drive-mix.webp",

            "55555555-5555-5555-5555-555555555555" =>
                "/demo/thumbnails/inside-the-game.webp",

            "66666666-6666-6666-6666-666666666666" =>
                "/demo/thumbnails/future-technology.webp",

            "77777777-7777-7777-7777-777777777777" =>
                "/demo/thumbnails/pro-game-moments.webp",

            "88888888-8888-8888-8888-888888888888" =>
                "/demo/thumbnails/wave-session.webp",

            "99999999-9999-9999-9999-999999999999" =>
                "/demo/thumbnails/talk-session.webp",

            "10101010-1010-1010-1010-101010101010" =>
                "/demo/thumbnails/learn-fast.webp",

            _ => null
        };
    }

    private static VideoDetailsDto CreateSeedVideo(
        string id,
        string channelId,
        string channelName,
        string category,
        string categorySlug,
        string title,
        string description,
        int durationSeconds,
        long viewCount,
        DateTimeOffset publishedAt)
    {
        var videoId = Guid.Parse(id);

        return new VideoDetailsDto
        {
            Id = videoId,
            ChannelId =
                Guid.Parse(channelId),
            ChannelName =
                channelName,
            ChannelAvatarPath =
                null,
            Category =
                category,
            CategorySlug =
                categorySlug,
            Title =
                title,
            Description =
                description,
            VideoPath =
                $"/api/v1/videos/{videoId}/stream",
            ThumbnailPath =
                GetSeedThumbnailPath(
                    videoId),
            DurationSeconds =
                durationSeconds,
            ViewCount =
                viewCount,
            Visibility =
                "Public",
            PublishedAt =
                publishedAt
        };
    }
}