using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Infrastructure.Auth;

public sealed class JwtAuthTokenService : IAuthTokenService
{
    private readonly IConfiguration _configuration;

    public JwtAuthTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateAccessToken(User user)
    {
        var signingKey = _configuration["Jwt:SigningKey"]
            ?? throw new InvalidOperationException(
                "JWT signing key is not configured.");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(signingKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()),
            new Claim(
                JwtRegisteredClaimNames.Email,
                user.Email),
            new Claim(
                ClaimTypes.Name,
                user.UserName)
        };

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddMinutes(
                _configuration.GetValue<int>(
                    "Jwt:AccessTokenMinutes")),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    public string CreateRefreshToken() =>
        Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(64));

    public string HashRefreshToken(string refreshToken) =>
        Convert.ToHexString(
            SHA256.HashData(
                Encoding.UTF8.GetBytes(refreshToken)));

    public DateTimeOffset GetRefreshTokenExpiration() =>
        DateTimeOffset.UtcNow.AddDays(
            _configuration.GetValue<int>(
                "Jwt:RefreshTokenDays"));
}
