namespace YouTubeClone.Application.Features.Categories.Contracts;

public sealed class CategoryDto
{
    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;
}