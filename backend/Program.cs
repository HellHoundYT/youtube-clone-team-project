using Microsoft.AspNetCore.Http.Features;
using YouTubeClone.Api.Hubs;
using YouTubeClone.Api.Services.Favorites;
using YouTubeClone.Api.Services.History;
using YouTubeClone.Api.Services.Streams;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Services.WatchParty;
using YouTubeClone.Infrastructure;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddSignalR();

builder.Services.AddSingleton<
    IWatchPartyService,
    WatchPartyService>();

builder.Services.Configure<FormOptions>(
    options =>
    {
        options.MultipartBodyLengthLimit =
            500L * 1024L * 1024L;
    });

builder.Services.AddInfrastructure(
    builder.Configuration);

builder.Services.AddSingleton<
    IVideoService,
    VideoService>();

builder.Services.AddSingleton<
    IWatchHistoryService,
    WatchHistoryService>();

builder.Services.AddSingleton<
    IFavoritesService,
    FavoritesService>();

builder.Services.AddSingleton<
    ILiveStreamService,
    LiveStreamService>();

var app =
    builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthorization();

app.MapControllers();

app.MapHub<WatchPartyHub>(
    "/hubs/watch-party");

app.MapHub<LiveChatHub>(
    "/hubs/live-chat");

app.Run();