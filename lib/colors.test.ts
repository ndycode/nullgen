import { describe, it, expect } from 'vitest'
import {
    THEME_COLORS,
    COLOR_PRESETS,
    QR_PRESETS,
    FAVICON_COLORS,
    CONFETTI_COLORS,
    CANVAS_COLORS,
} from './colors'

describe('lib/colors', () => {
    describe('THEME_COLORS', () => {
        it('should have primary color defined', () => {
            expect(THEME_COLORS.primary).toBe('#ec4899')
        })

        it('should have white and black colors', () => {
            expect(THEME_COLORS.white).toBe('#ffffff')
            expect(THEME_COLORS.black).toBe('#000000')
        })

        it('should have all theme colors as valid hex', () => {
            const hexRegex = /^#[0-9a-fA-F]{6}$/
            Object.values(THEME_COLORS).forEach(color => {
                expect(color).toMatch(hexRegex)
            })
        })
    })

    describe('COLOR_PRESETS', () => {
        it('should have 12 preset colors', () => {
            expect(COLOR_PRESETS).toHaveLength(12)
        })

        it('should include primary color', () => {
            expect(COLOR_PRESETS).toContain(THEME_COLORS.primary)
        })

        it('should have all valid hex colors', () => {
            const hexRegex = /^#[0-9a-fA-F]{6}$/
            COLOR_PRESETS.forEach(color => {
                expect(color).toMatch(hexRegex)
            })
        })
    })

    describe('QR_PRESETS', () => {
        it('should have 4 QR presets', () => {
            expect(QR_PRESETS).toHaveLength(4)
        })

        it('should have default preset with black on white', () => {
            const defaultPreset = QR_PRESETS.find(p => p.label === 'default')
            expect(defaultPreset).toBeDefined()
            expect(defaultPreset?.fg).toBe(THEME_COLORS.black)
            expect(defaultPreset?.bg).toBe(THEME_COLORS.white)
        })

        it('should have dark preset with white on black', () => {
            const darkPreset = QR_PRESETS.find(p => p.label === 'dark')
            expect(darkPreset).toBeDefined()
            expect(darkPreset?.fg).toBe(THEME_COLORS.white)
            expect(darkPreset?.bg).toBe(THEME_COLORS.black)
        })

        it('should have pink preset with primary color', () => {
            const pinkPreset = QR_PRESETS.find(p => p.label === 'pink')
            expect(pinkPreset).toBeDefined()
            expect(pinkPreset?.fg).toBe(THEME_COLORS.primary)
        })
    })

    describe('FAVICON_COLORS', () => {
        it('should have 7 colors', () => {
            expect(FAVICON_COLORS).toHaveLength(7)
        })

        it('should include primary color first', () => {
            expect(FAVICON_COLORS[0]).toBe(THEME_COLORS.primary)
        })

        it('should include black and white', () => {
            expect(FAVICON_COLORS).toContain(THEME_COLORS.black)
            expect(FAVICON_COLORS).toContain(THEME_COLORS.white)
        })
    })

    describe('CONFETTI_COLORS', () => {
        it('should have 3 pink shades', () => {
            expect(CONFETTI_COLORS).toHaveLength(3)
        })

        it('should include primary color', () => {
            expect(CONFETTI_COLORS).toContain(THEME_COLORS.primary)
        })
    })

    describe('CANVAS_COLORS', () => {
        it('should have jpegBackground as white', () => {
            expect(CANVAS_COLORS.jpegBackground).toBe('#FFFFFF')
        })

        it('should have transparencyChecker as gray', () => {
            expect(CANVAS_COLORS.transparencyChecker).toBe('#808080')
        })
    })
})
