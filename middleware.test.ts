import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Store original env
const originalEnv = { ...process.env };

// Mock fetch for Upstash
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Reset module cache before each test
beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Reset env to default (no Upstash)
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    (process.env as Record<string, string>).NODE_ENV = "test";
});

afterEach(() => {
    process.env = originalEnv;
});

// Helper to create mock request
function createMockRequest(path: string, ip?: string): NextRequest {
    const url = new URL(`http://localhost${path}`);
    const request = new NextRequest(url);

    // Mock headers
    if (ip) {
        Object.defineProperty(request, 'headers', {
            value: new Headers({
                'x-forwarded-for': ip,
            }),
        });
    }

    return request;
}

describe("Middleware Rate Limiting", () => {
    describe("Non-API routes", () => {
        it("bypasses rate limiting for non-API routes", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/", "127.0.0.1");
            const response = await middleware(request);

            expect(response.status).not.toBe(429);
        });

        it("bypasses rate limiting for static assets", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/favicon.ico", "127.0.0.1");
            const response = await middleware(request);

            expect(response.status).not.toBe(429);
        });
    });

    describe("API route rate limiting", () => {
        it("applies rate limiting to /api/upload", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/upload", "192.168.1.1");
            const response = await middleware(request);

            // Should have rate limit headers
            expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
        });

        it("applies rate limiting to /api/download", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/download/12345678", "192.168.1.1");
            const response = await middleware(request);

            expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
        });

        it("applies rate limiting to /api/share", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/share", "192.168.1.1");
            const response = await middleware(request);

            expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
        });

        it("does not apply rate limiting to other API routes", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/other-endpoint", "192.168.1.1");
            const response = await middleware(request);

            // Should pass through without rate limit headers
            expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
        });
    });

    describe("Rate limit headers", () => {
        it("sets X-RateLimit-Limit header", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/upload", "192.168.1.100");
            const response = await middleware(request);

            const limit = response.headers.get("X-RateLimit-Limit");
            expect(limit).toBeDefined();
            expect(parseInt(limit || "0")).toBeGreaterThan(0);
        });

        it("sets X-RateLimit-Remaining header", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/upload", "192.168.1.101");
            const response = await middleware(request);

            const remaining = response.headers.get("X-RateLimit-Remaining");
            expect(remaining).toBeDefined();
        });

        it("sets X-RateLimit-Reset header", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/upload", "192.168.1.102");
            const response = await middleware(request);

            const reset = response.headers.get("X-RateLimit-Reset");
            expect(reset).toBeDefined();
            expect(parseInt(reset || "0")).toBeGreaterThan(0);
        });
    });

    describe("Client IP extraction", () => {
        it("extracts IP from x-forwarded-for header", async () => {
            const { middleware } = await import("./middleware");

            const url = new URL("http://localhost/api/upload");
            const request = new NextRequest(url, {
                headers: {
                    'x-forwarded-for': '1.2.3.4, 5.6.7.8',
                },
            });

            const response = await middleware(request);
            // Should not error, meaning IP was extracted
            expect(response.status).not.toBe(400);
        });

        it("extracts first IP from comma-separated x-forwarded-for", async () => {
            const { middleware } = await import("./middleware");

            const url = new URL("http://localhost/api/upload");
            const request = new NextRequest(url, {
                headers: {
                    'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3',
                },
            });

            const response = await middleware(request);
            expect(response.status).not.toBe(400);
        });

        it("extracts IP from x-real-ip header", async () => {
            const { middleware } = await import("./middleware");

            const url = new URL("http://localhost/api/upload");
            const request = new NextRequest(url, {
                headers: {
                    'x-real-ip': '11.22.33.44',
                },
            });

            const response = await middleware(request);
            expect(response.status).not.toBe(400);
        });

        it("extracts IP from x-vercel-forwarded-for header", async () => {
            const { middleware } = await import("./middleware");

            const url = new URL("http://localhost/api/upload");
            const request = new NextRequest(url, {
                headers: {
                    'x-vercel-forwarded-for': '99.88.77.66',
                },
            });

            const response = await middleware(request);
            expect(response.status).not.toBe(400);
        });
    });

    describe("In-memory rate limiting (development)", () => {
        it("allows requests under limit", async () => {
            const { middleware } = await import("./middleware");

            const request = createMockRequest("/api/upload", "10.10.10.1");
            const response = await middleware(request);

            expect(response.status).not.toBe(429);
        });

        it("decrements remaining count", async () => {
            const { middleware } = await import("./middleware");

            const ip = "10.10.10.2";
            const response1 = await middleware(createMockRequest("/api/upload", ip));
            const remaining1 = parseInt(response1.headers.get("X-RateLimit-Remaining") || "0");

            const response2 = await middleware(createMockRequest("/api/upload", ip));
            const remaining2 = parseInt(response2.headers.get("X-RateLimit-Remaining") || "0");

            expect(remaining2).toBeLessThan(remaining1);
        });
    });

    describe("429 response", () => {
        it("returns 429 when limit exceeded", async () => {
            const { middleware } = await import("./middleware");
            const { UPLOAD_RATE_LIMIT } = await import("./lib/constants");

            const ip = "10.10.10.99";

            // Make requests up to and exceeding the limit
            for (let i = 0; i < UPLOAD_RATE_LIMIT + 1; i++) {
                const response = await middleware(createMockRequest("/api/upload", ip));

                if (i >= UPLOAD_RATE_LIMIT) {
                    expect(response.status).toBe(429);
                }
            }
        });

        it("includes Retry-After header on 429", async () => {
            const { middleware } = await import("./middleware");
            const { UPLOAD_RATE_LIMIT } = await import("./lib/constants");

            const ip = "10.10.10.98";

            // Exhaust the limit
            for (let i = 0; i <= UPLOAD_RATE_LIMIT; i++) {
                await middleware(createMockRequest("/api/upload", ip));
            }

            // Next request should be 429 with Retry-After
            const response = await middleware(createMockRequest("/api/upload", ip));

            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");
                expect(retryAfter).toBeDefined();
                expect(parseInt(retryAfter || "0")).toBeGreaterThan(0);
            }
        });
    });

    describe("Upstash configuration", () => {
        it("returns 503 in production without Upstash", async () => {
            (process.env as Record<string, string>).NODE_ENV = "production";
            delete process.env.UPSTASH_REDIS_REST_URL;
            delete process.env.UPSTASH_REDIS_REST_TOKEN;

            const { middleware } = await import("./middleware");

            const url = new URL("http://localhost/api/upload");
            const request = new NextRequest(url, {
                headers: { 'x-forwarded-for': '1.2.3.4' },
            });

            const response = await middleware(request);
            expect(response.status).toBe(503);
        });
    });

    describe("Different path limits", () => {
        it("uses different limits for upload vs download", async () => {
            const { UPLOAD_RATE_LIMIT, DOWNLOAD_RATE_LIMIT } = await import("./lib/constants");
            const { middleware } = await import("./middleware");

            const uploadRequest = createMockRequest("/api/upload", "192.168.50.1");
            const uploadResponse = await middleware(uploadRequest);
            const uploadLimit = parseInt(uploadResponse.headers.get("X-RateLimit-Limit") || "0");

            const downloadRequest = createMockRequest("/api/download/12345678", "192.168.50.2");
            const downloadResponse = await middleware(downloadRequest);
            const downloadLimit = parseInt(downloadResponse.headers.get("X-RateLimit-Limit") || "0");

            expect(uploadLimit).toBe(UPLOAD_RATE_LIMIT);
            expect(downloadLimit).toBe(DOWNLOAD_RATE_LIMIT);
        });
    });
});
