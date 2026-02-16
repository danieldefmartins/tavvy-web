/**
 * Account Screen
 * User account management
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { spacing, borderRadius } from '../../../constants/Colors';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { 
  FiUser, FiMail, FiLock, FiBell, FiCreditCard, FiShield, 
  FiHelpCircle, FiLogOut, FiChevronRight, FiEdit2 
} from 'react-icons/fi';

export default function AccountScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();
  const { user, signOut } = useAuth();
  const { t } = useTranslation('common');

  const handleSignOut = async () => {
    await signOut();
    router.push('/app', undefined, { locale });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="auth-prompt" style={{ backgroundColor: theme.background }}>
          <FiUser size={64} color={theme.textTertiary} />
          <h1 style={{ color: theme.text }}>Sign in to manage your account</h1>
          <p style={{ color: theme.textSecondary }}>
            Access your profile, settings, and preferences
          </p>
          <Link href="/app/login" locale={locale} className="sign-in-button" style={{ backgroundColor: theme.primary }}>
            Sign In
          </Link>
          <Link href="/app/signup" locale={locale} className="sign-up-link" style={{ color: theme.primary }}>
            Create an Account
          </Link>
          <style jsx>{`
            .auth-prompt {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
              text-align: center;
            }
            h1 { font-size: 24px; font-weight: 700; margin: 24px 0 12px; }
            p { font-size: 16px; margin: 0 0 32px; max-width: 300px; }
            .sign-in-button {
              display: block;
              padding: 16px 48px;
              border-radius: ${borderRadius.lg}px;
              color: white;
              font-size: 16px;
              font-weight: 600;
              text-decoration: none;
              margin-bottom: 16px;
            }
            .sign-up-link {
              font-size: 14px;
              text-decoration: none;
            }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  const accountSections = [
    {
      title: 'Profile',
      items: [
        { icon: FiUser, label: 'Personal Information', href: '/app/profile/edit' },
        { icon: FiMail, label: 'Email Address', href: '/app/account/email', value: user.email },
        { icon: FiLock, label: 'Password', href: '/app/settings/password' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: FiBell, label: 'Notifications', href: '/app/settings/notifications' },
        { icon: FiCreditCard, label: 'Payment Methods', href: '/app/account/payments' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: FiHelpCircle, label: 'Help Center', href: '/app/help' },
        { icon: FiShield, label: 'Privacy & Security', href: '/app/settings' },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Account | TavvY</title>
        <meta name="description" content="Manage your TavvY account" />
      </Head>

      <AppLayout requiredAccess="authenticated">
        <div className="account-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="account-header">
            <h1 style={{ color: theme.text }}>Account</h1>
          </header>

          {/* User Card */}
          <div className="user-card" style={{ backgroundColor: theme.cardBackground }}>
            <div className="user-avatar">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder" style={{ backgroundColor: theme.primary }}>
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 style={{ color: theme.text }}>
                {user.user_metadata?.full_name || 'TavvY User'}
              </h2>
              <p style={{ color: theme.textSecondary }}>{user.email}</p>
            </div>
            <Link href="/app/profile" locale={locale} className="edit-button">
              <FiEdit2 size={18} color={theme.primary} />
            </Link>
          </div>

          {/* Account Sections */}
          {accountSections.map((section) => (
            <section key={section.title} className="account-section">
              <h3 style={{ color: theme.textSecondary }}>{section.title}</h3>
              <div className="section-items" style={{ backgroundColor: theme.cardBackground }}>
                {section.items.map((item, index) => (
                  <Link 
                    key={index}
                    href={item.href}
                    locale={locale}
                    className="section-item"
                  >
                    <div className="item-left">
                      <item.icon size={20} color={theme.primary} />
                      <span style={{ color: theme.text }}>{item.label}</span>
                    </div>
                    <div className="item-right">
                      {item.value && (
                        <span className="item-value" style={{ color: theme.textTertiary }}>
                          {item.value.length > 20 ? item.value.substring(0, 20) + '...' : item.value}
                        </span>
                      )}
                      <FiChevronRight size={18} color={theme.textTertiary} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Sign Out */}
          <section className="account-section">
            <div className="section-items" style={{ backgroundColor: theme.cardBackground }}>
              <button className="section-item sign-out" onClick={handleSignOut}>
                <div className="item-left">
                  <FiLogOut size={20} color="#EF4444" />
                  <span style={{ color: '#EF4444' }}>Sign Out</span>
                </div>
              </button>
            </div>
          </section>

          {/* App Version */}
          <div className="version-info">
            <p style={{ color: theme.textTertiary }}>TavvY Web v1.0.0</p>
          </div>
        </div>

        <style jsx>{`
          .account-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .account-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .account-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          
          .user-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            margin: 0 ${spacing.lg}px ${spacing.xl}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.xl}px;
          }
          
          .user-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            overflow: hidden;
          }
          
          .user-avatar img {
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
            color: white;
            font-size: 24px;
            font-weight: 600;
          }
          
          .user-info {
            flex: 1;
          }
          
          .user-info h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .user-info p {
            font-size: 14px;
            margin: 0;
          }
          
          .edit-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .account-section {
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .account-section h3 {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 ${spacing.sm}px ${spacing.sm}px;
          }
          
          .section-items {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .section-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: ${spacing.md}px ${spacing.lg}px;
            background: none;
            border: none;
            border-bottom: 1px solid ${theme.border};
            cursor: pointer;
            text-decoration: none;
          }
          
          .section-item:last-child {
            border-bottom: none;
          }
          
          .item-left {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
          }
          
          .item-left span {
            font-size: 16px;
          }
          
          .item-right {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
          }
          
          .item-value {
            font-size: 14px;
          }
          
          .version-info {
            text-align: center;
            padding: ${spacing.xl}px;
          }
          
          .version-info p {
            font-size: 12px;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
