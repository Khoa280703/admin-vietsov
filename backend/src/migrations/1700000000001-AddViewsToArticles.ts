import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddViewsToArticles1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "articles",
      new TableColumn({
        name: "views",
        type: "int",
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("articles", "views");
  }
}

