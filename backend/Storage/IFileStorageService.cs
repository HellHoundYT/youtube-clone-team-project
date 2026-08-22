namespace YouTubeClone.Api.Storage;

public interface IFileStorageService
{
    bool Exists(
        string relativePath);

    Stream OpenRead(
        string relativePath);

    string GetContentType(
        string relativePath);

    Task SaveAsync(
        string relativePath,
        Stream source,
        CancellationToken cancellationToken = default);

    void Delete(
        string relativePath);
}