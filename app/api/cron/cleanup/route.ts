import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { r2Storage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Cleanup expired records from the database and storage.
 * Called by Vercel Cron (see vercel.json) or manually.
 * 
 * Security: Protected by CRON_SECRET header validation.
 */

const BATCH_SIZE = 100;

interface CleanupStats {
    files: number;
    uploadSessions: number;
    shares: number;
    downloadTokens: number;
    storageDeleted: number;
    storageFailed: number;
}

export async function GET(request: NextRequest) {
    // Validate cron secret for Vercel Cron or manual invocation
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats: CleanupStats = {
        files: 0,
        uploadSessions: 0,
        shares: 0,
        downloadTokens: 0,
        storageDeleted: 0,
        storageFailed: 0,
    };

    try {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        });

        const now = new Date().toISOString();

        // 1. Delete expired download tokens
        const { data: expiredTokens } = await supabase
            .from("download_tokens")
            .delete()
            .lt("expires_at", now)
            .select("token");
        stats.downloadTokens = expiredTokens?.length ?? 0;

        // 2. Delete expired upload sessions
        const { data: expiredSessions } = await supabase
            .from("upload_sessions")
            .delete()
            .lt("session_expires_at", now)
            .select("code");
        stats.uploadSessions = expiredSessions?.length ?? 0;

        // 3. Delete expired files (and their storage objects)
        const { data: expiredFiles } = await supabase
            .from("file_metadata")
            .select("id, storage_key")
            .lt("expires_at", now)
            .limit(BATCH_SIZE);

        if (expiredFiles && expiredFiles.length > 0) {
            for (const file of expiredFiles) {
                const result = await r2Storage.deleteFile(file.storage_key);
                if (result.success) {
                    stats.storageDeleted++;
                } else {
                    stats.storageFailed++;
                    logger.warn("Failed to delete file from R2", { key: file.storage_key });
                }
            }

            const fileIds = expiredFiles.map(f => f.id);
            await supabase.from("file_metadata").delete().in("id", fileIds);
            stats.files = expiredFiles.length;
        }

        // 4. Delete expired shares and their share_contents
        // NOTE: FK is shares.content_id → share_contents(id), so deleting shares
        // does NOT cascade to share_contents. We must delete share_contents first.
        const { data: expiredShares } = await supabase
            .from("shares")
            .select("id, content_id")
            .lt("expires_at", now);

        if (expiredShares && expiredShares.length > 0) {
            // Delete share_contents first (parent records)
            const contentIds = expiredShares.map(s => s.content_id);
            await supabase.from("share_contents").delete().in("id", contentIds);

            // Then delete shares (child records)
            const shareIds = expiredShares.map(s => s.id);
            await supabase.from("shares").delete().in("id", shareIds);
        }
        stats.shares = expiredShares?.length ?? 0;

        logger.info("Cleanup completed", { stats });

        return NextResponse.json({
            success: true,
            stats,
            timestamp: now,
        });
    } catch (error) {
        logger.exception("Cleanup error", error);
        return NextResponse.json(
            { error: "Cleanup failed", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
