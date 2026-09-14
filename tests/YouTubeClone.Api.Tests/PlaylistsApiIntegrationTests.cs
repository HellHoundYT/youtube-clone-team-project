using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.DTOs.Playlists;

namespace YouTubeClone.Api.Tests;

public sealed class PlaylistsApiIntegrationTests : IClassFixture<AuthApiFactory>
{
    private static readonly Guid VideoId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private readonly AuthApiFactory _factory;

    public PlaylistsApiIntegrationTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Playlist_crud_is_scoped_to_authenticated_user()
    {
        using var ownerClient = _factory.CreateClient();
        var ownerAuth = await RegisterAsync(ownerClient, "Owner");
        Authorize(ownerClient, ownerAuth.AccessToken);

        var createResponse = await ownerClient.PostAsJsonAsync(
            "/api/v1/playlists",
            new
            {
                title = "Frontend",
                description = "React videos"
            });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<PlaylistResponseDto>();
        Assert.NotNull(created);
        Assert.Equal("Frontend", created.Title);
        Assert.Empty(created.VideoIds);

        var list = await ownerClient.GetFromJsonAsync<List<PlaylistResponseDto>>(
            "/api/v1/playlists");
        Assert.Single(list!);

        var updateResponse = await ownerClient.PutAsJsonAsync(
            $"/api/v1/playlists/{created.Id}",
            new
            {
                title = "Backend",
                description = "ASP.NET Core videos"
            });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<PlaylistResponseDto>();
        Assert.NotNull(updated);
        Assert.Equal("Backend", updated.Title);

        using var otherClient = _factory.CreateClient();
        var otherAuth = await RegisterAsync(otherClient, "Other");
        Authorize(otherClient, otherAuth.AccessToken);

        var otherList = await otherClient.GetFromJsonAsync<List<PlaylistResponseDto>>(
            "/api/v1/playlists");
        Assert.Empty(otherList!);

        var forbiddenUpdate = await otherClient.PutAsJsonAsync(
            $"/api/v1/playlists/{created.Id}",
            new
            {
                title = "Taken",
                description = "Should not update"
            });
        Assert.Equal(HttpStatusCode.NotFound, forbiddenUpdate.StatusCode);

        var deleteResponse = await ownerClient.DeleteAsync(
            $"/api/v1/playlists/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var afterDelete = await ownerClient.GetFromJsonAsync<List<PlaylistResponseDto>>(
            "/api/v1/playlists");
        Assert.Empty(afterDelete!);
    }

    [Fact]
    public async Task Playlist_video_membership_is_idempotent_and_owner_scoped()
    {
        using var ownerClient = _factory.CreateClient();
        var ownerAuth = await RegisterAsync(ownerClient, "Playlist Owner");
        Authorize(ownerClient, ownerAuth.AccessToken);

        var createResponse = await ownerClient.PostAsJsonAsync(
            "/api/v1/playlists",
            new
            {
                title = "Night coding",
                description = "Videos for focused work"
            });
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<PlaylistResponseDto>();
        Assert.NotNull(created);

        var addResponse = await ownerClient.PostAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}",
            null);
        Assert.Equal(HttpStatusCode.NoContent, addResponse.StatusCode);

        var duplicateAddResponse = await ownerClient.PostAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}",
            null);
        Assert.Equal(HttpStatusCode.NoContent, duplicateAddResponse.StatusCode);

        var afterAdd = await ownerClient.GetFromJsonAsync<List<PlaylistResponseDto>>(
            "/api/v1/playlists");
        var ownerPlaylist = Assert.Single(afterAdd!);
        Assert.Equal(created.Id, ownerPlaylist.Id);
        Assert.Equal(new[] { VideoId }, ownerPlaylist.VideoIds);

        using var otherClient = _factory.CreateClient();
        var otherAuth = await RegisterAsync(otherClient, "Playlist Stranger");
        Authorize(otherClient, otherAuth.AccessToken);

        var forbiddenAdd = await otherClient.PostAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}",
            null);
        Assert.Equal(HttpStatusCode.NotFound, forbiddenAdd.StatusCode);

        var forbiddenRemove = await otherClient.DeleteAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}");
        Assert.Equal(HttpStatusCode.NotFound, forbiddenRemove.StatusCode);

        var removeResponse = await ownerClient.DeleteAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}");
        Assert.Equal(HttpStatusCode.NoContent, removeResponse.StatusCode);

        var duplicateRemoveResponse = await ownerClient.DeleteAsync(
            $"/api/v1/playlists/{created.Id}/videos/{VideoId}");
        Assert.Equal(HttpStatusCode.NoContent, duplicateRemoveResponse.StatusCode);

        var afterRemove = await ownerClient.GetFromJsonAsync<List<PlaylistResponseDto>>(
            "/api/v1/playlists");
        Assert.Empty(Assert.Single(afterRemove!).VideoIds);

        var missingVideoResponse = await ownerClient.PostAsync(
            $"/api/v1/playlists/{created.Id}/videos/{Guid.NewGuid()}",
            null);
        Assert.Equal(HttpStatusCode.BadRequest, missingVideoResponse.StatusCode);
    }

    [Fact]
    public async Task Guest_cannot_access_playlist_collection()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync(
            "/api/v1/playlists");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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
                email = $"playlists-{suffix}@example.com",
                password = "safe-password",
                displayName,
                userName = $"playlist-{suffix}"
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
