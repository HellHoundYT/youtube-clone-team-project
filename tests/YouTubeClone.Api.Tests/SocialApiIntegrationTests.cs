using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using YouTubeClone.Api.DTOs.Auth;

namespace YouTubeClone.Api.Tests;

public sealed class SocialApiIntegrationTests :
    IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory;

    public SocialApiIntegrationTests(
        AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Friend_request_acceptance_search_and_watch_party_invite_are_persisted()
    {
        using var aliceClient =
            _factory.CreateClient();

        using var bobClient =
            _factory.CreateClient();

        var alice =
            await RegisterAsync(
                aliceClient,
                "Alice Social");

        var bob =
            await RegisterAsync(
                bobClient,
                "Bob Social");

        var searchResponse =
            await aliceClient.GetAsync(
                "/api/v1/social/users?query=Bob%20Social");

        Assert.Equal(
            HttpStatusCode.OK,
            searchResponse.StatusCode);

        var search =
            await searchResponse.Content
                .ReadFromJsonAsync<JsonElement[]>();

        Assert.NotNull(search);

        Assert.Contains(
            search!,
            item =>
                item.GetProperty("id")
                    .GetGuid() ==
                bob.User.Id);

        var requestResponse =
            await aliceClient.PostAsync(
                $"/api/v1/social/requests/{bob.User.Id}",
                null);

        Assert.Equal(
            HttpStatusCode.OK,
            requestResponse.StatusCode);

        var bobOverviewResponse =
            await bobClient.GetAsync(
                "/api/v1/social/overview");

        Assert.Equal(
            HttpStatusCode.OK,
            bobOverviewResponse.StatusCode);

        using var bobOverview =
            JsonDocument.Parse(
                await bobOverviewResponse.Content
                    .ReadAsStringAsync());

        var incoming =
            bobOverview.RootElement
                .GetProperty(
                    "incomingRequests");

        Assert.Equal(
            1,
            incoming.GetArrayLength());

        var requestId =
            incoming[0]
                .GetProperty("id")
                .GetGuid();

        var acceptResponse =
            await bobClient.PostAsync(
                $"/api/v1/social/requests/{requestId}/accept",
                null);

        Assert.Equal(
            HttpStatusCode.OK,
            acceptResponse.StatusCode);

        var aliceOverviewResponse =
            await aliceClient.GetAsync(
                "/api/v1/social/overview");

        using var aliceOverview =
            JsonDocument.Parse(
                await aliceOverviewResponse.Content
                    .ReadAsStringAsync());

        Assert.Contains(
            aliceOverview.RootElement
                .GetProperty("friends")
                .EnumerateArray(),
            item =>
                item.GetProperty("id")
                    .GetGuid() ==
                bob.User.Id);

        var inviteResponse =
            await aliceClient.PostAsJsonAsync(
                "/api/v1/social/watch-party-invites",
                new
                {
                    friendId =
                        bob.User.Id,
                    roomCode =
                        "ABC123"
                });

        Assert.Equal(
            HttpStatusCode.OK,
            inviteResponse.StatusCode);

        var notificationsResponse =
            await bobClient.GetAsync(
                "/api/v1/social/notifications");

        Assert.Equal(
            HttpStatusCode.OK,
            notificationsResponse.StatusCode);

        var notifications =
            await notificationsResponse.Content
                .ReadFromJsonAsync<JsonElement[]>();

        Assert.NotNull(
            notifications);

        Assert.Contains(
            notifications!,
            item =>
                item.GetProperty("type")
                    .GetString() ==
                    "WatchPartyInvite" &&
                item.GetProperty("targetPath")
                    .GetString() ==
                    "/watch-party/ABC123");
    }

    private static async Task<AuthResponseDto> RegisterAsync(
        HttpClient client,
        string displayName)
    {
        var response =
            await client.PostAsJsonAsync(
                "/api/v1/auth/register",
                new
                {
                    email =
                        $"social-{Guid.NewGuid():N}@example.com",
                    password =
                        "safe-password",
                    displayName
                });

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        var auth =
            await response.Content
                .ReadFromJsonAsync<AuthResponseDto>();

        Assert.NotNull(
            auth);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                auth.AccessToken);

        return auth;
    }
}
