using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vietsov.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAuthorIdFromArticle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key if exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Articles_Users_AuthorId')
                BEGIN
                    ALTER TABLE [Articles] DROP CONSTRAINT [FK_Articles_Users_AuthorId];
                END
            ");

            // Drop index if exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Articles_AuthorId' AND object_id = OBJECT_ID('Articles'))
                BEGIN
                    DROP INDEX [IX_Articles_AuthorId] ON [Articles];
                END
            ");

            // Drop column if exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Articles') AND name = 'AuthorId')
                BEGIN
                    ALTER TABLE [Articles] DROP COLUMN [AuthorId];
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AuthorId",
                table: "Articles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Articles_AuthorId",
                table: "Articles",
                column: "AuthorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Users_AuthorId",
                table: "Articles",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
