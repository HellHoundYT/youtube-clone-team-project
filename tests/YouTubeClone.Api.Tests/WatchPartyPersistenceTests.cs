using YouTubeClone.Domain.WatchParty;
using YouTubeClone.Infrastructure.WatchParty;
using Xunit;

namespace YouTubeClone.Api.Tests.WatchParty;

public sealed class WatchPartyPersistenceTests
{
    [Fact]
    public void FileRepository_RestoresRoomAfterRecreation()
    {
        var directory =
            Path.Combine(
                Path.GetTempPath(),
                "youtube-clone-watch-party-tests",
                Guid.NewGuid()
                    .ToString("N"));

        var filePath =
            Path.Combine(
                directory,
                "rooms.json");

        try
        {
            var room =
                new WatchPartyRoom
                {
                    RoomId =
                        Guid.NewGuid(),

                    RoomCode =
                        "ABC123",

                    HostSessionId =
                        "host-session",

                    CurrentTime =
                        12.5,

                    IsPlaying =
                        true,

                    UpdatedAt =
                        DateTimeOffset.UtcNow
                };

            room.Participants[
                "host-session"] =
                    new WatchPartyParticipant
                    {
                        SessionId =
                            "host-session",

                        UserName =
                            "Host",

                        IsHost =
                            true,

                        JoinedAt =
                            DateTimeOffset.UtcNow
                    };

            var firstRepository =
                new FileWatchPartyRepository(
                    filePath);

            Assert.True(
                firstRepository.TryAdd(
                    room));

            var secondRepository =
                new FileWatchPartyRepository(
                    filePath);

            var restored =
                secondRepository.GetSnapshot(
                    room.RoomCode);

            Assert.NotNull(
                restored);

            Assert.Equal(
                room.RoomId,
                restored!.RoomId);

            Assert.Equal(
                room.RoomCode,
                restored.RoomCode);

            Assert.Equal(
                room.HostSessionId,
                restored.HostSessionId);

            Assert.Equal(
                room.CurrentTime,
                restored.CurrentTime);

            Assert.True(
                restored.IsPlaying);

            var participant =
                Assert.Single(
                    restored.Participants);

            Assert.Equal(
                "host-session",
                participant.Key);

            Assert.True(
                participant.Value.IsHost);
        }
        finally
        {
            if (Directory.Exists(
                    directory))
            {
                Directory.Delete(
                    directory,
                    true);
            }
        }
    }
}
