import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a distributed cache
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function getRateLimitKey(request: NextRequest): string {
    // Use IP address for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return ip;
}

function isRateLimited(key: string): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        // New window
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return { limited: true, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { limited: false, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetTime - now };
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);

export function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
        const key = getRateLimitKey(request);
        const { limited, remaining, resetIn } = isRateLimited(key);

        if (limited) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests, please try again later" }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
                        "Retry-After": Math.ceil(resetIn / 1000).toString(),
                    },
                }
            );
        }

        // Add rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", Math.ceil(resetIn / 1000).toString());
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all API routes
        "/api/:path*",
    ],
};
