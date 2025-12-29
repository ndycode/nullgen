/**
 * Structured logging utility for production
 * Provides consistent, environment-aware logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

class Logger {
    private minLevel: LogLevel;

    constructor() {
        // In production, only log warnings and errors
        // In development, log everything
        this.minLevel = process.env.NODE_ENV === "production" ? "warn" : "debug";
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
    }

    private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context }),
        };
    }

    private log(level: LogLevel, message: string, context?: LogContext): void {
        if (!this.shouldLog(level)) return;

        const entry = this.formatEntry(level, message, context);

        // In production, output structured JSON for log aggregators
        if (process.env.NODE_ENV === "production") {
            const output = JSON.stringify(entry);
            switch (level) {
                case "error":
                    console.error(output);
                    break;
                case "warn":
                    console.warn(output);
                    break;
                default:
                    console.log(output);
            }
        } else {
            // In development, use colored console output
            const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
            const contextStr = context ? ` ${JSON.stringify(context)}` : "";

            switch (level) {
                case "debug":
                    console.debug(`${prefix} ${message}${contextStr}`);
                    break;
                case "info":
                    console.info(`${prefix} ${message}${contextStr}`);
                    break;
                case "warn":
                    console.warn(`${prefix} ${message}${contextStr}`);
                    break;
                case "error":
                    console.error(`${prefix} ${message}${contextStr}`);
                    break;
            }
        }
    }

    debug(message: string, context?: LogContext): void {
        this.log("debug", message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log("info", message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log("warn", message, context);
    }

    error(message: string, context?: LogContext): void {
        this.log("error", message, context);
    }

    /**
     * Log an error with stack trace
     */
    exception(message: string, error: unknown, context?: LogContext): void {
        const errorContext: LogContext = {
            ...context,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : String(error),
        };
        this.error(message, errorContext);
    }
}

export const logger = new Logger();
