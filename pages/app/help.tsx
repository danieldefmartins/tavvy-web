/**
 * Help & Support Screen
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiArrowLeft, FiSearch, FiChevronRight, FiMail, FiMessageCircle, FiBook, FiHelpCircle } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const FAQ_ITEMS = [
  {
    question: 'How do I create an account?',
    answer: 'Tap the "Sign Up" button on the login screen and follow the prompts to create your account using your email address.',
  },
  {
    question: 'How do I save a place?',
    answer: 'When viewing a place, tap the bookmark icon to save it to your favorites. You can access saved places from the "Saved" section in the Apps tab.',
  },
  {
    question: 'How do signals work?',
    answer: 'Signals represent real-time community feedback about a place. Blue signals are positive, purple are neutral, and orange indicate areas for improvement.',
  },
  {
    question: 'How do I leave a review?',
    answer: 'Visit any place page and tap "Add Review" to share your experience. You can rate different aspects and add photos.',
  },
  {
    question: 'How do I contact a Pro?',
    answer: 'Browse the Pros section, find a service provider, and tap their profile to see contact options and booking availability.',
  },
  {
    question: 'Can I use TavvY offline?',
    answer: 'Some features require an internet connection, but saved places and recent searches are available offline.',
  },
];

const HELP_TOPICS = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'account', title: 'Account & Profile', icon: '👤' },
  { id: 'places', title: 'Places & Reviews', icon: '📍' },
  { id: 'pros', title: 'Pros & Services', icon: '🔧' },
  { id: 'atlas', title: 'Atlas & Guides', icon: '📖' },
  { id: 'privacy', title: 'Privacy & Security', icon: '🔒' },
];

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { theme } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = FAQ_ITEMS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Help & Support | TavvY</title>
        <meta name="description" content="Get help with TavvY" />
      </Head>

      <AppLayout hideTabBar>
        <div className="help-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="help-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Help & Support</h1>
            <div style={{ width: 40 }} />
          </header>

          {/* Search */}
          <div className="search-section">
            <div className="search-container" style={{ backgroundColor: theme.surface }}>
              <FiSearch size={18} color={theme.textSecondary} />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ color: theme.text }}
              />
            </div>
          </div>

          {/* Help Topics */}
          {!searchQuery && (
            <section className="topics-section">
              <h2 style={{ color: theme.text }}>Browse Topics</h2>
              <div className="topics-grid">
                {HELP_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    className="topic-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <span className="topic-icon">{topic.icon}</span>
                    <span style={{ color: theme.text }}>{topic.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="faq-section">
            <h2 style={{ color: theme.text }}>
              {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
            </h2>
            <div className="faq-list">
              {filteredFaqs.length === 0 ? (
                <div className="empty-state">
                  <FiHelpCircle size={48} color={theme.textTertiary} />
                  <p style={{ color: theme.textSecondary }}>No results found</p>
                </div>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="faq-item"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <button
                      className="faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                      <span style={{ color: theme.text }}>{faq.question}</span>
                      <FiChevronRight
                        size={18}
                        color={theme.textTertiary}
                        style={{
                          transform: expandedFaq === index ? 'rotate(90deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="faq-answer">
                        <p style={{ color: theme.textSecondary }}>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Contact Section */}
          <section className="contact-section">
            <h2 style={{ color: theme.text }}>Still need help?</h2>
            <div className="contact-options">
              <a
                href="mailto:support@tavvy.com"
                className="contact-card"
                style={{ backgroundColor: theme.cardBackground }}
              >
                <FiMail size={24} color={theme.primary} />
                <div>
                  <h3 style={{ color: theme.text }}>Email Us</h3>
                  <p style={{ color: theme.textSecondary }}>support@tavvy.com</p>
                </div>
              </a>
              <button
                className="contact-card"
                style={{ backgroundColor: theme.cardBackground }}
              >
                <FiMessageCircle size={24} color={theme.primary} />
                <div>
                  <h3 style={{ color: theme.text }}>Live Chat</h3>
                  <p style={{ color: theme.textSecondary }}>Available 9am - 5pm EST</p>
                </div>
              </button>
            </div>
          </section>

          {/* Documentation Link */}
          <section className="docs-section">
            <Link href="/docs" className="docs-card" style={{ backgroundColor: theme.surface }}>
              <FiBook size={24} color={theme.primary} />
              <div>
                <h3 style={{ color: theme.text }}>Documentation</h3>
                <p style={{ color: theme.textSecondary }}>Read our full documentation</p>
              </div>
              <FiChevronRight size={18} color={theme.textTertiary} />
            </Link>
          </section>
        </div>

        <style jsx>{`
          .help-screen {
            min-height: 100vh;
            padding-bottom: 40px;
          }
          
          .help-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
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
          
          .help-header h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .search-section {
            padding: 0 ${spacing.lg}px ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            outline: none;
          }
          
          .topics-section,
          .faq-section,
          .contact-section,
          .docs-section {
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.xl}px;
          }
          
          h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .topics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.sm}px;
          }
          
          .topic-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            cursor: pointer;
          }
          
          .topic-icon {
            font-size: 32px;
          }
          
          .faq-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .faq-item {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .faq-question {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: ${spacing.md}px ${spacing.lg}px;
            background: none;
            border: none;
            cursor: pointer;
            text-align: left;
          }
          
          .faq-answer {
            padding: 0 ${spacing.lg}px ${spacing.md}px;
          }
          
          .faq-answer p {
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          
          .empty-state {
            text-align: center;
            padding: 40px;
          }
          
          .empty-state p {
            margin: ${spacing.md}px 0 0;
          }
          
          .contact-options {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .contact-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            cursor: pointer;
            text-decoration: none;
            text-align: left;
          }
          
          .contact-card h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .contact-card p {
            font-size: 13px;
            margin: 0;
          }
          
          .docs-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
          }
          
          .docs-card div {
            flex: 1;
          }
          
          .docs-card h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .docs-card p {
            font-size: 13px;
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
