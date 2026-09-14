using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class UploadRegressionApiTests : IClassFixture<AuthApiFactory>
{
    private static readonly Guid DemoVideoId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private readonly AuthApiFactory _factory;

    public UploadRegressionApiTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task First_upload_for_user_without_channel_creates_channel_probes_and_persists_video()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(client);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(
                await db.Channels.AnyAsync(channel => channel.OwnerId == auth.User.Id));
        }

        var demoVideoPath = FindDemoVideoPath();

        using var form = new MultipartFormDataContent();
        await using var source = File.OpenRead(demoVideoPath);
        using var file = new StreamContent(source);
        file.Headers.ContentType = new MediaTypeHeaderValue("video/mp4");

        form.Add(file, "file", "first-upload.mp4");
        form.Add(new StringContent("First upload regression"), "title");
        form.Add(new StringContent("Regression upload through ffprobe."), "description");
        form.Add(new StringContent("Education"), "category");

        var uploadResponse = await client.PostAsync(
            "/api/v1/videos/upload",
            form);

        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        using var uploadDocument = JsonDocument.Parse(
            await uploadResponse.Content.ReadAsStringAsync());
        var uploaded = uploadDocument.RootElement;
        var videoId = uploaded.GetProperty("id").GetGuid();
        var channelId = uploaded.GetProperty("channelId").GetGuid();

        Assert.NotEqual(Guid.Empty, videoId);
        Assert.NotEqual(Guid.Empty, channelId);
        Assert.Equal("First upload regression", uploaded.GetProperty("title").GetString());
        Assert.Equal(6, uploaded.GetProperty("durationSeconds").GetInt32());

        var channelResponse = await client.GetAsync("/api/v1/channels/me");
        Assert.Equal(HttpStatusCode.OK, channelResponse.StatusCode);

        using var channelDocument = JsonDocument.Parse(
            await channelResponse.Content.ReadAsStringAsync());
        Assert.Equal(channelId, channelDocument.RootElement.GetProperty("id").GetGuid());

        var videoResponse = await client.GetAsync($"/api/v1/videos/{videoId}");
        Assert.Equal(HttpStatusCode.OK, videoResponse.StatusCode);

        using var videoDocument = JsonDocument.Parse(
            await videoResponse.Content.ReadAsStringAsync());
        Assert.Equal(videoId, videoDocument.RootElement.GetProperty("id").GetGuid());
        Assert.Equal(channelId, videoDocument.RootElement.GetProperty("channelId").GetGuid());
        Assert.Equal(6, videoDocument.RootElement.GetProperty("durationSeconds").GetInt32());

        using var streamRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/v1/videos/{videoId}/stream");
        streamRequest.Headers.Range = new RangeHeaderValue(0, 1023);

        var streamResponse = await client.SendAsync(streamRequest);
        Assert.Equal(HttpStatusCode.PartialContent, streamResponse.StatusCode);
        Assert.True((await streamResponse.Content.ReadAsByteArrayAsync()).Length > 0);
    }

    private static async Task<AuthResponseDto> RegisterAsync(HttpClient client)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"upload-{suffix}@example.com",
                password = "safe-password",
                displayName = "Upload Regression",
                userName = $"upload-{suffix}"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return Assert.IsType<AuthResponseDto>(auth);
    }

    private static string FindDemoVideoPath()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(
                directory.FullName,
                "backend",
                "Storage",
                "media",
                "videos",
                $"{DemoVideoId}.mp4");

            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException(
            "Bundled demo MP4 was not found for upload regression testing.");
    }
}
