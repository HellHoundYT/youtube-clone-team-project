namespace YouTubeClone.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName =
        "Storage";

    public string RootPath { get; set; } =
        Path.Combine(
            "Storage",
            "media");
}