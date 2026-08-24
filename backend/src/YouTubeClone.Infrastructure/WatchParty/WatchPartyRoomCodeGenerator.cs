using System.Security.Cryptography;
using YouTubeClone.Application.Features.WatchParty;

namespace YouTubeClone.Infrastructure.WatchParty;

public sealed class WatchPartyRoomCodeGenerator :
    IWatchPartyRoomCodeGenerator
{
    private const int RoomCodeLength =
        6;

    private const string RoomCodeAlphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public string GenerateRoomCode()
    {
        var characters =
            new char[
                RoomCodeLength];

        for (
            var index = 0;
            index < characters.Length;
            index++)
        {
            var alphabetIndex =
                RandomNumberGenerator
                    .GetInt32(
                        RoomCodeAlphabet.Length);

            characters[index] =
                RoomCodeAlphabet[
                    alphabetIndex];
        }

        return new string(
            characters);
    }
}