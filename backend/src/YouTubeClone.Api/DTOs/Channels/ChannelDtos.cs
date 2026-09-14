using System.ComponentModel.DataAnnotations;

namespace YouTubeClone.Api.DTOs.Channels;

public sealed class SaveChannelRequestDto
{
    [Required, MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required, MaxLength(64)]
    public string Handle { get; init; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; init; } = string.Empty;
}

public sealed record ChannelResponseDto(
    Guid Id,
    string Name,
    string Handle,
    string Description,
    string? AvatarUrl,
    string? BannerUrl,
    int SubscriberCount,
    bool IsSubscribed,
    bool IsOwner);
