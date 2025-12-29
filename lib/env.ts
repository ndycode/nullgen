/**
 * Environment configuration with runtime validation
 * Ensures all required environment variables are set
 */

import { logger } from "./logger";

interface EnvConfig {
    // R2 Storage
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL?: string;

    // App
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_APP_URL?: string;
}

interface EnvValidation {
    isValid: boolean;
    missing: string[];
    warnings: string[];
}

/**
 * Validate environment variables
 */
function validateEnv(): EnvValidation {
    const required = [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
    ];

    const optional = [
        "R2_PUBLIC_URL",
        "NEXT_PUBLIC_APP_URL",
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    for (const key of optional) {
        if (!process.env[key]) {
            warnings.push(`Optional env var ${key} is not set`);
        }
    }

    return {
        isValid: missing.length === 0,
        missing,
        warnings,
    };
}

/**
 * Get typed environment configuration
 * Logs warnings for missing optional vars, throws for missing required vars in production
 */
function getEnvConfig(): EnvConfig {
    const validation = validateEnv();

    // Log warnings
    for (const warning of validation.warnings) {
        logger.debug(warning);
    }

    // In production, require all mandatory variables
    if (!validation.isValid && process.env.NODE_ENV === "production") {
        const errorMsg = `Missing required environment variables: ${validation.missing.join(", ")}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }

    // In development, just warn
    if (!validation.isValid) {
        logger.warn(`Missing environment variables: ${validation.missing.join(", ")}. Some features may not work.`);
    }

    return {
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "",
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
        NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
    const config = getEnvConfig();
    return !!(
        config.R2_ACCOUNT_ID &&
        config.R2_ACCESS_KEY_ID &&
        config.R2_SECRET_ACCESS_KEY &&
        config.R2_BUCKET_NAME
    );
}

/**
 * Singleton env config
 */
export const env = getEnvConfig();
