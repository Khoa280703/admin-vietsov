import { AppDataSource } from "../config/data-source";
import { Log, LogLevel } from "../entities/Log";
import * as fs from "fs";
import * as path from "path";

export interface LogData {
  userId?: number;
  action: string;
  module: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  level?: LogLevel;
  metadata?: any;
}

export class LogService {
  private static readonly LOGS_DIR = path.join(process.cwd(), "logs");

  /**
   * Ensure logs directory exists
   */
  private static ensureLogsDirectory(): void {
    if (!fs.existsSync(this.LOGS_DIR)) {
      fs.mkdirSync(this.LOGS_DIR, { recursive: true });
    }
  }

  /**
   * Format log entry for file storage
   */
  private static formatLogEntry(data: LogData): any {
    return {
      timestamp: new Date().toISOString(),
      userId: data.userId || null,
      action: data.action,
      module: data.module,
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      message: data.message,
      level: data.level || LogLevel.INFO,
      metadata: data.metadata || null,
    };
  }

  /**
   * Write log to file (daily rotation)
   */
  private static async writeToFile(data: LogData): Promise<void> {
    try {
      this.ensureLogsDirectory();

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const logFile = path.join(this.LOGS_DIR, `logs-${today}.json`);

      const logEntry = this.formatLogEntry(data);

      // Read existing logs or create new array
      let logs: any[] = [];
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, "utf-8");
        try {
          logs = JSON.parse(fileContent);
        } catch (error) {
          // If file is corrupted, start fresh
          logs = [];
        }
      }

      // Add new log entry
      logs.push(logEntry);

      // Write back to file
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), "utf-8");
    } catch (error) {
      // Don't throw error if file logging fails, just log to console
      console.error("Failed to write log to file:", error);
    }
  }

  /**
   * Write log to database
   */
  private static async writeToDatabase(data: LogData): Promise<Log | null> {
    try {
      const logRepository = AppDataSource.getRepository(Log);

      // Safely stringify metadata, handling circular references
      let metadataString: string | null = null;
      if (data.metadata) {
        try {
          metadataString = JSON.stringify(data.metadata);
        } catch (error) {
          // If JSON.stringify fails (e.g., circular reference), store error message
          metadataString = JSON.stringify({ error: "Failed to serialize metadata", message: String(error) });
        }
      }

      const log = logRepository.create({
        userId: data.userId,
        action: data.action,
        module: data.module,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        message: data.message,
        level: data.level || LogLevel.INFO,
        metadata: metadataString,
      });

      return await logRepository.save(log);
    } catch (error) {
      // Log error but don't throw - logging should never break the application
      console.error("Failed to write log to database:", error);
      return null;
    }
  }

  /**
   * Write log to both database and file
   * This method never throws - it catches all errors internally
   */
  static async writeLog(data: LogData): Promise<Log | null> {
    try {
      // Write to database (primary storage)
      const log = await this.writeToDatabase(data);

      // Write to file (backup/archive) - don't wait for it
      this.writeToFile(data).catch((error) => {
        console.error("Failed to write log to file:", error);
      });

      return log;
    } catch (error) {
      // This should never happen, but just in case
      console.error("Unexpected error in writeLog:", error);
      return null;
    }
  }

  /**
   * Sanitize sensitive data from metadata
   * Also handles circular references by using a Set to track visited objects
   */
  static sanitizeMetadata(metadata: any, visited: Set<any> = new Set()): any {
    if (!metadata || typeof metadata !== "object") {
      return metadata;
    }

    // Handle circular references
    if (visited.has(metadata)) {
      return "[Circular Reference]";
    }
    visited.add(metadata);

    try {
      const sanitized = Array.isArray(metadata) ? [...metadata] : { ...metadata };
      const sensitiveFields = ["password", "token", "accessToken", "refreshToken", "authorization"];

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = "[REDACTED]";
        }
      }

      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeMetadata(sanitized[key], visited);
        }
      }

      visited.delete(metadata);
      return sanitized;
    } catch (error) {
      // If sanitization fails, return a safe representation
      return { error: "Failed to sanitize metadata", type: typeof metadata };
    }
  }
}

