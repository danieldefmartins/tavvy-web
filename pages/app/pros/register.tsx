/**
 * Pros Registration Screen
 * Register as a service professional
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiCheck, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const SERVICE_CATEGORIES = [
  { id: 'home-services', name: 'Home Services', icon: '🏠' },
  { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'landscaping', name: 'Landscaping', icon: '🌳' },
  { id: 'moving', name: 'Moving', icon: '📦' },
  { id: 'painting', name: 'Painting', icon: '🎨' },
  { id: 'hvac', name: 'HVAC', icon: '❄️' },
  { id: 'roofing', name: 'Roofing', icon: '🏗️' },
  { id: 'flooring', name: 'Flooring', icon: '🪵' },
  { id: 'pest-control', name: 'Pest Control', icon: '🐜' },
  { id: 'appliance-repair', name: 'Appliance Repair', icon: '🔌' },
];

export default function ProsRegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    phone: '',
    email: user?.email || '',
    location: '',
    description: '',
    yearsInBusiness: '',
    licenseNumber: '',
    hasInsurance: false,
    agreeToTerms: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pros_providers')
        .insert({
          user_id: user?.id,
          business_name: formData.businessName,
          category_slug: formData.category,
          phone: formData.phone,
          email: formData.email,
          location: formData.location,
          description: formData.description,
          years_in_business: parseInt(formData.yearsInBusiness) || null,
          license_number: formData.licenseNumber || null,
          insurance_verified: formData.hasInsurance,
          status: 'pending',
        });

      if (error) throw error;

      // Success - redirect to success page or dashboard
      router.push('/app/pros/register-success');
    } catch (error) {
      console.error('Error registering:', error);
      alert('There was an error submitting your registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.businessName && formData.category;
    if (step === 2) return formData.phone && formData.email && formData.location;
    if (step === 3) return formData.agreeToTerms;
    return false;
  };

  return (
    <>
      <Head>
        <title>Join TavvY Pros | TavvY</title>
        <meta name="description" content="Register as a service professional on TavvY" />
      </Head>

      <AppLayout hideTabBar>
        <div className="register-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="register-header">
            <button className="back-button" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Join TavvY Pros</h1>
            <div className="step-indicator">
              <span style={{ color: theme.textSecondary }}>Step {step} of 3</span>
            </div>
          </header>

          {/* Progress Bar */}
          <div className="progress-bar" style={{ backgroundColor: theme.surface }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(step / 3) * 100}%`,
                backgroundColor: theme.primary 
              }} 
            />
          </div>

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="step-content">
              <h2 style={{ color: theme.text }}>Tell us about your business</h2>
              <p style={{ color: theme.textSecondary }}>
                This information helps customers find and trust your services
              </p>

              <div className="form-group">
                <label style={{ color: theme.text }}>Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: theme.text }}>Service Category *</label>
                <div className="category-grid">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`category-option ${formData.category === cat.id ? 'selected' : ''}`}
                      onClick={() => handleInputChange('category', cat.id)}
                      style={{
                        backgroundColor: formData.category === cat.id ? theme.primary : theme.surface,
                        color: formData.category === cat.id ? 'white' : theme.text,
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="step-content">
              <h2 style={{ color: theme.text }}>Contact Information</h2>
              <p style={{ color: theme.textSecondary }}>
                How can customers reach you?
              </p>

              <div className="form-group">
                <label style={{ color: theme.text }}>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: theme.text }}>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: theme.text }}>Service Area *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: theme.text }}>About Your Business</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell customers about your services, experience, and what makes you stand out..."
                  rows={4}
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <div className="step-content">
              <h2 style={{ color: theme.text }}>Verification & Terms</h2>
              <p style={{ color: theme.textSecondary }}>
                Optional information to help build trust with customers
              </p>

              <div className="form-group">
                <label style={{ color: theme.text }}>Years in Business</label>
                <input
                  type="number"
                  value={formData.yearsInBusiness}
                  onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                  placeholder="e.g., 5"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: theme.text }}>License Number (if applicable)</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="Enter license number"
                  style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                />
              </div>

              <div className="checkbox-group">
                <button
                  className={`checkbox ${formData.hasInsurance ? 'checked' : ''}`}
                  onClick={() => handleInputChange('hasInsurance', !formData.hasInsurance)}
                  style={{ borderColor: formData.hasInsurance ? theme.primary : theme.border }}
                >
                  {formData.hasInsurance && <FiCheck size={16} color={theme.primary} />}
                </button>
                <span style={{ color: theme.text }}>I have liability insurance</span>
              </div>

              <div className="checkbox-group">
                <button
                  className={`checkbox ${formData.agreeToTerms ? 'checked' : ''}`}
                  onClick={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
                  style={{ borderColor: formData.agreeToTerms ? theme.primary : theme.border }}
                >
                  {formData.agreeToTerms && <FiCheck size={16} color={theme.primary} />}
                </button>
                <span style={{ color: theme.text }}>
                  I agree to the <Link href="/terms" locale={locale} style={{ color: theme.primary }}>Terms of Service</Link> and <Link href="/privacy" locale={locale} style={{ color: theme.primary }}>Privacy Policy</Link> *
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="register-footer">
            <button
              className="continue-button"
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              disabled={!canProceed() || loading}
              style={{
                backgroundColor: canProceed() ? theme.primary : theme.surface,
                color: canProceed() ? 'white' : theme.textTertiary,
              }}
            >
              {loading ? 'Submitting...' : step < 3 ? 'Continue' : 'Submit Application'}
              {!loading && step < 3 && <FiChevronRight size={20} />}
            </button>
          </div>
        </div>

        <style jsx>{`
          .register-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .register-header {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .register-header h1 {
            flex: 1;
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .step-indicator {
            font-size: 14px;
          }
          
          .progress-bar {
            height: 4px;
            margin: 0 ${spacing.lg}px;
            border-radius: 2px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
          }
          
          .step-content {
            flex: 1;
            padding: ${spacing.xl}px ${spacing.lg}px;
          }
          
          .step-content h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .step-content > p {
            font-size: 14px;
            margin: 0 0 ${spacing.xl}px;
          }
          
          .form-group {
            margin-bottom: ${spacing.lg}px;
          }
          
          .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: ${spacing.sm}px;
          }
          
          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 14px 16px;
            border-radius: ${borderRadius.md}px;
            border: 1px solid;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }
          
          .form-group input:focus,
          .form-group textarea:focus {
            border-color: ${theme.primary};
          }
          
          .form-group textarea {
            resize: vertical;
            min-height: 100px;
          }
          
          .category-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.sm}px;
          }
          
          .category-option {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.md}px;
          }
          
          .checkbox {
            width: 24px;
            height: 24px;
            min-width: 24px;
            border-radius: 6px;
            border: 2px solid;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .checkbox-group span {
            font-size: 14px;
            line-height: 1.5;
          }
          
          .register-footer {
            padding: ${spacing.lg}px;
            padding-bottom: max(${spacing.lg}px, env(safe-area-inset-bottom));
          }
          
          .continue-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            padding: 16px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .continue-button:disabled {
            cursor: not-allowed;
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
