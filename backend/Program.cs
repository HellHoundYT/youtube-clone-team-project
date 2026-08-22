using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.Data;
using YouTubeClone.Api.Services.Favorites;
using YouTubeClone.Api.Services.History;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Storage;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.Configure<FormOptions>(
    options =>
    {
        options.MultipartBodyLengthLimit =
            500L * 1024L * 1024L;
    });

var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(
    options =>
        options.UseSqlServer(
            connectionString));

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
    IFileStorageService,
    LocalFileStorageService>();

var app =
    builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthorization();

app.MapControllers();

app.Run();