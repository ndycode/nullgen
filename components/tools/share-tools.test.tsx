import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkShortener } from './link-shortener';
import { Pastebin } from './pastebin';
import { ImageHost } from './image-host';
import { SecretNote } from './secret-note';
import { CodeShare } from './code-share';
import { JsonShare } from './json-share';
import { CsvShare } from './csv-share';

describe('Share Tool Components', () => {
    describe('LinkShortener', () => {
        it('renders URL input', () => {
            render(<LinkShortener />);
            expect(screen.getByPlaceholderText(/example\.com/i)).toBeInTheDocument();
        });

        it('renders shorten button', () => {
            render(<LinkShortener />);
            expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
        });

        it('renders options toggle', () => {
            render(<LinkShortener />);
            expect(screen.getByText('options')).toBeInTheDocument();
        });
    });

    describe('Pastebin', () => {
        it('renders textarea', () => {
            render(<Pastebin />);
            expect(screen.getByPlaceholderText(/paste your text/i)).toBeInTheDocument();
        });

        it('renders create button', () => {
            render(<Pastebin />);
            expect(screen.getByRole('button', { name: /create paste/i })).toBeInTheDocument();
        });

        it('renders options toggle', () => {
            render(<Pastebin />);
            expect(screen.getByText('options')).toBeInTheDocument();
        });
    });

    describe('ImageHost', () => {
        it('renders dropzone', () => {
            render(<ImageHost />);
            expect(screen.getByText(/drop image/i)).toBeInTheDocument();
        });

        it('renders upload button', () => {
            render(<ImageHost />);
            expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
        });

        it('shows size limit', () => {
            render(<ImageHost />);
            expect(screen.getByText(/5 MB max/i)).toBeInTheDocument();
        });
    });

    describe('SecretNote', () => {
        it('renders textarea', () => {
            render(<SecretNote />);
            expect(screen.getByPlaceholderText(/secret message/i)).toBeInTheDocument();
        });

        it('renders burn warning', () => {
            render(<SecretNote />);
            expect(screen.getByText(/self-destruct/i)).toBeInTheDocument();
        });

        it('renders create button', () => {
            render(<SecretNote />);
            expect(screen.getByRole('button', { name: /create secret note/i })).toBeInTheDocument();
        });
    });

    describe('CodeShare', () => {
        it('renders code textarea', () => {
            render(<CodeShare />);
            expect(screen.getByPlaceholderText(/paste your code/i)).toBeInTheDocument();
        });

        it('renders language selector buttons', () => {
            render(<CodeShare />);
            expect(screen.getByText('JavaScript')).toBeInTheDocument();
            expect(screen.getByText('TypeScript')).toBeInTheDocument();
            expect(screen.getByText('Python')).toBeInTheDocument();
        });

        it('renders share button', () => {
            render(<CodeShare />);
            expect(screen.getByRole('button', { name: /share code/i })).toBeInTheDocument();
        });
    });

    describe('JsonShare', () => {
        it('renders JSON textarea', () => {
            render(<JsonShare />);
            expect(screen.getByPlaceholderText(/key.*value/i)).toBeInTheDocument();
        });

        it('renders format button', () => {
            render(<JsonShare />);
            expect(screen.getByText('format')).toBeInTheDocument();
        });

        it('renders share button', () => {
            render(<JsonShare />);
            expect(screen.getByRole('button', { name: /share json/i })).toBeInTheDocument();
        });
    });

    describe('CsvShare', () => {
        it('renders CSV textarea', () => {
            render(<CsvShare />);
            expect(screen.getByPlaceholderText(/name,email/i)).toBeInTheDocument();
        });

        it('renders share button', () => {
            render(<CsvShare />);
            expect(screen.getByRole('button', { name: /share csv/i })).toBeInTheDocument();
        });

        it('renders options toggle', () => {
            render(<CsvShare />);
            expect(screen.getByText('options')).toBeInTheDocument();
        });
    });
});
