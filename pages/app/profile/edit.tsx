/**
 * Edit Profile Page
 * Allows users to edit their profile information
 */
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { FiArrowLeft, FiCamera, FiCheck, FiUser, FiMapPin, FiFileText, FiLink } from 'react-icons/fi';
import { FaInstagram, FaTiktok, FaYoutube, FaXTwitter } from 'react-icons/fa6';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function EditProfileScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/app/login', undefined, { locale });
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setCity(data.city || '');
        setState(data.state || '');
        setCountry(data.country || '');
        setZipCode(data.zip_code || '');
        setInstagramUrl(data.instagram_url || '');
        setTiktokUrl(data.tiktok_url || '');
        setYoutubeUrl(data.youtube_url || '');
        setTwitterUrl(data.twitter_url || '');
      } else {
        // Use auth metadata as fallback
        setDisplayName(user?.user_metadata?.full_name || '');
        setAvatarUrl(user?.user_metadata?.avatar_url || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      // RLS policy requires: storage.foldername(name)[1] = auth.uid()
      // So path must be: {user_id}/{filename}
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          zip_code: zipCode.trim(),
          instagram_url: instagramUrl.trim() || null,
          tiktok_url: tiktokUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          twitter_url: twitterUrl.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Edit Profile | TavvY</title>
      </Head>

      <style jsx>{`
        .edit-profile-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 16px 40px;
          min-height: 100vh;
          background: ${theme.background};
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid ${theme.border};
          margin-bottom: 24px;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: ${theme.text};
          font-size: 16px;
          cursor: pointer;
          padding: 8px 0;
        }
        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: ${theme.text};
        }
        .save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0D9488;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .save-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }
        .avatar-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          border: 3px solid ${theme.border};
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${theme.surface};
          color: ${theme.textSecondary};
        }
        .avatar-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .change-photo-text {
          font-size: 13px;
          color: #0D9488;
          margin-top: 12px;
          cursor: pointer;
          font-weight: 500;
        }

        .form-section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: ${theme.textSecondary};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .field-group {
          margin-bottom: 16px;
        }
        .field-label {
          font-size: 14px;
          font-weight: 500;
          color: ${theme.textSecondary};
          margin-bottom: 6px;
        }
        .field-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          font-size: 16px;
          color: ${theme.text};
          background: ${theme.surface};
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .field-input:focus {
          border-color: #0D9488;
        }
        .field-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          font-size: 16px;
          color: ${theme.text};
          background: ${theme.surface};
          outline: none;
          transition: border-color 0.2s;
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
        }
        .field-textarea:focus {
          border-color: #0D9488;
        }
        .field-hint {
          font-size: 12px;
          color: ${theme.textSecondary};
          margin-top: 4px;
        }
        .row {
          display: flex;
          gap: 12px;
        }
        .row .field-group {
          flex: 1;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .alert-success {
          background: #D1FAE5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }
        .alert-error {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid ${theme.border};
          border-top-color: #0D9488;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="edit-profile-container">
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={20} />
            Back
          </button>
          <span className="header-title">Edit Profile</span>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : <><FiCheck size={16} /> Save</>}
          </button>
        </div>

        {success && (
          <div className="alert alert-success">
            Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <FiUser size={40} />
              </div>
            )}
            <div className="avatar-overlay">
              <FiCamera size={18} color="white" />
            </div>
          </div>
          <span className="change-photo-text" onClick={() => fileInputRef.current?.click()}>
            Change Photo
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Personal Info */}
        <div className="form-section">
          <div className="section-title">
            <FiUser size={14} /> Personal Information
          </div>

          <div className="field-group">
            <div className="field-label">Display Name</div>
            <input
              className="field-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="field-group">
            <div className="field-label">Username</div>
            <input
              className="field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
            />
            <div className="field-hint">Letters, numbers, and underscores only</div>
          </div>

          <div className="field-group">
            <div className="field-label">Bio</div>
            <textarea
              className="field-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={300}
            />
            <div className="field-hint">{bio.length}/300 characters</div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <div className="section-title">
            <FiMapPin size={14} /> Location
          </div>

          <div className="row">
            <div className="field-group">
              <div className="field-label">City</div>
              <input
                className="field-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="field-group">
              <div className="field-label">State</div>
              <input
                className="field-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

          <div className="row">
            <div className="field-group">
              <div className="field-label">Country</div>
              <input
                className="field-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
            </div>
            <div className="field-group">
              <div className="field-label">Zip Code</div>
              <input
                className="field-input"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Zip code"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="form-section">
          <div className="section-title">
            <FiLink size={14} /> Social Media
          </div>
          <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '0 0 16px' }}>
            Add your social media so other users can follow you
          </p>

          <div className="field-group">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaInstagram size={16} color="#E4405F" /> Instagram
            </div>
            <input
              className="field-input"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourusername"
            />
          </div>

          <div className="field-group">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTiktok size={16} /> TikTok
            </div>
            <input
              className="field-input"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@yourusername"
            />
          </div>

          <div className="field-group">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaYoutube size={16} color="#FF0000" /> YouTube
            </div>
            <input
              className="field-input"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>

          <div className="field-group">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaXTwitter size={16} /> X (Twitter)
            </div>
            <input
              className="field-input"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/yourusername"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
