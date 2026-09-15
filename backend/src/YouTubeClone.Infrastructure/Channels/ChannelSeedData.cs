using YouTubeClone.Domain.Channels;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Infrastructure.Channels;

internal static class ChannelSeedData
{
    private const string DemoPasswordHash =
        "AQAAAAIAAYagAAAAENZgCRcqWUUNHy7o2w0pVr5U10zcKH30UEFeFfnjOD9N9Aet8SgbFCYoyZ9PSyDErA==";

    private static readonly DateTimeOffset CreatedAt =
        new(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);

    public static IReadOnlyList<User> CreateOwners() =>
    [
        CreateOwner(
            "91111111-1111-1111-1111-111111111111",
            "stream-amtlis-live@demo.invalid",
            "amtlis-live-demo",
            "AMTLIS Live"),
        CreateOwner(
            "92222222-2222-2222-2222-222222222222",
            "stream-cyber-arena@demo.invalid",
            "cyber-arena-demo",
            "Cyber Arena"),
        CreateOwner(
            "93333333-3333-3333-3333-333333333333",
            "stream-next-level-dev@demo.invalid",
            "next-level-dev-demo",
            "Next Level Dev"),
        CreateOwner(
            "94444444-4444-4444-4444-444444444444",
            "stream-deep-waves@demo.invalid",
            "deep-waves-live-demo",
            "Deep Waves Live")
    ];

    public static IReadOnlyList<Channel> CreateChannels() =>
    [
        CreateChannel(
            "81111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "91111111-1111-1111-1111-111111111111",
            "AMTLIS Live",
            "amtlis-live",
            "Late-night gaming streams, ranked sessions and community broadcasts."),
        CreateChannel(
            "82222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            "92222222-2222-2222-2222-222222222222",
            "Cyber Arena",
            "cyber-arena",
            "Competitive esports streams, championship watch parties and live reactions."),
        CreateChannel(
            "83333333-cccc-cccc-cccc-cccccccccccc",
            "93333333-3333-3333-3333-333333333333",
            "Next Level Dev",
            "next-level-dev",
            "Live programming sessions, web development and practical engineering."),
        CreateChannel(
            "84444444-dddd-dddd-dddd-dddddddddddd",
            "94444444-4444-4444-4444-444444444444",
            "Deep Waves Live",
            "deep-waves-live",
            "Late-night music radio for work, games and relaxation.")
    ];

    private static User CreateOwner(
        string id,
        string email,
        string userName,
        string displayName) =>
        new()
        {
            Id = Guid.Parse(id),
            Email = email,
            UserName = userName,
            DisplayName = displayName,
            Bio = string.Empty,
            PasswordHash = DemoPasswordHash,
            CreatedAt = CreatedAt
        };

    private static Channel CreateChannel(
        string id,
        string ownerId,
        string name,
        string handle,
        string description) =>
        new()
        {
            Id = Guid.Parse(id),
            OwnerId = Guid.Parse(ownerId),
            Name = name,
            Handle = handle,
            Description = description,
            CreatedAt = CreatedAt
        };
}
