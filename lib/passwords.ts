import crypto from "crypto";
import { promisify } from "util";
import { logger } from "./logger";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_KEY_BYTES = 32;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };
const scryptAsync = promisify(crypto.scrypt);

// Track legacy hash usage for monitoring
let legacyHashWarningLogged = false;

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/**
 * Check if a stored hash uses the modern scrypt format
 */
export function isModernHash(storedHash: string): boolean {
    return storedHash.startsWith(`${SCRYPT_PREFIX}$`);
}

/**
 * Check if a stored hash uses the legacy SHA-256 format
 * @deprecated Legacy hashes should be migrated to scrypt
 */
export function isLegacyHash(storedHash: string): boolean {
    // Legacy hashes are 64-char hex strings (SHA-256)
    return storedHash.length === 64 && /^[0-9a-f]+$/i.test(storedHash);
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(SCRYPT_SALT_BYTES);
    const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_BYTES, SCRYPT_OPTIONS);
    return `${SCRYPT_PREFIX}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

/**
 * Verify a password against a stored hash.
 * Supports both modern scrypt hashes and legacy SHA-256 hashes.
 *
 * @returns Object with verified status and whether re-hashing is recommended
 */
export async function verifyPasswordWithMigration(
    password: string,
    storedHash: string
): Promise<{ verified: boolean; needsRehash: boolean; newHash?: string }> {
    if (!storedHash) {
        return { verified: false, needsRehash: false };
    }

    // Modern scrypt hash
    if (storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
        const parts = storedHash.split("$");
        if (parts.length !== 3) {
            return { verified: false, needsRehash: false };
        }
        const salt = Buffer.from(parts[1], "base64");
        const expected = Buffer.from(parts[2], "base64");
        const actual = crypto.scryptSync(password, salt, expected.length, SCRYPT_OPTIONS);
        const verified = timingSafeEqual(actual, expected);
        return { verified, needsRehash: false };
    }

    // Legacy SHA-256 hex hash
    if (!legacyHashWarningLogged) {
        logger.warn(
            "Legacy SHA-256 password hash detected. Consider migrating to scrypt on next password change."
        );
        legacyHashWarningLogged = true;
    }

    const legacy = crypto.createHash("sha256").update(password).digest("hex");
    const verified = timingSafeEqual(Buffer.from(legacy, "utf8"), Buffer.from(storedHash, "utf8"));

    if (verified) {
        // Generate new hash for migration
        const newHash = await hashPassword(password);
        return { verified: true, needsRehash: true, newHash };
    }

    return { verified: false, needsRehash: false };
}

/**
 * Verify a password against a stored hash.
 * For simple verification without migration support.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const result = await verifyPasswordWithMigration(password, storedHash);
    return result.verified;
}
