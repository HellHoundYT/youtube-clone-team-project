using Microsoft.AspNetCore.StaticFiles;

namespace YouTubeClone.Api.Storage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    private readonly FileExtensionContentTypeProvider _contentTypeProvider =
        new();

    public LocalFileStorageService(IWebHostEnvironment environment)
    {
        _rootPath = Path.Combine(
            environment.ContentRootPath,
            "Storage",
            "media");

        Directory.CreateDirectory(_rootPath);
    }

    public bool Exists(string relativePath)
    {
        var fullPath = ResolveFullPath(relativePath);

        return File.Exists(fullPath);
    }

    public Stream OpenRead(string relativePath)
    {
        var fullPath = ResolveFullPath(relativePath);

        return new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 64 * 1024,
            useAsync: true);
    }

    public string GetContentType(string relativePath)
    {
        if (_contentTypeProvider.TryGetContentType(
                relativePath,
                out var contentType))
        {
            return contentType;
        }

        return "application/octet-stream";
    }

    private string ResolveFullPath(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException(
                "Relative path is required.",
                nameof(relativePath));
        }

        var rootFullPath = Path.GetFullPath(_rootPath);

        var fullPath = Path.GetFullPath(
            Path.Combine(rootFullPath, relativePath));

        var safeRoot = rootFullPath.EndsWith(
            Path.DirectorySeparatorChar)
            ? rootFullPath
            : rootFullPath + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(
                safeRoot,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "The requested file is outside local storage.");
        }

        return fullPath;
    }
}