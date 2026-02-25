/**
 * StyledQRCode.tsx
 * A customizable QR code component with different dot styles, colors, and logo support.
 * Uses qr-code-styling library for advanced QR code rendering.
 */
import React, { useEffect, useRef, useState } from 'react';

// QR Code style options
export type QRDotStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded';
export type QRCornerStyle = 'square' | 'dot' | 'extra-rounded';

export interface QRStyleConfig {
  dotStyle: QRDotStyle;
  dotColor: string;
  backgroundColor: string;
  cornerSquareStyle: QRCornerStyle;
  cornerDotStyle: 'square' | 'dot';
  cornerColor: string;
  showLogo: boolean;
  size: number;
}

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  dotStyle: 'square',
  dotColor: '#000000',
  backgroundColor: '#FFFFFF',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
  cornerColor: '#000000',
  showLogo: true,
  size: 280,
};

export const QR_STYLE_PRESETS: { id: string; name: string; config: Partial<QRStyleConfig> }[] = [
  { id: 'classic', name: 'Classic', config: { dotStyle: 'square', dotColor: '#000000', backgroundColor: '#FFFFFF', cornerSquareStyle: 'square' } },
  { id: 'rounded', name: 'Rounded', config: { dotStyle: 'rounded', dotColor: '#000000', backgroundColor: '#FFFFFF', cornerSquareStyle: 'extra-rounded' } },
  { id: 'dots', name: 'Dots', config: { dotStyle: 'dots', dotColor: '#000000', backgroundColor: '#FFFFFF', cornerSquareStyle: 'dot', cornerDotStyle: 'dot' } },
  { id: 'classy', name: 'Classy', config: { dotStyle: 'classy-rounded', dotColor: '#1f2937', backgroundColor: '#FFFFFF', cornerSquareStyle: 'extra-rounded' } },
  { id: 'brand-green', name: 'Tavvy Green', config: { dotStyle: 'rounded', dotColor: '#00C853', backgroundColor: '#FFFFFF', cornerSquareStyle: 'extra-rounded', cornerColor: '#00C853' } },
  { id: 'brand-purple', name: 'Purple', config: { dotStyle: 'dots', dotColor: '#8B5CF6', backgroundColor: '#FFFFFF', cornerSquareStyle: 'dot', cornerColor: '#8B5CF6', cornerDotStyle: 'dot' } },
  { id: 'dark', name: 'Dark', config: { dotStyle: 'rounded', dotColor: '#FFFFFF', backgroundColor: '#1f2937', cornerSquareStyle: 'extra-rounded', cornerColor: '#FFFFFF' } },
  { id: 'gold', name: 'Gold', config: { dotStyle: 'classy-rounded', dotColor: '#d4af37', backgroundColor: '#1f2937', cornerSquareStyle: 'extra-rounded', cornerColor: '#d4af37' } },
];

interface StyledQRCodeProps {
  url: string;
  style?: Partial<QRStyleConfig>;
  className?: string;
}

export default function StyledQRCode({ url, style = {}, className }: StyledQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  const config: QRStyleConfig = { ...DEFAULT_QR_STYLE, ...style };

  useEffect(() => {
    // Dynamically import qr-code-styling
    const loadQR = async () => {
      try {
        const QRCodeStyling = (await import('qr-code-styling')).default;
        
        const qrCode = new QRCodeStyling({
          width: config.size,
          height: config.size,
          type: 'svg',
          data: url,
          dotsOptions: {
            color: config.dotColor,
            type: config.dotStyle,
          },
          cornersSquareOptions: {
            color: config.cornerColor || config.dotColor,
            type: config.cornerSquareStyle,
          },
          cornersDotOptions: {
            color: config.cornerColor || config.dotColor,
            type: config.cornerDotStyle,
          },
          backgroundOptions: {
            color: config.backgroundColor,
          },
          imageOptions: config.showLogo ? {
            crossOrigin: 'anonymous',
            margin: 8,
            imageSize: 0.35,
          } : undefined,
          image: config.showLogo ? '/brand/logo-icon.png' : undefined,
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          qrCode.append(containerRef.current);
          qrRef.current = qrCode;
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load QR code styling:', err);
        // Fallback to basic QR code via API
        if (containerRef.current) {
          containerRef.current.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${config.size}x${config.size}&data=${encodeURIComponent(url)}&color=${config.dotColor.replace('#', '')}&bgcolor=${config.backgroundColor.replace('#', '')}" alt="QR Code" style="width:${config.size}px;height:${config.size}px" />`;
        }
      }
    };

    loadQR();
  }, [url, config.dotStyle, config.dotColor, config.backgroundColor, config.cornerSquareStyle, config.cornerDotStyle, config.cornerColor, config.showLogo, config.size]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        width: config.size, 
        height: config.size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 12,
        overflow: 'hidden',
      }} 
    />
  );
}

// Helper to download QR code as PNG
export async function downloadQRCode(containerRef: HTMLDivElement, filename: string = 'qr-code') {
  const svg = containerRef.querySelector('svg');
  if (!svg) return;

  // Clone SVG and strip embedded images (they taint the canvas)
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  clonedSvg.querySelectorAll('image').forEach((img) => img.remove());

  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new window.Image();

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      try {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        resolve();
      } catch (err) {
        console.error('QR download canvas error:', err);
        reject(err);
      }
    };
    img.onerror = (err) => {
      console.error('QR download image load error:', err);
      reject(err);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgData)));
  });
}
