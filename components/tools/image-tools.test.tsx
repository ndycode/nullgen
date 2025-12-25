import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImageCropper } from './image-cropper'
import { ImageConverter } from './image-converter'
import { SvgOptimizer } from './svg-optimizer'
import { ColorFromImage } from './color-from-image'
import { ImageWatermarker } from './image-watermarker'
import { ImageSplitter } from './image-splitter'
import { BackgroundRemover } from './bg-remover'
import { PrivacyStripper } from './privacy-stripper'
import { ImageCompressor } from './image-compressor'
import { BulkResizer } from './bulk-resizer'

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
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }
})

// Mock background-removal library
vi.mock('@imgly/background-removal', () => ({
    removeBackground: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
}))

describe('Image Tool Components', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('ImageCropper', () => {
        it('renders dropzone correctly', () => {
            render(<ImageCropper />)
            expect(screen.getByText(/drop image or click to browse/i)).toBeInTheDocument()
        })

        it('has aspect ratio presets', () => {
            render(<ImageCropper />)
            expect(screen.getByText('free')).toBeInTheDocument()
            expect(screen.getByText('1:1')).toBeInTheDocument()
        })

        it('has output format buttons', () => {
            render(<ImageCropper />)
            expect(screen.getByText('PNG')).toBeInTheDocument()
            expect(screen.getByText('JPEG')).toBeInTheDocument()
        })
    })

    describe('ImageConverter', () => {
        it('renders dropzone correctly', () => {
            render(<ImageConverter />)
            expect(screen.getByText(/png, jpg, webp, gif/i)).toBeInTheDocument()
        })
    })

    describe('SvgOptimizer', () => {
        it('renders dropzone correctly', () => {
            render(<SvgOptimizer />)
            expect(screen.getByText(/drop svg file or click to browse/i)).toBeInTheDocument()
        })

        it('has optimization options', () => {
            render(<SvgOptimizer />)
            expect(screen.getByText('comments')).toBeInTheDocument()
            expect(screen.getByText('metadata')).toBeInTheDocument()
        })
    })

    describe('ColorFromImage', () => {
        it('renders dropzone correctly', () => {
            render(<ColorFromImage />)
            expect(screen.getByText(/drop image or click to browse/i)).toBeInTheDocument()
        })

        it('has color format buttons', () => {
            render(<ColorFromImage />)
            expect(screen.getByText('HEX')).toBeInTheDocument()
            expect(screen.getByText('RGB')).toBeInTheDocument()
        })
    })

    describe('ImageWatermarker', () => {
        it('renders dropzone correctly', () => {
            render(<ImageWatermarker />)
            expect(screen.getByText(/drop image or click to browse/i)).toBeInTheDocument()
        })

        it('has watermark text input', () => {
            render(<ImageWatermarker />)
            const input = screen.getByDisplayValue('vxid.cc')
            expect(input).toBeInTheDocument()
        })
    })

    describe('ImageSplitter', () => {
        it('renders dropzone correctly', () => {
            render(<ImageSplitter />)
            expect(screen.getByText(/drop image or click to browse/i)).toBeInTheDocument()
        })

        it('has output format options', () => {
            render(<ImageSplitter />)
            expect(screen.getByText('PNG')).toBeInTheDocument()
            expect(screen.getByText('JPEG')).toBeInTheDocument()
        })
    })

    describe('BackgroundRemover', () => {
        it('renders dropzone correctly', () => {
            render(<BackgroundRemover />)
            expect(screen.getByText(/tap to upload image/i)).toBeInTheDocument()
        })

        it('shows supported formats', () => {
            render(<BackgroundRemover />)
            expect(screen.getByText(/png, jpg, webp/i)).toBeInTheDocument()
        })
    })

    describe('PrivacyStripper', () => {
        it('renders dropzone correctly', () => {
            render(<PrivacyStripper />)
            expect(screen.getByText(/drop images or click to browse/i)).toBeInTheDocument()
        })

        it('has quality slider', () => {
            render(<PrivacyStripper />)
            expect(screen.getByText('quality')).toBeInTheDocument()
        })
    })

    describe('ImageCompressor', () => {
        it('renders dropzone correctly', () => {
            render(<ImageCompressor />)
            expect(screen.getByText(/drop images or click to browse/i)).toBeInTheDocument()
        })

        it('has quality settings', () => {
            render(<ImageCompressor />)
            expect(screen.getByText('quality')).toBeInTheDocument()
        })
    })

    describe('BulkResizer', () => {
        it('renders dropzone correctly', () => {
            render(<BulkResizer />)
            expect(screen.getByText(/drop images or click to browse/i)).toBeInTheDocument()
        })

        it('has custom dimension inputs', () => {
            render(<BulkResizer />)
            expect(screen.getByText(/width/i)).toBeInTheDocument()
            expect(screen.getByText(/height/i)).toBeInTheDocument()
        })
    })
})
