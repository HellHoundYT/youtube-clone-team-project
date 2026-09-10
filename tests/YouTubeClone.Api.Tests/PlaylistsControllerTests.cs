using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.Controllers;
using YouTubeClone.Api.DTOs.Playlists;
using YouTubeClone.Domain.Playlists;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class PlaylistsControllerTests
{
    [Fact]
    public async Task AddVideo_rejects_duplicate_for_the_same_playlist()
    {
        await using var db = CreateDb();
        var ownerId = Guid.NewGuid();
        var playlist = new Playlist { Id = Guid.NewGuid(), OwnerId = ownerId, Title = "Watch later", CreatedAt = DateTimeOffset.UtcNow };
        db.Playlists.Add(playlist);
        await db.SaveChangesAsync();
        var controller = CreateController(db, ownerId);
        var videoId = Guid.NewGuid();

        var first = await controller.AddVideo(playlist.Id, videoId, CancellationToken.None);
        var duplicate = await controller.AddVideo(playlist.Id, videoId, CancellationToken.None);

        Assert.IsType<OkObjectResult>(first.Result);
        Assert.IsType<ConflictObjectResult>(duplicate.Result);
        Assert.Single(db.PlaylistVideos);
    }

    [Fact]
    public async Task Update_does_not_allow_another_owner_to_change_playlist()
    {
        await using var db = CreateDb();
        var playlist = new Playlist { Id = Guid.NewGuid(), OwnerId = Guid.NewGuid(), Title = "Private", CreatedAt = DateTimeOffset.UtcNow };
        db.Playlists.Add(playlist);
        await db.SaveChangesAsync();
        var controller = CreateController(db, Guid.NewGuid());

        var result = await controller.Update(
            playlist.Id,
            new UpdatePlaylistRequestDto { Title = "Changed", Description = "" },
            CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
        Assert.Equal("Private", db.Playlists.Single().Title);
    }

    private static AppDbContext CreateDb() => new(
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static PlaylistsController CreateController(AppDbContext db, Guid userId)
    {
        var controller = new PlaylistsController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())],
                    "tests"))
            }
        };
        return controller;
    }
}
