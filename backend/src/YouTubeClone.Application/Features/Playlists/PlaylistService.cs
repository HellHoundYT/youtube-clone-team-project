using YouTubeClone.Domain.Playlists;

namespace YouTubeClone.Application.Features.Playlists;

public sealed class PlaylistService : IPlaylistService
{
    private const int MaxTitleLength = 80;
    private const int MaxDescriptionLength = 300;

    private readonly IPlaylistRepository _repository;

    public PlaylistService(IPlaylistRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<PlaylistModel>> ListAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        var playlists = await _repository.ListByOwnerAsync(
            ownerId,
            cancellationToken);

        return playlists
            .Select(Map)
            .ToList();
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

        return PlaylistResult.Success(Map(playlist));
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

        var playlist = await _repository.FindByIdAsync(
            playlistId,
            cancellationToken);

        if (playlist is null || playlist.OwnerId != ownerId)
        {
            return PlaylistResult.Failure(
                PlaylistError.NotFound);
        }

        playlist.Title = command.Title.Trim();
        playlist.Description = command.Description.Trim();
        playlist.UpdatedAt = DateTimeOffset.UtcNow;

        await _repository.SaveChangesAsync(cancellationToken);

        return PlaylistResult.Success(Map(playlist));
    }

    public async Task<bool> DeleteAsync(
        Guid ownerId,
        Guid playlistId,
        CancellationToken cancellationToken)
    {
        var playlist = await _repository.FindByIdAsync(
            playlistId,
            cancellationToken);

        if (playlist is null || playlist.OwnerId != ownerId)
        {
            return false;
        }

        _repository.Remove(playlist);
        await _repository.SaveChangesAsync(cancellationToken);
        return true;
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

    private static PlaylistModel Map(
        Playlist playlist) =>
        new(
            playlist.Id,
            playlist.OwnerId,
            playlist.Title,
            playlist.Description,
            playlist.CreatedAt,
            playlist.UpdatedAt);
}
