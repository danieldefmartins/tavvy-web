/**
 * Project Submitted Success Page
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/AppLayout';
import { Colors } from '../../../constants/Colors';
import { FiCheck, FiMail, FiMessageCircle } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ProjectSubmittedPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  return (
    <AppLayout>
      <Head>
        <title>Project Submitted | Tavvy Pros</title>
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: Colors.light.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: Colors.light.tint,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px'
          }}>
            <FiCheck />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>
            Project Submitted!
          </h1>
          
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '32px' }}>
            We're matching you with the best pros in your area. You'll hear from them soon!
          </p>

          {/* What's Next */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              What happens next?
            </h2>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${Colors.light.tint}20`,
                color: Colors.light.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  Pros review your project
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  Qualified pros in your area will see your request
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${Colors.light.tint}20`,
                color: Colors.light.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiMessageCircle />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  You'll receive messages
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  Interested pros will reach out with quotes
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${Colors.light.tint}20`,
                color: Colors.light.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  Compare and choose
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  Review quotes and hire the best pro for your project
                </p>
              </div>
            </div>
          </div>

          {/* Email Notification */}
          <div style={{
            background: '#F3F4F6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FiMail style={{ fontSize: '24px', color: Colors.light.tint }} />
            <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'left' }}>
              We sent a confirmation to your email. Check your inbox!
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/app/pros" locale={locale}>
              <a style={{
                display: 'block',
                padding: '16px',
                background: Colors.light.tint,
                color: 'white',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Browse Pros
              </a>
            </Link>
            
            <Link href="/app" locale={locale}>
              <a style={{
                display: 'block',
                padding: '16px',
                background: 'white',
                color: Colors.light.tint,
                border: `2px solid ${Colors.light.tint}`,
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Back to Home
              </a>
            </Link>
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
