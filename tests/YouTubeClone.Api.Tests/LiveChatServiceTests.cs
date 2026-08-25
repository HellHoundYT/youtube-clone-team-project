using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Infrastructure.LiveChat;

namespace YouTubeClone.Api.Tests;

public sealed class LiveChatServiceTests
{
    [Fact]
    public void OwnerCanEditAndSnapshotRestoresMessage()
    {
        var service =
            CreateService();

        var created =
            service.SendMessage(
                Guid.NewGuid(),
                "session-a",
                "Alice",
                "hello");

        var edited =
            service.EditMessage(
                created.StreamId,
                "session-a",
                created.Id,
                "updated");

        var snapshot =
            service.GetSnapshot(
                created.StreamId,
                "session-a");

        Assert.Equal(
            "updated",
            edited.Message);

        Assert.True(
            edited.IsOwn);

        Assert.NotNull(
            edited.EditedAt);

        Assert.Single(
            snapshot);

        Assert.Equal(
            "updated",
            snapshot[0].Message);

        Assert.True(
            snapshot[0].IsOwn);
    }

    [Fact]
    public void DifferentSessionCannotEditOrDeleteMessage()
    {
        var service =
            CreateService();

        var created =
            service.SendMessage(
                Guid.NewGuid(),
                "session-a",
                "Alice",
                "hello");

        Assert.Throws<InvalidOperationException>(
            () =>
                service.EditMessage(
                    created.StreamId,
                    "session-b",
                    created.Id,
                    "hacked"));

        Assert.Throws<InvalidOperationException>(
            () =>
                service.DeleteMessage(
                    created.StreamId,
                    "session-b",
                    created.Id));
    }

    [Fact]
    public void ReplyReactionAndDeleteAreSharedThroughRepositoryState()
    {
        var service =
            CreateService();

        var streamId =
            Guid.NewGuid();

        var parent =
            service.SendMessage(
                streamId,
                "session-a",
                "Alice",
                "parent");

        var reply =
            service.ReplyToMessage(
                streamId,
                "session-b",
                "Bob",
                parent.Id,
                "reply");

        var reaction =
            service.ToggleReaction(
                streamId,
                "session-b",
                parent.Id,
                "\U0001F525");

        var aliceSnapshot =
            service.GetSnapshot(
                streamId,
                "session-a");

        var bobSnapshot =
            service.GetSnapshot(
                streamId,
                "session-b");

        Assert.Equal(
            parent.Id,
            reply.ParentMessageId);

        Assert.Equal(
            1,
            reaction.Count);

        Assert.Equal(
            true,
            reaction.ReactedByCurrentSession);

        var aliceParent =
            Assert.Single(
                aliceSnapshot,
                item =>
                    item.Id ==
                    parent.Id);

        var bobParent =
            Assert.Single(
                bobSnapshot,
                item =>
                    item.Id ==
                    parent.Id);

        var aliceReaction =
            Assert.Single(
                aliceParent.Reactions);

        var bobReaction =
            Assert.Single(
                bobParent.Reactions);

        Assert.Equal(
            false,
            aliceReaction.ReactedByCurrentSession);

        Assert.Equal(
            true,
            bobReaction.ReactedByCurrentSession);

        var deleted =
            service.DeleteMessage(
                streamId,
                "session-a",
                parent.Id);

        Assert.Contains(
            parent.Id,
            deleted.MessageIds);

        Assert.Contains(
            reply.Id,
            deleted.MessageIds);

        Assert.Empty(
            service.GetSnapshot(
                streamId,
                "session-a"));
    }

    private static ILiveChatService
        CreateService()
    {
        return new LiveChatService(
            new InMemoryLiveChatRepository());
    }
}