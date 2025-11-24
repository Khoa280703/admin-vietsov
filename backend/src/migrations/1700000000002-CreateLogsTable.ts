import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateLogsTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create logs table
    await queryRunner.createTable(
      new Table({
        name: "logs",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "userId",
            type: "int",
            isNullable: true,
          },
          {
            name: "action",
            type: "nvarchar",
            length: "100",
          },
          {
            name: "module",
            type: "nvarchar",
            length: "50",
          },
          {
            name: "endpoint",
            type: "nvarchar",
            length: "255",
          },
          {
            name: "method",
            type: "varchar",
            length: "10",
          },
          {
            name: "statusCode",
            type: "int",
          },
          {
            name: "ipAddress",
            type: "nvarchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "userAgent",
            type: "text",
            isNullable: true,
          },
          {
            name: "message",
            type: "text",
          },
          {
            name: "level",
            type: "varchar",
            length: "10",
            default: "'info'",
          },
          {
            name: "metadata",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "datetime2",
            default: "GETDATE()",
          },
        ],
      }),
      true
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      "logs",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "SET NULL",
        name: "FK_logs_userId",
      })
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_userId",
        columnNames: ["userId"],
      })
    );

    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_action",
        columnNames: ["action"],
      })
    );

    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_level",
        columnNames: ["level"],
      })
    );

    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_createdAt",
        columnNames: ["createdAt"],
      })
    );

    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_module",
        columnNames: ["module"],
      })
    );

    await queryRunner.createIndex(
      "logs",
      new TableIndex({
        name: "IDX_logs_statusCode",
        columnNames: ["statusCode"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex("logs", "IDX_logs_statusCode");
    await queryRunner.dropIndex("logs", "IDX_logs_module");
    await queryRunner.dropIndex("logs", "IDX_logs_createdAt");
    await queryRunner.dropIndex("logs", "IDX_logs_level");
    await queryRunner.dropIndex("logs", "IDX_logs_action");
    await queryRunner.dropIndex("logs", "IDX_logs_userId");

    // Drop foreign key
    await queryRunner.dropForeignKey("logs", "FK_logs_userId");

    // Drop table
    await queryRunner.dropTable("logs");
  }
}

