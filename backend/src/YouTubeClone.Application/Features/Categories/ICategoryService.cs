using YouTubeClone.Application.Features.Categories.Contracts;

namespace YouTubeClone.Application.Features.Categories;

public interface ICategoryService
{
    IReadOnlyList<CategoryDto> GetCategories();

    CategoryDto? GetBySlug(
        string slug);
}