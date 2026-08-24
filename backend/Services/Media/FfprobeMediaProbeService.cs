using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using YouTubeClone.Application.Abstractions.Media;

namespace YouTubeClone.Api.Services.Media;

public sealed class FfprobeMediaProbeService :
    IMediaProbeService
{
    private const int DefaultTimeoutSeconds =
        20;

    private readonly ILogger<FfprobeMediaProbeService>
        _logger;

    private readonly string _ffprobePath;

    private readonly int _timeoutSeconds;

    public FfprobeMediaProbeService(
        IConfiguration configuration,
        ILogger<FfprobeMediaProbeService> logger)
    {
        _logger =
            logger;

        _ffprobePath =
            configuration[
                "MediaProbe:FfprobePath"]
            ?? "ffprobe";

        var configuredTimeout =
            configuration.GetValue<int?>(
                "MediaProbe:TimeoutSeconds");

        _timeoutSeconds =
            configuredTimeout is > 0
                ? configuredTimeout.Value
                : DefaultTimeoutSeconds;
    }

    public async Task<MediaProbeResult>
        ProbeAsync(
            string filePath,
            CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(
                filePath))
        {
            return new MediaProbeResult(
                MediaProbeStatus.InvalidMedia,
                ErrorMessage:
                    "Media file path is required.");
        }

        if (!File.Exists(filePath))
        {
            return new MediaProbeResult(
                MediaProbeStatus.InvalidMedia,
                ErrorMessage:
                    "Media file does not exist.");
        }

        using var process =
            new Process();

        process.StartInfo =
            CreateStartInfo(
                filePath);

        try
        {
            process.Start();
        }
        catch (Win32Exception exception)
        {
            _logger.LogError(
                exception,
                "ffprobe could not be started from path {FfprobePath}.",
                _ffprobePath);

            return new MediaProbeResult(
                MediaProbeStatus.ToolUnavailable,
                ErrorMessage:
                    "ffprobe is not available.");
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Could not start ffprobe.");

            return new MediaProbeResult(
                MediaProbeStatus.Failed,
                ErrorMessage:
                    "Media probe could not be started.");
        }

        var standardOutputTask =
            process.StandardOutput
                .ReadToEndAsync();

        var standardErrorTask =
            process.StandardError
                .ReadToEndAsync();

        using var timeoutSource =
            CancellationTokenSource
                .CreateLinkedTokenSource(
                    cancellationToken);

        timeoutSource.CancelAfter(
            TimeSpan.FromSeconds(
                _timeoutSeconds));

        try
        {
            await process.WaitForExitAsync(
                timeoutSource.Token);
        }
        catch (OperationCanceledException)
            when (!cancellationToken
                .IsCancellationRequested)
        {
            TryKillProcess(
                process);

            _logger.LogWarning(
                "ffprobe timed out after {TimeoutSeconds} seconds for {FilePath}.",
                _timeoutSeconds,
                filePath);

            return new MediaProbeResult(
                MediaProbeStatus.TimedOut,
                ErrorMessage:
                    "Media probe timed out.");
        }
        catch (OperationCanceledException)
        {
            TryKillProcess(
                process);

            throw;
        }

        var standardOutput =
            await standardOutputTask;

        var standardError =
            await standardErrorTask;

        if (process.ExitCode != 0)
        {
            _logger.LogWarning(
                "ffprobe rejected media file {FilePath}. Exit code: {ExitCode}. Error: {Error}",
                filePath,
                process.ExitCode,
                standardError);

            return new MediaProbeResult(
                MediaProbeStatus.InvalidMedia,
                ErrorMessage:
                    "The uploaded file is not a valid supported video.");
        }

        try
        {
            using var document =
                JsonDocument.Parse(
                    standardOutput);

            if (!ContainsVideoStream(
                    document.RootElement))
            {
                return new MediaProbeResult(
                    MediaProbeStatus.InvalidMedia,
                    ErrorMessage:
                        "The uploaded file does not contain a video stream.");
            }

            if (!TryGetDurationSeconds(
                    document.RootElement,
                    out var rawDuration))
            {
                return new MediaProbeResult(
                    MediaProbeStatus.InvalidMedia,
                    ErrorMessage:
                        "Video duration could not be determined.");
            }

            if (!double.IsFinite(
                    rawDuration) ||
                rawDuration <= 0 ||
                rawDuration >
                    int.MaxValue)
            {
                return new MediaProbeResult(
                    MediaProbeStatus.InvalidMedia,
                    ErrorMessage:
                        "Video duration is invalid.");
            }

            var durationSeconds =
                Math.Max(
                    1,
                    (int)Math.Ceiling(
                        rawDuration));

            return new MediaProbeResult(
                MediaProbeStatus.Success,
                durationSeconds);
        }
        catch (JsonException exception)
        {
            _logger.LogError(
                exception,
                "ffprobe returned invalid JSON for {FilePath}. Output: {Output}",
                filePath,
                standardOutput);

            return new MediaProbeResult(
                MediaProbeStatus.Failed,
                ErrorMessage:
                    "Media metadata could not be parsed.");
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Unexpected media probe failure for {FilePath}.",
                filePath);

            return new MediaProbeResult(
                MediaProbeStatus.Failed,
                ErrorMessage:
                    "Media analysis failed.");
        }
    }

    private ProcessStartInfo
        CreateStartInfo(
            string filePath)
    {
        var startInfo =
            new ProcessStartInfo
            {
                FileName =
                    _ffprobePath,
                RedirectStandardOutput =
                    true,
                RedirectStandardError =
                    true,
                UseShellExecute =
                    false,
                CreateNoWindow =
                    true
            };

        startInfo.ArgumentList.Add(
            "-v");

        startInfo.ArgumentList.Add(
            "error");

        startInfo.ArgumentList.Add(
            "-show_entries");

        startInfo.ArgumentList.Add(
            "format=duration:stream=codec_type,duration");

        startInfo.ArgumentList.Add(
            "-of");

        startInfo.ArgumentList.Add(
            "json");

        startInfo.ArgumentList.Add(
            filePath);

        return startInfo;
    }

    private static bool
        ContainsVideoStream(
            JsonElement root)
    {
        if (!root.TryGetProperty(
                "streams",
                out var streams) ||
            streams.ValueKind !=
                JsonValueKind.Array)
        {
            return false;
        }

        foreach (var stream in
                 streams.EnumerateArray())
        {
            if (!stream.TryGetProperty(
                    "codec_type",
                    out var codecType))
            {
                continue;
            }

            if (string.Equals(
                    codecType.GetString(),
                    "video",
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool
        TryGetDurationSeconds(
            JsonElement root,
            out double durationSeconds)
    {
        durationSeconds =
            0;

        if (root.TryGetProperty(
                "format",
                out var format) &&
            format.TryGetProperty(
                "duration",
                out var formatDuration) &&
            TryParseDuration(
                formatDuration,
                out durationSeconds))
        {
            return true;
        }

        if (!root.TryGetProperty(
                "streams",
                out var streams) ||
            streams.ValueKind !=
                JsonValueKind.Array)
        {
            return false;
        }

        foreach (var stream in
                 streams.EnumerateArray())
        {
            if (!stream.TryGetProperty(
                    "codec_type",
                    out var codecType) ||
                !string.Equals(
                    codecType.GetString(),
                    "video",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (stream.TryGetProperty(
                    "duration",
                    out var streamDuration) &&
                TryParseDuration(
                    streamDuration,
                    out durationSeconds))
            {
                return true;
            }
        }

        return false;
    }

    private static bool
        TryParseDuration(
            JsonElement element,
            out double durationSeconds)
    {
        durationSeconds =
            0;

        if (element.ValueKind ==
            JsonValueKind.Number)
        {
            return element.TryGetDouble(
                out durationSeconds);
        }

        if (element.ValueKind !=
            JsonValueKind.String)
        {
            return false;
        }

        return double.TryParse(
            element.GetString(),
            NumberStyles.Float,
            CultureInfo.InvariantCulture,
            out durationSeconds);
    }

    private static void
        TryKillProcess(
            Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(
                    entireProcessTree:
                        true);
            }
        }
        catch
        {
            // Best-effort cleanup only.
        }
    }
}