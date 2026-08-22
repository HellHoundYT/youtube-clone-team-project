using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.Services.Videos;

public sealed class VideoReadService : IVideoReadService
{
    private static readonly IReadOnlyList<VideoDetailsDto> Videos =
    [
        new VideoDetailsDto
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            ChannelId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ChannelName = "AMTLIS Music",
            Category = "Music",
            CategorySlug = "music",
            Title = "Midnight City",
            Description = "A late night electronic music session.",
            VideoPath = "/api/v1/videos/11111111-1111-1111-1111-111111111111/stream",
            ThumbnailPath = null,
            DurationSeconds = 768,
            ViewCount = 2_400_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
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
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ChannelId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ChannelName = "Arena Live",
            Category = "Cybersport",
            CategorySlug = "cybersport",
            Title = "Cyber Arena Finals",
            Description = "Highlights from the championship finals.",
            VideoPath = "/api/v1/videos/22222222-2222-2222-2222-222222222222/stream",
            ThumbnailPath = null,
            DurationSeconds = 1696,
            ViewCount = 842_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
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
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ChannelId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ChannelName = "Movie Space",
            Category = "Films",
            CategorySlug = "films",
            Title = "Beyond The Horizon",
            Description = "A cinematic journey beyond the horizon.",
            VideoPath = "/api/v1/videos/33333333-3333-3333-3333-333333333333/stream",
            ThumbnailPath = null,
            DurationSeconds = 1122,
            ViewCount = 1_700_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
                2026,
                7,
                22,
                16,
                0,
                0,
                TimeSpan.Zero)
        },

        new VideoDetailsDto
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            ChannelId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ChannelName = "Deep Waves",
            Category = "Mixes",
            CategorySlug = "mixes",
            Title = "Night Drive Mix",
            Description = "A continuous mix for night drives.",
            VideoPath = "/api/v1/videos/44444444-4444-4444-4444-444444444444/stream",
            ThumbnailPath = null,
            DurationSeconds = 2702,
            ViewCount = 956_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
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
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            ChannelId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ChannelName = "Play Zone",
            Category = "Games",
            CategorySlug = "games",
            Title = "Inside The Game",
            Description = "Exploring modern game design and gameplay.",
            VideoPath = "/api/v1/videos/55555555-5555-5555-5555-555555555555/stream",
            ThumbnailPath = null,
            DurationSeconds = 1270,
            ViewCount = 634_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
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
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            ChannelId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            ChannelName = "Next Level",
            Category = "Education",
            CategorySlug = "education",
            Title = "Future Technology",
            Description = "A look at technologies shaping the near future.",
            VideoPath = "/api/v1/videos/66666666-6666-6666-6666-666666666666/stream",
            ThumbnailPath = null,
            DurationSeconds = 936,
            ViewCount = 1_100_000,
            Visibility = "Public",
            PublishedAt = new DateTimeOffset(
                2026,
                8,
                15,
                14,
                0,
                0,
                TimeSpan.Zero)
        }
    ];

    public Task<IReadOnlyList<VideoListItemDto>> GetVideosAsync(
        int page,
        int pageSize,
        string? category,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IEnumerable<VideoDetailsDto> query = Videos;

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(video =>
                string.Equals(
                    video.Category,
                    category,
                    StringComparison.OrdinalIgnoreCase)
                ||
                string.Equals(
                    video.CategorySlug,
                    category,
                    StringComparison.OrdinalIgnoreCase));
        }

        var skip = (page - 1) * pageSize;

        var result = query
            .OrderByDescending(video => video.PublishedAt)
            .Skip(skip)
            .Take(pageSize)
            .Select(video => new VideoListItemDto
            {
                Id = video.Id,
                ChannelId = video.ChannelId,
                ChannelName = video.ChannelName,
                ChannelAvatarPath = video.ChannelAvatarPath,
                Category = video.Category,
                CategorySlug = video.CategorySlug,
                Title = video.Title,
                ThumbnailPath = video.ThumbnailPath,
                DurationSeconds = video.DurationSeconds,
                ViewCount = video.ViewCount,
                PublishedAt = video.PublishedAt
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<VideoListItemDto>>(result);
    }

    public Task<VideoDetailsDto?> GetVideoByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var video = Videos.FirstOrDefault(item => item.Id == videoId);

        return Task.FromResult(video);
    }
}