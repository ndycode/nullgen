import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(() => ({
        get: vi.fn(() => null),
    })),
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
    })),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock framer-motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

import DownloadClient from "./download-client";

describe("DownloadClient Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    describe("Initial Render", () => {
        it("renders code input form", () => {
            render(<DownloadClient />);

            expect(screen.getByLabelText(/download code/i)).toBeInTheDocument();
            expect(screen.getByRole("button")).toBeInTheDocument();
        });

        it("has placeholder text for code input", () => {
            render(<DownloadClient />);

            const input = screen.getByLabelText(/download code/i);
            expect(input).toHaveAttribute("placeholder");
        });
    });

    describe("Code Validation", () => {
        it("validates code format (8 digits)", async () => {
            render(<DownloadClient />);
            const user = userEvent.setup();

            const input = screen.getByLabelText(/download code/i);
            await user.type(input, "abc123");

            const button = screen.getByRole("button");
            await user.click(button);

            // Should show error for invalid format
            await waitFor(() => {
                expect(screen.getByText(/8.*digit/i)).toBeInTheDocument();
            });
        });

        it("accepts valid 8-digit code", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            const input = screen.getByLabelText(/download code/i);
            await user.type(input, "12345678");

            const button = screen.getByRole("button");
            await user.click(button);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining("/api/download/12345678"),
                    expect.any(Object)
                );
            });
        });
    });

    describe("File Info Display", () => {
        it("displays file name after code lookup", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "important-doc.pdf",
                    size: 2048576,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            const input = screen.getByLabelText(/download code/i);
            await user.type(input, "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/important-doc.pdf/i)).toBeInTheDocument();
            });
        });

        it("displays file size", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1048576, // 1 MB
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/1.*MB/i)).toBeInTheDocument();
            });
        });

        it("displays time remaining", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/hour|minute/i)).toBeInTheDocument();
            });
        });

        it("displays downloads remaining", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                    downloadsRemaining: 3,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/3/)).toBeInTheDocument();
            });
        });
    });

    describe("Password Protection", () => {
        it("shows password input when required", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "secret.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: true,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
            });
        });
    });

    describe("Error States", () => {
        it("handles file not found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: "File not found" }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "99999999");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/not found|doesn't exist/i)).toBeInTheDocument();
            });
        });

        it("handles expired file", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 410,
                json: async () => ({ error: "File has expired" }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/expired|no longer available/i)).toBeInTheDocument();
            });
        });

        it("handles download limit reached", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 410,
                json: async () => ({ error: "Download limit reached" }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/limit|reached/i)).toBeInTheDocument();
            });
        });

        it("handles incorrect password", async () => {
            // First call returns file info with password required
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "secret.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: true,
                }),
            });
            // Second call is the password verification
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: async () => ({ error: "Incorrect password" }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
            });

            await user.type(screen.getByLabelText(/password/i), "wrong");
            await user.click(screen.getByRole("button", { name: /download/i }));

            await waitFor(() => {
                expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
            });
        });
    });

    describe("Download Flow", () => {
        it("shows download button after file lookup", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
            });
        });
    });

    describe("Reset Functionality", () => {
        it("can reset and enter new code", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    name: "test.txt",
                    size: 1024,
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                    requiresPassword: false,
                }),
            });

            render(<DownloadClient />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/download code/i), "12345678");
            await user.click(screen.getByRole("button"));

            await waitFor(() => {
                expect(screen.getByText(/test.txt/i)).toBeInTheDocument();
            });

            // Look for reset/back button
            const resetButton = screen.queryByRole("button", { name: /back|reset|new/i });
            if (resetButton) {
                await user.click(resetButton);
                // Should show code input again
                await waitFor(() => {
                    expect(screen.getByLabelText(/download code/i)).toBeInTheDocument();
                });
            }
        });
    });
});
