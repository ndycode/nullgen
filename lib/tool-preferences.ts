"use client";

import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "vxid_favorites";
const RECENT_KEY = "vxid_recent";
const MAX_RECENT = 10;

export interface ToolPreferences {
    favorites: string[];
    recent: string[];
    isFavorite: (toolId: string) => boolean;
    toggleFavorite: (toolId: string) => void;
    addRecent: (toolId: string) => void;
}

export function useToolPreferences(): ToolPreferences {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recent, setRecent] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    const parseStringArray = (value: string | null): string[] | null => {
        if (!value) return null;
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    };

    // Load from localStorage on mount - setState calls are valid for initialization
    useEffect(() => {
        setMounted(true); // eslint-disable-line
        try {
            const storedFavorites = localStorage.getItem(FAVORITES_KEY);
            const storedRecent = localStorage.getItem(RECENT_KEY);

            const favoritesData = parseStringArray(storedFavorites);
            if (favoritesData) {
                setFavorites(favoritesData); // eslint-disable-line
            }
            const recentData = parseStringArray(storedRecent);
            if (recentData) {
                setRecent(recentData); // eslint-disable-line
            }
        } catch (e) {
            console.error("Failed to load tool preferences:", e);
        }
    }, []);

    // Save preferences to localStorage (debounced to reduce writes)
    useEffect(() => {
        if (!mounted) return;
        const timeout = setTimeout(() => {
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
                localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
            } catch (e) {
                console.error("Failed to save preferences:", e);
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [favorites, recent, mounted]);

    const isFavorite = useCallback((toolId: string) => {
        return favorites.includes(toolId);
    }, [favorites]);

    const toggleFavorite = useCallback((toolId: string) => {
        setFavorites(prev => {
            if (prev.includes(toolId)) {
                return prev.filter(id => id !== toolId);
            } else {
                return [...prev, toolId];
            }
        });
    }, []);

    const addRecent = useCallback((toolId: string) => {
        setRecent(prev => {
            // Remove if already exists, then add to front
            const filtered = prev.filter(id => id !== toolId);
            const updated = [toolId, ...filtered];
            // Keep max 10
            return updated.slice(0, MAX_RECENT);
        });
    }, []);

    return {
        favorites,
        recent,
        isFavorite,
        toggleFavorite,
        addRecent,
    };
}
