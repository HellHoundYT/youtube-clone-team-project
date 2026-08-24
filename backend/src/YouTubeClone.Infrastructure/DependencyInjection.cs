using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Application.Abstractions.Media;
using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Application.Features.Streams;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Infrastructure.Media;
using YouTubeClone.Infrastructure.Persistence;
using YouTubeClone.Infrastructure.Storage;
using YouTubeClone.Infrastructure.Favorites;
using YouTubeClone.Infrastructure.History;
using YouTubeClone.Infrastructure.Streams;
using YouTubeClone.Infrastructure.Videos;
using YouTubeClone.Infrastructure.WatchParty;

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

        services.AddSingleton<
            IVideoRepository,
            InMemoryVideoRepository>();

        services.AddSingleton<
            IWatchHistoryRepository,
            InMemoryWatchHistoryRepository>();

        services.AddSingleton<
            IFavoritesRepository,
            InMemoryFavoritesRepository>();

        services.AddSingleton<
            ILiveStreamRepository,
            InMemoryLiveStreamRepository>();

        services.AddSingleton<
            IWatchPartyRepository,
            InMemoryWatchPartyRepository>();

        services.AddSingleton<
            IWatchPartyRoomCodeGenerator,
            WatchPartyRoomCodeGenerator>();

        return services;
    }
}