using YouTubeClone.Domain.Streams;

namespace YouTubeClone.Application.Features.Streams;

public interface ILiveStreamRepository
{
    Task<IReadOnlyList<LiveStream>>
        GetAllAsync(
            CancellationToken cancellationToken = default);
}