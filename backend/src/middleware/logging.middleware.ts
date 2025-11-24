import { Request, Response, NextFunction } from "express";
import { LogService, LogData } from "../services/log.service";
import { LogLevel } from "../entities/Log";
import { AuthRequest } from "./auth.middleware";

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return (
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    undefined
  );
}

/**
 * Extract module name from endpoint
 */
function extractModule(endpoint: string): string {
  // Extract module from /api/v1/{module}
  const match = endpoint.match(/\/api\/v1\/([^\/]+)/);
  if (match) {
    return match[1];
  }
  return "unknown";
}

/**
 * Determine log level based on status code
 */
function getLogLevel(statusCode: number): LogLevel {
  if (statusCode >= 500) {
    return LogLevel.ERROR;
  } else if (statusCode >= 400) {
    return LogLevel.WARN;
  }
  return LogLevel.INFO;
}

/**
 * Extract action from method and endpoint
 */
function extractAction(method: string, endpoint: string): string {
  const parts = endpoint.split("/").filter(Boolean);
  const resource = parts[parts.length - 1] || "unknown";

  const actionMap: Record<string, string> = {
    GET: "view",
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };

  const baseAction = actionMap[method] || method.toLowerCase();

  // Special cases
  if (endpoint.includes("/login")) return "login";
  if (endpoint.includes("/logout")) return "logout";
  if (endpoint.includes("/refresh")) return "refresh_token";
  if (endpoint.includes("/submit")) return "submit";
  if (endpoint.includes("/approve")) return "approve";
  if (endpoint.includes("/reject")) return "reject";
  if (endpoint.includes("/publish")) return "publish";

  return `${baseAction}_${resource}`;
}

/**
 * Logging middleware to capture all API requests
 */
export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip health check and static files
  if (
    req.path === "/health" ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/api/v1/logs") // Don't log log requests to avoid recursion
  ) {
    return next();
  }

  const startTime = Date.now();
  const authReq = req as AuthRequest;

  // Capture response using 'finish' event instead of overriding send
  // This ensures response is already sent before we try to log
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Prepare log data
    const logData: LogData = {
      userId: authReq.userId,
      action: extractAction(req.method, req.path),
      module: extractModule(req.path),
      endpoint: req.path,
      method: req.method,
      statusCode,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"],
      message: `${req.method} ${req.path} - ${statusCode} (${duration}ms)`,
      level: getLogLevel(statusCode),
      metadata: {
        duration,
        query: req.query,
        params: req.params,
        // Only include body for non-sensitive endpoints
        body:
          req.method !== "GET" && !req.path.includes("/auth/login")
            ? LogService.sanitizeMetadata(req.body)
            : undefined,
      },
    };

    // Write log asynchronously (don't block response)
    // Use setImmediate to ensure this runs after response is fully sent
    setImmediate(() => {
      LogService.writeLog(logData).catch((error) => {
        console.error("Failed to write log:", error);
      });
    });
  });

  next();
};

