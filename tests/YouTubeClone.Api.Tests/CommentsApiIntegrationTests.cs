using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.DTOs.Comments;

namespace YouTubeClone.Api.Tests;

public sealed class CommentsApiIntegrationTests : IClassFixture<AuthApiFactory>
{
    private readonly AuthApiFactory _factory;

    public CommentsApiIntegrationTests(AuthApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Comment_reply_and_reaction_round_trip_through_api()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(client, "Comment Author");
        Authorize(client, auth.AccessToken);

        var videoId = Guid.NewGuid();
        var created = await CreateCommentAsync(
            client,
            videoId,
            "First comment");

        Assert.Empty(created.Replies);

        var likeResponse = await client.PostAsJsonAsync(
            $"/api/v1/comments/{created.Id}/reaction",
            new { reaction = "like" });

        Assert.Equal(HttpStatusCode.OK, likeResponse.StatusCode);
        var liked = await likeResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(liked);
        Assert.Equal(1, liked.Likes);
        Assert.Equal("like", liked.Reaction);

        var toggleOffResponse = await client.PostAsJsonAsync(
            $"/api/v1/comments/{created.Id}/reaction",
            new { reaction = "like" });

        Assert.Equal(HttpStatusCode.OK, toggleOffResponse.StatusCode);
        var toggledOff = await toggleOffResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(toggledOff);
        Assert.Equal(0, toggledOff.Likes);
        Assert.Null(toggledOff.Reaction);

        var reply = await CreateCommentAsync(
            client,
            videoId,
            "Reply",
            created.Id);

        Assert.Equal(created.Id, reply.ParentCommentId);

        var comments = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments");

        var root = Assert.Single(comments!);
        var loadedReply = Assert.Single(root.Replies);
        Assert.Equal("Reply", loadedReply.Text);
        Assert.Equal(created.Id, loadedReply.ParentCommentId);
    }

    [Fact]
    public async Task Owner_can_edit_and_delete_comment_tree()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(client, "Owner");
        Authorize(client, auth.AccessToken);

        var videoId = Guid.NewGuid();
        var root = await CreateCommentAsync(
            client,
            videoId,
            "Original");
        await CreateCommentAsync(
            client,
            videoId,
            "Child reply",
            root.Id);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/comments/{root.Id}",
            new { text = "Updated root" });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(updated);
        Assert.Equal("Updated root", updated.Text);
        Assert.Single(updated.Replies);

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/comments/{root.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var remaining = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments");

        Assert.NotNull(remaining);
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task Other_user_cannot_edit_or_delete_comment()
    {
        using var ownerClient = _factory.CreateClient();
        var ownerAuth = await RegisterAsync(ownerClient, "Owner");
        Authorize(ownerClient, ownerAuth.AccessToken);

        var videoId = Guid.NewGuid();
        var comment = await CreateCommentAsync(
            ownerClient,
            videoId,
            "Protected comment");

        using var otherClient = _factory.CreateClient();
        var otherAuth = await RegisterAsync(otherClient, "Other User");
        Authorize(otherClient, otherAuth.AccessToken);

        var updateResponse = await otherClient.PutAsJsonAsync(
            $"/api/v1/comments/{comment.Id}",
            new { text = "Unauthorized edit" });
        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);

        var deleteResponse = await otherClient.DeleteAsync(
            $"/api/v1/comments/{comment.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);

        var comments = await ownerClient.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments");

        var remaining = Assert.Single(comments!);
        Assert.Equal("Protected comment", remaining.Text);
    }

    [Fact]
    public async Task Comments_support_sorting_and_pagination()
    {
        using var client = _factory.CreateClient();
        var auth = await RegisterAsync(client, "Sorter");
        Authorize(client, auth.AccessToken);

        var videoId = Guid.NewGuid();
        var first = await CreateCommentAsync(client, videoId, "First");
        var second = await CreateCommentAsync(client, videoId, "Second");
        var third = await CreateCommentAsync(client, videoId, "Third");

        var likeResponse = await client.PostAsJsonAsync(
            $"/api/v1/comments/{second.Id}/reaction",
            new { reaction = "like" });
        Assert.Equal(HttpStatusCode.OK, likeResponse.StatusCode);

        var top = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments?page=1&pageSize=3&sort=top");

        Assert.NotNull(top);
        Assert.Equal(3, top.Count);
        Assert.Equal(second.Id, top[0].Id);

        var newestPageOne = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments?page=1&pageSize=2&sort=newest");
        var newestPageTwo = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments?page=2&pageSize=2&sort=newest");

        Assert.NotNull(newestPageOne);
        Assert.NotNull(newestPageTwo);
        Assert.Equal(2, newestPageOne.Count);
        Assert.Single(newestPageTwo);

        var pagedIds = newestPageOne
            .Concat(newestPageTwo)
            .Select(item => item.Id)
            .ToHashSet();

        Assert.Equal(3, pagedIds.Count);
        Assert.Contains(first.Id, pagedIds);
        Assert.Contains(second.Id, pagedIds);
        Assert.Contains(third.Id, pagedIds);

        var oldest = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments?page=1&pageSize=3&sort=oldest");

        Assert.NotNull(oldest);
        Assert.Equal(first.Id, oldest[0].Id);
    }

    [Fact]
    public async Task Guest_can_read_comments_but_cannot_create_one()
    {
        using var client = _factory.CreateClient();
        var videoId = Guid.NewGuid();

        var listResponse = await client.GetAsync(
            $"/api/v1/videos/{videoId}/comments");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/videos/{videoId}/comments",
            new { text = "Guest comment" });

        Assert.Equal(HttpStatusCode.Unauthorized, createResponse.StatusCode);
    }

    private static async Task<CommentResponseDto> CreateCommentAsync(
        HttpClient client,
        Guid videoId,
        string text,
        Guid? parentCommentId = null)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/videos/{videoId}/comments",
            new
            {
                text,
                parentCommentId
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var comment = await response.Content.ReadFromJsonAsync<CommentResponseDto>();
        return Assert.IsType<CommentResponseDto>(comment);
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
                email = $"comments-{suffix}@example.com",
                password = "safe-password",
                displayName,
                userName = $"comment-{suffix}"
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
