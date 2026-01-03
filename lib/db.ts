import "server-only";

// Defense-in-depth: runtime check to catch misconfiguration
if (typeof window !== "undefined") {
    throw new Error("Database module cannot be imported on the client side");
}

import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { performance } from "perf_hooks";
import { env } from "./env";
import { logger } from "./logger";
import { StorageError, ValidationError } from "./errors";

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
}

function validateUUID(id: string, context: string): void {
    if (!id || !isValidUUID(id)) {
        throw new ValidationError(`Invalid UUID for ${context}: ${id || "(empty)"}`);
    }
}

export interface FileRecord {
    id: string;
    code: string;
    storage_key: string;
    original_name: string;
    size: number;
    mime_type: string;
    expires_at: string;
    max_downloads: number;
    download_count: number;
    password_hash: string | null;
    downloaded: boolean;
    created_at: string;
    updated_at: string;
}

export interface UploadSessionRecord {
    code: string;
    storage_key: string;
    original_name: string;
    size: number;
    mime_type: string;
    expires_at: string;
    max_downloads: number;
    password_hash: string | null;
    session_expires_at: string;
    created_at?: string;
}

export interface ShareContentRecord {
    id: string;
    content: string;
    created_at: string;
}

export interface ShareRecord {
    id: string;
    code: string;
    type: string;
    content_id: string;
    original_name: string | null;
    mime_type: string | null;
    size: number | null;
    language: string | null;
    expires_at: string;
    password_hash: string | null;
    burn_after_reading: boolean;
    view_count: number;
    burned: boolean;
    created_at: string;
}

export interface ShareWithContentRecord extends ShareRecord {
    content: ShareContentRecord | null;
}

export interface DownloadTokenRecord {
    token: string;
    file_id: string;
    code: string;
    delete_after: boolean;
    expires_at: string;
    created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabase() {
    if (!env.SUPABASE_URL) {
        throw new StorageError("Database not configured: SUPABASE_URL is not set");
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new StorageError("Database not configured: SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    if (!supabaseClient) {
        supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        });
    }

    return supabaseClient;
}

function isDuplicateError(error: PostgrestError): boolean {
    return error.code === "23505";
}

function handleDbError(error: PostgrestError, message: string): never {
    logger.error(message, { code: error.code, details: error.details, hint: error.hint });
    throw new StorageError(message);
}

function logDbTiming(label: string, start: number) {
    const durationMs = performance.now() - start;
    logger.debug("db.timing", { label, durationMs: Math.round(durationMs) });
}

export async function reserveUploadSession(session: UploadSessionRecord): Promise<boolean> {
    const supabase = getSupabase();
    const start = performance.now();
    const { error } = await supabase
        .from("upload_sessions")
        .insert({
            code: session.code,
            storage_key: session.storage_key,
            original_name: session.original_name,
            size: session.size,
            mime_type: session.mime_type,
            expires_at: session.expires_at,
            max_downloads: session.max_downloads,
            password_hash: session.password_hash,
            session_expires_at: session.session_expires_at,
        });
    logDbTiming("upload_sessions.insert", start);

    if (!error) return true;
    if (isDuplicateError(error)) return false;
    handleDbError(error, "Failed to reserve upload session");
}

export async function getUploadSession(code: string): Promise<UploadSessionRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("upload_sessions")
        .select("*")
        .eq("code", code)
        .maybeSingle();
    logDbTiming("upload_sessions.select", start);

    if (error) {
        handleDbError(error, "Failed to read upload session");
    }

    return data as UploadSessionRecord | null;
}

export async function deleteUploadSession(code: string): Promise<void> {
    const supabase = getSupabase();
    const start = performance.now();
    const { error } = await supabase
        .from("upload_sessions")
        .delete()
        .eq("code", code);
    logDbTiming("upload_sessions.delete", start);

    if (error) {
        handleDbError(error, "Failed to delete upload session");
    }
}

export async function createFileMetadataFromSession(
    session: UploadSessionRecord
): Promise<FileRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("file_metadata")
        .insert({
            code: session.code,
            storage_key: session.storage_key,
            original_name: session.original_name,
            size: session.size,
            mime_type: session.mime_type,
            expires_at: session.expires_at,
            max_downloads: session.max_downloads,
            password_hash: session.password_hash,
            downloaded: false,
        })
        .select("*");
    logDbTiming("file_metadata.insert", start);

    if (!error) {
        return data?.[0] as FileRecord | null;
    }
    if (isDuplicateError(error)) return null;
    handleDbError(error, "Failed to save file metadata");
}

export async function getFileByCode(code: string): Promise<FileRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("file_metadata")
        .select("*")
        .eq("code", code)
        .maybeSingle();
    logDbTiming("file_metadata.select_code", start);

    if (error) {
        handleDbError(error, "Failed to fetch file metadata");
    }

    return data as FileRecord | null;
}

export async function getFileById(id: string): Promise<FileRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("file_metadata")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    logDbTiming("file_metadata.select_id", start);

    if (error) {
        handleDbError(error, "Failed to fetch file metadata");
    }

    return data as FileRecord | null;
}

