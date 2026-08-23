using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using YouTubeClone.Api.Controllers;
using Xunit;

namespace YouTubeClone.Api.Tests.Integration;

public sealed class ApiIntegrationTests
{
    private static readonly Guid VideoId =
        Guid.Parse(
            "11111111-1111-1111-1111-111111111111");

    private static readonly Guid StreamId =
        Guid.Parse(
            "83333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task VideosApi_ReturnsSeedVideo_AndRegistersView()
    {
        using var factory =
            CreateFactory();

        using var client =
            factory.CreateClient();

        var listResponse =
            await client.GetAsync(
                "/api/v1/videos?page=1&pageSize=5");

        Assert.Equal(
            HttpStatusCode.OK,
            listResponse.StatusCode);

        using var listDocument =
            JsonDocument.Parse(
                await listResponse.Content
                    .ReadAsStringAsync());

        Assert.Equal(
            JsonValueKind.Array,
            listDocument.RootElement.ValueKind);

        Assert.NotEmpty(
            listDocument.RootElement
                .EnumerateArray());

        var beforeResponse =
            await client.GetAsync(
                $"/api/v1/videos/{VideoId}");

        Assert.Equal(
            HttpStatusCode.OK,
            beforeResponse.StatusCode);

        using var beforeDocument =
            JsonDocument.Parse(
                await beforeResponse.Content
                    .ReadAsStringAsync());

        var beforeRoot =
            beforeDocument.RootElement;

        Assert.Equal(
            VideoId.ToString(),
            beforeRoot
                .GetProperty("id")
                .GetString());

        Assert.Equal(
            "Midnight City",
            beforeRoot
                .GetProperty("title")
                .GetString());

        var initialViewCount =
            beforeRoot
                .GetProperty("viewCount")
                .GetInt64();

        var viewResponse =
            await client.PostAsync(
                $"/api/v1/videos/{VideoId}/view",
                null);

        Assert.Equal(
            HttpStatusCode.NoContent,
            viewResponse.StatusCode);

        var afterResponse =
            await client.GetAsync(
                $"/api/v1/videos/{VideoId}");

        Assert.Equal(
            HttpStatusCode.OK,
            afterResponse.StatusCode);

        using var afterDocument =
            JsonDocument.Parse(
                await afterResponse.Content
                    .ReadAsStringAsync());

        Assert.Equal(
            initialViewCount + 1,
            afterDocument.RootElement
                .GetProperty("viewCount")
                .GetInt64());
    }

    [Fact]
    public async Task HistoryApi_StoresAndReturnsPlaybackProgress()
    {
        using var factory =
            CreateFactory();

        using var client =
            factory.CreateClient();

        var updateResponse =
            await client.PutAsJsonAsync(
                $"/api/v1/history/{VideoId}",
                new
                {
                    progressSeconds = 42,
                    completed = false
                });

        Assert.Equal(
            HttpStatusCode.OK,
            updateResponse.StatusCode);

        using var updateDocument =
            JsonDocument.Parse(
                await updateResponse.Content
                    .ReadAsStringAsync());

        var updatedItem =
            updateDocument.RootElement;

        Assert.Equal(
            VideoId.ToString(),
            updatedItem
                .GetProperty("videoId")
                .GetString());

        Assert.Equal(
            42,
            updatedItem
                .GetProperty("progressSeconds")
                .GetInt32());

        Assert.False(
            updatedItem
                .GetProperty("completed")
                .GetBoolean());

        var historyResponse =
            await client.GetAsync(
                "/api/v1/history");

        Assert.Equal(
            HttpStatusCode.OK,
            historyResponse.StatusCode);

        using var historyDocument =
            JsonDocument.Parse(
                await historyResponse.Content
                    .ReadAsStringAsync());

        var historyItems =
            historyDocument.RootElement
                .EnumerateArray()
                .ToList();

        Assert.Contains(
            historyItems,
            item =>
                item
                    .GetProperty("videoId")
                    .GetString() ==
                VideoId.ToString() &&
                item
                    .GetProperty("progressSeconds")
                    .GetInt32() ==
                42);

        var clearResponse =
            await client.DeleteAsync(
                "/api/v1/history");

        Assert.Equal(
            HttpStatusCode.NoContent,
            clearResponse.StatusCode);
    }

    [Fact]
    public async Task FavoritesApi_AddsListsAndRemovesVideo()
    {
        using var factory =
            CreateFactory();

        using var client =
            factory.CreateClient();

        var addResponse =
            await client.PostAsync(
                $"/api/v1/favorites/{VideoId}",
                null);

        Assert.Equal(
            HttpStatusCode.OK,
            addResponse.StatusCode);

        using var addDocument =
            JsonDocument.Parse(
                await addResponse.Content
                    .ReadAsStringAsync());

        Assert.Equal(
            VideoId.ToString(),
            addDocument.RootElement
                .GetProperty("videoId")
                .GetString());

        var listResponse =
            await client.GetAsync(
                "/api/v1/favorites");

        Assert.Equal(
            HttpStatusCode.OK,
            listResponse.StatusCode);

        using var listDocument =
            JsonDocument.Parse(
                await listResponse.Content
                    .ReadAsStringAsync());

        Assert.Contains(
            listDocument.RootElement
                .EnumerateArray(),
            item =>
                item
                    .GetProperty("videoId")
                    .GetString() ==
                VideoId.ToString());

        var removeResponse =
            await client.DeleteAsync(
                $"/api/v1/favorites/{VideoId}");

        Assert.Equal(
            HttpStatusCode.NoContent,
            removeResponse.StatusCode);

        var afterRemoveResponse =
            await client.GetAsync(
                "/api/v1/favorites");

        using var afterRemoveDocument =
            JsonDocument.Parse(
                await afterRemoveResponse.Content
                    .ReadAsStringAsync());

        Assert.DoesNotContain(
            afterRemoveDocument.RootElement
                .EnumerateArray(),
            item =>
                item
                    .GetProperty("videoId")
                    .GetString() ==
                VideoId.ToString());
    }

    [Fact]
    public async Task StreamsApi_ReturnsLiveStreams_AndFiltersByCategory()
    {
        using var factory =
            CreateFactory();

        using var client =
            factory.CreateClient();

        var listResponse =
            await client.GetAsync(
                "/api/v1/streams");

        Assert.Equal(
            HttpStatusCode.OK,
            listResponse.StatusCode);

        using var listDocument =
            JsonDocument.Parse(
                await listResponse.Content
                    .ReadAsStringAsync());

        Assert.True(
            listDocument.RootElement
                .GetArrayLength() >= 4);

        var categoryResponse =
            await client.GetAsync(
                "/api/v1/streams?category=Programming");

        Assert.Equal(
            HttpStatusCode.OK,
            categoryResponse.StatusCode);

        using var categoryDocument =
            JsonDocument.Parse(
                await categoryResponse.Content
                    .ReadAsStringAsync());

        var programmingStreams =
            categoryDocument.RootElement
                .EnumerateArray()
                .ToList();

        Assert.Single(
            programmingStreams);

        Assert.Equal(
            "Programming",
            programmingStreams[0]
                .GetProperty("category")
                .GetString());

        var detailsResponse =
            await client.GetAsync(
                $"/api/v1/streams/{StreamId}");

        Assert.Equal(
            HttpStatusCode.OK,
            detailsResponse.StatusCode);

        using var detailsDocument =
            JsonDocument.Parse(
                await detailsResponse.Content
                    .ReadAsStringAsync());

        Assert.Equal(
            "Late Night Coding Session",
            detailsDocument.RootElement
                .GetProperty("title")
                .GetString());

        Assert.True(
            detailsDocument.RootElement
                .GetProperty("isLive")
                .GetBoolean());
    }

    private static WebApplicationFactory<HealthController>
        CreateFactory()
    {
        return new WebApplicationFactory<
            HealthController>();
    }
}
