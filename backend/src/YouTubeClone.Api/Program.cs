using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using YouTubeClone.Api.Auth;
using YouTubeClone.Api.Hubs;
using YouTubeClone.Application.Abstractions.Auth;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Application.Features.Categories;
using YouTubeClone.Application.Features.Channels;
using YouTubeClone.Application.Features.Comments;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Application.Features.Playlists;
using YouTubeClone.Application.Features.Search;
using YouTubeClone.Application.Features.Streams;
using YouTubeClone.Application.Features.Users;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Infrastructure;
using YouTubeClone.Infrastructure.Persistence;

var builder =
    WebApplication.CreateBuilder(args);

const long maxUploadSize =
    500L * 1024L * 1024L;

builder.WebHost.ConfigureKestrel(
    options =>
    {
        options.Limits.MaxRequestBodySize =
            maxUploadSize;
    });

builder.Services.Configure<ForwardedHeadersOptions>(
    options =>
    {
        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto;

        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:SigningKey"]!))
        };
    });

builder.Services.AddOpenApi();

builder.Services.AddSignalR();

builder.Services.AddScoped<
    ICurrentUserContext,
    HttpCurrentUserContext>();

builder.Services.AddScoped<
    IWatchPartyService,
    WatchPartyService>();

builder.Services.AddSingleton<
    ILiveChatService,
    LiveChatService>();

builder.Services.Configure<FormOptions>(
    options =>
    {
        options.MultipartBodyLengthLimit =
            maxUploadSize;
    });

builder.Services.AddInfrastructure(
    builder.Configuration);

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    IUserProfileService,
    UserProfileService>();

builder.Services.AddScoped<
    IChannelService,
    ChannelService>();

builder.Services.AddScoped<
    ICommentService,
    CommentService>();

builder.Services.AddScoped<
    IPlaylistService,
    PlaylistService>();

builder.Services.AddScoped<
    IVideoService,
    VideoService>();

builder.Services.AddScoped<
    IWatchHistoryService,
    WatchHistoryService>();

builder.Services.AddScoped<
    IFavoritesService,
    FavoritesService>();

builder.Services.AddSingleton<
    ILiveStreamService,
    LiveStreamService>();

builder.Services.AddScoped<
    ICategoryService,
    CategoryService>();

builder.Services.AddScoped<
    ISearchService,
    SearchService>();

var app =
    builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (app.Configuration.GetValue<bool>(
        "Database:MigrateOnStartup"))
{
    const int maxMigrationAttempts = 20;

    for (var attempt = 1;
         attempt <= maxMigrationAttempts;
         attempt++)
    {
        try
        {
            await using var scope =
                app.Services.CreateAsyncScope();

            var dbContext =
                scope.ServiceProvider
                    .GetRequiredService<AppDbContext>();

            await dbContext.Database.MigrateAsync();
            break;
        }
        catch when (attempt < maxMigrationAttempts)
        {
            await Task.Delay(
                TimeSpan.FromSeconds(3));
        }
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<WatchPartyHub>(
    "/hubs/watch-party");

app.MapHub<LiveChatHub>(
    "/hubs/live-chat");

app.MapFallbackToFile(
    "index.html");

await app.RunAsync();

public partial class Program;
