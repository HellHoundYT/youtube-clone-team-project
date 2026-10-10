using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YouTubeClone.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261010122000_AddSocialFriends")]
    public partial class AddSocialFriends : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Friendships",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    UserAId = table.Column<Guid>(nullable: false),
                    UserBId = table.Column<Guid>(nullable: false),
                    RequestedById = table.Column<Guid>(nullable: false),
                    Status = table.Column<string>(maxLength: 24, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Friendships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Friendships_Users_UserAId",
                        column: x => x.UserAId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Friendships_Users_UserBId",
                        column: x => x.UserBId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Friendships_Users_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "WatchPartyInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    SenderId = table.Column<Guid>(nullable: false),
                    RecipientId = table.Column<Guid>(nullable: false),
                    RoomCode = table.Column<string>(maxLength: 12, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchPartyInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WatchPartyInvitations_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WatchPartyInvitations_Users_RecipientId",
                        column: x => x.RecipientId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SocialNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    Type = table.Column<string>(maxLength: 40, nullable: false),
                    ActorUserId = table.Column<Guid>(nullable: true),
                    FriendshipId = table.Column<Guid>(nullable: true),
                    WatchPartyInvitationId = table.Column<Guid>(nullable: true),
                    TargetPath = table.Column<string>(maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    ReadAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SocialNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialNotifications_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_UserAId_UserBId",
                table: "Friendships",
                columns: new[] { "UserAId", "UserBId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_UserBId",
                table: "Friendships",
                column: "UserBId");

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_RequestedById",
                table: "Friendships",
                column: "RequestedById");

            migrationBuilder.CreateIndex(
                name: "IX_SocialNotifications_ActorUserId",
                table: "SocialNotifications",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialNotifications_UserId_ReadAt_CreatedAt",
                table: "SocialNotifications",
                columns: new[] { "UserId", "ReadAt", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WatchPartyInvitations_RecipientId_CreatedAt",
                table: "WatchPartyInvitations",
                columns: new[] { "RecipientId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WatchPartyInvitations_SenderId",
                table: "WatchPartyInvitations",
                column: "SenderId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SocialNotifications");

            migrationBuilder.DropTable(
                name: "WatchPartyInvitations");

            migrationBuilder.DropTable(
                name: "Friendships");
        }
    }
}
