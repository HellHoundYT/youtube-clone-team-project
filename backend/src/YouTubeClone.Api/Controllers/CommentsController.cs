using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Comments;
using YouTubeClone.Application.Features.Comments;
using YouTubeClone.Domain.Comments;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class CommentsController : ControllerBase
{
    private const int MaxPageSize = 50;

    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [AllowAnonymous]
    [HttpGet("videos/{videoId:guid}/comments")]
    public async Task<ActionResult<IReadOnlyList<CommentResponseDto>>> List(
        Guid videoId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sort = "newest",
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(
                new { message = "Page must be greater than zero." });
        }

        if (pageSize < 1 || pageSize > MaxPageSize)
        {
            return BadRequest(
                new { message = "Page size must be between 1 and 50." });
        }

        if (!TryParseSort(sort, out var commentSort))
        {
            return BadRequest(
                new { message = "Sort must be newest, oldest, or top." });
        }

        var viewerUserId = GetUserId();
        var comments = await _commentService.ListAsync(
            videoId,
            viewerUserId,
            page,
            pageSize,
            commentSort,
            cancellationToken);

        return Ok(
            comments
                .Select(Map)
                .ToList());
    }

    [Authorize]
    [HttpPost("videos/{videoId:guid}/comments")]
    public async Task<ActionResult<CommentResponseDto>> Add(
        Guid videoId,
        AddCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _commentService.AddAsync(
            new AddCommentCommand(
                videoId,
                userId.Value,
                request.Text,
                request.ParentCommentId),
            cancellationToken);

        return result.Comment is not null
            ? Ok(Map(result.Comment))
            : MapError(result.Error);
    }

    [Authorize]
    [HttpPut("comments/{commentId:guid}")]
    public async Task<ActionResult<CommentResponseDto>> Update(
        Guid commentId,
        UpdateCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _commentService.UpdateAsync(
            new UpdateCommentCommand(
                commentId,
                userId.Value,
                request.Text),
            cancellationToken);

        return result.Comment is not null
            ? Ok(Map(result.Comment))
            : MapError(result.Error);
    }

    [Authorize]
    [HttpDelete("comments/{commentId:guid}")]
    public async Task<IActionResult> Delete(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var error = await _commentService.DeleteAsync(
            commentId,
            userId.Value,
            cancellationToken);

        return error switch
        {
            CommentError.None => NoContent(),
            CommentError.NotFound => NotFound(),
            CommentError.Forbidden => Forbid(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    [Authorize]
    [HttpPost("comments/{commentId:guid}/reaction")]
    public async Task<ActionResult<CommentResponseDto>> ToggleReaction(
        Guid commentId,
        ToggleCommentReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        if (!TryParseReaction(
                request.Reaction,
                out var reaction))
        {
            return BadRequest(
                new { message = "Reaction must be like or dislike." });
        }

        var result = await _commentService.ToggleReactionAsync(
            commentId,
            userId.Value,
            reaction,
            cancellationToken);

        return result.Comment is not null
            ? Ok(Map(result.Comment))
            : MapError(result.Error);
    }

    private ActionResult<CommentResponseDto> MapError(
        CommentError error) =>
        error switch
        {
            CommentError.NotFound => NotFound(),
            CommentError.Forbidden => Forbid(),
            CommentError.TextRequired =>
                BadRequest(new { message = "Comment text is required." }),
            CommentError.TextTooLong =>
                BadRequest(new { message = "Comment text must not exceed 500 characters." }),
            CommentError.InvalidParent =>
                BadRequest(new { message = "The reply target is invalid." }),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };

    private Guid? GetUserId()
    {
        var subject =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(subject, out var userId)
            ? userId
            : null;
    }

    private static bool TryParseSort(
        string value,
        out CommentSort sort)
    {
        if (value.Equals(
                "oldest",
                StringComparison.OrdinalIgnoreCase))
        {
            sort = CommentSort.Oldest;
            return true;
        }

        if (value.Equals(
                "top",
                StringComparison.OrdinalIgnoreCase))
        {
            sort = CommentSort.Top;
            return true;
        }

        if (value.Equals(
                "newest",
                StringComparison.OrdinalIgnoreCase))
        {
            sort = CommentSort.Newest;
            return true;
        }

        sort = default;
        return false;
    }

    private static bool TryParseReaction(
        string value,
        out CommentReactionKind reaction)
    {
        if (value.Equals(
                "like",
                StringComparison.OrdinalIgnoreCase))
        {
            reaction = CommentReactionKind.Like;
            return true;
        }

        if (value.Equals(
                "dislike",
                StringComparison.OrdinalIgnoreCase))
        {
            reaction = CommentReactionKind.Dislike;
            return true;
        }

        reaction = default;
        return false;
    }

    private static CommentResponseDto Map(
        CommentModel comment) =>
        new(
            comment.Id,
            comment.VideoId,
            comment.AuthorId,
            comment.ParentCommentId,
            comment.AuthorName,
            string.IsNullOrWhiteSpace(comment.AuthorAvatarPath)
                ? null
                : $"/api/v1/users/{comment.AuthorId}/avatar",
            comment.Text,
            comment.CreatedAt,
            comment.Likes,
            comment.Dislikes,
            comment.ViewerReaction switch
            {
                CommentReactionKind.Like => "like",
                CommentReactionKind.Dislike => "dislike",
                _ => null
            },
            comment.Replies
                .Select(Map)
                .ToList());
}
