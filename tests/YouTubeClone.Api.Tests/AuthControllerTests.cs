using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using YouTubeClone.Api.Controllers;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class AuthControllerTests
{
    [Fact]
    public async Task Register_creates_user_and_returns_tokens()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);

        var result = await controller.Register(
            new RegisterRequestDto
            {
                Email = "tanya@example.com",
                UserName = "tanya",
                DisplayName = "Tanya",
                Password = "safe-password"
            },
            CancellationToken.None);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<AuthResponseDto>(response.Value);
        Assert.Equal("tanya@example.com", payload.User.Email);
        Assert.NotEmpty(payload.AccessToken);
        Assert.NotEmpty(payload.RefreshToken);
        Assert.Single(db.Users);
        Assert.Single(db.RefreshTokens);
    }

    [Fact]
    public async Task Register_rejects_duplicate_email()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);
        var request = new RegisterRequestDto { Email = "tanya@example.com", UserName = "tanya", DisplayName = "Tanya", Password = "safe-password" };
        await controller.Register(request, CancellationToken.None);

        var result = await controller.Register(
            new RegisterRequestDto { Email = "TANYA@example.com", UserName = "another", DisplayName = "Another", Password = "safe-password" },
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_rejects_invalid_password()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);
        await controller.Register(new RegisterRequestDto { Email = "tanya@example.com", UserName = "tanya", DisplayName = "Tanya", Password = "safe-password" }, CancellationToken.None);

        var result = await controller.Login(new LoginRequestDto { Email = "tanya@example.com", Password = "wrong-password" }, CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Refresh_rotates_refresh_token()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);
        var registration = await controller.Register(
            new RegisterRequestDto { Email = "tanya@example.com", UserName = "tanya", DisplayName = "Tanya", Password = "safe-password" },
            CancellationToken.None);
        var first = Assert.IsType<AuthResponseDto>(Assert.IsType<OkObjectResult>(registration.Result).Value);

        var refresh = await controller.Refresh(
            new RefreshRequestDto { RefreshToken = first.RefreshToken },
            CancellationToken.None);

        var second = Assert.IsType<AuthResponseDto>(Assert.IsType<OkObjectResult>(refresh.Result).Value);
        Assert.NotEqual(first.RefreshToken, second.RefreshToken);

        var reused = await controller.Refresh(
            new RefreshRequestDto { RefreshToken = first.RefreshToken },
            CancellationToken.None);
        Assert.IsType<UnauthorizedObjectResult>(reused.Result);
    }

    [Fact]
    public async Task Logout_revokes_only_the_current_users_refresh_token()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);
        var registration = await controller.Register(
            new RegisterRequestDto { Email = "tanya@example.com", UserName = "tanya", DisplayName = "Tanya", Password = "safe-password" },
            CancellationToken.None);
        var payload = Assert.IsType<AuthResponseDto>(Assert.IsType<OkObjectResult>(registration.Result).Value);
        SetUser(controller, payload.User.Id);

        var logout = await controller.Logout(
            new RefreshRequestDto { RefreshToken = payload.RefreshToken },
            CancellationToken.None);

        Assert.IsType<NoContentResult>(logout);
        Assert.NotNull(db.RefreshTokens.Single().RevokedAt);
    }

    private static AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static AuthController CreateController(AppDbContext db) => new(
        db,
        new PasswordHasher<User>(),
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = "tests",
            ["Jwt:Audience"] = "tests",
            ["Jwt:SigningKey"] = "a-test-signing-key-that-is-long-enough-for-hmac-sha256",
            ["Jwt:AccessTokenMinutes"] = "15",
            ["Jwt:RefreshTokenDays"] = "14"
        }).Build());

    private static void SetUser(ControllerBase controller, Guid userId)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())],
                    "tests"))
            }
        };
    }
}
