/**
 * eCard Create Screen
 * Step-by-step onboarding flow for creating a new eCard
 * Ported from tavvy-mobile eCard onboarding flow
 */

import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { createCard, generateSlug, PLATFORM_ICONS, CardData } from '../../../lib/ecard';
import { TEMPLATES, ColorScheme, Template } from '../../../config/eCardTemplates';
import { 
  IoArrowBack, 
  IoArrowForward,
  IoCamera,
  IoClose,
  IoCheckmark,
  IoAdd,
  IoTrash,
} from 'react-icons/io5';

// Brand colors
const ACCENT_GREEN = '#00C853';
const BG_LIGHT = '#FAFAFA';
const BG_DARK = '#0F172A';

type Step = 'profile' | 'links' | 'template' | 'review';

interface LinkItem {
  id: string;
  platform: string;
  value: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', placeholder: '@username' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'Profile URL' },
  { id: 'facebook', name: 'Facebook', placeholder: 'Profile URL' },
  { id: 'website', name: 'Website', placeholder: 'https://...' },
  { id: 'email', name: 'Email', placeholder: 'email@example.com' },
  { id: 'phone', name: 'Phone', placeholder: '+1 (555) 123-4567' },
  { id: 'whatsapp', name: 'WhatsApp', placeholder: 'Phone number' },
];

