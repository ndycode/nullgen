import { performance } from "perf_hooks";

export async function withTiming<T>(
    timings: Record<string, number>,
    label: string,
    fn: () => Promise<T>
): Promise<T> {
    const start = performance.now();
    const value = await fn();
    const durationMs = performance.now() - start;
    timings[label] = (timings[label] || 0) + durationMs;
    return value;
}

export function formatServerTiming(timings: Record<string, number>): string {
    return Object.entries(timings)
        .map(([label, duration]) => `${label};dur=${duration.toFixed(1)}`)
        .join(", ");
}
