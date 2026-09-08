using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.Controllers;

namespace YouTubeClone.Api.Tests;

public sealed class ChannelsApiIntegrationTests : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client;
    public ChannelsApiIntegrationTests(AuthApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Authenticated_user_can_create_subscribe_and_unsubscribe()
    {
        var auth = await RegisterAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        var create = await _client.PostAsJsonAsync("/api/v1/channels", new { name = "Test channel", handle = $"test-{Guid.NewGuid():N}", description = "A test channel" });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var channel = await create.Content.ReadFromJsonAsync<ChannelResponse>();
        Assert.NotNull(channel);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync($"/api/v1/channels/{channel.Id}/subscribe", null)).StatusCode);
        var subscriptions = await _client.GetFromJsonAsync<List<ChannelResponse>>("/api/v1/channels/subscriptions");
        Assert.Contains(subscriptions!, item => item.Id == channel.Id);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/v1/channels/{channel.Id}/subscribe")).StatusCode);
    }

    private async Task<AuthResponseDto> RegisterAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { email = $"channel-{Guid.NewGuid():N}@example.com", password = "safe-password", displayName = "Channel owner" });
        return (await response.Content.ReadFromJsonAsync<AuthResponseDto>())!;
    }
}
