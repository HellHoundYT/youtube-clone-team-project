using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Streams;
using YouTubeClone.Api.Services.Streams;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/streams")]
public sealed class StreamsController :
    ControllerBase
{
    private readonly ILiveStreamService
        _liveStreamService;

    public StreamsController(
        ILiveStreamService liveStreamService)
    {
        _liveStreamService =
            liveStreamService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<LiveStreamListItemDto>),
        StatusCodes.Status200OK)]
    public async Task<
        ActionResult<IReadOnlyList<LiveStreamListItemDto>>>
        GetLiveStreams(
            [FromQuery] string? category = null,
            CancellationToken cancellationToken = default)
    {
        var streams =
            await _liveStreamService.GetLiveStreamsAsync(
                category,
                cancellationToken);

        return Ok(
            streams);
    }

    [HttpGet("{streamId:guid}")]
    [ProducesResponseType(
        typeof(LiveStreamDetailsDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LiveStreamDetailsDto>>
        GetLiveStream(
            Guid streamId,
            CancellationToken cancellationToken = default)
    {
        var stream =
            await _liveStreamService.GetLiveStreamByIdAsync(
                streamId,
                cancellationToken);

        if (stream is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Live stream was not found."
                });
        }

        return Ok(
            stream);
    }

    [HttpGet("categories")]
    [ProducesResponseType(
        typeof(IReadOnlyList<StreamCategoryDto>),
        StatusCodes.Status200OK)]
    public async Task<
        ActionResult<IReadOnlyList<StreamCategoryDto>>>
        GetCategories(
            CancellationToken cancellationToken = default)
    {
        var categories =
            await _liveStreamService.GetCategoriesAsync(
                cancellationToken);

        return Ok(
            categories);
    }
}