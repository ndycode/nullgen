// Share types for all sharing tools

export type ShareType = 'link' | 'paste' | 'image' | 'note' | 'code' | 'json' | 'csv';

export interface ShareMetadata {
    type: ShareType;
    content: string; // URL for link, text for paste/note/code/json/csv, R2 key for image
    originalName?: string; // For images
    mimeType?: string; // For images
    size?: number; // For images
    language?: string; // For code
    expiresAt: Date;
    password: string | null;
    burnAfterReading: boolean;
    viewCount: number;
    burned: boolean;
    createdAt: Date;
}

export interface CreateShareRequest {
    type: ShareType;
    content: string;
    expiryMinutes?: number;
    password?: string;
    burnAfterReading?: boolean;
    language?: string; // For code
    originalName?: string; // For images
    mimeType?: string; // For images
}

export interface ShareResponse {
    code: string;
    url: string;
    expiresAt: string;
}

export interface GetShareResponse {
    type: ShareType;
    content: string;
    language?: string;
    originalName?: string;
    mimeType?: string;
    expiresAt: string;
    burnAfterReading: boolean;
    burned: boolean;
    requiresPassword: boolean;
}

// Default expiry options (in minutes)
export const EXPIRY_OPTIONS = [
    { label: '10m', value: 10 },
    { label: '1h', value: 60 },
    { label: '24h', value: 1440 },
    { label: '7d', value: 10080 },
    { label: '30d', value: 43200 },
];

// Language options for code sharing
export const CODE_LANGUAGES = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'sql', label: 'SQL' },
    { id: 'bash', label: 'Bash' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'java', label: 'Java' },
    { id: 'csharp', label: 'C#' },
    { id: 'cpp', label: 'C++' },
    { id: 'php', label: 'PHP' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'plain', label: 'Plain Text' },
];
