/**
 * Tavvy Shield Page - Web Version
 * 
 * Protection Built Into Discovery
 * 
 * Features:
 * - Verified identity and payment accountability
 * - Real activity signals (not star ratings)
 * - Payment options: Direct pay or Tavvy pays on behalf
 * - Optional licensed professional inspection
 * - Municipal code compliance verification
 * - Transparent flat percentage fee
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { spacing, borderRadius, Colors } from '../../../constants/Colors';
import { 
  IoShieldCheckmark, IoCheckmarkCircle, IoCard, IoConstruct,
  IoPeople, IoBriefcase, IoChevronDown, IoChevronUp, IoArrowForward,
  IoInformationCircle, IoAnalytics
} from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function TavvyShieldScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useThemeContext();
  const router = useRouter();
  const { locale } = router;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const bgColor = isDark ? '#000000' : '#F9F7F2';
  const cardBg = isDark ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#E5E7EB' : '#6B7280';
  const accentColor = '#6B7FFF';

  const features = [
    {
      icon: IoShieldCheckmark,
      title: 'Verified Identity',
      description: 'All professionals complete identity verification, license validation, and background checks',
      color: '#6B7FFF',
    },
    {
      icon: IoAnalytics,
      title: 'Real Activity Signals',
      description: 'No fake reviews. We track real visits, live activity, and verified behavior patterns',
      color: '#8B5CF6',
    },
    {
      icon: IoCard,
      title: 'Payment Protection',
      description: 'Choose to pay directly or let Tavvy handle payments. All transactions are tracked and accountable',
      color: '#10B981',
    },
    {
      icon: IoConstruct,
      title: 'Licensed Inspections',
      description: 'Optional: Hire a licensed professional to verify work quality and municipal code compliance',
      color: '#F59E0B',
    },
  ];

  const paymentOptions = [
    {
      icon: IoCard,
      title: 'Pay Contractor Directly',
      description: 'After Tavvy approval, pay the contractor directly with full transparency',
      badge: 'Popular',
      badgeColor: '#10B981',
    },
    {
      icon: IoShieldCheckmark,
      title: 'Tavvy Pays on Your Behalf',
      description: 'We hold funds and release payment after work completion and your approval',
      badge: 'Safest',
      badgeColor: '#6B7FFF',
    },
  ];

  const inspectionFeatures = [
    { text: 'Licensed professional site visit' },
    { text: 'Municipal code compliance check' },
    { text: 'Work quality verification' },
    { text: 'Detailed inspection report' },
  ];

  const faqs = [
    {
      question: 'How much does Tavvy Shield cost?',
      answer: 'We charge a small flat percentage fee (3.5%) on transactions. This covers payment processing, verification, and protection services. No hidden fees.',
    },
    {
      question: 'What are the payment options?',
      answer: 'You can either pay the contractor directly after our approval, or have Tavvy hold and release funds on your behalf. Both options include full payment accountability.',
    },
    {
      question: 'What is the licensed inspection service?',
      answer: 'For an additional fee, we can send a licensed professional to your project site to verify work quality and ensure everything meets municipal building codes. This is optional but highly recommended for major projects.',
    },
    {
      question: 'How long does contractor approval take?',
      answer: 'Most contractor approvals are completed within 24-48 hours. We verify their identity, licenses, insurance, and past work history.',
    },
    {
      question: 'What happens if something goes wrong?',
      answer: 'If you have an issue with a Shield-protected transaction, file a dispute through Tavvy. We review all disputes fairly and work toward resolution. Contractors with repeated issues lose Shield eligibility.',
    },
    {
      question: 'Can contractors lose their Shield badge?',
      answer: 'Yes. Shield eligibility is behavior-based. Contractors who consistently violate policies, abandon work, or engage in fraud lose their Shield status and may be removed from Tavvy entirely.',
    },
  ];

  const benefits = [
    { 
      icon: IoPeople, 
      title: 'For Homeowners', 
      items: ['Verified contractors', 'Payment protection', 'Dispute resolution', 'Optional inspections', 'Code compliance'] 
    },
    { 
      icon: IoBriefcase, 
      title: 'For Contractors', 
      items: ['Higher trust', 'Better visibility', 'Fair disputes', 'Clear expectations', 'Good behavior rewards'] 
    },
  ];

  return (
    <>
      <Head>
        <title>Tavvy Shield | TavvY</title>
        <meta name="description" content="Protection built into discovery. Verified contractors, payment protection, and licensed inspections." />
      </Head>

      <AppLayout>
        <div className="shield-screen" style={{ backgroundColor: bgColor, minHeight: '100vh' }}>
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-icon">
              <IoShieldCheckmark size={80} color={accentColor} />
            </div>
            <h1 className="hero-title">Tavvy Shield</h1>
            <p className="hero-subtitle">
              A safer way to discover, hire, and pay.<br />
              Built into every experience.
            </p>
          </div>

          {/* Introduction */}
          <div className="section">
            <h2 className="section-title">Protection by Design</h2>
            <p className="body-text">
              Finding a contractor shouldn't feel like a gamble. Tavvy Shield is our protection layer — designed to help you make confident decisions when hiring professionals or paying for services.
            </p>
            <p className="body-text" style={{ marginTop: 16 }}>
              It's not insurance. It's not social media.
            </p>
            <p className="body-text" style={{ marginTop: 16, fontWeight: 600 }}>
              It's accountability, verification, and trust — built into Tavvy.
            </p>
          </div>

          {/* Features Grid */}
          <div className="section">
            <h2 className="section-title">What Shield Protects</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card" style={{ backgroundColor: cardBg }}>
                  <div className="feature-icon" style={{ backgroundColor: feature.color + '20' }}>
                    <feature.icon size={32} color={feature.color} />
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-desc">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Options */}
          <div className="section">
            <h2 className="section-title">💳 Payment Options</h2>
            <p className="body-text" style={{ marginBottom: 24 }}>
              Choose how you want to handle payments. Both options include full protection and accountability.
            </p>
            <div className="payment-grid">
              {paymentOptions.map((option, index) => (
                <div key={index} className="payment-card" style={{ backgroundColor: cardBg }}>
                  <div className="payment-header">
                    <div className="payment-icon-container">
                      <option.icon size={28} color={accentColor} />
                    </div>
                    <div className="payment-badge" style={{ backgroundColor: option.badgeColor + '20', color: option.badgeColor }}>
                      {option.badge}
                    </div>
                  </div>
                  <h3 className="payment-title">{option.title}</h3>
                  <p className="payment-desc">{option.description}</p>
                </div>
              ))}
            </div>
            
            {/* Fee Information */}
            <div className="fee-box" style={{ 
              backgroundColor: isDark ? '#1A1F2E' : '#F3F4F6',
              borderColor: isDark ? '#374151' : '#D1D5DB'
            }}>
              <IoInformationCircle size={24} color={accentColor} />
              <p className="fee-text">
                <strong>Flat 3.5% fee</strong> on all transactions. No hidden charges. This covers payment processing, verification, and protection services.
              </p>
            </div>
          </div>

          {/* Licensed Inspection Service */}
          <div className="section">
            <h2 className="section-title">🔍 Licensed Inspection Service</h2>
            <p className="body-text" style={{ marginBottom: 24 }}>
              Add an extra layer of protection with a licensed professional inspection. Recommended for major projects.
            </p>
            <div className="inspection-card" style={{ backgroundColor: cardBg }}>
              <div className="inspection-header">
                <IoConstruct size={40} color="#F59E0B" />
                <h3 className="inspection-title">Professional Site Inspection</h3>
              </div>
              <div className="inspection-features">
                {inspectionFeatures.map((item, index) => (
                  <div key={index} className="inspection-item">
                    <IoCheckmarkCircle size={24} color="#10B981" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <button className="inspection-button">
                <span>Request Inspection</span>
                <IoArrowForward size={20} />
              </button>
            </div>
          </div>

          {/* Benefits for Both Sides */}
          <div className="section">
            <h2 className="section-title">Built for Everyone</h2>
            <p className="body-text" style={{ marginBottom: 24 }}>
              Tavvy Shield protects homeowners without punishing good contractors.
            </p>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-card" style={{ backgroundColor: cardBg }}>
                  <div className="benefit-header">
                    <benefit.icon size={28} color={accentColor} />
                    <h3 className="benefit-title">{benefit.title}</h3>
                  </div>
                  <div className="benefit-items">
                    {benefit.items.map((item, idx) => (
                      <div key={idx} className="benefit-item">
                        <IoCheckmarkCircle size={20} color="#10B981" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="section">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="faq-card" 
                  style={{ backgroundColor: cardBg }}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="faq-header">
                    <h3 className="faq-question">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <IoChevronUp size={24} color={secondaryTextColor} />
                    ) : (
                      <IoChevronDown size={24} color={secondaryTextColor} />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <p className="faq-answer">{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="cta-section" style={{ backgroundColor: cardBg }}>
            <IoShieldCheckmark size={64} color={accentColor} />
            <h2 className="cta-title">Ready to Explore with Confidence?</h2>
            <p className="cta-subtitle">
              Tavvy Shield is already built into Tavvy. You don't need to activate it — just look for the 🛡️ badge.
            </p>
            <button className="cta-button">
              <span>Find Verified Contractors</span>
              <IoArrowForward size={24} />
            </button>
          </div>

          {/* Footer Disclaimer */}
          <div className="footer">
            <p className="footer-text">
              Tavvy Shield is a trust and accountability framework, not an insurance policy. It helps reduce risk through verification and tracking, but doesn't provide financial guarantees for every possible scenario.
            </p>
          </div>

          <style jsx>{`
            .shield-screen {
              padding-bottom: 80px;
            }

            .hero-section {
              text-align: center;
              padding: 80px 24px;
              background: linear-gradient(135deg, rgba(107, 127, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
            }

            .hero-icon {
              margin-bottom: 24px;
            }

            .hero-title {
              font-size: 48px;
              font-weight: 700;
              color: ${textColor};
              margin-bottom: 16px;
            }

            .hero-subtitle {
              font-size: 20px;
              color: ${secondaryTextColor};
              line-height: 1.6;
              max-width: 600px;
              margin: 0 auto;
            }

            .section {
              max-width: 1200px;
              margin: 0 auto;
              padding: 60px 24px;
            }

            .section-title {
              font-size: 32px;
              font-weight: 700;
              color: ${textColor};
              margin-bottom: 24px;
            }

            .body-text {
              font-size: 18px;
              color: ${secondaryTextColor};
              line-height: 1.7;
            }

            .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 24px;
              margin-top: 32px;
            }

            .feature-card {
              padding: 24px;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              transition: transform 0.2s;
            }

            .feature-card:hover {
              transform: translateY(-4px);
            }

            .feature-icon {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
            }

            .feature-content {
              flex: 1;
            }

            .feature-title {
              font-size: 20px;
              font-weight: 600;
              color: ${textColor};
              margin-bottom: 8px;
            }

            .feature-desc {
              font-size: 15px;
              color: ${secondaryTextColor};
              line-height: 1.6;
            }

            .payment-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
              gap: 24px;
            }

            .payment-card {
              padding: 32px;
              border-radius: 20px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .payment-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }

            .payment-icon-container {
              width: 56px;
              height: 56px;
              border-radius: 12px;
              background: rgba(107, 127, 255, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .payment-badge {
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
            }

            .payment-title {
              font-size: 22px;
              font-weight: 600;
              color: ${textColor};
              margin-bottom: 12px;
            }

            .payment-desc {
              font-size: 16px;
              color: ${secondaryTextColor};
              line-height: 1.6;
            }

            .fee-box {
              display: flex;
              gap: 16px;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid;
              margin-top: 24px;
            }

            .fee-text {
              flex: 1;
              font-size: 15px;
              color: ${secondaryTextColor};
              line-height: 1.6;
            }

            .fee-text strong {
              color: ${textColor};
            }

            .inspection-card {
              padding: 32px;
              border-radius: 20px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .inspection-header {
              display: flex;
              align-items: center;
              gap: 16px;
              margin-bottom: 24px;
            }

            .inspection-title {
              font-size: 24px;
              font-weight: 600;
              color: ${textColor};
              flex: 1;
            }

            .inspection-features {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-bottom: 24px;
            }

            .inspection-item {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 16px;
              color: ${secondaryTextColor};
            }

            .inspection-button {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              padding: 16px;
              background: ${accentColor};
              color: white;
              border: none;
              border-radius: 12px;
              font-size: 17px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }

            .inspection-button:hover {
              background: #5A6FE6;
            }

            .benefits-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 24px;
            }

            .benefit-card {
              padding: 28px;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .benefit-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
            }

            .benefit-title {
              font-size: 20px;
              font-weight: 600;
              color: ${textColor};
            }

            .benefit-items {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .benefit-item {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 15px;
              color: ${secondaryTextColor};
            }

            .faq-list {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }

            .faq-card {
              padding: 24px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              cursor: pointer;
              transition: box-shadow 0.2s;
            }

            .faq-card:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }

            .faq-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
            }

            .faq-question {
              font-size: 18px;
              font-weight: 600;
              color: ${textColor};
              flex: 1;
            }

            .faq-answer {
              font-size: 15px;
              color: ${secondaryTextColor};
              line-height: 1.7;
              margin-top: 16px;
            }

            .cta-section {
              max-width: 800px;
              margin: 60px auto;
              padding: 60px 40px;
              border-radius: 24px;
              text-align: center;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            }

            .cta-title {
              font-size: 32px;
              font-weight: 700;
              color: ${textColor};
              margin: 24px 0 16px;
            }

            .cta-subtitle {
              font-size: 17px;
              color: ${secondaryTextColor};
              line-height: 1.6;
              margin-bottom: 32px;
            }

            .cta-button {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              padding: 18px 36px;
              background: ${accentColor};
              color: white;
              border: none;
              border-radius: 12px;
              font-size: 18px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }

            .cta-button:hover {
              background: #5A6FE6;
            }

            .footer {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 24px;
            }

            .footer-text {
              font-size: 14px;
              color: ${secondaryTextColor};
              line-height: 1.6;
              text-align: center;
            }

            @media (max-width: 768px) {
              .hero-title {
                font-size: 36px;
              }

              .hero-subtitle {
                font-size: 18px;
              }

              .section {
                padding: 40px 20px;
              }

              .section-title {
                font-size: 28px;
              }

              .features-grid,
              .payment-grid,
              .benefits-grid {
                grid-template-columns: 1fr;
              }

              .cta-section {
                padding: 40px 24px;
              }

              .cta-title {
                font-size: 28px;
              }
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
