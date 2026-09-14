using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Favorites.Contracts;
using YouTubeClone.Application.Features.History.Contracts;
using Xunit;

namespace YouTubeClone.Api.Tests.Integration;

public sealed class PersonalLibraryIsolationApiTests
{
    private static readonly Guid VideoId =
        Guid.Parse(
            "11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task PersonalLibraryEndpoints_RequireAuthentication()
    {
        using var factory = new AuthApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/v1/history")).StatusCode);

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/v1/favorites")).StatusCode);
    }

    [Fact]
    public async Task HistoryFavoritesAndPauseState_AreIsolatedBetweenUsers()
    {
        using var factory = new AuthApiFactory();
        using var userA = await CreateAuthenticatedClientAsync(factory, "user-a");
        using var userB = await CreateAuthenticatedClientAsync(factory, "user-b");

        var historyResponse = await userA.PutAsJsonAsync(
            $"/api/v1/history/{VideoId}",
            new
            {
                progressSeconds = 35,
                completed = false
            });

        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);

        var favoriteResponse = await userA.PostAsync(
            $"/api/v1/favorites/{VideoId}",
            null);

        Assert.Equal(HttpStatusCode.OK, favoriteResponse.StatusCode);

        var userAHistory = await userA.GetFromJsonAsync<List<WatchHistoryItemDto>>(
            "/api/v1/history");
        var userBHistory = await userB.GetFromJsonAsync<List<WatchHistoryItemDto>>(
            "/api/v1/history");

        Assert.NotNull(userAHistory);
        Assert.Contains(userAHistory, item => item.VideoId == VideoId);
        Assert.NotNull(userBHistory);
        Assert.DoesNotContain(userBHistory, item => item.VideoId == VideoId);

        var userAFavorites = await userA.GetFromJsonAsync<List<FavoriteItemDto>>(
            "/api/v1/favorites");
        var userBFavorites = await userB.GetFromJsonAsync<List<FavoriteItemDto>>(
            "/api/v1/favorites");

        Assert.NotNull(userAFavorites);
        Assert.Contains(userAFavorites, item => item.VideoId == VideoId);
        Assert.NotNull(userBFavorites);
        Assert.DoesNotContain(userBFavorites, item => item.VideoId == VideoId);

        var pauseResponse = await userB.PutAsJsonAsync(
            "/api/v1/history/status",
            new { isPaused = true });

        Assert.Equal(HttpStatusCode.OK, pauseResponse.StatusCode);

        var userAStatus = await userA.GetFromJsonAsync<HistoryStatusDto>(
            "/api/v1/history/status");
        var userBStatus = await userB.GetFromJsonAsync<HistoryStatusDto>(
            "/api/v1/history/status");

        Assert.False(userAStatus?.IsPaused);
        Assert.True(userBStatus?.IsPaused);
    }

    private static async Task<HttpClient> CreateAuthenticatedClientAsync(
        AuthApiFactory factory,
        string prefix)
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"{prefix}-{Guid.NewGuid():N}@example.com",
                password = "safe-password",
                displayName = prefix
            });

        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                auth.AccessToken);

        return client;
    }
}
