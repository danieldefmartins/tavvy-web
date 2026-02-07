/**
 * WalletButtons.tsx
 * Apple Wallet and Google Wallet "Add to Wallet" buttons for eCard.
 * Also includes vCard download as a universal fallback.
 */
import React, { useState } from 'react';

interface WalletButtonsProps {
  slug: string;
  cardId: string;
  textColor?: string;
  isDark?: boolean;
}

export default function WalletButtons({ slug, cardId, textColor = '#fff', isDark = true }: WalletButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAppleWallet = async () => {
    setLoading('apple');
    setError(null);
    try {
      const response = await fetch('/api/ecard/wallet/apple-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, slug }),
      });

      if (response.status === 503) {
        // Not configured yet — show vCard fallback
        handleVCard();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }

      // Download the .pkpass file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.pkpass`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Apple Wallet error:', err);
      // Fallback to vCard
      handleVCard();
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleWallet = async () => {
    setLoading('google');
    setError(null);
    try {
      const response = await fetch('/api/ecard/wallet/google-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, slug }),
      });

      if (response.status === 503) {
        // Not configured yet — show vCard fallback
        handleVCard();
        return;
      }

      const data = await response.json();
      if (data.saveUrl) {
        window.open(data.saveUrl, '_blank');
      } else {
        throw new Error('No save URL returned');
      }
    } catch (err: any) {
      console.error('Google Wallet error:', err);
      // Fallback to vCard
      handleVCard();
    } finally {
      setLoading(null);
    }
  };

  const handleVCard = () => {
    window.open(`/api/ecard/wallet/vcard?slug=${encodeURIComponent(slug)}`, '_blank');
  };

  return (
    <div className="wallet-buttons">
      {/* Apple Wallet Button */}
      <button 
        className="wallet-btn apple-wallet-btn"
        onClick={handleAppleWallet}
        disabled={loading === 'apple'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.57 5.72C13.36 5.72 14.85 4.62 16.4 4.8C17.06 4.83 18.89 5.08 20.06 6.81C19.96 6.87 17.62 8.23 17.65 11.1C17.68 14.54 20.62 15.68 20.66 15.69C20.63 15.78 20.19 17.36 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor"/>
        </svg>
        <span>{loading === 'apple' ? 'Loading...' : 'Add to Apple Wallet'}</span>
      </button>

      {/* Google Wallet Button */}
      <button 
        className="wallet-btn google-wallet-btn"
        onClick={handleGoogleWallet}
        disabled={loading === 'google'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
          <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.69 5.84 14.09H2.18V16.94C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
          <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.09Z" fill="#FBBC05"/>
          <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.91C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335"/>
        </svg>
        <span>{loading === 'google' ? 'Loading...' : 'Add to Google Wallet'}</span>
      </button>

      {/* Save Contact (vCard) - Universal fallback */}
      <button 
        className="wallet-btn vcard-btn"
        onClick={handleVCard}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        <span>Save Contact</span>
      </button>

      {error && (
        <p className="wallet-error">{error}</p>
      )}

      <style jsx>{`
        .wallet-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 16px;
        }
        .wallet-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .wallet-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .wallet-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .apple-wallet-btn {
          background: #000;
          color: #fff;
        }
        .google-wallet-btn {
          background: #fff;
          color: #1f2937;
          border: 1px solid #E5E7EB;
        }
        .vcard-btn {
          background: rgba(255,255,255,0.15);
          color: ${textColor};
          border: 1px solid rgba(255,255,255,0.2);
        }
        .wallet-error {
          color: #EF4444;
          font-size: 13px;
          text-align: center;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
