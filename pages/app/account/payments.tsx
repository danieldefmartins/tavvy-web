/**
 * Payment Methods Page
 * Placeholder for payment management
 */
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { theme } = useThemeContext();
  const { t } = useTranslation('common');

  return (
    <AppLayout>
      <Head>
        <title>Payment Methods | TavvY</title>
      </Head>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 16px 40px;
          min-height: 100vh;
          background: ${theme.background};
        }
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid ${theme.border};
          margin-bottom: 24px;
        }
        .back-btn {
          background: none;
          border: none;
          color: ${theme.text};
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: ${theme.text};
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: ${theme.surface};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .empty-title {
          font-size: 20px;
          font-weight: 600;
          color: ${theme.text};
          margin-bottom: 8px;
        }
        .empty-text {
          font-size: 15px;
          color: ${theme.textSecondary};
          line-height: 1.5;
          max-width: 300px;
        }
      `}</style>

      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>
          <span className="header-title">Payment Methods</span>
        </div>

        <div className="empty-state">
          <div className="empty-icon">
            <FiCreditCard size={32} color={theme.textSecondary} />
          </div>
          <div className="empty-title">No Payment Methods</div>
          <div className="empty-text">
            Payment methods will be available when you subscribe to a premium plan or use paid services.
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
