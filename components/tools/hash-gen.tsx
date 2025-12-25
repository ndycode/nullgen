"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ClipboardText } from "@phosphor-icons/react";

type HashType = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

const HASH_TYPES: HashType[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

// Simple MD5 implementation
function md5(str: string): string {
    function rotateLeft(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }
    function addUnsigned(x: number, y: number) {
        const x8 = (x & 0x80000000), y8 = (y & 0x80000000);
        const x4 = (x & 0x40000000), y4 = (y & 0x40000000);
        const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
        if (x4 & y4) return (result ^ 0x80000000 ^ x8 ^ y8);
        if (x4 | y4) return (result & 0x40000000) ? (result ^ 0xC0000000 ^ x8 ^ y8) : (result ^ 0x40000000 ^ x8 ^ y8);
        return result ^ x8 ^ y8;
    }
    function F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | (~z)); }
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b); }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b); }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b); }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b); }
    function toHex(n: number) { let s = "", v; for (let i = 0; i <= 3; i++) { v = (n >>> (i * 8)) & 255; s += ("0" + v.toString(16)).slice(-2); } return s; }
    function utf8Encode(s: string) { s = s.replace(/\r\n/g, "\n"); let utf = ""; for (let n = 0; n < s.length; n++) { const c = s.charCodeAt(n); if (c < 128) utf += String.fromCharCode(c); else if (c > 127 && c < 2048) { utf += String.fromCharCode((c >> 6) | 192); utf += String.fromCharCode((c & 63) | 128); } else { utf += String.fromCharCode((c >> 12) | 224); utf += String.fromCharCode(((c >> 6) & 63) | 128); utf += String.fromCharCode((c & 63) | 128); } } return utf; }

    const S11 = 7, S12 = 12, S13 = 17, S14 = 22, S21 = 5, S22 = 9, S23 = 14, S24 = 20, S31 = 4, S32 = 11, S33 = 16, S34 = 23, S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    str = utf8Encode(str);
    const len = str.length, wordLen = ((((len + 8) - ((len + 8) % 64)) / 64) + 1) * 16, wordArr: number[] = Array(wordLen - 1).fill(0);
    let pos = 0, count = 0;
    while (count < len) { const i = (count - (count % 4)) / 4; pos = (count % 4) * 8; wordArr[i] = (wordArr[i] | (str.charCodeAt(count) << pos)); count++; }
    const i = (count - (count % 4)) / 4; pos = (count % 4) * 8; wordArr[i] = wordArr[i] | (0x80 << pos); wordArr[wordLen - 2] = len << 3; wordArr[wordLen - 1] = len >>> 29;

    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for (let k = 0; k < wordArr.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, wordArr[k], S11, 0xD76AA478); d = FF(d, a, b, c, wordArr[k + 1], S12, 0xE8C7B756); c = FF(c, d, a, b, wordArr[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, wordArr[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, wordArr[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, wordArr[k + 5], S12, 0x4787C62A); c = FF(c, d, a, b, wordArr[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, wordArr[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, wordArr[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, wordArr[k + 9], S12, 0x8B44F7AF); c = FF(c, d, a, b, wordArr[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, wordArr[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, wordArr[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, wordArr[k + 13], S12, 0xFD987193); c = FF(c, d, a, b, wordArr[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, wordArr[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, wordArr[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, wordArr[k + 6], S22, 0xC040B340); c = GG(c, d, a, b, wordArr[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, wordArr[k], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, wordArr[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, wordArr[k + 10], S22, 0x02441453); c = GG(c, d, a, b, wordArr[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, wordArr[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, wordArr[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, wordArr[k + 14], S22, 0xC33707D6); c = GG(c, d, a, b, wordArr[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, wordArr[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, wordArr[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, wordArr[k + 2], S22, 0xFCEFA3F8); c = GG(c, d, a, b, wordArr[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, wordArr[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, wordArr[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, wordArr[k + 8], S32, 0x8771F681); c = HH(c, d, a, b, wordArr[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, wordArr[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, wordArr[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, wordArr[k + 4], S32, 0x4BDECFA9); c = HH(c, d, a, b, wordArr[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, wordArr[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, wordArr[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, wordArr[k], S32, 0xEAA127FA); c = HH(c, d, a, b, wordArr[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, wordArr[k + 6], S34, 0x04881D05);
        a = HH(a, b, c, d, wordArr[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, wordArr[k + 12], S32, 0xE6DB99E5); c = HH(c, d, a, b, wordArr[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, wordArr[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, wordArr[k], S41, 0xF4292244); d = II(d, a, b, c, wordArr[k + 7], S42, 0x432AFF97); c = II(c, d, a, b, wordArr[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, wordArr[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, wordArr[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, wordArr[k + 3], S42, 0x8F0CCC92); c = II(c, d, a, b, wordArr[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, wordArr[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, wordArr[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, wordArr[k + 15], S42, 0xFE2CE6E0); c = II(c, d, a, b, wordArr[k + 6], S43, 0xA3014314); b = II(b, c, d, a, wordArr[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, wordArr[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, wordArr[k + 11], S42, 0xBD3AF235); c = II(c, d, a, b, wordArr[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, wordArr[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
}

// Use Web Crypto API for SHA hashes
async function sha(text: string, algo: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function HashGen() {
    const [input, setInput] = useState("");
    const [hashType, setHashType] = useState<HashType>("SHA-256");
    const [output, setOutput] = useState("");
    const [copied, setCopied] = useState(false);
    const [uppercase, setUppercase] = useState(false);

    // Real-time hash generation
    useEffect(() => {
        if (!input) {
            setOutput("");
            return;
        }

        const generateHash = async () => {
            try {
                let hash: string;
                if (hashType === "MD5") {
                    hash = md5(input);
                } else {
                    hash = await sha(input, hashType);
                }
                setOutput(uppercase ? hash.toUpperCase() : hash);
            } catch {
                setOutput("Error");
            }
        };

        generateHash();
    }, [input, hashType, uppercase]);

    const copy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const paste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInput(text);
        } catch { }
    };

    return (
        <motion.div
            className="bg-card border rounded-2xl p-3 sm:p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Hash type selector */}
            <div className="flex gap-1">
                {HASH_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setHashType(type)}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${hashType === type
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>input</span>
                    <button onClick={paste} className="text-primary hover:underline flex items-center gap-1">
                        <ClipboardText className="w-3 h-3" />
                        paste
                    </button>
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type or paste text to hash..."
                    className="w-full h-20 px-3 py-2 text-sm bg-muted/50 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Options */}
            <div className="flex gap-2">
                <button
                    onClick={() => setUppercase(!uppercase)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${uppercase
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    UPPERCASE
                </button>
            </div>

            {/* Output */}
            {output && (
                <motion.div
                    className="relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">{hashType.toLowerCase()} ({output.length} chars)</span>
                        <button
                            onClick={copy}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? "copied!" : "copy"}
                        </button>
                    </div>
                    <div
                        className="p-3 bg-muted/30 border rounded-lg break-all font-mono text-xs select-all cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={copy}
                        style={{ textTransform: 'none' }}
                    >
                        {output}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
