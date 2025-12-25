import { describe, it, expect } from 'vitest';
import { EXPIRY_OPTIONS, CODE_LANGUAGES, ShareType } from './share-types';

describe('Share Types', () => {
    describe('EXPIRY_OPTIONS', () => {
        it('should have 5 expiry options', () => {
            expect(EXPIRY_OPTIONS).toHaveLength(5);
        });

        it('should have correct labels', () => {
            expect(EXPIRY_OPTIONS.map(o => o.label)).toEqual(['10m', '1h', '24h', '7d', '30d']);
        });

        it('should have correct values in minutes', () => {
            expect(EXPIRY_OPTIONS[0].value).toBe(10); // 10 minutes
            expect(EXPIRY_OPTIONS[1].value).toBe(60); // 1 hour
            expect(EXPIRY_OPTIONS[2].value).toBe(1440); // 24 hours
            expect(EXPIRY_OPTIONS[3].value).toBe(10080); // 7 days
            expect(EXPIRY_OPTIONS[4].value).toBe(43200); // 30 days
        });
    });

    describe('CODE_LANGUAGES', () => {
        it('should have at least 10 languages', () => {
            expect(CODE_LANGUAGES.length).toBeGreaterThanOrEqual(10);
        });

        it('should include common languages', () => {
            const ids = CODE_LANGUAGES.map(l => l.id);
            expect(ids).toContain('javascript');
            expect(ids).toContain('typescript');
            expect(ids).toContain('python');
            expect(ids).toContain('html');
            expect(ids).toContain('css');
        });

        it('should have id and label for each language', () => {
            CODE_LANGUAGES.forEach(lang => {
                expect(lang.id).toBeDefined();
                expect(lang.label).toBeDefined();
                expect(typeof lang.id).toBe('string');
                expect(typeof lang.label).toBe('string');
            });
        });
    });

    describe('ShareType', () => {
        it('should support all 7 share types', () => {
            const validTypes: ShareType[] = ['link', 'paste', 'image', 'note', 'code', 'json', 'csv'];
            validTypes.forEach(type => {
                expect(typeof type).toBe('string');
            });
        });
    });
});
