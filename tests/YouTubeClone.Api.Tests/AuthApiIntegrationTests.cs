using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class AuthApiIntegrationTests : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client;

    public AuthApiIntegrationTests(AuthApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_then_get_current_user_returns_authenticated_user()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new { email = $"tanya-{Guid.NewGuid():N}@example.com", password = "safe-password", displayName = "Tanya" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var currentUser = await _client.GetAsync("/api/v1/users/me");

        Assert.Equal(HttpStatusCode.OK, currentUser.StatusCode);
        var user = await currentUser.Content.ReadFromJsonAsync<CurrentUserDto>();
        Assert.Equal(auth.User.Id, user?.Id);
    }
}

public sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Database:Provider", "InMemory");
    }
}
