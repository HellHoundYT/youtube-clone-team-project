using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Application.Abstractions.Media;
using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Infrastructure.Media;
using YouTubeClone.Infrastructure.Persistence;
using YouTubeClone.Infrastructure.Storage;

namespace YouTubeClone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString(
                "DefaultConnection");

        services.AddDbContext<AppDbContext>(
            options =>
                options.UseSqlServer(
                    connectionString));

        services.AddSingleton<
            IFileStorageService,
            LocalFileStorageService>();

        services.AddSingleton<
            IMediaProbeService,
            FfprobeMediaProbeService>();

        return services;
    }
}