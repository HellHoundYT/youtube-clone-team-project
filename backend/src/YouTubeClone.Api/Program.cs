using Microsoft.AspNetCore.Http.Features;
using YouTubeClone.Api.Hubs;
using YouTubeClone.Application.Features.Categories;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Application.Features.Search;
using YouTubeClone.Application.Features.Streams;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Infrastructure;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddSignalR();

builder.Services.AddSingleton<
    IWatchPartyService,
    WatchPartyService>();

builder.Services.AddSingleton<
    ILiveChatService,
    LiveChatService>();

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

builder.Services.AddSingleton<
    ICategoryService,
    CategoryService>();

builder.Services.AddSingleton<
    ISearchService,
    SearchService>();

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