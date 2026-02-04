/**
 * eCard Preview Screen
 * Full preview of the card as it appears to viewers
 * Ported from tavvy-mobile/screens/ecard/ECardPreviewScreen.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { 
  getCardById, 
  getCardLinks, 
  CardData, 
  LinkItem,
  PLATFORM_ICONS,
  PHOTO_SIZES,
  getCardUrl,
  getQRCodeUrl,
} from '../../../lib/ecard';
import { 
  IoArrowBack, 
  IoShare,
  IoQrCode,
  IoCopy,
  IoCheckmark,
  IoClose,
  IoCall,
  IoMail,
  IoGlobe,
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoYoutube,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoFacebook,
  IoLogoWhatsapp,
  IoLink,
  IoStar,
  IoShieldCheckmark,
  IoRibbon,
  IoDocument,
} from 'react-icons/io5';

const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#0F172A';

// Light background themes that need dark text
const LIGHT_THEMES = ['minimal'];

// Platform icon components mapping
const PlatformIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  instagram: IoLogoInstagram,
  tiktok: IoLogoTiktok,
  youtube: IoLogoYoutube,
  twitter: IoLogoTwitter,
  linkedin: IoLogoLinkedin,
  facebook: IoLogoFacebook,
  whatsapp: IoLogoWhatsapp,
  phone: IoCall,
  email: IoMail,
  website: IoGlobe,
};

export default function ECardPreviewScreen() {
  const router = useRouter();
  const { cardId } = router.query;
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  // Load card data
  useEffect(() => {
    const loadCard = async () => {
      if (!cardId || typeof cardId !== 'string') {
        setLoading(false);
        return;
      }

      try {
        const card = await getCardById(cardId);
        if (card) {
          setCardData(card);
          const cardLinks = await getCardLinks(cardId);
          setLinks(cardLinks.map(l => ({
            id: l.id,
            platform: l.icon || l.platform || 'other',
            value: l.url,
            title: l.title,
          })));
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [cardId]);

  // Determine text color based on theme
  const isLightTheme = cardData?.theme && LIGHT_THEMES.includes(cardData.theme);
  const textColor = isLightTheme ? '#1A1A1A' : '#FFFFFF';
  const secondaryTextColor = isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';

  // Get photo size
  const getPhotoSize = () => {
    const sizeConfig = PHOTO_SIZES.find(s => s.id === cardData?.profile_photo_size);
    return sizeConfig?.size || 110;
  };

  const isCoverPhoto = cardData?.profile_photo_size === 'cover';
  const photoSize = getPhotoSize();

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

  // Open link
  const openLink = (link: LinkItem) => {
    let url = link.value;
    
    // Format URL based on platform
    if (link.platform === 'email' && !url.startsWith('mailto:')) {
      url = `mailto:${url}`;
    } else if (link.platform === 'phone' && !url.startsWith('tel:')) {
      url = `tel:${url}`;
    } else if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = `https://${url}`;
    }

    window.open(url, '_blank');
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const IconComponent = PlatformIcons[platform] || IoLink;
    return IconComponent;
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

          {/* Card Container */}
          <div className="card-container">
            <div 
              className={`card ${isCoverPhoto ? 'cover-layout' : ''}`}
              style={{ 
                background: `linear-gradient(135deg, ${cardData.gradient_color_1 || '#667eea'}, ${cardData.gradient_color_2 || '#764ba2'})`,
                border: isLightTheme ? '1px solid #E5E7EB' : 'none',
              }}
            >
              {/* Cover Photo Layout */}
              {isCoverPhoto && cardData.profile_photo_url && (
                <div className="cover-photo-container">
                  <img src={cardData.profile_photo_url} alt={cardData.full_name} className="cover-photo" />
                  <div className="cover-gradient" />
                </div>
              )}

              {/* Standard Photo Layout */}
              {!isCoverPhoto && cardData.profile_photo_url && (
                <div className="photo-container" style={{ width: photoSize, height: photoSize }}>
                  <img src={cardData.profile_photo_url} alt={cardData.full_name} className="profile-photo" />
                </div>
              )}

              {/* Card Content */}
              <div className={`card-content ${isCoverPhoto ? 'cover-content' : ''}`}>
                <h2 className="name" style={{ color: textColor }}>{cardData.full_name}</h2>
                {cardData.title && (
                  <p className="title" style={{ color: secondaryTextColor }}>{cardData.title}</p>
                )}
                {cardData.company && (
                  <p className="company" style={{ color: secondaryTextColor }}>{cardData.company}</p>
                )}
                {(cardData.city || cardData.state) && (
                  <p className="location" style={{ color: secondaryTextColor }}>
                    {[cardData.city, cardData.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {cardData.bio && (
                  <p className="bio" style={{ color: secondaryTextColor }}>{cardData.bio}</p>
                )}

                {/* Pro Credentials */}
                {cardData.pro_credentials && (
                  <div className="credentials">
                    {cardData.pro_credentials.isTavvyVerified && (
                      <div className="credential-badge verified">
                        <IoShieldCheckmark size={14} />
                        <span>Tavvy Verified</span>
                      </div>
                    )}
                    {cardData.pro_credentials.isLicensed && (
                      <div className="credential-badge">
                        <IoDocument size={14} />
                        <span>Licensed</span>
                      </div>
                    )}
                    {cardData.pro_credentials.isInsured && (
                      <div className="credential-badge">
                        <IoRibbon size={14} />
                        <span>Insured</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {cardData.review_count && cardData.review_count > 0 && (
                  <div className="reviews" style={{ color: secondaryTextColor }}>
                    <IoStar size={16} color="#FFD700" />
                    <span>{cardData.review_rating?.toFixed(1)} ({cardData.review_count} reviews)</span>
                  </div>
                )}

                {/* Links */}
                <div className="links-container">
                  {links.map((link) => {
                    const IconComponent = getPlatformIcon(link.platform);
                    const platformInfo = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
                    
                    return (
                      <button
                        key={link.id}
                        className="link-button"
                        onClick={() => openLink(link)}
                        style={{
                          backgroundColor: isLightTheme ? '#F3F4F6' : 'rgba(255,255,255,0.15)',
                          color: textColor,
                        }}
                      >
                        <div 
                          className="link-icon"
                          style={{ backgroundColor: platformInfo.bgColor }}
                        >
                          <IconComponent size={18} color={platformInfo.color} />
                        </div>
                        <span>{link.title || link.platform}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

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
              Edit Card
            </button>
          )}

          {/* QR Code Modal */}
          {showQRModal && cardData.slug && (
            <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
                <button className="modal-close" onClick={() => setShowQRModal(false)}>
                  <IoClose size={24} color={isDark ? '#fff' : '#333'} />
                </button>
                <h2 style={{ color: isDark ? '#fff' : '#333' }}>Scan to View</h2>
                <div className="qr-container">
                  <img src={getQRCodeUrl(cardData.slug)} alt="QR Code" className="qr-code" />
                </div>
                <p style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                  {getCardUrl(cardData.slug)}
                </p>
                <button className="download-btn" onClick={copyCardUrl}>
                  <IoCopy size={18} />
                  <span>Copy Link</span>
                </button>
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

          /* Card Container */
          .card-container {
            padding: 0 20px;
            margin-bottom: 20px;
          }

          .card {
            border-radius: 20px;
            padding: 32px 24px;
            text-align: center;
            overflow: hidden;
            position: relative;
          }

          .card.cover-layout {
            padding: 0;
          }

          /* Cover Photo */
          .cover-photo-container {
            position: relative;
            height: 200px;
            overflow: hidden;
          }

          .cover-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .cover-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(transparent, rgba(0,0,0,0.5));
          }

          .cover-content {
            padding: 24px;
          }

          /* Standard Photo */
          .photo-container {
            margin: 0 auto 16px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid rgba(255,255,255,0.3);
          }

          .profile-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Card Content */
          .card-content {
            position: relative;
            z-index: 1;
          }

          .name {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 4px;
          }

          .title {
            font-size: 16px;
            margin: 0 0 4px;
          }

          .company {
            font-size: 14px;
            margin: 0 0 4px;
          }

          .location {
            font-size: 13px;
            margin: 0 0 12px;
          }

          .bio {
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 16px;
          }

          /* Credentials */
          .credentials {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
            margin-bottom: 16px;
          }

          .credential-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: rgba(255,255,255,0.2);
            border-radius: 16px;
            font-size: 12px;
            color: #fff;
          }

          .credential-badge.verified {
            background: rgba(0, 200, 83, 0.3);
          }

          /* Reviews */
          .reviews {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-bottom: 16px;
            font-size: 14px;
          }

          /* Links */
          .links-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
          }

          .link-button {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
            font-size: 15px;
            font-weight: 500;
          }

          .link-button:hover {
            transform: scale(1.02);
            opacity: 0.9;
          }

          .link-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Actions */
          .actions {
            display: flex;
            gap: 12px;
            padding: 0 20px;
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
            display: block;
            width: calc(100% - 40px);
            margin: 0 20px;
            padding: 14px;
            background: transparent;
            border: 1px solid ${isDark ? '#334155' : '#E5E7EB'};
            border-radius: 12px;
            color: ${isDark ? '#fff' : '#333'};
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
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

          .qr-code {
            width: 200px;
            height: 200px;
          }

          .modal p {
            font-size: 13px;
            margin: 0 0 16px;
            word-break: break-all;
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
