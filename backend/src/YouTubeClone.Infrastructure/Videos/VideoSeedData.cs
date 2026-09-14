using YouTubeClone.Domain.Videos;

namespace YouTubeClone.Infrastructure.Videos;

internal static class VideoSeedData
{
    public static IReadOnlyList<Video> CreateCatalog()
    {
        return
        [
            Create(
                "11111111-1111-1111-1111-111111111111",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "AMTLIS Music",
                "Music",
                "music",
                "Midnight City",
                "A late night electronic music session.",
                6,
                2_400_000,
                new DateTimeOffset(2026, 8, 8, 18, 0, 0, TimeSpan.Zero)),
            Create(
                "22222222-2222-2222-2222-222222222222",
                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "Arena Live",
                "Cybersport",
                "cybersport",
                "Cyber Arena Finals",
                "The final match from the cyber arena.",
                6,
                842_000,
                new DateTimeOffset(2026, 8, 18, 20, 30, 0, TimeSpan.Zero)),
            Create(
                "33333333-3333-3333-3333-333333333333",
                "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "Movie Space",
                "Films",
                "films",
                "Beyond The Horizon",
                "A cinematic journey beyond the horizon.",
                6,
                1_700_000,
                new DateTimeOffset(2026, 7, 22, 18, 0, 0, TimeSpan.Zero)),
            Create(
                "44444444-4444-4444-4444-444444444444",
                "dddddddd-dddd-dddd-dddd-dddddddddddd",
                "Deep Waves",
                "Mixes",
                "mixes",
                "Night Drive Mix",
                "Music for a long night drive.",
                6,
                956_000,
                new DateTimeOffset(2026, 8, 16, 21, 0, 0, TimeSpan.Zero)),
            Create(
                "55555555-5555-5555-5555-555555555555",
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                "Play Zone",
                "Games",
                "games",
                "Inside The Game",
                "Explore what happens inside the game.",
                6,
                634_000,
                new DateTimeOffset(2026, 8, 19, 17, 0, 0, TimeSpan.Zero)),
            Create(
                "66666666-6666-6666-6666-666666666666",
                "ffffffff-ffff-ffff-ffff-ffffffffffff",
                "Next Level",
                "Education",
                "education",
                "Future Technology",
                "Technology that may define the future.",
                6,
                1_100_000,
                new DateTimeOffset(2026, 8, 15, 15, 0, 0, TimeSpan.Zero)),
            Create(
                "77777777-7777-7777-7777-777777777777",
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                "Play Zone",
                "Games",
                "games",
                "Pro Game Moments",
                "A collection of intense competitive gaming moments.",
                6,
                1_350_000,
                new DateTimeOffset(2026, 8, 20, 19, 15, 0, TimeSpan.Zero)),
            Create(
                "88888888-8888-8888-8888-888888888888",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "AMTLIS Music",
                "Music",
                "music",
                "Wave Session",
                "A neon electronic music session for the night.",
                6,
                1_280_000,
                new DateTimeOffset(2026, 8, 21, 20, 0, 0, TimeSpan.Zero)),
            Create(
                "99999999-9999-9999-9999-999999999999",
                "12121212-1212-1212-1212-121212121212",
                "AMTLIS Talks",
                "Podcasts",
                "podcasts",
                "Talk Session",
                "A relaxed conversation about ideas, technology and culture.",
                6,
                720_000,
                new DateTimeOffset(2026, 8, 17, 16, 30, 0, TimeSpan.Zero)),
            Create(
                "10101010-1010-1010-1010-101010101010",
                "ffffffff-ffff-ffff-ffff-ffffffffffff",
                "Next Level",
                "Education",
                "education",
                "Learn Fast",
                "A short visual guide focused on faster and smarter learning.",
                6,
                1_520_000,
                new DateTimeOffset(2026, 8, 22, 14, 0, 0, TimeSpan.Zero))
        ];
    }

    private static Video Create(
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

        return new Video
        {
            Id = videoId,
            ChannelId = Guid.Parse(channelId),
            ChannelName = channelName,
            Category = category,
            CategorySlug = categorySlug,
            Title = title,
            Description = description,
            VideoPath = $"/api/v1/videos/{videoId}/stream",
            ThumbnailPath = GetThumbnailPath(videoId),
            DurationSeconds = durationSeconds,
            ViewCount = viewCount,
            Visibility = "Public",
            PublishedAt = publishedAt
        };
    }

    private static string? GetThumbnailPath(Guid videoId)
    {
        return videoId.ToString() switch
        {
            "11111111-1111-1111-1111-111111111111" => "/demo/thumbnails/midnight-city.webp",
            "22222222-2222-2222-2222-222222222222" => "/demo/thumbnails/cyber-arena-finals.webp",
            "33333333-3333-3333-3333-333333333333" => "/demo/thumbnails/beyond-the-horizon.webp",
            "44444444-4444-4444-4444-444444444444" => "/demo/thumbnails/night-drive-mix.webp",
            "55555555-5555-5555-5555-555555555555" => "/demo/thumbnails/inside-the-game.webp",
            "66666666-6666-6666-6666-666666666666" => "/demo/thumbnails/future-technology.webp",
            "77777777-7777-7777-7777-777777777777" => "/demo/thumbnails/pro-game-moments.webp",
            "88888888-8888-8888-8888-888888888888" => "/demo/thumbnails/wave-session.webp",
            "99999999-9999-9999-9999-999999999999" => "/demo/thumbnails/talk-session.webp",
            "10101010-1010-1010-1010-101010101010" => "/demo/thumbnails/learn-fast.webp",
            _ => null
        };
    }
}
