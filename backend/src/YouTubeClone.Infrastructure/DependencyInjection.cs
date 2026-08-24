using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString(
                "DefaultConnection");

        services.AddDbContext<AppDbContext>(
            options =>
                options.UseSqlServer(
                    connectionString));

        return services;
    }
}