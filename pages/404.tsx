import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Tavvy</title>
      </Head>
      <div className="error-page">
        <div className="error-content">
          <div className="error-code">404</div>
          <h1 className="error-title">This page doesn't exist</h1>
          <p className="error-message">
            The page you're looking for may have been moved or no longer exists.
            Let's get you back on track.
          </p>
          <div className="error-actions">
            <Link href="/app" className="btn-primary">
              Go Home
            </Link>
            <Link href="/app" className="btn-secondary">
              Explore Places
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
            background: linear-gradient(135deg, #8A05BE, #00C2CB);
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

          .error-actions :global(.btn-secondary) {
            display: inline-block;
            padding: 14px 32px;
            background: rgba(0, 194, 203, 0.12);
            color: #00C2CB;
            border: 1px solid rgba(0, 194, 203, 0.2);
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-decoration: none;
            transition: all 0.2s;
          }

          .error-actions :global(.btn-secondary:hover) {
            background: rgba(0, 194, 203, 0.2);
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    </>
  );
}
