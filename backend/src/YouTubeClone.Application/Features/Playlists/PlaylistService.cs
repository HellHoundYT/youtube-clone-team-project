using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Domain.Playlists;

namespace YouTubeClone.Application.Features.Playlists;

public sealed class PlaylistService : IPlaylistService
{
    private const int MaxTitleLength = 80;
    private const int MaxDescriptionLength = 300;

    private readonly IPlaylistRepository _repository;
    private readonly IVideoService _videoService;

    public PlaylistService(
        IPlaylistRepository repository,
        IVideoService videoService)
    {
        _repository = repository;
        _videoService = videoService;
    }

    public async Task<IReadOnlyList<PlaylistModel>> ListAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        var playlists = await _repository.ListByOwnerAsync(
            ownerId,
            cancellationToken);

        var models = new List<PlaylistModel>(playlists.Count);
        foreach (var playlist in playlists)
        {
            models.Add(
                await MapAsync(
                    playlist,
                    cancellationToken));
        }

        return models;
    }

    public async Task<PlaylistResult> CreateAsync(
        Guid ownerId,
        SavePlaylistCommand command,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(command);
        if (validationError != PlaylistError.None)
        {
            return PlaylistResult.Failure(validationError);
        }

        var now = DateTimeOffset.UtcNow;
        var playlist = new Playlist
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = command.Title.Trim(),
            Description = command.Description.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        _repository.Add(playlist);
        await _repository.SaveChangesAsync(cancellationToken);

        return PlaylistResult.Success(
            await MapAsync(
                playlist,
                cancellationToken));
    }

    public async Task<PlaylistResult> UpdateAsync(
        Guid ownerId,
        Guid playlistId,
        SavePlaylistCommand command,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(command);
        if (validationError != PlaylistError.None)
        {
            return PlaylistResult.Failure(validationError);
        }

        var playlist = await FindOwnedAsync(
            ownerId,
            playlistId,
            cancellationToken);

        if (playlist is null)
        {
            return PlaylistResult.Failure(
                PlaylistError.NotFound);
        }

        playlist.Title = command.Title.Trim();
        playlist.Description = command.Description.Trim();
        playlist.UpdatedAt = DateTimeOffset.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);

        return PlaylistResult.Success(
            await MapAsync(
                playlist,
                cancellationToken));
    }

    public async Task<bool> DeleteAsync(
        Guid ownerId,
        Guid playlistId,
        CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedAsync(
            ownerId,
            playlistId,
            cancellationToken);

        if (playlist is null)
        {
            return false;
        }

        _repository.Remove(playlist);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PlaylistError> AddVideoAsync(
        Guid ownerId,
        Guid playlistId,
        Guid videoId,
        CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedAsync(
            ownerId,
            playlistId,
            cancellationToken);

        if (playlist is null)
        {
            return PlaylistError.NotFound;
        }

        var video = await _videoService.GetVideoByIdAsync(
            videoId,
            cancellationToken);

        if (video is null)
        {
            return PlaylistError.VideoNotFound;
        }

        var existing = await _repository.FindVideoAsync(
            playlistId,
            videoId,
            cancellationToken);

        if (existing is not null)
        {
            return PlaylistError.None;
        }

        _repository.AddVideo(
            new PlaylistVideo
            {
                PlaylistId = playlistId,
                VideoId = videoId,
                AddedAt = DateTimeOffset.UtcNow
            });

        playlist.UpdatedAt = DateTimeOffset.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);

        return PlaylistError.None;
    }

    public async Task<PlaylistError> RemoveVideoAsync(
        Guid ownerId,
        Guid playlistId,
        Guid videoId,
        CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedAsync(
            ownerId,
            playlistId,
            cancellationToken);

        if (playlist is null)
        {
            return PlaylistError.NotFound;
        }

        var existing = await _repository.FindVideoAsync(
            playlistId,
            videoId,
            cancellationToken);

        if (existing is null)
        {
            return PlaylistError.None;
        }

        _repository.RemoveVideo(existing);
        playlist.UpdatedAt = DateTimeOffset.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);

        return PlaylistError.None;
    }

    private Task<Playlist?> FindOwnedAsync(
        Guid ownerId,
        Guid playlistId,
        CancellationToken cancellationToken) =>
        FindOwnedCoreAsync(
            ownerId,
            playlistId,
            cancellationToken);

    private async Task<Playlist?> FindOwnedCoreAsync(
        Guid ownerId,
        Guid playlistId,
        CancellationToken cancellationToken)
    {
        var playlist = await _repository.FindByIdAsync(
            playlistId,
            cancellationToken);

        return playlist?.OwnerId == ownerId
            ? playlist
            : null;
    }

    private static PlaylistError Validate(
        SavePlaylistCommand command)
    {
        var title = command.Title.Trim();
        var description = command.Description.Trim();

        if (string.IsNullOrWhiteSpace(title))
        {
            return PlaylistError.TitleRequired;
        }

        if (title.Length > MaxTitleLength)
        {
            return PlaylistError.TitleTooLong;
        }

        if (description.Length > MaxDescriptionLength)
        {
            return PlaylistError.DescriptionTooLong;
        }

        return PlaylistError.None;
    }

    private async Task<PlaylistModel> MapAsync(
        Playlist playlist,
        CancellationToken cancellationToken)
    {
        var videoIds = await _repository.ListVideoIdsAsync(
            playlist.Id,
            cancellationToken);

        return new PlaylistModel(
            playlist.Id,
            playlist.OwnerId,
            playlist.Title,
            playlist.Description,
            playlist.CreatedAt,
            playlist.UpdatedAt,
            videoIds);
    }
}
