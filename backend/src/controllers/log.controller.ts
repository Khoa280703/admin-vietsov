import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Log, LogLevel } from "../entities/Log";
import { query, validationResult } from "express-validator";

export class LogController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const action = req.query.action as string | undefined;
      const level = req.query.level as LogLevel | undefined;
      const module = req.query.module as string | undefined;
      const endpoint = req.query.endpoint as string | undefined;
      const statusCode = req.query.statusCode ? parseInt(req.query.statusCode as string) : undefined;
      const ipAddress = req.query.ipAddress as string | undefined;
      const searchText = req.query.searchText as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const logRepository = AppDataSource.getRepository(Log);
      const queryBuilder = logRepository
        .createQueryBuilder("log")
        .leftJoinAndSelect("log.user", "user")
        .select([
          "log.id",
          "log.userId",
          "log.action",
          "log.module",
          "log.endpoint",
          "log.method",
          "log.statusCode",
          "log.ipAddress",
          "log.userAgent",
          "log.message",
          "log.level",
          "log.metadata",
          "log.createdAt",
          "user.id",
          "user.username",
          "user.fullName",
          "user.email",
        ]);

      // Apply filters
      if (userId) {
        queryBuilder.andWhere("log.userId = :userId", { userId });
      }

      if (action) {
        queryBuilder.andWhere("log.action = :action", { action });
      }

      if (level) {
        queryBuilder.andWhere("log.level = :level", { level });
      }

      if (module) {
        queryBuilder.andWhere("log.module = :module", { module });
      }

      if (endpoint) {
        queryBuilder.andWhere("log.endpoint LIKE :endpoint", { endpoint: `%${endpoint}%` });
      }

      if (statusCode) {
        queryBuilder.andWhere("log.statusCode = :statusCode", { statusCode });
      }

      if (ipAddress) {
        queryBuilder.andWhere("log.ipAddress LIKE :ipAddress", { ipAddress: `%${ipAddress}%` });
      }

      if (searchText) {
        queryBuilder.andWhere(
          "(log.message LIKE :searchText OR log.action LIKE :searchText OR log.module LIKE :searchText)",
          { searchText: `%${searchText}%` }
        );
      }

      if (startDate) {
        queryBuilder.andWhere("log.createdAt >= :startDate", { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere("log.createdAt <= :endDate", { endDate });
      }

      // Order by createdAt DESC (newest first)
      queryBuilder.orderBy("log.createdAt", "DESC");

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const logs = await queryBuilder.skip(skip).take(limit).getMany();

      // Parse metadata JSON
      const logsWithParsedMetadata = logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));

      res.json({
        data: logsWithParsedMetadata,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error("Error in LogController.list:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const logRepository = AppDataSource.getRepository(Log);
      const log = await logRepository.findOne({
        where: { id: parseInt(id) },
        relations: ["user"],
      });

      if (!log) {
        res.status(404).json({ error: "Log not found" });
        return;
      }

      // Parse metadata JSON
      const logWithParsedMetadata = {
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      };

      res.json({ data: logWithParsedMetadata });
    } catch (error: any) {
      console.error("Error in LogController.getById:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async export(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query.format as string) || "json";
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const action = req.query.action as string | undefined;
      const level = req.query.level as LogLevel | undefined;
      const module = req.query.module as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const logRepository = AppDataSource.getRepository(Log);
      const queryBuilder = logRepository
        .createQueryBuilder("log")
        .leftJoinAndSelect("log.user", "user")
        .select([
          "log.id",
          "log.userId",
          "log.action",
          "log.module",
          "log.endpoint",
          "log.method",
          "log.statusCode",
          "log.ipAddress",
          "log.userAgent",
          "log.message",
          "log.level",
          "log.metadata",
          "log.createdAt",
          "user.id",
          "user.username",
          "user.fullName",
          "user.email",
        ]);

      // Apply same filters as list
      if (userId) {
        queryBuilder.andWhere("log.userId = :userId", { userId });
      }
      if (action) {
        queryBuilder.andWhere("log.action = :action", { action });
      }
      if (level) {
        queryBuilder.andWhere("log.level = :level", { level });
      }
      if (module) {
        queryBuilder.andWhere("log.module = :module", { module });
      }
      if (startDate) {
        queryBuilder.andWhere("log.createdAt >= :startDate", { startDate });
      }
      if (endDate) {
        queryBuilder.andWhere("log.createdAt <= :endDate", { endDate });
      }

      queryBuilder.orderBy("log.createdAt", "DESC");

      const logs = await queryBuilder.getMany();

      if (format === "csv") {
        // Generate CSV
        const headers = [
          "ID",
          "Timestamp",
          "User",
          "Action",
          "Module",
          "Endpoint",
          "Method",
          "Status Code",
          "Level",
          "IP Address",
          "Message",
        ];

        const rows = logs.map((log) => [
          log.id,
          log.createdAt.toISOString(),
          log.user ? `${log.user.username} (${log.user.fullName})` : "System",
          log.action,
          log.module,
          log.endpoint,
          log.method,
          log.statusCode,
          log.level,
          log.ipAddress || "",
          log.message.replace(/,/g, ";"), // Replace commas in message
        ]);

        const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.csv`);
        res.send(csv);
      } else {
        // Generate JSON
        const logsWithParsedMetadata = logs.map((log) => ({
          ...log,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        }));

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=logs-${new Date().toISOString().split("T")[0]}.json`);
        res.json(logsWithParsedMetadata);
      }
    } catch (error: any) {
      console.error("Error in LogController.export:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const logRepository = AppDataSource.getRepository(Log);

      // Logs by level
      const logsByLevel = await logRepository
        .createQueryBuilder("log")
        .select("log.level", "level")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.level")
        .getRawMany();

      // Logs by module
      const logsByModule = await logRepository
        .createQueryBuilder("log")
        .select("log.module", "module")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.module")
        .orderBy("COUNT(*)", "DESC")
        .limit(10)
        .getRawMany();

      // Logs by day (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const logsByDay = await logRepository
        .createQueryBuilder("log")
        .select("CAST(log.createdAt AS DATE)", "date")
        .addSelect("COUNT(*)", "count")
        .where("log.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
        .groupBy("CAST(log.createdAt AS DATE)")
        .orderBy("CAST(log.createdAt AS DATE)", "ASC")
        .getRawMany();

      // Top actions
      const topActions = await logRepository
        .createQueryBuilder("log")
        .select("log.action", "action")
        .addSelect("COUNT(*)", "count")
        .groupBy("log.action")
        .orderBy("COUNT(*)", "DESC")
        .limit(10)
        .getRawMany();

      // Error rate (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const totalLogs24h = await logRepository
        .createQueryBuilder("log")
        .where("log.createdAt >= :oneDayAgo", { oneDayAgo })
        .getCount();

      const errorLogs24h = await logRepository
        .createQueryBuilder("log")
        .where("log.createdAt >= :oneDayAgo", { oneDayAgo })
        .andWhere("log.level = :level", { level: LogLevel.ERROR })
        .getCount();

      const errorRate = totalLogs24h > 0 ? (errorLogs24h / totalLogs24h) * 100 : 0;

      res.json({
        logsByLevel: logsByLevel.map((item) => ({
          level: item.level,
          count: parseInt(item.count),
        })),
        logsByModule: logsByModule.map((item) => ({
          module: item.module,
          count: parseInt(item.count),
        })),
        logsByDay: logsByDay.map((item) => ({
          date: item.date,
          count: parseInt(item.count),
        })),
        topActions: topActions.map((item) => ({
          action: item.action,
          count: parseInt(item.count),
        })),
        errorRate: parseFloat(errorRate.toFixed(2)),
        totalLogs24h,
        errorLogs24h,
      });
    } catch (error: any) {
      console.error("Error in LogController.getStats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const listLogsValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("userId").optional().isInt(),
  query("action").optional().isString(),
  query("level").optional().isIn(Object.values(LogLevel)),
  query("module").optional().isString(),
  query("endpoint").optional().isString(),
  query("statusCode").optional().isInt(),
  query("ipAddress").optional().isString(),
  query("searchText").optional().isString(),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
];

