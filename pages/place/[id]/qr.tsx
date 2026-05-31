/**
 * QR Code Generator Page
 * Path: pages/place/[id]/qr.tsx
 * URL: tavvy.com/place/[uuid]/qr
 *
 * Features:
 * - Generates QR code pointing to menu-gallery page
 * - Restaurant name above QR
 * - "Scan for Menu" text below
 * - Download PNG button
 * - Print button with print-optimized CSS
 * - Option to include Tavvy logo in center
 * - Clean, minimal, printable design
 */

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function QRCodePage() {
  const router = useRouter();
  const { id } = router.query;

  const [placeName, setPlaceName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const menuUrl = `https://tavvy.com/place/${id}/menu-gallery`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}&margin=10`;

  useEffect(() => {
    if (id) {
      loadPlace(id as string);
    }
  }, [id]);

  const loadPlace = async (placeId: string) => {
    setLoading(true);
    try {
      const { data: placeData } = await supabase
        .from('places')
        .select('name')
        .eq('id', placeId)
        .maybeSingle();

      if (placeData) {
        setPlaceName(placeData.name || '');
      }
    } catch (error) {
      console.error('[QRPage] Error loading place:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${placeName || 'menu'}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[QRPage] Download error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <style jsx global>{qrStyles}</style>
        <div className="qr-loading">
          <div className="qr-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{placeName ? `${placeName} QR Code` : 'QR Code'} | Tavvy</title>
        <meta name="robots" content="noindex" />
      </Head>

      <style jsx global>{qrStyles}</style>

      <div className="qr-page">
        {/* Controls - hidden when printing */}
        <div className="qr-controls no-print">
          <button className="qr-back-btn" onClick={() => router.back()}>
            ← Back
          </button>
          <div className="qr-controls-right">
            <label className="qr-logo-toggle">
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
              />
              <span>Tavvy logo</span>
            </label>
            <button className="qr-btn qr-btn-download" onClick={handleDownload}>
              Download PNG
            </button>
            <button className="qr-btn qr-btn-print" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {/* Printable QR Content */}
        <div className="qr-printable" ref={qrContainerRef}>
          <h1 className="qr-restaurant-name">{placeName}</h1>

          <div className="qr-code-wrapper">
            <img
              src={qrApiUrl}
              alt={`QR code for ${placeName} menu`}
              className="qr-code-img"
            />
            {includeLogo && (
              <div className="qr-logo-overlay">
                <img
                  src="/tavvy-logo-dark.png"
                  alt="Tavvy"
                  className="qr-logo-img"
                />
              </div>
            )}
          </div>

          <p className="qr-scan-text">Scan for Menu</p>

          <div className="qr-footer-branding">
            <img src="/tavvy-logo-dark.png" alt="Tavvy" className="qr-footer-logo" />
            <span className="qr-footer-url">tavvy.com</span>
          </div>
        </div>
      </div>
    </>
  );
}

const qrStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }

  .qr-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }
  .qr-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #eee;
    border-top-color: #8A05BE;
    border-radius: 50%;
    animation: qr-spin 0.7s linear infinite;
  }
  @keyframes qr-spin { to { transform: rotate(360deg); } }

  .qr-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
  }

  /* Controls */
  .qr-controls {
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .qr-back-btn {
    background: none;
    border: none;
    font-size: 15px;
    font-weight: 600;
    color: #8A05BE;
    cursor: pointer;
    padding: 8px 0;
  }
  .qr-controls-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .qr-logo-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
  }
  .qr-logo-toggle input {
    width: 16px;
    height: 16px;
    accent-color: #8A05BE;
  }
  .qr-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .qr-btn:hover {
    opacity: 0.85;
  }
  .qr-btn-download {
    background: #8A05BE;
    color: #fff;
  }
  .qr-btn-print {
    background: #1a1a1a;
    color: #fff;
  }

  /* Printable Area */
  .qr-printable {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 40px;
    flex: 1;
    width: 100%;
    max-width: 500px;
  }

  .qr-restaurant-name {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 32px;
    letter-spacing: -0.5px;
  }

  .qr-code-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border: 1px solid #f0f0f0;
  }
  .qr-code-img {
    width: 280px;
    height: 280px;
    display: block;
  }
  .qr-logo-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .qr-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .qr-scan-text {
    margin-top: 28px;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.2px;
  }

  .qr-footer-branding {
    margin-top: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.5;
  }
  .qr-footer-logo {
    height: 20px;
    width: auto;
  }
  .qr-footer-url {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }

  /* Print styles */
  @media print {
    .no-print {
      display: none !important;
    }
    html, body {
      background: #fff !important;
    }
    .qr-page {
      min-height: auto;
      justify-content: center;
    }
    .qr-printable {
      padding: 40px 24px;
    }
    .qr-code-wrapper {
      box-shadow: none;
      border: 2px solid #eee;
    }
    .qr-code-img {
      width: 320px;
      height: 320px;
    }
  }

  @media (min-width: 768px) {
    .qr-code-img {
      width: 340px;
      height: 340px;
    }
    .qr-restaurant-name {
      font-size: 34px;
    }
  }
`;

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
