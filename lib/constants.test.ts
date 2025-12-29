import { describe, it, expect } from "vitest";
import {
    MAX_UPLOAD_SIZE,
    MAX_FILE_SIZE,
    CODE_LENGTH,
    DEFAULT_EXPIRY_MINUTES,
    DEFAULT_MAX_DOWNLOADS,
    RECENT_TOOLS_COUNT,
    ANIMATION,
    BREAKPOINTS,
    API_ROUTES,
    STORAGE_KEYS,
} from "./constants";

describe("Constants", () => {
    describe("File Upload Limits", () => {
        it("MAX_UPLOAD_SIZE should be 1 GB", () => {
            expect(MAX_UPLOAD_SIZE).toBe(1024 * 1024 * 1024);
        });

        it("MAX_FILE_SIZE should be 100 MB", () => {
            expect(MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
        });
    });

    describe("Dead Drop Settings", () => {
        it("CODE_LENGTH should be 6", () => {
            expect(CODE_LENGTH).toBe(6);
        });

        it("DEFAULT_EXPIRY_MINUTES should be 60", () => {
            expect(DEFAULT_EXPIRY_MINUTES).toBe(60);
        });

        it("DEFAULT_MAX_DOWNLOADS should be 1", () => {
            expect(DEFAULT_MAX_DOWNLOADS).toBe(1);
        });
    });

    describe("UI Constants", () => {
        it("RECENT_TOOLS_COUNT should be 6", () => {
            expect(RECENT_TOOLS_COUNT).toBe(6);
        });

        it("ANIMATION should have correct values", () => {
            expect(ANIMATION.FAST).toBe(150);
            expect(ANIMATION.NORMAL).toBe(300);
            expect(ANIMATION.SLOW).toBe(500);
        });

        it("BREAKPOINTS should match Tailwind", () => {
            expect(BREAKPOINTS.SM).toBe(640);
            expect(BREAKPOINTS.MD).toBe(768);
            expect(BREAKPOINTS.LG).toBe(1024);
            expect(BREAKPOINTS.XL).toBe(1280);
        });
    });

    describe("API Routes", () => {
        it("UPLOAD should be correct", () => {
            expect(API_ROUTES.UPLOAD).toBe("/api/upload");
        });

        it("DOWNLOAD should return correct path", () => {
            expect(API_ROUTES.DOWNLOAD("123456")).toBe("/api/download/123456");
        });

        it("SHARE should be correct", () => {
            expect(API_ROUTES.SHARE).toBe("/api/share");
        });

        it("SHARE_GET should return correct path", () => {
            expect(API_ROUTES.SHARE_GET("abc123")).toBe("/api/share/abc123");
        });
    });

    describe("Storage Keys", () => {
        it("should have correct keys", () => {
            expect(STORAGE_KEYS.THEME).toBe("theme");
            expect(STORAGE_KEYS.FAVORITES).toBe("vxid-favorites");
            expect(STORAGE_KEYS.RECENT).toBe("vxid-recent");
        });
    });
});
