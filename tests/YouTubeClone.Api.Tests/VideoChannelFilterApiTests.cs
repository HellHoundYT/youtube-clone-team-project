using System.Net;
using System.Text.Json;
using Xunit;

namespace YouTubeClone.Api.Tests.Integration;

public sealed class VideoChannelFilterApiTests
{
    private static readonly Guid MusicChannelId =
        Guid.Parse(
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task VideosApi_FiltersCatalogByChannel()
    {
        using var factory =
            new AuthApiFactory();

        using var client =
            factory.CreateClient();

        var response =
            await client.GetAsync(
                $"/api/v1/videos?page=1&pageSize=50&channelId={MusicChannelId}");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var document =
            JsonDocument.Parse(
                await response.Content
                    .ReadAsStringAsync());

        var videos =
            document.RootElement
                .EnumerateArray()
                .ToList();

        Assert.Equal(
            2,
            videos.Count);

        Assert.All(
            videos,
            video =>
                Assert.Equal(
                    MusicChannelId.ToString(),
                    video
                        .GetProperty("channelId")
                        .GetString()));
    }
}
