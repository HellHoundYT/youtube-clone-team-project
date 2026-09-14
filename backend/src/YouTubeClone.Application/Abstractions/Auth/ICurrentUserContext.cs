namespace YouTubeClone.Application.Abstractions.Auth;

public interface ICurrentUserContext
{
    Guid? UserId { get; }
}
