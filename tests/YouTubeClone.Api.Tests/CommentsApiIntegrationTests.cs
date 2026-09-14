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
        var auth = await RegisterAsync(client);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                auth.AccessToken);

        var videoId = Guid.NewGuid();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/videos/{videoId}/comments",
            new
            {
                text = "First comment"
            });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(created);
        Assert.Equal("First comment", created.Text);
        Assert.Empty(created.Replies);

        var likeResponse = await client.PostAsJsonAsync(
            $"/api/v1/comments/{created.Id}/reaction",
            new
            {
                reaction = "like"
            });

        Assert.Equal(HttpStatusCode.OK, likeResponse.StatusCode);
        var liked = await likeResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(liked);
        Assert.Equal(1, liked.Likes);
        Assert.Equal("like", liked.Reaction);

        var toggleOffResponse = await client.PostAsJsonAsync(
            $"/api/v1/comments/{created.Id}/reaction",
            new
            {
                reaction = "like"
            });

        Assert.Equal(HttpStatusCode.OK, toggleOffResponse.StatusCode);
        var toggledOff = await toggleOffResponse.Content.ReadFromJsonAsync<CommentResponseDto>();
        Assert.NotNull(toggledOff);
        Assert.Equal(0, toggledOff.Likes);
        Assert.Null(toggledOff.Reaction);

        var replyResponse = await client.PostAsJsonAsync(
            $"/api/v1/videos/{videoId}/comments",
            new
            {
                text = "Reply",
                parentCommentId = created.Id
            });

        Assert.Equal(HttpStatusCode.OK, replyResponse.StatusCode);

        var comments = await client.GetFromJsonAsync<List<CommentResponseDto>>(
            $"/api/v1/videos/{videoId}/comments");

        var root = Assert.Single(comments!);
        var reply = Assert.Single(root.Replies);
        Assert.Equal("Reply", reply.Text);
        Assert.Equal(created.Id, reply.ParentCommentId);
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
            new
            {
                text = "Guest comment"
            });

        Assert.Equal(HttpStatusCode.Unauthorized, createResponse.StatusCode);
    }

    private static async Task<AuthResponseDto> RegisterAsync(
        HttpClient client)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new
            {
                email = $"comments-{suffix}@example.com",
                password = "safe-password",
                displayName = "Comment Author",
                userName = $"comment-{suffix}"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return Assert.IsType<AuthResponseDto>(auth);
    }
}
