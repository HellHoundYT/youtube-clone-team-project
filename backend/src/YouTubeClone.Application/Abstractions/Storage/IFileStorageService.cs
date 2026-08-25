namespace YouTubeClone.Application.Abstractions.Storage;

public interface IFileStorageService
{
    bool Exists(
        string relativePath);

    Stream OpenRead(
        string relativePath);

    string GetContentType(
        string relativePath);

    string GetPhysicalPath(
        string relativePath);

    Task SaveAsync(
        string relativePath,
        Stream source,
        CancellationToken cancellationToken = default);

    void Delete(
        string relativePath);
}