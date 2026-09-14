using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.DTOs.Channels;

namespace YouTubeClone.Api.Tests;

public sealed class ChannelsApiIntegrationTests : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory;

    public ChannelsApiIntegrationTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Subscribe_and_unsubscribe_updates_channel_state()
    {
        using var ownerClient = _factory.CreateClient();
        var ownerAuth = await RegisterAsync(
            ownerClient,
            "Owner");
        Authorize(ownerClient, ownerAuth.AccessToken);

        var ownerChannel = await ownerClient.GetFromJsonAsync<ChannelResponseDto>(
            "/api/v1/channels/me");

        Assert.NotNull(ownerChannel);
        Assert.True(ownerChannel.IsOwner);
        Assert.Equal(0, ownerChannel.SubscriberCount);

        using var subscriberClient = _factory.CreateClient();
        var subscriberAuth = await RegisterAsync(
            subscriberClient,
            "Subscriber");
        Authorize(subscriberClient, subscriberAuth.AccessToken);

        var subscribeResponse = await subscriberClient.PostAsync(
            $"/api/v1/channels/{ownerChannel.Id}/subscribe",
            null);

        Assert.Equal(HttpStatusCode.NoContent, subscribeResponse.StatusCode);

        var subscriptions = await subscriberClient.GetFromJsonAsync<List<ChannelResponseDto>>(
            "/api/v1/channels/subscriptions");

        var subscribedChannel = Assert.Single(subscriptions!);
        Assert.Equal(ownerChannel.Id, subscribedChannel.Id);
        Assert.True(subscribedChannel.IsSubscribed);
        Assert.Equal(1, subscribedChannel.SubscriberCount);

        var channelAfterSubscribe = await subscriberClient.GetFromJsonAsync<ChannelResponseDto>(
            $"/api/v1/channels/{ownerChannel.Id}");

        Assert.NotNull(channelAfterSubscribe);
        Assert.True(channelAfterSubscribe.IsSubscribed);
        Assert.Equal(1, channelAfterSubscribe.SubscriberCount);

        var unsubscribeResponse = await subscriberClient.DeleteAsync(
            $"/api/v1/channels/{ownerChannel.Id}/subscribe");

        Assert.Equal(HttpStatusCode.NoContent, unsubscribeResponse.StatusCode);

        var channelAfterUnsubscribe = await subscriberClient.GetFromJsonAsync<ChannelResponseDto>(
            $"/api/v1/channels/{ownerChannel.Id}");

        Assert.NotNull(channelAfterUnsubscribe);
        Assert.False(channelAfterUnsubscribe.IsSubscribed);
        Assert.Equal(0, channelAfterUnsubscribe.SubscriberCount);
    }

    [Fact]
    public async Task User_cannot_subscribe_to_own_channel()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(
            client,
            "Self Subscribe");
        Authorize(client, auth.AccessToken);

        var channel = await client.GetFromJsonAsync<ChannelResponseDto>(
            "/api/v1/channels/me");

        Assert.NotNull(channel);

        var response = await client.PostAsync(
            $"/api/v1/channels/{channel.Id}/subscribe",
            null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<AuthResponseDto> RegisterAsync(
        HttpClient client,
        string displayName)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"channels-{suffix}@example.com",
                password = "safe-password",
                displayName,
                userName = $"channel-{suffix}"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return Assert.IsType<AuthResponseDto>(auth);
    }

    private static void Authorize(
        HttpClient client,
        string accessToken)
    {
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                accessToken);
    }
}