export default function ECardCreateScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [isCreating, setIsCreating] = useState(false);

  // Profile state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Links state
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic-blue');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('blue');

  const bgColor = isDark ? BG_DARK : BG_LIGHT;

  const steps: Step[] = ['profile', 'links', 'template', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      router.back();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = (platform: string) => {
    setLinks([...links, { id: Date.now().toString(), platform, value: '' }]);
    setShowAddLink(false);
  };

  const updateLink = (id: string, value: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, value } : link));
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const getTemplate = (): Template | undefined => {
    return TEMPLATES.find(t => t.id === selectedTemplate);
  };

  const getColorScheme = (): ColorScheme | undefined => {
    const template = getTemplate();
    return template?.colorSchemes.find(c => c.id === selectedColorScheme);
  };

  const handleCreate = async () => {
    if (!user) {
      router.push('/app/login');
      return;
    }

    setIsCreating(true);

    try {
      const colorScheme = getColorScheme();
      const tempSlug = `draft_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;

      const cardData: Partial<CardData> = {
        user_id: user.id,
        slug: tempSlug,
        full_name: name,
        title: title,
        bio: bio,
        profile_photo_url: profileImage || undefined,
        gradient_color_1: colorScheme?.primary || '#667eea',
        gradient_color_2: colorScheme?.secondary || '#764ba2',
        theme: selectedTemplate,
        button_style: 'fill',
        font_style: 'default',
        is_published: false,
      };

      const newCard = await createCard(cardData);

      if (newCard) {
        // Navigate to dashboard to finish editing
        router.push(`/app/ecard/dashboard?cardId=${newCard.id}&isNew=true`);
      } else {
        alert('Failed to create card. Please try again.');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'profile':
        return name.trim().length > 0;
      case 'links':
        return true; // Links are optional
      case 'template':
        return selectedTemplate && selectedColorScheme;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderProfileStep = () => (
    <div className="step-content">
      <h2 style={{ color: isDark ? '#fff' : '#333' }}>Let's create your card</h2>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
        Start with your basic information
      </p>

      {/* Profile Photo */}
      <div className="photo-upload" onClick={() => fileInputRef.current?.click()}>
        {profileImage ? (
          <img src={profileImage} alt="Profile" className="photo-preview" />
        ) : (
          <div className="photo-placeholder" style={{ backgroundColor: isDark ? '#1E293B' : '#E5E7EB' }}>
            <IoCamera size={32} color={isDark ? '#94A3B8' : '#9CA3AF'} />
            <span style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Add Photo</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Name Input */}
      <div className="input-group">
        <label style={{ color: isDark ? '#fff' : '#333' }}>Full Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          style={{ 
            backgroundColor: isDark ? '#1E293B' : '#fff',
            color: isDark ? '#fff' : '#333',
            borderColor: isDark ? '#334155' : '#E5E7EB',
          }}
        />
      </div>

      {/* Title Input */}
      <div className="input-group">
        <label style={{ color: isDark ? '#fff' : '#333' }}>Title / Role</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Software Engineer at TavvY"
          style={{ 
            backgroundColor: isDark ? '#1E293B' : '#fff',
            color: isDark ? '#fff' : '#333',
            borderColor: isDark ? '#334155' : '#E5E7EB',
          }}
        />
      </div>

      {/* Bio Input */}
      <div className="input-group">
        <label style={{ color: isDark ? '#fff' : '#333' }}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short description about yourself..."
          rows={3}
          style={{ 
            backgroundColor: isDark ? '#1E293B' : '#fff',
            color: isDark ? '#fff' : '#333',
            borderColor: isDark ? '#334155' : '#E5E7EB',
          }}
        />
      </div>
    </div>
  );

  const renderLinksStep = () => (
    <div className="step-content">
      <h2 style={{ color: isDark ? '#fff' : '#333' }}>Add your links</h2>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
        Connect your social profiles and websites
      </p>

      {/* Added Links */}
      <div className="links-list">
        {links.map((link) => {
          const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
          return (
            <div key={link.id} className="link-item" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
              <div className="link-platform">
                <span style={{ color: isDark ? '#fff' : '#333' }}>{platform?.name}</span>
              </div>
              <input
                type="text"
                value={link.value}
                onChange={(e) => updateLink(link.id, e.target.value)}
                placeholder={platform?.placeholder}
                style={{ 
                  backgroundColor: 'transparent',
                  color: isDark ? '#fff' : '#333',
                }}
              />
              <button className="remove-link" onClick={() => removeLink(link.id)}>
                <IoTrash size={18} color="#EF4444" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Link Button */}
      {!showAddLink ? (
        <button 
          className="add-link-btn"
          onClick={() => setShowAddLink(true)}
          style={{ 
            backgroundColor: isDark ? '#1E293B' : '#fff',
            borderColor: isDark ? '#334155' : '#E5E7EB',
          }}
        >
          <IoAdd size={20} color={ACCENT_GREEN} />
          <span style={{ color: isDark ? '#fff' : '#333' }}>Add Link</span>
        </button>
      ) : (
        <div className="platform-picker" style={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}>
          <div className="picker-header">
            <span style={{ color: isDark ? '#fff' : '#333' }}>Choose Platform</span>
            <button onClick={() => setShowAddLink(false)}>
              <IoClose size={20} color={isDark ? '#94A3B8' : '#6B7280'} />
            </button>
          </div>
          <div className="platform-grid">
            {SOCIAL_PLATFORMS.filter(p => !links.some(l => l.platform === p.id)).map((platform) => (
              <button
                key={platform.id}
                className="platform-option"
                onClick={() => addLink(platform.id)}
                style={{ backgroundColor: isDark ? '#0F172A' : '#F3F4F6' }}
              >
                <span style={{ color: isDark ? '#fff' : '#333' }}>{platform.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplateStep = () => {
    const freeTemplates = TEMPLATES.filter(t => !t.isPremium);
    
    return (
      <div className="step-content">
        <h2 style={{ color: isDark ? '#fff' : '#333' }}>Choose a template</h2>
        <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
          Select a style that represents you
        </p>

        <div className="templates-grid">
          {freeTemplates.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTemplate(template.id);
                setSelectedColorScheme(template.colorSchemes[0].id);
              }}
            >
              <div 
                className="template-preview"
                style={{ 
                  background: `linear-gradient(135deg, ${template.colorSchemes[0].primary}, ${template.colorSchemes[0].secondary})` 
                }}
              >
                {selectedTemplate === template.id && (
                  <div className="selected-badge">
                    <IoCheckmark size={16} color="#fff" />
                  </div>
                )}
              </div>
              <span className="template-name" style={{ color: isDark ? '#fff' : '#333' }}>
                {template.name}
              </span>
            </div>
          ))}
        </div>

        {/* Color Schemes */}
        {selectedTemplate && (
          <div className="color-schemes">
            <h3 style={{ color: isDark ? '#fff' : '#333' }}>Color Scheme</h3>
            <div className="schemes-row">
              {getTemplate()?.colorSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  className={`scheme-btn ${selectedColorScheme === scheme.id ? 'selected' : ''}`}
                  onClick={() => setSelectedColorScheme(scheme.id)}
                  style={{ 
                    background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})` 
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReviewStep = () => {
    const colorScheme = getColorScheme();
    
    return (
      <div className="step-content">
        <h2 style={{ color: isDark ? '#fff' : '#333' }}>Review your card</h2>
        <p style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }}>
          Here's a preview of your new eCard
        </p>

        {/* Card Preview */}
        <div 
          className="card-preview"
          style={{ 
            background: `linear-gradient(135deg, ${colorScheme?.primary || '#667eea'}, ${colorScheme?.secondary || '#764ba2'})` 
          }}
        >
          {profileImage && (
            <img src={profileImage} alt={name} className="preview-photo" />
          )}
          <h3 className="preview-name">{name || 'Your Name'}</h3>
          {title && <p className="preview-title">{title}</p>}
          {bio && <p className="preview-bio">{bio}</p>}
          
          {links.length > 0 && (
            <div className="preview-links">
              {links.slice(0, 3).map((link) => (
                <div key={link.id} className="preview-link">
                  {SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.name}
                </div>
              ))}
              {links.length > 3 && (
                <div className="preview-link">+{links.length - 3} more</div>
              )}
            </div>
          )}
        </div>

        <p className="review-note" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }}>
          You can customize everything after creating your card
        </p>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Create eCard | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div className="create-screen" style={{ backgroundColor: bgColor }}>
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={handleBack}>
              <IoArrowBack size={24} color={isDark ? '#fff' : '#333'} />
            </button>
            <div className="progress-bar">
              {steps.map((step, index) => (
                <div 
                  key={step}
                  className={`progress-dot ${index <= currentStepIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            <div style={{ width: 40 }} />
          </header>

          {/* Step Content */}
          <div className="content">
            {currentStep === 'profile' && renderProfileStep()}
            {currentStep === 'links' && renderLinksStep()}
            {currentStep === 'template' && renderTemplateStep()}
            {currentStep === 'review' && renderReviewStep()}
          </div>

          {/* Footer */}
          <footer className="footer">
            {currentStep === 'review' ? (
              <button 
                className="create-btn"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Card'}
              </button>
            ) : (
              <button 
                className="next-btn"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                <span>Continue</span>
                <IoArrowForward size={20} color="#fff" />
              </button>
            )}
          </footer>
        </div>

        <style jsx>{`
          .create-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .back-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
          }

          .progress-bar {
            display: flex;
            gap: 8px;
          }

          .progress-dot {
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: ${isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB'};
            transition: background 0.3s;
          }

          .progress-dot.active {
            background: ${ACCENT_GREEN};
            width: 24px;
          }

          .content {
            flex: 1;
            padding: 0 20px;
            overflow-y: auto;
          }

          .step-content h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .step-content > p {
            font-size: 14px;
            margin: 0 0 24px;
          }

          /* Photo Upload */
          .photo-upload {
            width: 120px;
            height: 120px;
            margin: 0 auto 24px;
            cursor: pointer;
          }

          .photo-preview {
            width: 100%;
            height: 100%;
            border-radius: 60px;
            object-fit: cover;
          }

          .photo-placeholder {
            width: 100%;
            height: 100%;
            border-radius: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .photo-placeholder span {
            font-size: 12px;
          }

          /* Input Groups */
          .input-group {
            margin-bottom: 16px;
          }

          .input-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
          }

          .input-group input,
          .input-group textarea {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid;
            border-radius: 12px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }

          .input-group input:focus,
          .input-group textarea:focus {
            border-color: ${ACCENT_GREEN};
          }

          .input-group textarea {
            resize: none;
          }

          /* Links */
          .links-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
          }

          .link-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 12px;
            gap: 12px;
          }

          .link-platform {
            width: 100px;
            flex-shrink: 0;
          }

          .link-item input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
          }

          .remove-link {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
          }

          .add-link-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px;
            border: 1px dashed;
            border-radius: 12px;
            background: transparent;
            cursor: pointer;
          }

          .platform-picker {
            border-radius: 12px;
            padding: 16px;
          }

          .picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .picker-header button {
            background: none;
            border: none;
            cursor: pointer;
          }

          .platform-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .platform-option {
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
          }

          /* Templates */
          .templates-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          .template-card {
            cursor: pointer;
            transition: transform 0.2s;
          }

          .template-card:hover {
            transform: scale(1.02);
          }

          .template-card.selected .template-preview {
            box-shadow: 0 0 0 3px ${ACCENT_GREEN};
          }

          .template-preview {
            height: 140px;
            border-radius: 12px;
            position: relative;
            margin-bottom: 8px;
          }

          .selected-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border-radius: 12px;
            background: ${ACCENT_GREEN};
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .template-name {
            font-size: 14px;
            font-weight: 500;
          }

          .color-schemes h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px;
          }

          .schemes-row {
            display: flex;
            gap: 12px;
          }

          .scheme-btn {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .scheme-btn.selected {
            border-color: ${isDark ? '#fff' : '#333'};
            transform: scale(1.1);
          }

          /* Review */
          .card-preview {
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            margin-bottom: 16px;
          }

          .preview-photo {
            width: 80px;
            height: 80px;
            border-radius: 40px;
            object-fit: cover;
            margin-bottom: 16px;
            border: 3px solid rgba(255,255,255,0.3);
          }

          .preview-name {
            color: #fff;
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px;
          }

          .preview-title {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin: 0 0 8px;
          }

          .preview-bio {
            color: rgba(255,255,255,0.7);
            font-size: 13px;
            margin: 0 0 16px;
          }

          .preview-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }

          .preview-link {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            color: #fff;
            font-size: 12px;
          }

          .review-note {
            text-align: center;
            font-size: 13px;
          }

          /* Footer */
          .footer {
            padding: 16px 20px;
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }

          .next-btn, .create-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            background: ${ACCENT_GREEN};
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .next-btn:disabled, .create-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
