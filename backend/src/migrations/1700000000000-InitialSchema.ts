import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Roles table
    await queryRunner.createTable(
      new Table({
        name: "roles",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "nvarchar",
            length: "100",
            isUnique: true,
          },
          {
            name: "description",
            type: "nvarchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "permissions",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
          {
            name: "updatedAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    // Users table
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "username",
            type: "nvarchar",
            length: "100",
            isUnique: true,
          },
          {
            name: "email",
            type: "nvarchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "password",
            type: "nvarchar",
            length: "255",
          },
          {
            name: "fullName",
            type: "nvarchar",
            length: "255",
          },
          {
            name: "roleId",
            type: "int",
          },
          {
            name: "isActive",
            type: "bit",
            default: 1,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
          {
            name: "updatedAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "users",
      new TableForeignKey({
        columnNames: ["roleId"],
        referencedColumnNames: ["id"],
        referencedTableName: "roles",
        onDelete: "CASCADE",
      })
    );

    // Categories table
    await queryRunner.createTable(
      new Table({
        name: "categories",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "nvarchar",
            length: "255",
          },
          {
            name: "slug",
            type: "nvarchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "type",
            type: "varchar",
            length: "50",
            default: "'other'",
          },
          {
            name: "parentId",
            type: "int",
            isNullable: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "bit",
            default: 1,
          },
          {
            name: "order",
            type: "int",
            default: 0,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
          {
            name: "updatedAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    // Create self-referencing foreign key for categories after table is created
    // SQL Server doesn't allow CASCADE on self-referencing FK, use NO ACTION instead
    await queryRunner.query(`
      ALTER TABLE [categories]
      ADD CONSTRAINT [FK_categories_parentId]
      FOREIGN KEY ([parentId]) REFERENCES [categories]([id]) ON DELETE NO ACTION
    `);

    // Create closure table for tree structure (TypeORM closure-table pattern)
    await queryRunner.query(`
      CREATE TABLE [categories_closure] (
        [id_ancestor] int NOT NULL,
        [id_descendant] int NOT NULL,
        PRIMARY KEY ([id_ancestor], [id_descendant])
      )
    `);

    await queryRunner.query(`
      ALTER TABLE [categories_closure]
      ADD CONSTRAINT [FK_categories_closure_ancestor]
      FOREIGN KEY ([id_ancestor]) REFERENCES [categories]([id]) ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE [categories_closure]
      ADD CONSTRAINT [FK_categories_closure_descendant]
      FOREIGN KEY ([id_descendant]) REFERENCES [categories]([id]) ON DELETE NO ACTION
    `);

    // Tags table
    await queryRunner.createTable(
      new Table({
        name: "tags",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "nvarchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "slug",
            type: "nvarchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
          {
            name: "updatedAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    // Articles table
    await queryRunner.createTable(
      new Table({
        name: "articles",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "title",
            type: "nvarchar",
            length: "500",
          },
          {
            name: "subtitle",
            type: "nvarchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "slug",
            type: "nvarchar",
            length: "500",
            isUnique: true,
          },
          {
            name: "excerpt",
            type: "text",
            isNullable: true,
          },
          {
            name: "contentJson",
            type: "text",
          },
          {
            name: "contentHtml",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "50",
            default: "'draft'",
          },
          {
            name: "authorId",
            type: "int",
          },
          {
            name: "featuredImage",
            type: "nvarchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "seoTitle",
            type: "nvarchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "seoDescription",
            type: "text",
            isNullable: true,
          },
          {
            name: "seoKeywords",
            type: "text",
            isNullable: true,
          },
          {
            name: "isFeatured",
            type: "bit",
            default: 0,
          },
          {
            name: "isBreakingNews",
            type: "bit",
            default: 0,
          },
          {
            name: "allowComments",
            type: "bit",
            default: 1,
          },
          {
            name: "visibility",
            type: "nvarchar",
            length: "100",
            default: "'web,mobile'",
          },
          {
            name: "scheduledAt",
            type: "datetime2",
            isNullable: true,
          },
          {
            name: "publishedAt",
            type: "datetime2",
            isNullable: true,
          },
          {
            name: "reviewNotes",
            type: "text",
            isNullable: true,
          },
          {
            name: "wordCount",
            type: "int",
            default: 0,
          },
          {
            name: "characterCount",
            type: "int",
            default: 0,
          },
          {
            name: "readingTime",
            type: "int",
            default: 0,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
          {
            name: "updatedAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "articles",
      new TableForeignKey({
        columnNames: ["authorId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Article Categories junction table
    await queryRunner.createTable(
      new Table({
        name: "article_categories",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "articleId",
            type: "int",
          },
          {
            name: "categoryId",
            type: "int",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "article_categories",
      new TableForeignKey({
        columnNames: ["articleId"],
        referencedColumnNames: ["id"],
        referencedTableName: "articles",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "article_categories",
      new TableForeignKey({
        columnNames: ["categoryId"],
        referencedColumnNames: ["id"],
        referencedTableName: "categories",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createIndex(
      "article_categories",
      new TableIndex({
        name: "IDX_article_categories_unique",
        columnNames: ["articleId", "categoryId"],
        isUnique: true,
      })
    );

    // Article Tags junction table
    await queryRunner.createTable(
      new Table({
        name: "article_tags",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "articleId",
            type: "int",
          },
          {
            name: "tagId",
            type: "int",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "article_tags",
      new TableForeignKey({
        columnNames: ["articleId"],
        referencedColumnNames: ["id"],
        referencedTableName: "articles",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "article_tags",
      new TableForeignKey({
        columnNames: ["tagId"],
        referencedColumnNames: ["id"],
        referencedTableName: "tags",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createIndex(
      "article_tags",
      new TableIndex({
        name: "IDX_article_tags_unique",
        columnNames: ["articleId", "tagId"],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("article_tags", true);
    await queryRunner.dropTable("article_categories", true);
    await queryRunner.dropTable("articles", true);
    await queryRunner.dropTable("tags", true);
    await queryRunner.dropTable("categories", true);
    await queryRunner.dropTable("users", true);
    await queryRunner.dropTable("roles", true);
  }
}
