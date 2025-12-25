import {
    File,
    FileImage,
    FilePdf,
    FileVideo,
    FileAudio,
    FileZip,
    FileCode,
    FileText,
    FileDoc,
    FileXls,
    FilePpt,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

type FileIconInfo = {
    icon: Icon;
    color: string;
};

const extensionMap: Record<string, FileIconInfo> = {
    // Images
    jpg: { icon: FileImage, color: "text-primary" },
    jpeg: { icon: FileImage, color: "text-primary" },
    png: { icon: FileImage, color: "text-primary" },
    gif: { icon: FileImage, color: "text-primary" },
    webp: { icon: FileImage, color: "text-primary" },
    svg: { icon: FileImage, color: "text-primary" },
    ico: { icon: FileImage, color: "text-primary" },

    // PDF
    pdf: { icon: FilePdf, color: "text-destructive" },

    // Video
    mp4: { icon: FileVideo, color: "text-primary" },
    mov: { icon: FileVideo, color: "text-primary" },
    avi: { icon: FileVideo, color: "text-primary" },
    mkv: { icon: FileVideo, color: "text-primary" },
    webm: { icon: FileVideo, color: "text-primary" },

    // Audio
    mp3: { icon: FileAudio, color: "text-primary" },
    wav: { icon: FileAudio, color: "text-primary" },
    flac: { icon: FileAudio, color: "text-primary" },
    ogg: { icon: FileAudio, color: "text-primary" },
    m4a: { icon: FileAudio, color: "text-primary" },

    // Archives
    zip: { icon: FileZip, color: "text-muted-foreground" },
    rar: { icon: FileZip, color: "text-muted-foreground" },
    "7z": { icon: FileZip, color: "text-muted-foreground" },
    tar: { icon: FileZip, color: "text-muted-foreground" },
    gz: { icon: FileZip, color: "text-muted-foreground" },

    // Code
    js: { icon: FileCode, color: "text-primary" },
    ts: { icon: FileCode, color: "text-primary" },
    jsx: { icon: FileCode, color: "text-primary" },
    tsx: { icon: FileCode, color: "text-primary" },
    py: { icon: FileCode, color: "text-primary" },
    java: { icon: FileCode, color: "text-primary" },
    cpp: { icon: FileCode, color: "text-primary" },
    c: { icon: FileCode, color: "text-primary" },
    html: { icon: FileCode, color: "text-primary" },
    css: { icon: FileCode, color: "text-primary" },
    json: { icon: FileCode, color: "text-primary" },

    // Documents
    doc: { icon: FileDoc, color: "text-primary" },
    docx: { icon: FileDoc, color: "text-primary" },
    txt: { icon: FileText, color: "text-muted-foreground" },
    md: { icon: FileText, color: "text-muted-foreground" },
    rtf: { icon: FileText, color: "text-muted-foreground" },

    // Spreadsheets
    xls: { icon: FileXls, color: "text-primary" },
    xlsx: { icon: FileXls, color: "text-primary" },
    csv: { icon: FileXls, color: "text-primary" },

    // Presentations
    ppt: { icon: FilePpt, color: "text-primary" },
    pptx: { icon: FilePpt, color: "text-primary" },
};

export function getFileIcon(filename: string): FileIconInfo {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return extensionMap[ext] || { icon: File, color: "text-primary" };
}

export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}
