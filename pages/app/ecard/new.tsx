/**
 * eCard Creation Wizard — /app/ecard/new
 * Single-page 3-step wizard: Type → Template → Quick Setup → Create
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import AppLayout from '../../../components/AppLayout';
import TypePicker from '../../../components/ecard/wizard/TypePicker';
import TemplateGallery from '../../../components/ecard/wizard/TemplateGallery';
import QuickSetup from '../../../components/ecard/wizard/QuickSetup';
import {
  createCard,
  generateSlug,
  uploadProfilePhoto,
  getUserCards,
} from '../../../lib/ecard';
import { IoArrowBack, IoClose } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ACCENT = '#00C853';

type WizardStep = 'type' | 'template' | 'setup';

export default function ECardNewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const { isPro, isSuperAdmin } = useRoles();

  const [step, setStep] = useState<WizardStep>('type');
  const [cardType, setCardType] = useState('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryTemplate, setCountryTemplate] = useState<string | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedColorSchemeId, setSelectedColorSchemeId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const bg = isDark ? '#000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Step indicators
  const stepIndex = step === 'type' ? 0 : step === 'template' ? 1 : 2;

  const handleTypeSelect = (type: string, country?: string, template?: string) => {
    setCardType(type);
    setCountryCode(country);
    setCountryTemplate(template);
    // Pre-select template if country specifies one
    if (template) {
      setSelectedTemplateId(template);
    }
    setStep('template');
  };

  const handleTemplateSelect = (templateId: string, colorSchemeId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedColorSchemeId(colorSchemeId);
  };

  const handleContinueToSetup = () => {
    if (selectedTemplateId) {
      setStep('setup');
    }
  };

  const handleCreate = async (data: {
    fullName: string;
    title: string;
    photoFile: File | null;
    primaryColor: string;
  }) => {
    if (!user || creating) return;
    setCreating(true);

    try {
      // Upload photo if provided
      let photoUrl: string | undefined;
      if (data.photoFile) {
        const uploaded = await uploadProfilePhoto(user.id, data.photoFile);
        if (uploaded) photoUrl = uploaded;
      }

      const slug = generateSlug(data.fullName);

      const newCard = await createCard({
        user_id: user.id,
        full_name: data.fullName.trim(),
        title: data.title.trim() || undefined,
        slug,
        template_id: selectedTemplateId || 'basic',
        color_scheme_id: selectedColorSchemeId || undefined,
        gradient_color_1: data.primaryColor,
        gradient_color_2: data.primaryColor,
        profile_photo_url: photoUrl,
        card_type: cardType || 'business',
        country_code: countryCode,
        is_published: false,
        is_active: true,
        view_count: 0,
        tap_count: 0,
      });

      if (newCard) {
        router.push(`/app/ecard/${newCard.id}/edit`, undefined, { locale });
      } else {
        alert('Failed to create card. Please try again.');
      }
    } catch (err) {
      console.error('Error creating card:', err);
      alert('Failed to create card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create eCard | TavvY</title>
      </Head>

      <AppLayout hideTabBar>
        <div style={{ minHeight: '100vh', backgroundColor: bg }}>
          {/* Header */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', paddingTop: 'max(12px, env(safe-area-inset-top))',
            backgroundColor: headerBg,
            borderBottom: `1px solid ${border}`,
          }}>
            <button
              onClick={() => {
                if (step === 'type') router.push('/app/ecard', undefined, { locale });
                else if (step === 'template') setStep('type');
                else setStep('template');
              }}
              style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex' }}
            >
              <IoArrowBack size={22} color={textPrimary} />
            </button>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: i === stepIndex ? 24 : 8, height: 8, borderRadius: 4,
                  background: i <= stepIndex ? ACCENT : (isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB'),
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            <button
              onClick={() => router.push('/app/ecard', undefined, { locale })}
              style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex' }}
            >
              <IoClose size={22} color={textPrimary} />
            </button>
          </header>

          {/* Content */}
          <div style={{ padding: '24px 20px', paddingBottom: 120, maxWidth: 480, margin: '0 auto' }}>
            {step === 'type' && (
              <TypePicker onSelect={handleTypeSelect} isDark={isDark} />
            )}

            {step === 'template' && (
              <>
                <TemplateGallery
                  cardType={cardType}
                  countryTemplate={countryTemplate}
                  selectedTemplateId={selectedTemplateId}
                  selectedColorSchemeId={selectedColorSchemeId}
                  onSelect={handleTemplateSelect}
                  onBack={() => setStep('type')}
                  isPro={isPro}
                  isDark={isDark}
                />
                {/* Continue button */}
                {selectedTemplateId && (
                  <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                    background: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderTop: `1px solid ${border}`,
                  }}>
                    <button
                      onClick={handleContinueToSetup}
                      style={{
                        width: '100%', maxWidth: 480, margin: '0 auto', display: 'block',
                        padding: '16px 24px', border: 'none', borderRadius: 14,
                        fontSize: 16, fontWeight: 700, cursor: 'pointer',
                        background: `linear-gradient(135deg, ${ACCENT}, #00A843)`,
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(0,200,83,0.35)',
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'setup' && (
              <QuickSetup
                onBack={() => setStep('template')}
                onCreate={handleCreate}
                creating={creating}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
