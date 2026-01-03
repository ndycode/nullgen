import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
    RATE_LIMIT_WINDOW_MS,
    UPLOAD_RATE_LIMIT,
    DOWNLOAD_RATE_LIMIT,
    SHARE_RATE_LIMIT,
} from "@/lib/constants";

const inMemoryCounters = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = 0;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Log startup warning about rate limiter configuration
if (!USE_UPSTASH && process.env.NODE_ENV !== "test") {
    console.warn(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "⚠️  RATE LIMITER: Running in ephemeral in-memory mode\n" +
        "   - Counters reset on server restart\n" +
        "   - Does not work across server instances\n" +
        "   - Production requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
}


function getClientIp(request: NextRequest): string | null {
    const requestIp = (request as { ip?: string }).ip;
    if (requestIp) return requestIp;
    const headers = request.headers;
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    const vercelIp = headers.get("x-vercel-forwarded-for");
    if (vercelIp) return vercelIp.trim();
    return null;
}

function getLimitForPath(pathname: string): { limit: number; key: string } | null {
    if (pathname.startsWith("/api/upload")) return { limit: UPLOAD_RATE_LIMIT, key: "upload" };
    if (pathname.startsWith("/api/download")) return { limit: DOWNLOAD_RATE_LIMIT, key: "download" };
    if (pathname.startsWith("/api/share")) return { limit: SHARE_RATE_LIMIT, key: "share" };
    return null;
}

async function upstashIncr(key: string, windowMs: number): Promise<number> {
    const encodedKey = encodeURIComponent(key);
    const headers = {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
    };

    const incrRes = await fetch(`${UPSTASH_URL}/incr/${encodedKey}`, { headers });
    const incrJson = await incrRes.json();
    if (!incrRes.ok || incrJson.error) {
        throw new Error(incrJson.error || "Rate limit increment failed");
    }

    if (incrJson.result === 1) {
        await fetch(`${UPSTASH_URL}/pexpire/${encodedKey}/${windowMs}`, { headers });
    }

    return incrJson.result as number;
}

function inMemoryIncr(key: string, windowMs: number): number {
    const now = Date.now();
    if (now - lastCleanup > windowMs) {
        for (const [entryKey, record] of inMemoryCounters.entries()) {
            if (now > record.resetTime) {
                inMemoryCounters.delete(entryKey);
            }
        }
        lastCleanup = now;
    }

    const record = inMemoryCounters.get(key);
    if (!record || now > record.resetTime) {
        inMemoryCounters.set(key, { count: 1, resetTime: now + windowMs });
        return 1;
    }

    record.count += 1;
    return record.count;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (!pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    const config = getLimitForPath(pathname);
    if (!config) {
        return NextResponse.next();
    }

    const ip = getClientIp(request);
    if (!ip) {
        if (process.env.NODE_ENV === "production") {
            return new NextResponse(
                JSON.stringify({ error: "Client IP unavailable" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        return NextResponse.next();
    }

    if (process.env.NODE_ENV === "production" && !USE_UPSTASH) {
        return new NextResponse(
            JSON.stringify({ error: "Rate limiter not configured" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }

    const now = Date.now();
    const windowId = Math.floor(now / RATE_LIMIT_WINDOW_MS);
    const resetIn = RATE_LIMIT_WINDOW_MS - (now % RATE_LIMIT_WINDOW_MS);
    const key = `rate:${config.key}:${ip}:${windowId}`;

    let count: number;
    try {
        count = USE_UPSTASH
            ? await upstashIncr(key, RATE_LIMIT_WINDOW_MS)
            : inMemoryIncr(key, RATE_LIMIT_WINDOW_MS);
    } catch {
        return new NextResponse(
            JSON.stringify({ error: "Rate limiter unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
        );
    }

    const remaining = Math.max(config.limit - count, 0);
    const baseHeaders = {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": config.limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
    };

    if (count > config.limit) {
        return new NextResponse(JSON.stringify({ error: "Too many requests, please try again later" }), {
            status: 429,
            headers: {
                ...baseHeaders,
                "Retry-After": Math.ceil(resetIn / 1000).toString(),
            },
        });
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", baseHeaders["X-RateLimit-Limit"]);
    response.headers.set("X-RateLimit-Remaining", baseHeaders["X-RateLimit-Remaining"]);
    response.headers.set("X-RateLimit-Reset", baseHeaders["X-RateLimit-Reset"]);
    return response;
}

export const config = {
    matcher: [
        "/api/:path*",
    ],
};
