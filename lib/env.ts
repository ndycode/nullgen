/**
 * Environment configuration with runtime validation
 * Ensures all required environment variables are set
 *
 * ADDING NEW ENV VARS CHECKLIST:
 * 1. Add to EnvConfig interface
 * 2. Add to required[] or optional[] arrays in validateEnv()
 * 3. Add to return object in getEnvConfig()
 * 4. Update .env.example with description
 * 5. Update README.md environment section
 * 6. Deploy env vars to ALL environments before deploying code
 */

import { logger } from "./logger";

interface EnvConfig {
    // R2 Storage
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL?: string;
    // Supabase
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    // Rate limiting (Upstash)
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;

    // App
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_APP_URL?: string;

    // Feature Flags
    FEATURE_UPLOAD_ENABLED: boolean;
    FEATURE_DOWNLOAD_ENABLED: boolean;
    FEATURE_SHARE_ENABLED: boolean;
    FEATURE_CRON_ENABLED: boolean;
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
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const optional = [
        "R2_PUBLIC_URL",
        "NEXT_PUBLIC_APP_URL",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
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
 * Fails loudly on missing required vars in ALL environments.
 * Set ENV_VALIDATION_STRICT=false to allow partial env for testing.
 */
function getEnvConfig(): EnvConfig {
    const validation = validateEnv();
    const strictValidation = process.env.ENV_VALIDATION_STRICT !== "false";

    // Log warnings for optional vars
    for (const warning of validation.warnings) {
        logger.debug(warning);
    }

    // Fail loudly on missing required vars (default behavior)
    // Skip during build phase to allow 'next build' to complete
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (!validation.isValid && strictValidation && !isBuildPhase) {
        const missingList = validation.missing.map((v) => `  - ${v}`).join("\n");
        const errorMsg = [
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "FATAL: Missing required environment variables:",
            missingList,
            "",
            "To fix: Copy .env.example to .env.local and fill in values.",
            "To skip (testing only): Set ENV_VALIDATION_STRICT=false",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n");
        logger.error(errorMsg);
        throw new Error(`Missing required environment variables: ${validation.missing.join(", ")}`);
    }

    // Warn-only mode for intentional partial-env testing
    if (!validation.isValid) {
        logger.warn(
            `ENV_VALIDATION_STRICT=false: Running with missing vars: ${validation.missing.join(", ")}. ` +
                "Storage and database operations will fail."
        );
    }

    return {
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "",
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
        SUPABASE_URL: process.env.SUPABASE_URL || "",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        FEATURE_UPLOAD_ENABLED: process.env.FEATURE_UPLOAD_ENABLED !== "false",
        FEATURE_DOWNLOAD_ENABLED: process.env.FEATURE_DOWNLOAD_ENABLED !== "false",
        FEATURE_SHARE_ENABLED: process.env.FEATURE_SHARE_ENABLED !== "false",
        FEATURE_CRON_ENABLED: process.env.FEATURE_CRON_ENABLED !== "false",
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
