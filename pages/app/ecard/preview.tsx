/**
 * eCard Preview Screen
 * Shows the actual public card in an iframe so it always matches what visitors see.
 * Keeps QR code, share, copy link, and edit actions outside the iframe.
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { 
  getCardById, 
  CardData, 
  getCardUrl,
} from '../../../lib/ecard';
import StyledQRCode, { QR_STYLE_PRESETS, QRStyleConfig } from '../../../components/ecard/StyledQRCode';
import { 
  IoArrowBack, 
  IoShare,
  IoQrCode,
  IoCopy,
  IoCheckmark,
  IoClose,
  IoDownload,
  IoCreate,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#000000';

export default function ECardPreviewScreen() {
  const router = useRouter();
  const { cardId: queryCardId } = router.query;
  const { isDark } = useThemeContext();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStyle, setQrStyle] = useState<Partial<QRStyleConfig>>({});
  const qrContainerRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  // Sync cardId from router query to state
  useEffect(() => {
    if (router.isReady && queryCardId && typeof queryCardId === 'string') {
      setCardId(queryCardId);
    }
  }, [router.isReady, queryCardId]);

  // Load card data (just for slug, name, and ownership check)
  useEffect(() => {
    const loadCard = async () => {
      if (!cardId) {
        if (router.isReady) setLoading(false);
        return;
      }

      try {
        const card = await getCardById(cardId);
        if (card) {
          setCardData(card);
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [cardId]);

  // Copy card URL
  const copyCardUrl = () => {
    if (!cardData?.slug) return;
    const url = getCardUrl(cardData.slug);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share card
  const shareCard = async () => {
    if (!cardData?.slug) return;
    const url = getCardUrl(cardData.slug);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.full_name}'s Card`,
          text: `Check out ${cardData.full_name}'s digital business card`,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyCardUrl();
    }
  };

  if (loading) {
    return (
      <>
        <Head><title>Preview eCard | TavvY</title></Head>
        <AppLayout>
          <div className="loading" style={{ backgroundColor: bgColor }}>
            <div className="spinner" />
          </div>
          <style jsx>{`
            .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .spinner { width: 40px; height: 40px; border: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; border-top-color: ${ACCENT_GREEN}; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </AppLayout>
      </>
    );
  }

  if (!cardData) {
    return (
      <>
        <Head><title>Card Not Found | TavvY</title></Head>
        <AppLayout>
          <div className="not-found" style={{ backgroundColor: bgColor }}>
            <h2 style={{ color: isDark ? '#fff' : '#333' }}>Card not found</h2>
            <button onClick={() => router.push('/app/ecard')}>Go Back</button>
          </div>
          <style jsx>{`
            .not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
            button { background: ${ACCENT_GREEN}; border: none; padding: 12px 24px; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; }
          `}</style>
        </AppLayout>
      </>
    );
  }

  // Build the public card URL for the iframe
  const publicCardUrl = cardData.slug ? getCardUrl(cardData.slug) : null;
  // For draft cards without a public slug, show a message
  const isDraft = !cardData.is_published;

  return (
    <>
      <Head>
        <title>{cardData.full_name}'s Card | TavvY</title>
        <meta name="description" content={cardData.bio || `${cardData.full_name}'s digital business card`} />
      </Head>

      <AppLayout hideTabBar>
        <div className="preview-screen" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <h1 style={{ color: isDark ? '#fff' : '#333' }}>Preview</h1>
            <button className="share-btn" onClick={shareCard}>
              <IoShare size={20} color={isDark ? '#fff' : '#333'} />
            </button>
          </header>

          {/* Card Preview — Embedded Public Card */}
          <div className="card-iframe-container">
            {publicCardUrl ? (
              <>
                {!iframeLoaded && (
                  <div className="iframe-loading">
                    <div className="spinner" />
                    <p style={{ color: isDark ? '#94A3B8' : '#6B7280', marginTop: 12, fontSize: 14 }}>Loading preview...</p>
                  </div>
                )}
                <iframe
                  src={`${publicCardUrl}?preview=true`}
                  className="card-iframe"
                  style={{ opacity: iframeLoaded ? 1 : 0 }}
                  onLoad={() => setIframeLoaded(true)}
                  title={`${cardData.full_name}'s Card Preview`}
                  scrolling="yes"
                />
              </>
            ) : (
              <div className="draft-notice">
                <div className="draft-icon">📝</div>
                <h3 style={{ color: isDark ? '#fff' : '#333', margin: '0 0 8px' }}>Draft Card</h3>
                <p style={{ color: isDark ? '#94A3B8' : '#6B7280', margin: 0, fontSize: 14, textAlign: 'center' }}>
                  Publish your card to see a live preview. You can still edit and share after publishing.
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {isDraft && publicCardUrl && (
            <div className="draft-banner">
              <span>⚠️ This card is not published yet. Publish to make it visible to others.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="actions">
            <button className="action-btn" onClick={() => setShowQRModal(true)}>
              <IoQrCode size={20} />
              <span>QR Code</span>
            </button>
            <button className="action-btn" onClick={copyCardUrl}>
              {copied ? <IoCheckmark size={20} color={ACCENT_GREEN} /> : <IoCopy size={20} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button className="action-btn primary" onClick={shareCard}>
              <IoShare size={20} />
              <span>Share</span>
            </button>
          </div>

          {/* Edit Button (for owner) */}
          {user && cardData.user_id === user.id && (
            <button 
              className="edit-btn"
              onClick={() => router.push(`/app/ecard/dashboard?cardId=${cardId}`)}
            >
              <IoCreate size={18} />
              <span>Edit Card</span>
            </button>
          )}

          {/* QR Code Modal */}
          {showQRModal && cardData.slug && (
            <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
              <div className="modal qr-modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff', maxWidth: 420 }}>
                <button className="modal-close" onClick={() => setShowQRModal(false)}>
                  <IoClose size={24} color={isDark ? '#fff' : '#333'} />
                </button>
                <h2 style={{ color: isDark ? '#fff' : '#333', marginBottom: 4 }}>QR Code</h2>
                <p style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 13, marginBottom: 16 }}>
                  Customize your QR code style
                </p>
                
                {/* QR Code Preview */}
                <div ref={qrContainerRef} className="qr-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <StyledQRCode url={getCardUrl(cardData.slug)} style={qrStyle} />
                </div>

                {/* Style Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {QR_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setQrStyle(preset.config)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: `2px solid ${JSON.stringify(qrStyle) === JSON.stringify(preset.config) ? '#00C853' : (isDark ? '#334155' : '#E5E7EB')}`,
                        backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: isDark ? '#E2E8F0' : '#374151',
                        textAlign: 'center' as const,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, margin: '0 auto 4px',
                        borderRadius: preset.config.dotStyle === 'dots' ? '50%' : 4,
                        background: preset.config.backgroundColor === '#FFFFFF' 
                          ? `linear-gradient(135deg, ${preset.config.dotColor}, ${preset.config.dotColor}88)` 
                          : preset.config.backgroundColor,
                        border: `2px solid ${preset.config.dotColor}`,
                      }} />
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Custom Color Pickers */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Dot Color</label>
                  <input
                    type="color"
                    value={qrStyle.dotColor || '#000000'}
                    onChange={(e) => setQrStyle(prev => ({ ...prev, dotColor: e.target.value, cornerColor: e.target.value }))}
                    style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                  />
                  <label style={{ color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}>Background</label>
                  <input
                    type="color"
                    value={qrStyle.backgroundColor || '#FFFFFF'}
                    onChange={(e) => setQrStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                  />
                </div>

                <p style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                  {getCardUrl(cardData.slug)}
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="download-btn" onClick={copyCardUrl} style={{ flex: 1 }}>
                    <IoCopy size={16} />
                    <span>Copy Link</span>
                  </button>
                  <button className="download-btn" onClick={async () => {
                    if (qrContainerRef.current) {
                      const { downloadQRCode } = await import('../../../components/ecard/StyledQRCode');
                      await downloadQRCode(qrContainerRef.current, `${cardData.slug}-qr`);
                    }
                  }} style={{ flex: 1, background: '#00C853' }}>
                    <IoDownload size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .preview-screen {
            min-height: 100vh;
            padding-bottom: 40px;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .back-btn, .share-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .header h1 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }

          /* Card Iframe Container */
          .card-iframe-container {
            margin: 0 16px 20px;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            min-height: 500px;
          }

          .card-iframe {
            width: 100%;
            height: 70vh;
            min-height: 500px;
            border: none;
            display: block;
            transition: opacity 0.3s ease;
          }

          .iframe-loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
            border-top-color: ${ACCENT_GREEN};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }

          .draft-notice {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 24px;
          }

          .draft-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .draft-banner {
            margin: 0 16px 16px;
            padding: 12px 16px;
            background: ${isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)'};
            border: 1px solid ${isDark ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.3)'};
            border-radius: 12px;
            color: ${isDark ? '#FFC107' : '#856404'};
            font-size: 13px;
            text-align: center;
          }

          /* Actions */
          .actions {
            display: flex;
            gap: 12px;
            padding: 0 16px;
            margin-bottom: 16px;
          }

          .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px;
            background: ${isDark ? '#1E293B' : '#fff'};
            border: none;
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .action-btn:hover {
            transform: scale(1.02);
          }

          .action-btn.primary {
            background: ${ACCENT_GREEN};
            color: #fff;
          }

          .edit-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: calc(100% - 32px);
            margin: 0 16px;
            padding: 14px;
            background: transparent;
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
          }

          .edit-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
          }

          /* Modal */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal {
            width: 100%;
            max-width: 340px;
            padding: 24px;
            border-radius: 20px;
            text-align: center;
            position: relative;
          }

          .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
          }

          .modal h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px;
          }

          .qr-container {
            background: #fff;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 12px;
            background: ${ACCENT_GREEN};
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
