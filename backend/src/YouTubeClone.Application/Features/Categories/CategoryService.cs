using YouTubeClone.Application.Features.Categories.Contracts;

namespace YouTubeClone.Application.Features.Categories;

public sealed class CategoryService :
    ICategoryService
{
    private static readonly IReadOnlyList<CategoryDto>
        Categories =
        [
            new CategoryDto
            {
                Name = "Games",
                Slug = "games"
            },
            new CategoryDto
            {
                Name = "Cybersport",
                Slug = "cybersport"
            },
            new CategoryDto
            {
                Name = "Education",
                Slug = "education"
            },
            new CategoryDto
            {
                Name = "Programming",
                Slug = "programming"
            },
            new CategoryDto
            {
                Name = "Music",
                Slug = "music"
            },
            new CategoryDto
            {
                Name = "Podcasts",
                Slug = "podcasts"
            },
            new CategoryDto
            {
                Name = "Films",
                Slug = "films"
            },
            new CategoryDto
            {
                Name = "Mixes",
                Slug = "mixes"
            }
        ];

    public IReadOnlyList<CategoryDto>
        GetCategories()
    {
        return Categories;
    }

    public CategoryDto? GetBySlug(
        string slug)
    {
        var normalizedSlug =
            slug.Trim()
                .ToLowerInvariant();

        return Categories.FirstOrDefault(
            category =>
                string.Equals(
                    category.Slug,
                    normalizedSlug,
                    StringComparison.OrdinalIgnoreCase));
    }
}