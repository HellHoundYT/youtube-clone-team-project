using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.DTOs.Channels;

namespace YouTubeClone.Api.Tests;

public sealed class DemoVideoChannelsApiTests : IClassFixture<AuthApiFactory>
{
    private static readonly Guid[] DemoVideoChannelIds =
    [
        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
        Guid.Parse("12121212-1212-1212-1212-121212121212")
    ];

    private readonly AuthApiFactory _factory;

    public DemoVideoChannelsApiTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Every_demo_video_channel_resolves()
    {
        using var client = _factory.CreateClient();

        foreach (var channelId in DemoVideoChannelIds)
        {
            var response = await client.GetAsync(
                $"/api/v1/channels/{channelId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var channel = await response.Content
                .ReadFromJsonAsync<ChannelResponseDto>();

            Assert.NotNull(channel);
            Assert.Equal(channelId, channel.Id);
        }
    }

    [Fact]
    public async Task Authenticated_user_can_subscribe_to_demo_video_channel()
    {
        using var client = _factory.CreateClient();
        var suffix = Guid.NewGuid().ToString("N");

        var registerResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"demo-subscribe-{suffix}@example.com",
                password = "safe-password",
                displayName = "Demo Subscriber",
                userName = $"demo-subscribe-{suffix}"
            });

        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        var auth = await registerResponse.Content
            .ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var channelId = DemoVideoChannelIds[0];
        var subscribe = await client.PostAsync(
            $"/api/v1/channels/{channelId}/subscribe",
            null);

        Assert.Equal(HttpStatusCode.NoContent, subscribe.StatusCode);

        var channel = await client.GetFromJsonAsync<ChannelResponseDto>(
            $"/api/v1/channels/{channelId}");

        Assert.NotNull(channel);
        Assert.True(channel.IsSubscribed);

        var unsubscribe = await client.DeleteAsync(
            $"/api/v1/channels/{channelId}/subscribe");

        Assert.Equal(HttpStatusCode.NoContent, unsubscribe.StatusCode);
    }
}
