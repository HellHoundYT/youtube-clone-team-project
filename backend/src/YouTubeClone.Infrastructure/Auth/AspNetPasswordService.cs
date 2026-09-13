using Microsoft.AspNetCore.Identity;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Infrastructure.Auth;

public sealed class AspNetPasswordService : IPasswordService
{
    private readonly IPasswordHasher<User> _passwordHasher;

    public AspNetPasswordService(IPasswordHasher<User> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public string HashPassword(
        User user,
        string password) =>
        _passwordHasher.HashPassword(user, password);

    public bool VerifyPassword(
        User user,
        string passwordHash,
        string password) =>
        _passwordHasher.VerifyHashedPassword(
            user,
            passwordHash,
            password) != PasswordVerificationResult.Failed;
}
