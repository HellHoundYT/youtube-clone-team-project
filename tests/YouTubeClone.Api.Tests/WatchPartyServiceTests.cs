using System.Text.Json;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Services.WatchParty;
using Xunit;

namespace YouTubeClone.Api.Tests.WatchParty;

public sealed class WatchPartyServiceTests
{
    private static readonly Guid Video1Id =
        Guid.Parse(
            "11111111-1111-1111-1111-111111111111");

    private static readonly Guid Video2Id =
        Guid.Parse(
            "22222222-2222-2222-2222-222222222222");

    [Fact]
    public async Task CreateRoomAsync_CreatesPersistentRoomForHost()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                null);

        Assert.NotEqual(
            Guid.Empty,
            room.RoomId);

        Assert.Equal(
            6,
            room.RoomCode.Length);

        Assert.Equal(
            "host-session",
            room.HostSessionId);

        Assert.Null(
            room.CurrentVideoId);

        Assert.False(
            room.IsPlaying);

        Assert.Equal(
            0,
            room.CurrentTime);

        var host =
            Assert.Single(
                room.Participants);

        Assert.True(
            host.IsHost);

        Assert.Equal(
            "Host",
            host.UserName);
    }

    [Fact]
    public async Task SetVideoAsync_AllowsHostToChangeVideosWithoutReplacingRoom()
    {
        var service =
            CreateService();

        var created =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        var originalRoomId =
            created.RoomId;

        Assert.Equal(
            Video1Id,
            created.CurrentVideoId);

        service.SetPlaybackState(
            created.RoomCode,
            "host-session",
            42,
            true);

        var changed =
            await service.SetVideoAsync(
                created.RoomCode,
                "host-session",
                Video2Id);

        Assert.Equal(
            Video2Id,
            changed.CurrentVideoId);

        Assert.Equal(
            0,
            changed.CurrentTime);

        Assert.False(
            changed.IsPlaying);

        var room =
            service.GetRoomState(
                created.RoomCode);

        Assert.Equal(
            originalRoomId,
            room.RoomId);

        Assert.Equal(
            Video2Id,
            room.CurrentVideoId);
    }

    [Fact]
    public async Task Guest_CannotControlRoomPlayback()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        service.JoinRoom(
            room.RoomCode,
            "guest-session",
            "Guest");

        await Assert.ThrowsAsync<
            InvalidOperationException>(
                () =>
                    service.SetVideoAsync(
                        room.RoomCode,
                        "guest-session",
                        Video2Id));

        Assert.Throws<
            InvalidOperationException>(
                () =>
                    service.SetPlaybackState(
                        room.RoomCode,
                        "guest-session",
                        30,
                        true));
    }

    [Fact]
    public async Task SetPlaybackState_UpdatesSharedRoomState()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        var playback =
            service.SetPlaybackState(
                room.RoomCode,
                "host-session",
                37.5,
                true);

        Assert.Equal(
            37.5,
            playback.CurrentTime);

        Assert.True(
            playback.IsPlaying);

        var state =
            service.GetRoomState(
                room.RoomCode);

        Assert.True(
            state.CurrentTime >=
            37.5);

        Assert.True(
            state.IsPlaying);

        Assert.Equal(
            Video1Id,
            state.CurrentVideoId);
    }

    [Fact]
    public async Task GetRoomState_AdvancesTimeWhileVideoIsPlaying()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        service.SetPlaybackState(
            room.RoomCode,
            "host-session",
            10,
            true);

        await Task.Delay(
            120);

        var state =
            service.GetRoomState(
                room.RoomCode);

        Assert.True(
            state.IsPlaying);

        Assert.True(
            state.CurrentTime >
            10.05);
    }
    [Fact]
    public async Task JoinRoom_AddsGuestWithoutChangingHost()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                null);

        var joined =
            service.JoinRoom(
                room.RoomCode,
                "guest-session",
                "Guest");

        Assert.Equal(
            2,
            joined.Participants.Count);

        var host =
            joined.Participants.Single(
                participant =>
                    participant.IsHost);

        var guest =
            joined.Participants.Single(
                participant =>
                    !participant.IsHost);

        Assert.Equal(
            "Host",
            host.UserName);

        Assert.Equal(
            "Guest",
            guest.UserName);
    }

    [Fact]
    public async Task AddMessage_StoresMessageFromJoinedParticipant()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                null);

        service.JoinRoom(
            room.RoomCode,
            "guest-session",
            "Guest");

        var message =
            service.AddMessage(
                room.RoomCode,
                "guest-session",
                "Hello!");

        Assert.Equal(
            "Guest",
            message.UserName);

        Assert.Equal(
            "Hello!",
            message.Message);

        var state =
            service.GetRoomState(
                room.RoomCode);

        var stored =
            Assert.Single(
                state.Messages);

        Assert.Equal(
            message.Id,
            stored.Id);
    }

    [Fact]
    public async Task AddMessage_RejectsUserWhoDidNotJoinRoom()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                null);

        Assert.Throws<
            InvalidOperationException>(
                () =>
                    service.AddMessage(
                        room.RoomCode,
                        "unknown-session",
                        "Hello!"));
    }

    [Fact]
    public async Task HostLeaving_ClosesRoom()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        service.JoinRoom(
            room.RoomCode,
            "guest-session",
            "Guest");

        var result =
            service.LeaveRoom(
                room.RoomCode,
                "host-session");

        Assert.True(
            result.RoomClosed);

        Assert.Null(
            result.Room);

        Assert.Throws<
            InvalidOperationException>(
                () =>
                    service.GetRoomState(
                        room.RoomCode));
    }

    [Fact]
    public async Task RoomStateSerialization_DoesNotExposeSessionSecrets()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-secret-session",
                "Host",
                null);

        service.JoinRoom(
            room.RoomCode,
            "guest-secret-session",
            "Guest");

        var state =
            service.GetRoomState(
                room.RoomCode);

        var json =
            JsonSerializer.Serialize(
                state);

        Assert.DoesNotContain(
            "host-secret-session",
            json);

        Assert.DoesNotContain(
            "guest-secret-session",
            json);

        Assert.DoesNotContain(
            "HostSessionId",
            json);

        Assert.DoesNotContain(
            "SessionId",
            json);
    }

    [Fact]
    public async Task SetVideoAsync_RejectsUnknownVideo()
    {
        var service =
            CreateService();

        var room =
            await service.CreateRoomAsync(
                "host-session",
                "Host",
                Video1Id);

        await Assert.ThrowsAsync<
            InvalidOperationException>(
                () =>
                    service.SetVideoAsync(
                        room.RoomCode,
                        "host-session",
                        Guid.NewGuid()));

        var state =
            service.GetRoomState(
                room.RoomCode);

        Assert.Equal(
            Video1Id,
            state.CurrentVideoId);
    }

    private static WatchPartyService
        CreateService()
    {
        var videoService =
            new FakeVideoService(
                new[]
                {
                    CreateVideo(
                        Video1Id,
                        "Video One"),
                    CreateVideo(
                        Video2Id,
                        "Video Two")
                });

        return new WatchPartyService(
            videoService);
    }

    private static VideoDetailsDto
        CreateVideo(
            Guid id,
            string title)
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
                "Watch Party test video.",

            VideoPath =
                $"/videos/{id}.mp4",

            ThumbnailPath =
                $"/thumbnails/{id}.webp",

            DurationSeconds =
                300,

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
            VideoDetailsDto>
            _videos;

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
                CancellationToken cancellationToken =
                    default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            IReadOnlyList<VideoListItemDto>
                result =
                    Array.Empty<
                        VideoListItemDto>();

            return Task.FromResult(
                result);
        }

        public Task<VideoDetailsDto?>
            GetVideoByIdAsync(
                Guid videoId,
                CancellationToken cancellationToken =
                    default)
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
                CancellationToken cancellationToken =
                    default)
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
                CancellationToken cancellationToken =
                    default)
        {
            cancellationToken
                .ThrowIfCancellationRequested();

            _videos[
                video.Id] =
                    video;

            return Task.FromResult(
                video);
        }
    }
}