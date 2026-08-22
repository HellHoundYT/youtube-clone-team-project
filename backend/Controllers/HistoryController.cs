using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.History;
using YouTubeClone.Api.Services.History;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/history")]
public sealed class HistoryController :
    ControllerBase
{
    private readonly IWatchHistoryService
        _historyService;

    public HistoryController(
        IWatchHistoryService historyService)
    {
        _historyService =
            historyService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<WatchHistoryItemDto>),
        StatusCodes.Status200OK)]
    public async Task<
        ActionResult<IReadOnlyList<WatchHistoryItemDto>>>
        GetHistory(
            CancellationToken cancellationToken)
    {
        var history =
            await _historyService.GetHistoryAsync(
                cancellationToken);

        return Ok(history);
    }

    [HttpPut("{videoId:guid}")]
    [ProducesResponseType(
        typeof(WatchHistoryItemDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WatchHistoryItemDto>>
        UpdateHistory(
            Guid videoId,
            UpdateWatchHistoryRequestDto request,
            CancellationToken cancellationToken)
    {
        if (request.ProgressSeconds < 0)
        {
            return BadRequest(
                new
                {
                    message =
                        "Progress seconds must not be negative."
                });
        }

        var status =
            await _historyService.GetStatusAsync(
                cancellationToken);

        if (status.IsPaused)
        {
            return NoContent();
        }

        var item =
            await _historyService.UpdateHistoryAsync(
                videoId,
                request.ProgressSeconds,
                request.Completed,
                cancellationToken);

        if (item is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Video was not found."
                });
        }

        return Ok(item);
    }

    [HttpDelete("{videoId:guid}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult>
        RemoveHistoryItem(
            Guid videoId,
            CancellationToken cancellationToken)
    {
        await _historyService.RemoveHistoryItemAsync(
            videoId,
            cancellationToken);

        return NoContent();
    }

    [HttpDelete]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult>
        ClearHistory(
            CancellationToken cancellationToken)
    {
        await _historyService.ClearHistoryAsync(
            cancellationToken);

        return NoContent();
    }

    [HttpGet("status")]
    [ProducesResponseType(
        typeof(HistoryStatusDto),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<HistoryStatusDto>>
        GetStatus(
            CancellationToken cancellationToken)
    {
        var status =
            await _historyService.GetStatusAsync(
                cancellationToken);

        return Ok(status);
    }

    [HttpPut("status")]
    [ProducesResponseType(
        typeof(HistoryStatusDto),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<HistoryStatusDto>>
        SetStatus(
            UpdateHistoryStatusRequestDto request,
            CancellationToken cancellationToken)
    {
        var status =
            await _historyService.SetPausedAsync(
                request.IsPaused,
                cancellationToken);

        return Ok(status);
    }
}