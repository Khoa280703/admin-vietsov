import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

async function createDatabase() {
  // Connect to master database first
  const masterDataSource = new DataSource({
    type: "mssql",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "1433"),
    username: process.env.DATABASE_USER || "sa",
    password: process.env.DATABASE_PASSWORD || "",
    database: "master",
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    extra: {
      trustServerCertificate: true,
      encrypt: false,
    },
  });

  try {
    await masterDataSource.initialize();
    console.log("Connected to master database");

    const databaseName = process.env.DATABASE_NAME || "test_post";
    const queryRunner = masterDataSource.createQueryRunner();

    // Check if database exists
    const result = await queryRunner.query(
      `SELECT name FROM sys.databases WHERE name = '${databaseName}'`
    );

    if (result.length === 0) {
      // Create database
      await queryRunner.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Database '${databaseName}' created successfully`);
    } else {
      console.log(`Database '${databaseName}' already exists`);
    }

    await queryRunner.release();
    await masterDataSource.destroy();
  } catch (error) {
    console.error("Error creating database:", error);
    process.exit(1);
  }
}

createDatabase();

