using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.Controllers;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class UsersControllerTests
{
    [Fact]
    public async Task UpdateMe_persists_avatar_and_theme_preferences()
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new User
        {
            Id = Guid.NewGuid(), Email = "profile@example.com", UserName = "profile",
            DisplayName = "Profile", Bio = string.Empty, PasswordHash = "hash"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var controller = new UsersController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString())], "tests"))
            }
        };

        var result = await controller.UpdateMe(new UpdateCurrentUserRequestDto
        {
            Email = user.Email, DisplayName = user.DisplayName, Handle = "@profile", Bio = "Updated",
            AvatarDataUrl = "data:image/png;base64,AA==", ThemeId = "cyber-red"
        }, CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<CurrentUserDto>(response.Value);
        Assert.Equal("data:image/png;base64,AA==", payload.AvatarDataUrl);
        Assert.Equal("cyber-red", payload.ThemeId);
        var saved = await db.Users.SingleAsync();
        Assert.Equal(payload.AvatarDataUrl, saved.AvatarDataUrl);
        Assert.Equal(payload.ThemeId, saved.ThemeId);
    }
}
