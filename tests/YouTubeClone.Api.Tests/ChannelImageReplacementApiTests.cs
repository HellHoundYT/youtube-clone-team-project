using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.DTOs.Channels;

namespace YouTubeClone.Api.Tests;

public sealed class ChannelImageReplacementApiTests :
    IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory;

    public ChannelImageReplacementApiTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Owner_can_replace_avatar_using_same_file_extension()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(client);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                auth.AccessToken);

        var channel = await client.GetFromJsonAsync<ChannelResponseDto>(
            "/api/v1/channels/me");

        Assert.NotNull(channel);

        var first = await UploadImageAsync(
            client,
            $"/api/v1/channels/{channel.Id}/avatar",
            "first.png");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await UploadImageAsync(
            client,
            $"/api/v1/channels/{channel.Id}/avatar",
            "second.png");

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        var updated = await second.Content
            .ReadFromJsonAsync<ChannelResponseDto>();

        Assert.NotNull(updated);
        Assert.NotNull(updated.AvatarUrl);

        var avatar = await client.GetAsync(updated.AvatarUrl);
        Assert.Equal(HttpStatusCode.OK, avatar.StatusCode);
    }

    private static async Task<AuthResponseDto> RegisterAsync(
        HttpClient client)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"channel-image-{suffix}@example.com",
                password = "safe-password",
                displayName = "Channel Image Test",
                userName = $"channel-image-{suffix}"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var auth = await response.Content
            .ReadFromJsonAsync<AuthResponseDto>();

        return Assert.IsType<AuthResponseDto>(auth);
    }

    private static async Task<HttpResponseMessage> UploadImageAsync(
        HttpClient client,
        string url,
        string fileName)
    {
        using var form = new MultipartFormDataContent();
        using var file = new ByteArrayContent(CreatePngBytes());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(file, "file", fileName);

        return await client.PostAsync(url, form);
    }

    private static byte[] CreatePngBytes() =>
    [
        0x89, 0x50, 0x4E, 0x47,
        0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x00
    ];
}
