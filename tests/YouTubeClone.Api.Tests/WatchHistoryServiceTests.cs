using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.History;
using YouTubeClone.Api.Services.Videos;
using Xunit;

namespace YouTubeClone.Api.Tests.History;

public sealed class WatchHistoryServiceTests
{
    private static readonly Guid Video1Id =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid Video2Id =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid Video3Id =
        Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task UpdateHistoryAsync_StoresThreeVideosIndependently_AndOrdersNewestFirst()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video1Id,
            10,
            false);

        await Task.Delay(25);

        await service.UpdateHistoryAsync(
            Video2Id,
            20,
            false);

        await Task.Delay(25);

        await service.UpdateHistoryAsync(
            Video3Id,
            30,
            false);

        var history =
            await service.GetHistoryAsync();

        Assert.Equal(
            3,
            history.Count);

        Assert.Equal(
            Video3Id,
            history[0].VideoId);

        Assert.Equal(
            30,
            history[0].ProgressSeconds);

        Assert.Equal(
            Video2Id,
            history[1].VideoId);

        Assert.Equal(
            20,
            history[1].ProgressSeconds);

        Assert.Equal(
            Video1Id,
            history[2].VideoId);

        Assert.Equal(
            10,
            history[2].ProgressSeconds);
    }

    [Fact]
    public async Task UpdateHistoryAsync_CompletedVideo_UsesFullDuration_WithoutChangingOtherEntries()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video1Id,
            10,
            false);

        await Task.Delay(25);

        await service.UpdateHistoryAsync(
            Video2Id,
            20,
            false);

        var before =
            await service.GetHistoryAsync();

        var video1Before =
            before.Single(
                item =>
                    item.VideoId == Video1Id);

        await Task.Delay(25);

        var completed =
            await service.UpdateHistoryAsync(
                Video2Id,
                44,
                true);

        Assert.NotNull(
            completed);

        Assert.True(
            completed.Completed);

        Assert.Equal(
            completed.Video.DurationSeconds,
            completed.ProgressSeconds);

        var after =
            await service.GetHistoryAsync();

        Assert.Equal(
            2,
            after.Count);

        var video1After =
            after.Single(
                item =>
                    item.VideoId == Video1Id);

        var video2After =
            after.Single(
                item =>
                    item.VideoId == Video2Id);

        Assert.Equal(
            video1Before.ProgressSeconds,
            video1After.ProgressSeconds);

        Assert.False(
            video1After.Completed);

        Assert.True(
            video2After.Completed);

        Assert.Equal(
            video2After.Video.DurationSeconds,
            video2After.ProgressSeconds);
    }

    [Fact]
    public async Task UpdateHistoryAsync_Rewatch_UpdatesOnlyRequestedVideo_AndMovesItFirst()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video1Id,
            10,
            false);

        await Task.Delay(25);

        await service.UpdateHistoryAsync(
            Video2Id,
            20,
            true);

        await Task.Delay(25);

        await service.UpdateHistoryAsync(
            Video3Id,
            30,
            false);

        await Task.Delay(25);

        var updated =
            await service.UpdateHistoryAsync(
                Video1Id,
                55,
                false);

        Assert.NotNull(
            updated);

        Assert.Equal(
            55,
            updated.ProgressSeconds);

        var history =
            await service.GetHistoryAsync();

        Assert.Equal(
            3,
            history.Count);

        Assert.Equal(
            Video1Id,
            history[0].VideoId);

        Assert.Equal(
            55,
            history[0].ProgressSeconds);

        var video2 =
            history.Single(
                item =>
                    item.VideoId == Video2Id);

        var video3 =
            history.Single(
                item =>
                    item.VideoId == Video3Id);

        Assert.True(
            video2.Completed);

        Assert.Equal(
            video2.Video.DurationSeconds,
            video2.ProgressSeconds);

        Assert.Equal(
            30,
            video3.ProgressSeconds);
    }

    [Fact]
    public async Task SetPausedAsync_WhenPaused_PreventsHistoryChanges()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video3Id,
            30,
            false);

        var before =
            await service.GetHistoryAsync();

        var beforeItem =
            Assert.Single(
                before);

        await service.SetPausedAsync(
            true);

        await Task.Delay(25);

        var updateResult =
            await service.UpdateHistoryAsync(
                Video3Id,
                77,
                false);

        Assert.Null(
            updateResult);

        var after =
            await service.GetHistoryAsync();

        var afterItem =
            Assert.Single(
                after);

        Assert.Equal(
            beforeItem.ProgressSeconds,
            afterItem.ProgressSeconds);

        Assert.Equal(
            beforeItem.LastWatchedAt,
            afterItem.LastWatchedAt);

        var status =
            await service.GetStatusAsync();

        Assert.True(
            status.IsPaused);

        await service.SetPausedAsync(
            false);

        status =
            await service.GetStatusAsync();

        Assert.False(
            status.IsPaused);
    }

    [Fact]
    public async Task RemoveHistoryItemAsync_RemovesOnlyRequestedVideo()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video1Id,
            10,
            false);

        await service.UpdateHistoryAsync(
            Video2Id,
            20,
            false);

        await service.UpdateHistoryAsync(
            Video3Id,
            30,
            false);

        var removed =
            await service.RemoveHistoryItemAsync(
                Video2Id);

        Assert.True(
            removed);

        var history =
            await service.GetHistoryAsync();

        Assert.Equal(
            2,
            history.Count);

        Assert.Contains(
            history,
            item =>
                item.VideoId == Video1Id);

        Assert.Contains(
            history,
            item =>
                item.VideoId == Video3Id);

        Assert.DoesNotContain(
            history,
            item =>
                item.VideoId == Video2Id);
    }

    [Fact]
    public async Task ClearHistoryAsync_RemovesAllEntries()
    {
        var service = CreateService();

        await service.UpdateHistoryAsync(
            Video1Id,
            10,
            false);

        await service.UpdateHistoryAsync(
            Video2Id,
            20,
            false);

        await service.UpdateHistoryAsync(
            Video3Id,
            30,
            false);

        await service.ClearHistoryAsync();

        var history =
            await service.GetHistoryAsync();

        Assert.Empty(
            history);
    }

    [Fact]
    public async Task UpdateHistoryAsync_UnknownVideo_ReturnsNullAndDoesNotCreateEntry()
    {
        var service = CreateService();

        var result =
            await service.UpdateHistoryAsync(
                Guid.NewGuid(),
                50,
                false);

        Assert.Null(
            result);

        var history =
            await service.GetHistoryAsync();

        Assert.Empty(
            history);
    }

    private static WatchHistoryService
        CreateService()
    {
        var videos =
            new[]
            {
                CreateVideo(
                    Video1Id,
                    "Video One",
                    120),
                CreateVideo(
                    Video2Id,
                    "Video Two",
                    240),
                CreateVideo(
                    Video3Id,
                    "Video Three",
                    360)
            };

        var videoService =
            new FakeVideoService(
                videos);

        return new WatchHistoryService(
            videoService);
    }

    private static VideoDetailsDto
        CreateVideo(
            Guid id,
            string title,
            int durationSeconds)
    {
        return new VideoDetailsDto
        {
            Id =
                id,
            ChannelId =
                Guid.NewGuid(),
            ChannelName =
                "Test Channel",
            Category =
                "Tests",
            CategorySlug =
                "tests",
            Title =
                title,
            Description =
                "History regression test video.",
            VideoPath =
                $"/videos/{id}.mp4",
            ThumbnailPath =
                $"/thumbnails/{id}.webp",
            DurationSeconds =
                durationSeconds,
            ViewCount =
                100,
            Visibility =
                "Public",
            PublishedAt =
                DateTimeOffset.UtcNow
        };
    }

    private sealed class FakeVideoService :
        IVideoService
    {
        private readonly Dictionary<
            Guid,
            VideoDetailsDto> _videos;

        public FakeVideoService(
            IEnumerable<VideoDetailsDto> videos)
        {
            _videos =
                videos.ToDictionary(
                    video =>
                        video.Id);
        }

        public Task<IReadOnlyList<VideoListItemDto>>
            GetVideosAsync(
                int page,
                int pageSize,
                string? category,
                CancellationToken cancellationToken = default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            IReadOnlyList<VideoListItemDto>
                result =
                    Array.Empty<VideoListItemDto>();

            return Task.FromResult(
                result);
        }

        public Task<VideoDetailsDto?>
            GetVideoByIdAsync(
                Guid videoId,
                CancellationToken cancellationToken = default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            _videos.TryGetValue(
                videoId,
                out var video);

            return Task.FromResult(
                video);
        }

        public Task<long?>
            RegisterViewAsync(
                Guid videoId,
                CancellationToken cancellationToken = default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            long? result =
                _videos.ContainsKey(
                    videoId)
                    ? 1
                    : null;

            return Task.FromResult(
                result);
        }

        public Task<VideoDetailsDto>
            CreateVideoAsync(
                VideoDetailsDto video,
                CancellationToken cancellationToken = default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            _videos[video.Id] =
                video;

            return Task.FromResult(
                video);
        }
    }
}
