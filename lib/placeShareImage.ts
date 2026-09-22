/** Server-only, bounded image loading and raster OG rendering. */
import { readFileSync, statSync } from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { compositePlacePhotoSource } from './placeSharePhoto';
import type { PlaceShareMetadata } from './placeShareMetadata';
const MAX_BYTES = 4 * 1024 * 1024, MAX_PIXELS = 16000000;
export type SharePhoto = {
    bytes: Buffer;
    mime: 'image/png' | 'image/jpeg';
};
export function checkedShareRaster(bytes: Buffer): SharePhoto | null {
    let width = 0, height = 0, mime: SharePhoto['mime'];
    if (bytes.length > MAX_BYTES || bytes.length < 24)
        return null;
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR') {
        width = bytes.readUInt32BE(16);
        height = bytes.readUInt32BE(20);
        mime = 'image/png';
    }
    else if (bytes[0] === 255 && bytes[1] === 216) {
        mime = 'image/jpeg';
        let offset = 2;
        while (offset + 4 < bytes.length) {
            if (bytes[offset] !== 255)
                return null;
            while (bytes[offset] === 255)
                offset++;
            const marker = bytes[offset++];
            if (marker === 217 || marker === 218)
                break;
            if (marker === 1 || (marker >= 208 && marker <= 215))
                continue;
            if (offset + 2 > bytes.length)
                return null;
            const size = bytes.readUInt16BE(offset);
            if (size < 2 || offset + size > bytes.length)
                return null;
            if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
                if (size < 8)
                    return null;
                height = bytes.readUInt16BE(offset + 3);
                width = bytes.readUInt16BE(offset + 5);
                break;
            }
            offset += size;
        }
    }
    else
        return null;
    if (!width || !height || width > 8192 || height > 8192 || width * height > MAX_PIXELS)
        return null;
    return { bytes, mime };
}
export async function loadPlaceSharePhoto(url: unknown, options: {
    fetcher?: typeof fetch;
    storageOrigin?: string;
    root?: string;
    timeoutMs?: number;
} = {}): Promise<SharePhoto | null> {
    const source = compositePlacePhotoSource(url, options.storageOrigin);
    if (!source)
        return null;
    try {
        if (source.kind === 'local') {
            const file = path.join(options.root || process.cwd(), 'public', source.path);
            if (statSync(file).size > MAX_BYTES)
                return null;
            return checkedShareRaster(readFileSync(file));
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs || 2000);
        try {
            const response = await (options.fetcher || fetch)(source.url, { signal: controller.signal, redirect: 'manual', headers: { Accept: 'image/png,image/jpeg' } });
            if (!response.ok || !/^image\/(?:png|jpeg)(?:;|$)/i.test(response.headers.get('content-type') || '') || Number(response.headers.get('content-length') || 0) > MAX_BYTES || !response.body) {
                await response.body?.cancel();
                return null;
            }
            const reader = response.body.getReader(), chunks: Uint8Array[] = [];
            let total = 0;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    total += value.byteLength;
                    if (total > MAX_BYTES) {
                        await reader.cancel();
                        return null;
                    }
                    chunks.push(value);
                }
            }
            finally {
                reader.releaseLock();
            }
            return checkedShareRaster(Buffer.concat(chunks));
        }
        finally {
            clearTimeout(timer);
        }
    }
    catch {
        return null;
    }
}
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const units = (value: string) => Array.from(value).reduce((sum, c) => sum + (c === ' ' ? 0.3 : /[ilI.,:;'!|]/.test(c) ? 0.34 : /[MW@]/.test(c) ? 1.02 : /[A-Z0-9]/.test(c) ? 0.75 : c.codePointAt(0)! > 0x2ff ? 1.05 : 0.63), 0);
export function wrapShareText(value: string, width: number, font: number, maxLines = 3): string[] {
    const lines: string[] = [];
    let current = '';
    for (const word of value.trim().split(/\s+/)) {
        if (current && units(current + ' ' + word) * font <= width) {
            current += ' ' + word;
            continue;
        }
        if (current) {
            lines.push(current);
            current = '';
        }
        for (const char of Array.from(word)) {
            if (current && units(current + char) * font > width) {
                lines.push(current);
                current = '';
            }
            current += char;
        }
    }
    if (current)
        lines.push(current);
    if (lines.length <= maxLines)
        return lines;
    const result = lines.slice(0, maxLines);
    let last = result[maxLines - 1];
    while (last && units(last + '…') * font > width)
        last = Array.from(last).slice(0, -1).join('');
    result[maxLines - 1] = last + '…';
    return result;
}
export function buildPlaceShareSvg(metadata: PlaceShareMetadata, photo: SharePhoto | null, brand: SharePhoto | null = null): string {
    const taxonomy = [metadata.category, metadata.subcategory].filter(Boolean).join(' · ');
    // Sizes read comfortably in chat-app link previews, which show the image at roughly a third of its size.
    const categories = wrapShareText(taxonomy, 1040, 31, 2);
    let font = 94;
    for (const size of [94, 84, 74, 64]) {
        font = size;
        if (wrapShareText(metadata.name, 1040, size, 20).length <= 3)
            break;
    }
    let title = wrapShareText(metadata.name, 1040, font, 3);
    if (title.length === 3 && font > 76) {
        font = 76;
        title = wrapShareText(metadata.name, 1040, font, 3);
    }
    const start = title.length === 3 ? (categories.length > 1 ? 312 : 284) : title.length === 2 ? (categories.length > 1 ? 330 : 306) : (categories.length > 1 ? 366 : 348);
    const location = wrapShareText(metadata.location || 'Explore this place', 940, 31, 1)[0];
    const hero = photo ? `<image href="data:${photo.mime};base64,${photo.bytes.toString('base64')}" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/><rect width="1200" height="630" fill="url(#photoShade)"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#21103D"/><stop offset=".52" stop-color="#32105B"/><stop offset="1" stop-color="#053D4B"/></linearGradient><radialGradient id="glow"><stop stop-color="#9E29D3" stop-opacity=".5"/><stop offset="1" stop-color="#9E29D3" stop-opacity="0"/></radialGradient><linearGradient id="photoShade" x1="0" y1="0" x2="1" y2=".35"><stop stop-color="#160C2D" stop-opacity=".96"/><stop offset=".63" stop-color="#1E123A" stop-opacity=".83"/><stop offset="1" stop-color="#071D29" stop-opacity=".55"/></linearGradient><pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#FFFFFF" stroke-opacity=".035"/></pattern></defs>
 <rect width="1200" height="630" fill="url(#bg)"/><ellipse cx="900" cy="90" rx="580" ry="440" fill="url(#glow)"/>
 <path d="M780 690L1250 220M850 700L1280 270M920 715L1300 335" stroke="#31D4CE" stroke-width="2" stroke-opacity=".14"/>
 <circle cx="1180" cy="570" r="210" fill="none" stroke="#40D3CC" stroke-width="1" stroke-opacity=".17"/><circle cx="1180" cy="570" r="265" fill="none" stroke="#40D3CC" stroke-width="1" stroke-opacity=".1"/>
 <rect width="1200" height="630" fill="url(#grid)"/>${hero}
 ${brand ? `<image href="data:${brand.mime};base64,${brand.bytes.toString('base64')}" x="80" y="51" width="180" height="53" preserveAspectRatio="xMinYMid meet"/>` : '<text x="80" y="93" font-family="Noto Sans" font-size="36" fill="#FFFFFF">Tavvy</text>'}
 <text x="1120" y="92" text-anchor="end" font-family="Noto Sans" font-size="24" fill="#D1C7DD">Discover your kind of place</text>
 ${categories.map((line, i) => `<text x="80" y="${178 + i * 38}" font-family="Noto Sans" font-size="31" fill="#7BE5DE">${escape(line)}</text>`).join('')}
 ${title.map((line, i) => `<text x="77" y="${start + i * (font + 12)}" font-family="Noto Sans" font-size="${font}" fill="#FFFFFF">${escape(line)}</text>`).join('')}
 <path d="M89 544s-10-9-10-16a10 10 0 0 1 20 0c0 7-10 16-10 16z" fill="none" stroke="#7BE5DE" stroke-width="2"/><circle cx="89" cy="528" r="3" fill="none" stroke="#7BE5DE" stroke-width="2"/>
 <text x="116" y="542" font-family="Noto Sans" font-size="31" fill="#EEE7F5">${escape(location)}</text>
 <path d="M80 576H1120" stroke="#FFFFFF" stroke-opacity=".17"/>
 <text x="80" y="611" font-family="Noto Sans" font-size="22" fill="#C9BDDA">Visitor experiences · Photos · Place details</text><text x="1120" y="611" text-anchor="end" font-family="Noto Sans" font-size="22" fill="#C9BDDA">tavvy.com</text></svg>`;
}
export function renderPlaceSharePng(metadata: PlaceShareMetadata, photo: SharePhoto | null, root = process.cwd()): Buffer {
    const fontFile = path.join(root, 'node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf');
    // Fail visibly if a standalone package omitted the font, rather than shipping blank text.
    readFileSync(fontFile);
    let brand: SharePhoto | null = null;
    try {
        brand = checkedShareRaster(readFileSync(path.join(root, 'public/tavvy-logo-white.png')));
    }
    catch { }
    const svg = buildPlaceShareSvg(metadata, photo, brand);
    try {
        return new Resvg(svg, { font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: 'Noto Sans' } }).render().asPng();
    }
    catch (error) {
        if (photo)
            return new Resvg(buildPlaceShareSvg(metadata, null, brand), { font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: 'Noto Sans' } }).render().asPng();
        throw error;
    }
}
