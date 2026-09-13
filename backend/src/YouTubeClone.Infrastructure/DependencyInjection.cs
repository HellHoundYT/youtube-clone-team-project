using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Application.Abstractions.Media;
using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Application.Features.Channels;
using YouTubeClone.Application.Features.Comments;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Application.Features.Playlists;
using YouTubeClone.Application.Features.Streams;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Auth;
using YouTubeClone.Infrastructure.Channels;
using YouTubeClone.Infrastructure.Comments;
using YouTubeClone.Infrastructure.Favorites;
using YouTubeClone.Infrastructure.History;
using YouTubeClone.Infrastructure.LiveChat;
using YouTubeClone.Infrastructure.Media;
using YouTubeClone.Infrastructure.Persistence;
using YouTubeClone.Infrastructure.Playlists;
using YouTubeClone.Infrastructure.Storage;
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
            {
                if (configuration["Database:Provider"] == "InMemory")
                {
                    options.UseInMemoryDatabase("YouTubeCloneTests");
                    return;
                }

                options.UseSqlServer(connectionString);
            });

        services.AddScoped<
            IPasswordHasher<User>,
            PasswordHasher<User>>();

        services.AddScoped<
            IUserAccountRepository,
            EfUserAccountRepository>();

        services.AddScoped<
            IPasswordService,
            AspNetPasswordService>();

        services.AddScoped<
            IAuthTokenService,
            JwtAuthTokenService>();

        services.AddScoped<
            IChannelRepository,
            EfChannelRepository>();

        services.AddScoped<
            ICommentRepository,
            EfCommentRepository>();

        services.AddScoped<
            IPlaylistRepository,
            EfPlaylistRepository>();

        services.Configure<StorageOptions>(
            configuration.GetSection(
                StorageOptions.SectionName));

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
            ILiveChatRepository,
            InMemoryLiveChatRepository>();

        services.AddSingleton<
            IWatchPartyRepository,
            FileWatchPartyRepository>();

        services.AddSingleton<
            IWatchPartyRoomCodeGenerator,
            WatchPartyRoomCodeGenerator>();

        return services;
    }
}