export async function updateFileDownloadCount(
    id: string,
    expectedCount: number,
    nextCount: number
): Promise<FileRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("file_metadata")
        .update({
            download_count: nextCount,
            downloaded: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("download_count", expectedCount)
        .select("*");
    logDbTiming("file_metadata.update_download", start);

    if (error) {
        handleDbError(error, "Failed to update download count");
    }

    return data?.[0] as FileRecord | null;
}

export async function deleteFileById(id: string): Promise<void> {
    validateUUID(id, "file_metadata.id");
    const supabase = getSupabase();
    const start = performance.now();
    const { error } = await supabase
        .from("file_metadata")
        .delete()
        .eq("id", id);
    logDbTiming("file_metadata.delete", start);

    if (error) {
        handleDbError(error, "Failed to delete file metadata");
    }
    logger.debug("Deleted file metadata", { id });
}

export async function createShareContent(content: string): Promise<ShareContentRecord> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("share_contents")
        .insert({ content })
        .select("*");
    logDbTiming("share_contents.insert", start);

    if (error) {
        handleDbError(error, "Failed to save share content");
    }

    const record = data?.[0] as ShareContentRecord | undefined;
    if (!record) {
        throw new StorageError("Share content was not created");
    }
    return record;
}

export async function deleteShareContent(id: string): Promise<void> {
    validateUUID(id, "share_contents.id");
    const supabase = getSupabase();
    const start = performance.now();
    const { error } = await supabase
        .from("share_contents")
        .delete()
        .eq("id", id);
    logDbTiming("share_contents.delete", start);

    if (error) {
        handleDbError(error, "Failed to delete share content");
    }
    logger.debug("Deleted share content", { id });
}

export async function createShareRecord(
    record: Omit<ShareRecord, "id" | "created_at">
): Promise<ShareRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("shares")
        .insert({
            code: record.code,
            type: record.type,
            content_id: record.content_id,
            original_name: record.original_name,
            mime_type: record.mime_type,
            size: record.size,
            language: record.language,
            expires_at: record.expires_at,
            password_hash: record.password_hash,
            burn_after_reading: record.burn_after_reading,
            view_count: record.view_count,
            burned: record.burned,
        })
        .select("*");
    logDbTiming("shares.insert", start);

    if (!error) {
        return data?.[0] as ShareRecord | null;
    }
    if (isDuplicateError(error)) return null;
    handleDbError(error, "Failed to save share metadata");
}

export async function getShareWithContentByCode(code: string): Promise<ShareWithContentRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("shares")
        .select("*, content:share_contents(*)")
        .eq("code", code)
        .maybeSingle();
    logDbTiming("shares.select_code", start);

    if (error) {
        handleDbError(error, "Failed to fetch share metadata");
    }

    if (!data) return null;

    const content = Array.isArray(data.content) ? data.content[0] : data.content;
    return { ...(data as ShareRecord), content: content as ShareContentRecord | null };
}

export async function updateShareViewCount(
    id: string,
    expectedCount: number,
    burnAfterReading: boolean
): Promise<ShareRecord | null> {
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("shares")
        .update({
            view_count: expectedCount + 1,
            burned: burnAfterReading ? true : undefined,
        })
        .eq("id", id)
        .eq("view_count", expectedCount)
        .select("*");
    logDbTiming("shares.update_view", start);

    if (error) {
        handleDbError(error, "Failed to update share view count");
    }

    return data?.[0] as ShareRecord | null;
}

export async function createDownloadToken(record: Omit<DownloadTokenRecord, "created_at">): Promise<void> {
    const supabase = getSupabase();
    const start = performance.now();
    const { error } = await supabase
        .from("download_tokens")
        .insert({
            token: record.token,
            file_id: record.file_id,
            code: record.code,
            delete_after: record.delete_after,
            expires_at: record.expires_at,
        });
    logDbTiming("download_tokens.insert", start);

    if (error) {
        handleDbError(error, "Failed to create download token");
    }
}

/**
 * Delete a download token and return its data.
 * WARNING: This operation is destructive - the token is deleted immediately.
 * Use getDownloadToken() for read-only access if you don't want to consume it.
 * @deprecated Use deleteAndReturnDownloadToken for clearer intent
 */
export async function consumeDownloadToken(token: string): Promise<DownloadTokenRecord | null> {
    return deleteAndReturnDownloadToken(token);
}

/**
 * Delete a download token and return its data.
 * WARNING: This operation is destructive - the token is deleted immediately.
 * For read-only access without deletion, use getDownloadToken() first.
 */
export async function deleteAndReturnDownloadToken(token: string): Promise<DownloadTokenRecord | null> {
    if (!token) {
        throw new ValidationError("token is required for token deletion");
    }
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("download_tokens")
        .delete()
        .eq("token", token)
        .select("*");
    logDbTiming("download_tokens.delete", start);

    if (error) {
        handleDbError(error, "Failed to delete download token");
    }

    const result = data?.[0] as DownloadTokenRecord | null;
    if (result) {
        logger.debug("Deleted and returned download token", { token: token.slice(0, 8) + "..." });
    }
    return result;
}

/**
 * Get a download token without deleting it.
 * Use this for read-only validation before consuming.
 */
export async function getDownloadToken(token: string): Promise<DownloadTokenRecord | null> {
    if (!token) {
        return null;
    }
    const supabase = getSupabase();
    const start = performance.now();
    const { data, error } = await supabase
        .from("download_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();
    logDbTiming("download_tokens.select", start);

    if (error) {
        handleDbError(error, "Failed to fetch download token");
    }

    return data as DownloadTokenRecord | null;
}
