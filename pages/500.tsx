import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Something went wrong | Tavvy</title>
      </Head>
      <div className="error-page">
        <div className="error-content">
          <div className="error-code">500</div>
          <h1 className="error-title">Something went wrong</h1>
          <p className="error-message">
            We're working on fixing this. Please try again in a moment.
          </p>
          <div className="error-actions">
            <Link href="/app" className="btn-primary">
              Go Home
            </Link>
          </div>
        </div>

        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #17013A;
            padding: 24px;
          }

          .error-content {
            text-align: center;
            max-width: 480px;
          }

          .error-code {
            font-size: 120px;
            font-weight: 900;
            background: linear-gradient(135deg, #F5A623, #E53E3E);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1;
            margin-bottom: 16px;
          }

          .error-title {
            font-size: 28px;
            font-weight: 800;
            color: #F1F5F9;
            margin-bottom: 12px;
          }

          .error-message {
            font-size: 16px;
            color: #9394A1;
            line-height: 1.6;
            margin-bottom: 32px;
          }

          .error-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
          }

          .error-actions :global(.btn-primary) {
            display: inline-block;
            padding: 14px 32px;
            background: #8A05BE;
            color: white;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-decoration: none;
            transition: all 0.2s;
          }

          .error-actions :global(.btn-primary:hover) {
            background: #9B10D4;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    </>
  );
}
