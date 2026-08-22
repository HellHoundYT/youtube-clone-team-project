using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.Data;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddSingleton<IVideoReadService, VideoReadService>();

builder.Services.AddSingleton<
    IFileStorageService,
    LocalFileStorageService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthorization();

app.MapControllers();

app.Run();