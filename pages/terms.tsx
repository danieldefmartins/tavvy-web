import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | TavvY</title>
        <meta name="description" content="TavvY Terms of Service - Rules and guidelines for using our platform." />
      </Head>

      <div className="legal-page">
        <header className="legal-header">
          <Link href="/">
            <img src="/logo-white.png" alt="TavvY" style={{ height: 40, marginBottom: 24 }} />
          </Link>
          <h1>Terms of Service</h1>
          <p>Last Updated: January 17, 2026</p>
        </header>

        <main className="legal-content">
          <p>
            Welcome to TavvY! These Terms of Service ("Terms") govern your access to and use of the TavvY mobile 
            application and related services (collectively, the "Services") provided by TavvY, Inc. ("TavvY", "we", 
            "us", or "our").
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these 
            Terms, you may not access or use the Services.
          </p>

          <h2>1. Using TavvY</h2>
          <h3>1.1. Who Can Use TavvY</h3>
          <p>
            You must be at least 13 years old to use TavvY. By using our Services, you represent and warrant that 
            you meet this age requirement.
          </p>

          <h3>1.2. Your Account</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2>2. Content and Conduct</h2>
          <h3>2.1. Your Content</h3>
          <p>
            You retain ownership of the content you create and share on TavvY ("Your Content"). By posting Your Content, 
            you grant TavvY a worldwide, non-exclusive, royalty-free license to use, copy, modify, distribute, publish, 
            and process Your Content in connection with the Services.
          </p>

          <h3>2.2. Content Guidelines</h3>
          <p>You agree not to post content that:</p>
          <ul>
            <li>Is false, misleading, or deceptive;</li>
            <li>Is defamatory, obscene, pornographic, vulgar, or offensive;</li>
            <li>Promotes discrimination, bigotry, racism, hatred, harassment, or harm against any individual or group;</li>
            <li>Is violent or threatening or promotes violence or actions that are threatening to any person or entity;</li>
            <li>Promotes illegal or harmful activities or substances;</li>
            <li>Infringes any patent, trademark, trade secret, copyright, or other intellectual property rights of any party;</li>
            <li>Violates the privacy or publicity rights of any third party;</li>
            <li>Contains software viruses or any other computer code designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
          </ul>

          <h3>2.3. Enforcement</h3>
          <p>
            We reserve the right to remove any content that violates these Terms or that we find objectionable for any 
            reason. We may also suspend or terminate your account for violations.
          </p>

          <h2>3. TavvY Pros</h2>
          <p>
            TavvY Pros is a subscription service for business owners and service professionals. TavvY Pros enables 
            professionals to connect with customers for real-world services such as plumbing, catering, home repairs, 
            and other physical services.
          </p>
          <p>
            The TavvY Pros subscription is a service for real-world service providers and is subject to additional 
            terms and conditions provided at the time of subscription.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The Services and their entire contents, features, and functionality (including but not limited to all 
            information, software, text, displays, images, video, and audio, and the design, selection, and arrangement 
            thereof) are owned by TavvY, its licensors, or other providers of such material and are protected by 
            copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>

          <h2>5. Disclaimers</h2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
            IMPLIED. TAVVY DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            TavvY does not warrant that the Services will be uninterrupted, secure, or error-free. TavvY does not 
            endorse or guarantee the accuracy or reliability of any content posted by users.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, TAVVY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
            INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS 
            TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES.
          </p>

          <h2>7. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless TavvY and its officers, directors, employees, agents, 
            and affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable 
            attorneys' fees, arising out of or in any way connected with your access to or use of the Services or your 
            violation of these Terms.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We may revise these Terms from time to time. The most current version will always be posted on our website. 
            By continuing to access or use the Services after revisions become effective, you agree to be bound by the 
            revised Terms.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: <a href="mailto:support@tavvy.com">support@tavvy.com</a>
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
