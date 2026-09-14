using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using YouTubeClone.Api.Controllers;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Auth;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class AuthControllerTests
{
    [Fact]
    public async Task Register_creates_user_and_returns_access_token_with_refresh_cookie()
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
        Assert.StartsWith(
            "amtlis.refresh_token=",
            GetLatestRefreshCookie(controller));
        Assert.Single(db.Users);
        Assert.Single(db.RefreshTokens);
    }

    [Fact]
    public async Task Register_rejects_duplicate_email()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);
        var request = new RegisterRequestDto
        {
            Email = "tanya@example.com",
            UserName = "tanya",
            DisplayName = "Tanya",
            Password = "safe-password"
        };

        await controller.Register(
            request,
            CancellationToken.None);

        var result = await controller.Register(
            new RegisterRequestDto
            {
                Email = "TANYA@example.com",
                UserName = "another",
                DisplayName = "Another",
                Password = "safe-password"
            },
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_rejects_invalid_password()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);

        await controller.Register(
            new RegisterRequestDto
            {
                Email = "tanya@example.com",
                UserName = "tanya",
                DisplayName = "Tanya",
                Password = "safe-password"
            },
            CancellationToken.None);

        var result = await controller.Login(
            new LoginRequestDto
            {
                Email = "tanya@example.com",
                Password = "wrong-password"
            },
            CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Refresh_rotates_refresh_cookie()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);

        var registration = await controller.Register(
            new RegisterRequestDto
            {
                Email = "tanya@example.com",
                UserName = "tanya",
                DisplayName = "Tanya",
                Password = "safe-password"
            },
            CancellationToken.None);

        Assert.IsType<AuthResponseDto>(
            Assert.IsType<OkObjectResult>(registration.Result).Value);

        var firstCookie = GetLatestRefreshCookie(controller);
        SetRefreshCookie(controller, firstCookie);

        var refresh = await controller.Refresh(
            CancellationToken.None);

        Assert.IsType<AuthResponseDto>(
            Assert.IsType<OkObjectResult>(refresh.Result).Value);

        var secondCookie = GetLatestRefreshCookie(controller);
        Assert.NotEqual(firstCookie, secondCookie);

        SetRefreshCookie(controller, firstCookie);

        var reused = await controller.Refresh(
            CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(reused.Result);
    }

    [Fact]
    public async Task Logout_revokes_refresh_token_from_cookie()
    {
        await using var db = CreateDb();
        var controller = CreateController(db);

        var registration = await controller.Register(
            new RegisterRequestDto
            {
                Email = "tanya@example.com",
                UserName = "tanya",
                DisplayName = "Tanya",
                Password = "safe-password"
            },
            CancellationToken.None);

        Assert.IsType<AuthResponseDto>(
            Assert.IsType<OkObjectResult>(registration.Result).Value);

        SetRefreshCookie(
            controller,
            GetLatestRefreshCookie(controller));

        var logout = await controller.Logout(
            CancellationToken.None);

        Assert.IsType<NoContentResult>(logout);
        Assert.NotNull(db.RefreshTokens.Single().RevokedAt);
    }

    private static AppDbContext CreateDb() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options);

    private static AuthController CreateController(AppDbContext db)
    {
        var repository = new EfUserAccountRepository(db);
        var passwordService = new AspNetPasswordService(
            new PasswordHasher<User>());
        var tokenService = new JwtAuthTokenService(
            CreateConfiguration());
        var authService = new AuthService(
            repository,
            passwordService,
            tokenService);
        var controller = new AuthController(authService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        return controller;
    }

    private static IConfiguration CreateConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Jwt:Issuer"] = "tests",
                    ["Jwt:Audience"] = "tests",
                    ["Jwt:SigningKey"] =
                        "a-test-signing-key-that-is-long-enough-for-hmac-sha256",
                    ["Jwt:AccessTokenMinutes"] = "15",
                    ["Jwt:RefreshTokenDays"] = "14"
                })
            .Build();

    private static string GetLatestRefreshCookie(
        ControllerBase controller)
    {
        var header = controller.Response.Headers.SetCookie
            .Last(value =>
                value is not null &&
                value.StartsWith(
                    "amtlis.refresh_token=",
                    StringComparison.Ordinal))!;

        return header.Split(';', 2)[0];
    }

    private static void SetRefreshCookie(
        ControllerBase controller,
        string cookie)
    {
        controller.Request.Headers.Cookie = cookie;
    }
}
