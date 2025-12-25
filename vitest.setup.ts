import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    fillText: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test')
HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(['test'], { type: 'image/png' })))

// Mock URL.createObjectURL
URL.createObjectURL = vi.fn(() => 'blob:test')
URL.revokeObjectURL = vi.fn()

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
    },
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock Image
class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''
    width = 100
    height = 100

    constructor() {
        setTimeout(() => this.onload?.(), 0)
    }
}
global.Image = MockImage as unknown as typeof Image

// Mock FileReader
class MockFileReader {
    onload: ((e: ProgressEvent<FileReader>) => void) | null = null
    result: string | ArrayBuffer | null = 'data:image/png;base64,test'

    readAsDataURL() {
        setTimeout(() => this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>), 0)
    }
    readAsArrayBuffer() {
        setTimeout(() => this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>), 0)
    }
    readAsText() {
        setTimeout(() => this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>), 0)
    }
}
global.FileReader = MockFileReader as unknown as typeof FileReader
