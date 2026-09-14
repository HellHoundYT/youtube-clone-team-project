using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using YouTubeClone.Api.Hubs;
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

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<WatchPartyHub>(
    "/hubs/watch-party");

app.MapHub<LiveChatHub>(
    "/hubs/live-chat");

app.Run();

public partial class Program;
