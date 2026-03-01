/**
 * Pro Profile Edit Screen
 * Allows Pros to manage their business details and specialties
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useProSubscription } from '../../../hooks/useProSubscription';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiCheck, FiSave, FiMinus, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ProProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const { provider, loading: subLoading } = useProSubscription();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  useEffect(() => {
    if (user && !subLoading) {
      fetchProfile();
    } else if (!subLoading && !user) {
      setLoading(false);
    }
  }, [user, subLoading]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (data) {
        setProfile({
          ...data,
          // Normalize service_radius → service_radius_miles for the UI
          service_radius_miles: data.service_radius ?? 25,
        });

        // Fetch available specialties by matching trade_category to service_categories
        if (data.trade_category) {
          const { data: cat } = await supabase
            .from('service_categories')
            .select('id, name')
            .eq('slug', data.trade_category)
            .single();

          if (cat) {
            setProfile((prev: any) => ({ ...prev, category: cat }));
            const { data: questions } = await supabase
              .from('service_category_questions')
              .select('options')
              .eq('category_id', cat.id)
              .is('parent_question_id', null)
              .single();

            if (questions?.options) {
              setAvailableSpecialties(questions.options);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    const current = profile?.specialties || [];
    const updated = current.includes(specialty)
      ? current.filter((s: string) => s !== specialty)
      : [...current, specialty];
    setProfile({ ...profile, specialties: updated });
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('pro_providers')
        .update({
          business_name: profile.business_name,
          description: profile.description,
          phone: profile.phone,
          location: profile.location,
          specialties: profile.specialties,
          service_radius: profile.service_radius_miles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || subLoading) {
    return (
      <AppLayout accessLevel="pro">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.background
        }}>
          <p style={{ color: theme.textSecondary }}>Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout accessLevel="pro">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.background,
          gap: 16,
        }}>
          <p style={{ color: theme.textSecondary, fontSize: 16 }}>No profile found.</p>
          <button
            onClick={() => router.push('/app/pros/register', undefined, { locale })}
            style={{
              backgroundColor: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Register as a Pro
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Profile | TavvY Pros</title>
        <meta name="description" content="Edit your TavvY Pro profile" />
      </Head>

      <AppLayout accessLevel="pro">
        <div className="profile-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="profile-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Edit Profile</h1>
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: saved ? '#10B981' : theme.primary }}
            >
              {saving ? 'Saving...' : saved ? (
                <><FiCheck size={16} /> Saved</>
              ) : (
                <><FiSave size={16} /> Save</>
              )}
            </button>
          </header>

          <div className="profile-content">
            {/* Business Info Section */}
            <div className="section">
              <h3 className="section-label" style={{ color: theme.textSecondary }}>BUSINESS INFO</h3>

              <div className="field">
                <label style={{ color: theme.textSecondary }}>Business Name</label>
                <input
                  type="text"
                  value={profile.business_name || ''}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  placeholder="Your business name"
                  className="input"
                  style={{
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border || '#E5E7EB',
                  }}
                />
              </div>

              {profile.category?.name && (
                <div className="category-badge" style={{ backgroundColor: `${theme.primary}15` }}>
                  <span style={{ color: theme.primary }}>{profile.category.name}</span>
                </div>
              )}

              <div className="field">
                <label style={{ color: theme.textSecondary }}>Description</label>
                <textarea
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe your business and services..."
                  className="textarea"
                  rows={4}
                  style={{
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border || '#E5E7EB',
                  }}
                />
              </div>

              <div className="field">
                <label style={{ color: theme.textSecondary }}>Phone</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Your business phone"
                  className="input"
                  style={{
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border || '#E5E7EB',
                  }}
                />
              </div>

              <div className="field">
                <label style={{ color: theme.textSecondary }}>Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, State"
                  className="input"
                  style={{
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border || '#E5E7EB',
                  }}
                />
              </div>
            </div>

            {/* Specialties Section */}
            {availableSpecialties.length > 0 && (
              <div className="section">
                <h3 className="section-label" style={{ color: theme.textSecondary }}>YOUR SPECIALTIES</h3>
                <p className="section-subtext" style={{ color: theme.textSecondary }}>
                  Select the specific services you offer. We'll use these to match you with high-quality leads.
                </p>
                <div className="specialty-grid">
                  {availableSpecialties.map((specialty, i) => {
                    const isSelected = profile.specialties?.includes(specialty);
                    return (
                      <button
                        key={i}
                        className={`specialty-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSpecialty(specialty)}
                        style={{
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : (theme.border || '#E5E7EB'),
                          color: isSelected ? '#FFFFFF' : theme.text,
                        }}
                      >
                        {specialty}
                        {isSelected && <FiCheck size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Service Radius Section */}
            {profile.service_radius_miles !== undefined && (
              <div className="section">
                <h3 className="section-label" style={{ color: theme.textSecondary }}>SERVICE RADIUS</h3>
                <div className="radius-row" style={{ backgroundColor: theme.surface, borderColor: theme.border || '#E5E7EB' }}>
                  <span className="radius-value" style={{ color: theme.text }}>
                    {profile.service_radius_miles} miles
                  </span>
                  <div className="radius-buttons">
                    <button
                      className="radius-btn"
                      onClick={() => setProfile({
                        ...profile,
                        service_radius_miles: Math.max(5, profile.service_radius_miles - 5)
                      })}
                      style={{ backgroundColor: theme.background, borderColor: theme.border || '#E5E7EB' }}
                    >
                      <FiMinus size={18} color={theme.text} />
                    </button>
                    <button
                      className="radius-btn"
                      onClick={() => setProfile({
                        ...profile,
                        service_radius_miles: Math.min(100, profile.service_radius_miles + 5)
                      })}
                      style={{ backgroundColor: theme.background, borderColor: theme.border || '#E5E7EB' }}
                    >
                      <FiPlus size={18} color={theme.text} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .profile-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }

          .profile-header {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            position: sticky;
            top: 0;
            z-index: 10;
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

          .profile-header h1 {
            flex: 1;
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }

          .save-button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 20px;
            border-radius: ${borderRadius.md}px;
            border: none;
            font-size: 14px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: opacity 0.2s, background-color 0.3s;
          }

          .save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .profile-content {
            padding: 0 ${spacing.lg}px;
          }

          .section {
            margin-bottom: 32px;
          }

          .section-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0 0 16px;
          }

          .section-subtext {
            font-size: 13px;
            margin: 0 0 16px;
            line-height: 1.5;
          }

          .field {
            margin-bottom: 16px;
          }

          .field label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 6px;
          }

          .input {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid;
            border-radius: ${borderRadius.md}px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }

          .input:focus {
            border-color: ${theme.primary};
          }

          .textarea {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid;
            border-radius: ${borderRadius.md}px;
            font-size: 16px;
            outline: none;
            resize: vertical;
            font-family: inherit;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }

          .textarea:focus {
            border-color: ${theme.primary};
          }

          .category-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            font-weight: 600;
          }

          .specialty-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .specialty-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 25px;
            border: 1px solid;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .specialty-chip:hover {
            opacity: 0.85;
          }

          .radius-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-radius: ${borderRadius.md}px;
            border: 1px solid;
          }

          .radius-value {
            font-size: 20px;
            font-weight: 700;
          }

          .radius-buttons {
            display: flex;
            gap: 12px;
          }

          .radius-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .radius-btn:hover {
            opacity: 0.7;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getServerSideProps({ locale, res }: { locale: string; res: any }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
