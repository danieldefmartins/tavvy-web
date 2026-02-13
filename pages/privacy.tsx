import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>Privacy Policy | TavvY</title>
        <meta name="description" content="TavvY Privacy Policy - How we collect, use, and protect your data." />
      </Head>

      <div className="legal-page">
        <header className="legal-header">
          <Link href="/">
            <img src="/logo-white.png" alt="TavvY" style={{ height: 40, marginBottom: 24 }} />
          </Link>
          <h1>Privacy Policy</h1>
          <p>Last Updated: January 17, 2026</p>
        </header>

        <main className="legal-content">
          <p>
            Welcome to TavvY! This Privacy Policy explains how TavvY, Inc. ("TavvY", "we", "us", or "our") 
            collects, uses, and discloses information about you when you use our mobile application (the "App") 
            and our related services (collectively, the "Services").
          </p>
          <p>
            By using our Services, you agree to the collection, use, and disclosure of your information as 
            described in this Privacy Policy. If you do not agree, please do not use our Services.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, information we collect automatically when you 
            use our Services, and information we collect from other sources.
          </p>

          <h3>1.1. Information You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you create a TavvY account, we collect your email address and password. You may also choose to provide a full name and profile picture.</li>
            <li><strong>User-Generated Content:</strong> We collect the content you create, including your reviews (taps and signals), photos, and any captions or comments you post.</li>
            <li><strong>Communications:</strong> If you contact us directly, we may receive additional information about you, such as your name, email address, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
          </ul>

          <h3>1.2. Information We Collect Automatically</h3>
          <ul>
            <li><strong>Location Information:</strong> With your permission, we collect your precise location information when you use our App. We use this information to show you nearby places, allow you to review your current location, and sort places by distance. We only collect this information while the App is in use.</li>
            <li><strong>Usage Information:</strong> We collect information about your activity on our Services, such as the places you view, the signals you tap, the searches you conduct, and the dates and times of your activity.</li>
            <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including the hardware model, operating system and version, unique device identifiers, and mobile network information.</li>
          </ul>

          <h3>1.3. Information We Collect from Other Sources</h3>
          <p>
            We may receive information about you from other sources, including other users (e.g., if they report 
            your content) and third-party services (e.g., if you interact with our social media pages).
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services;</li>
            <li>Personalize your experience and provide content and features that match your interests;</li>
            <li>Allow you to share your experiences with the TavvY community;</li>
            <li>Communicate with you about products, services, offers, and events offered by TavvY and others;</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Services;</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of TavvY and others;</li>
            <li>Carry out any other purpose described to you at the time the information was collected.</li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We may share your information as follows:</p>
          <ul>
            <li><strong>With the Public:</strong> Your profile information (name and profile picture), reviews, photos, and other user-generated content are public and can be seen by anyone.</li>
            <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., hosting, analytics, and payment processing).</li>
            <li><strong>In Response to Legal Process:</strong> We may disclose your information if we believe that disclosure is in accordance with, or required by, any applicable law, regulation, legal process, or governmental request.</li>
            <li><strong>To Protect TavvY:</strong> We may disclose your information if we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of TavvY or others.</li>
            <li><strong>With Your Consent:</strong> We may share your information with your consent or at your direction.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>4. Your Choices</h2>
          <h3>4.1. Account Information</h3>
          <p>
            You may update, correct, or delete your account information at any time by logging into your account. 
            If you wish to delete your account, please contact us at support@tavvy.com.
          </p>

          <h3>4.2. Location Information</h3>
          <p>
            You can stop our collection of location information at any time by changing the preferences on your mobile device.
          </p>

          <h3>4.3. Cookies</h3>
          <p>We do not use cookies in our mobile application.</p>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to help protect your information from loss, theft, misuse, and unauthorized 
            access, disclosure, alteration, and destruction.
          </p>

          <h2>6. Children's Privacy</h2>
          <p>
            Our Services are not intended for children under the age of 13. We do not knowingly collect personal 
            information from children under 13. If we learn that we have collected personal information from a 
            child under 13, we will take steps to delete such information.
          </p>

          <h2>7. Changes to this Privacy Policy</h2>
          <p>
            We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising 
            the date at the top of the policy and, in some cases, we may provide you with additional notice (such 
            as adding a statement to our homepage or sending you a notification).
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:support@tavvy.com">support@tavvy.com</a>
          </p>
        </main>

        <footer className="legal-footer">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/">Home</Link>
        </footer>
      </div>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
