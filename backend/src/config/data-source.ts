import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

// For migrations, we might need to connect to master first if database doesn't exist
const databaseName = process.env.DATABASE_NAME || "test_post";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "1433"),
  username: process.env.DATABASE_USER || "sa",
  password: process.env.DATABASE_PASSWORD || "",
  database: databaseName,
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/../entities/**/*.ts"],
  migrations: [__dirname + "/../migrations/**/*.ts"],
  subscribers: [__dirname + "/../subscribers/**/*.ts"],
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
