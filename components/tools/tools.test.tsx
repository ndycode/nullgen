import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QRGen } from './qr-gen'
import { ColorPicker } from './color-picker'
import { PassGen } from './passgen'
import { HashGen } from './hash-gen'
import { WordCount } from './word-count'
import { DateDiff } from './date-diff'
import { EmojiPicker } from './emoji-picker'
import { CaseConverter } from './case-converter'
import { TextCleaner } from './text-cleaner'
import { AspectRatioCalc } from './aspect-ratio-calc'
import { FaviconGen } from './favicon-gen'
import { DuplicateRemover } from './duplicate-remover'
import { TextReverser } from './text-reverser'
import { CharacterMap } from './character-map'
import { NumberConverter } from './number-converter'
import { UuidGenerator } from './uuid-generator'
import { BarcodeGen } from './barcode-gen'
import { FakeDataGen } from './fake-data-gen'
import { ColorPaletteGen } from './color-palette-gen'

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion')
    return {
        ...actual,
        motion: {
            div: ({ children, className, onClick, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
                <div className={className} onClick={onClick} style={style} {...props}>{children}</div>
            ),
            button: ({ children, className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
                <button className={className} onClick={onClick} {...props}>{children}</button>
            ),
            p: ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
                <p className={className} {...props}>{children}</p>
            ),
            img: ({ className, src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                <img className={className} src={src} alt={alt} {...props} />
            ),
            span: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
                <span className={className} {...props}>{children}</span>
            ),
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }
})

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe('Tool Components', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('QRGen', () => {
        it('renders without crashing', () => {
            render(<QRGen />)
            expect(screen.getByPlaceholderText(/enter text or url/i)).toBeInTheDocument()
        })

        it('has color preset buttons', () => {
            render(<QRGen />)
            expect(screen.getByTitle('default')).toBeInTheDocument()
            expect(screen.getByTitle('dark')).toBeInTheDocument()
        })
    })

    describe('ColorPicker', () => {
        it('renders without crashing', () => {
            render(<ColorPicker />)
            expect(screen.getByText('rgb')).toBeInTheDocument()
            expect(screen.getByText('hsl')).toBeInTheDocument()
        })

        it('has color preset squares', () => {
            render(<ColorPicker />)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })
    })

    describe('PassGen', () => {
        it('renders without crashing', () => {
            render(<PassGen />)
            expect(screen.getByText('length')).toBeInTheDocument()
        })

        it('has toggle buttons for options', () => {
            render(<PassGen />)
            expect(screen.getByText('uppercase')).toBeInTheDocument()
            expect(screen.getByText('numbers')).toBeInTheDocument()
        })
    })

    describe('HashGen', () => {
        it('renders without crashing', () => {
            render(<HashGen />)
            expect(screen.getByPlaceholderText(/text to hash/i)).toBeInTheDocument()
        })

        it('has hash type buttons', () => {
            render(<HashGen />)
            expect(screen.getByText('MD5')).toBeInTheDocument()
            expect(screen.getByText('SHA-256')).toBeInTheDocument()
        })
    })

    describe('WordCount', () => {
        it('renders without crashing', () => {
            render(<WordCount />)
            const textarea = document.querySelector('textarea')
            expect(textarea).toBeInTheDocument()
        })

        it('shows word count statistics', () => {
            render(<WordCount />)
            expect(screen.getByText('words')).toBeInTheDocument()
            expect(screen.getByText('characters')).toBeInTheDocument()
        })
    })

    describe('DateDiff', () => {
        it('renders without crashing', () => {
            render(<DateDiff />)
            expect(screen.getByText('from')).toBeInTheDocument()
            expect(screen.getByText('to')).toBeInTheDocument()
        })

        it('shows difference units', () => {
            render(<DateDiff />)
            expect(screen.getByText('days')).toBeInTheDocument()
        })
    })

    describe('EmojiPicker', () => {
        it('renders without crashing', () => {
            render(<EmojiPicker />)
            const input = document.querySelector('input')
            expect(input).toBeInTheDocument()
        })
    })

    describe('CaseConverter', () => {
        it('renders without crashing', () => {
            render(<CaseConverter />)
            const textarea = document.querySelector('textarea')
            expect(textarea).toBeInTheDocument()
        })

        it('has conversion buttons', () => {
            render(<CaseConverter />)
            expect(screen.getByText('lowercase')).toBeInTheDocument()
            expect(screen.getByText('UPPERCASE')).toBeInTheDocument()
        })
    })

    describe('TextCleaner', () => {
        it('renders without crashing', () => {
            render(<TextCleaner />)
            const textarea = document.querySelector('textarea')
            expect(textarea).toBeInTheDocument()
        })
    })

    describe('AspectRatioCalc', () => {
        it('renders without crashing', () => {
            render(<AspectRatioCalc />)
            expect(screen.getByText('width')).toBeInTheDocument()
            expect(screen.getByText('height')).toBeInTheDocument()
        })

        it('has preset ratio buttons', () => {
            render(<AspectRatioCalc />)
            expect(screen.getByText('16:9')).toBeInTheDocument()
            expect(screen.getByText('1:1')).toBeInTheDocument()
        })
    })

    describe('FaviconGen', () => {
        it('renders without crashing', () => {
            render(<FaviconGen />)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('has download buttons', () => {
            render(<FaviconGen />)
            expect(screen.getByText('Download All Sizes')).toBeInTheDocument()
        })
    })

    describe('DuplicateRemover', () => {
        it('renders without crashing', () => {
            render(<DuplicateRemover />)
            const textarea = document.querySelector('textarea')
            expect(textarea).toBeInTheDocument()
        })

        it('has mode buttons', () => {
            render(<DuplicateRemover />)
            expect(screen.getByText('lines')).toBeInTheDocument()
            expect(screen.getByText('words')).toBeInTheDocument()
        })
    })

    describe('TextReverser', () => {
        it('renders without crashing', () => {
            render(<TextReverser />)
            const textarea = document.querySelector('textarea')
            expect(textarea).toBeInTheDocument()
        })

        it('has mode buttons', () => {
            render(<TextReverser />)
            expect(screen.getByText('characters')).toBeInTheDocument()
            expect(screen.getByText('words')).toBeInTheDocument()
            expect(screen.getByText('lines')).toBeInTheDocument()
        })
    })

    describe('CharacterMap', () => {
        it('renders without crashing', () => {
            render(<CharacterMap />)
            const input = document.querySelector('input')
            expect(input).toBeInTheDocument()
        })

        it('has category tabs', () => {
            render(<CharacterMap />)
            expect(screen.getByText('symbols')).toBeInTheDocument()
            expect(screen.getByText('arrows')).toBeInTheDocument()
        })
    })

    describe('NumberConverter', () => {
        it('renders without crashing', () => {
            render(<NumberConverter />)
            const input = document.querySelector('input')
            expect(input).toBeInTheDocument()
        })

        it('has base selector buttons', () => {
            render(<NumberConverter />)
            expect(screen.getByText('decimal')).toBeInTheDocument()
            expect(screen.getByText('binary')).toBeInTheDocument()
            expect(screen.getByText('hex')).toBeInTheDocument()
        })
    })

    describe('UuidGenerator', () => {
        it('renders without crashing', () => {
            render(<UuidGenerator />)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('has option buttons', () => {
            render(<UuidGenerator />)
            expect(screen.getByText('UPPERCASE')).toBeInTheDocument()
            expect(screen.getByText('no dashes')).toBeInTheDocument()
        })
    })

    describe('BarcodeGen', () => {
        it('renders without crashing', () => {
            render(<BarcodeGen />)
            const input = document.querySelector('input')
            expect(input).toBeInTheDocument()
        })

        it('has format buttons', () => {
            render(<BarcodeGen />)
            expect(screen.getByText('code128')).toBeInTheDocument()
            expect(screen.getByText('ean-13')).toBeInTheDocument()
        })
    })

    describe('FakeDataGen', () => {
        it('renders without crashing', () => {
            render(<FakeDataGen />)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('has data type buttons', () => {
            render(<FakeDataGen />)
            expect(screen.getByText('name')).toBeInTheDocument()
            expect(screen.getByText('email')).toBeInTheDocument()
        })
    })

    describe('ColorPaletteGen', () => {
        it('renders without crashing', () => {
            render(<ColorPaletteGen />)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('has harmony buttons', () => {
            render(<ColorPaletteGen />)
            expect(screen.getByText('analogous')).toBeInTheDocument()
            expect(screen.getByText('triadic')).toBeInTheDocument()
        })
    })
})
