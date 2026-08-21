using Microsoft.EntityFrameworkCore;

namespace YouTubeClone.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
}