using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext db, IPasswordHasher<User> passwordHasher, IConfiguration configuration)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var userName = string.IsNullOrWhiteSpace(request.UserName)
            ? email.Split('@')[0]
            : request.UserName.Trim();
        if (await _db.Users.AnyAsync(user => user.Email == email, cancellationToken))
            return Conflict(new { message = "Email is already registered." });
        if (await _db.Users.AnyAsync(user => user.UserName == userName, cancellationToken))
            return Conflict(new { message = "Username is already registered." });

        var user = new User { Id = Guid.NewGuid(), Email = email, UserName = userName, DisplayName = request.DisplayName.Trim(), CreatedAt = DateTimeOffset.UtcNow };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(await CreateAuthResponseAsync(user, cancellationToken));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.SingleOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (user is null || _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Invalid email or password." });
        return Ok(await CreateAuthResponseAsync(user, cancellationToken));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshRequestDto request, CancellationToken cancellationToken)
    {
        var tokenHash = Hash(request.RefreshToken);
        var token = await _db.RefreshTokens.Include(item => item.User).SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);
        if (token is null || token.User is null || token.RevokedAt is not null || token.ExpiresAt <= DateTimeOffset.UtcNow)
            return Unauthorized(new { message = "Refresh token is invalid or expired." });
        token.RevokedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(await CreateAuthResponseAsync(token.User, cancellationToken));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequestDto request, CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
            return Unauthorized();

        var token = await _db.RefreshTokens.SingleOrDefaultAsync(
            item => item.TokenHash == Hash(request.RefreshToken) && item.UserId == userId,
            cancellationToken);

        if (token is not null)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return NoContent();
    }

    private async Task<AuthResponseDto> CreateAuthResponseAsync(User user, CancellationToken cancellationToken)
    {
        var rawRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _db.RefreshTokens.Add(new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = Hash(rawRefreshToken), ExpiresAt = DateTimeOffset.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:RefreshTokenDays")) });
        await _db.SaveChangesAsync(cancellationToken);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SigningKey"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), new Claim(JwtRegisteredClaimNames.Email, user.Email), new Claim(ClaimTypes.Name, user.UserName) };
        var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:AccessTokenMinutes")), signingCredentials: credentials);
        return new AuthResponseDto(Map(user), new JwtSecurityTokenHandler().WriteToken(token), rawRefreshToken);
    }

    private static CurrentUserDto Map(User user) => new(user.Id, user.Email, user.DisplayName, $"@{user.UserName}", user.Bio);
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
