using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Auth;

public sealed class EfUserAccountRepository : IUserAccountRepository
{
    private readonly AppDbContext _db;

    public EfUserAccountRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<User?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        _db.Users.SingleOrDefaultAsync(
            user => user.Id == userId,
            cancellationToken);

    public Task<User?> GetUserByEmailAsync(
        string email,
        CancellationToken cancellationToken) =>
        _db.Users.SingleOrDefaultAsync(
            user => user.Email == email,
            cancellationToken);

    public Task<bool> EmailExistsAsync(
        string email,
        Guid? excludingUserId,
        CancellationToken cancellationToken) =>
        _db.Users.AnyAsync(
            user =>
                user.Email == email &&
                (!excludingUserId.HasValue || user.Id != excludingUserId.Value),
            cancellationToken);

    public Task<bool> UserNameExistsAsync(
        string userName,
        Guid? excludingUserId,
        CancellationToken cancellationToken) =>
        _db.Users.AnyAsync(
            user =>
                user.UserName == userName &&
                (!excludingUserId.HasValue || user.Id != excludingUserId.Value),
            cancellationToken);

    public Task<RefreshToken?> GetRefreshTokenWithUserAsync(
        string tokenHash,
        CancellationToken cancellationToken) =>
        _db.RefreshTokens
            .Include(token => token.User)
            .SingleOrDefaultAsync(
                token => token.TokenHash == tokenHash,
                cancellationToken);

    public Task<RefreshToken?> GetRefreshTokenForUserAsync(
        Guid userId,
        string tokenHash,
        CancellationToken cancellationToken) =>
        _db.RefreshTokens.SingleOrDefaultAsync(
            token =>
                token.UserId == userId &&
                token.TokenHash == tokenHash,
            cancellationToken);

    public void AddUser(User user)
    {
        _db.Users.Add(user);
    }

    public void AddRefreshToken(RefreshToken refreshToken)
    {
        _db.RefreshTokens.Add(refreshToken);
    }

    public Task SaveChangesAsync(
        CancellationToken cancellationToken) =>
        _db.SaveChangesAsync(cancellationToken);
}
