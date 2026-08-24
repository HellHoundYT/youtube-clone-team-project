using Microsoft.AspNetCore.StaticFiles;
using YouTubeClone.Application.Abstractions.Storage;

namespace YouTubeClone.Api.Storage;

public sealed class LocalFileStorageService :
    IFileStorageService
{
    private readonly string _rootPath;

    private readonly FileExtensionContentTypeProvider
        _contentTypeProvider = new();

    public LocalFileStorageService(
        IWebHostEnvironment environment)
    {
        _rootPath =
            Path.Combine(
                environment.ContentRootPath,
                "Storage",
                "media");

        Directory.CreateDirectory(
            _rootPath);
    }

    public bool Exists(
        string relativePath)
    {
        return File.Exists(
            GetPhysicalPath(
                relativePath));
    }

    public Stream OpenRead(
        string relativePath)
    {
        var fullPath =
            GetPhysicalPath(
                relativePath);

        return new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize:
                64 * 1024,
            useAsync:
                true);
    }

    public string GetContentType(
        string relativePath)
    {
        if (_contentTypeProvider
            .TryGetContentType(
                relativePath,
                out var contentType))
        {
            return contentType;
        }

        return "application/octet-stream";
    }

    public string GetPhysicalPath(
        string relativePath)
    {
        if (string.IsNullOrWhiteSpace(
                relativePath))
        {
            throw new ArgumentException(
                "Relative path is required.",
                nameof(relativePath));
        }

        var rootFullPath =
            Path.GetFullPath(
                _rootPath);

        var fullPath =
            Path.GetFullPath(
                Path.Combine(
                    rootFullPath,
                    relativePath));

        var safeRoot =
            rootFullPath.EndsWith(
                Path.DirectorySeparatorChar)
                ? rootFullPath
                : rootFullPath +
                  Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(
                safeRoot,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "The requested file is outside local storage.");
        }

        return fullPath;
    }

    public async Task SaveAsync(
        string relativePath,
        Stream source,
        CancellationToken cancellationToken = default)
    {
        var fullPath =
            GetPhysicalPath(
                relativePath);

        var directory =
            Path.GetDirectoryName(
                fullPath);

        if (!string.IsNullOrWhiteSpace(
                directory))
        {
            Directory.CreateDirectory(
                directory);
        }

        await using var destination =
            new FileStream(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize:
                    64 * 1024,
                useAsync:
                    true);

        await source.CopyToAsync(
            destination,
            cancellationToken);
    }

    public void Delete(
        string relativePath)
    {
        var fullPath =
            GetPhysicalPath(
                relativePath);

        if (File.Exists(
                fullPath))
        {
            File.Delete(
                fullPath);
        }
    }
}