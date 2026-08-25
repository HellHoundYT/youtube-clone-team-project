using System.Collections.Concurrent;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Domain.History;

namespace YouTubeClone.Infrastructure.History;

public sealed class InMemoryWatchHistoryRepository :
    IWatchHistoryRepository
{
    private readonly ConcurrentDictionary<
        Guid,
        WatchHistoryEntry> _history =
            new();

    private int _isPaused;

    public Task<IReadOnlyList<WatchHistoryEntry>>
        GetAllAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<WatchHistoryEntry> result =
            _history
                .Values
                .Select(
                    CreateSnapshot)
                .ToList();

        return Task.FromResult(
            result);
    }

    public Task
        UpsertAsync(
            WatchHistoryEntry entry,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var snapshot =
            CreateSnapshot(
                entry);

        _history.AddOrUpdate(
            entry.VideoId,
            snapshot,
            (_, _) =>
                snapshot);

        return Task.CompletedTask;
    }

    public Task<bool>
        RemoveAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var removed =
            _history.TryRemove(
                videoId,
                out _);

        return Task.FromResult(
            removed);
    }

    public Task
        ClearAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _history.Clear();

        return Task.CompletedTask;
    }

    public Task<bool>
        IsPausedAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var isPaused =
            Volatile.Read(
                ref _isPaused) == 1;

        return Task.FromResult(
            isPaused);
    }

    public Task<bool>
        SetPausedAsync(
            bool isPaused,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        Interlocked.Exchange(
            ref _isPaused,
            isPaused
                ? 1
                : 0);

        return Task.FromResult(
            isPaused);
    }

    private static WatchHistoryEntry
        CreateSnapshot(
            WatchHistoryEntry entry)
    {
        return new WatchHistoryEntry
        {
            VideoId =
                entry.VideoId,

            ProgressSeconds =
                entry.ProgressSeconds,

            Completed =
                entry.Completed,

            LastWatchedAt =
                entry.LastWatchedAt
        };
    }
}