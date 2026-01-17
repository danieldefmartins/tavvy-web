# TavvY Web App

The official web application for TavvY - a signal-based community review platform.

## Pages

- `/` - Landing page
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** CSS (global styles)
- **Backend:** Supabase (shared with mobile app)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment to Railway

### Option 1: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 2: Deploy via GitHub

1. Push this repo to GitHub
2. Go to [Railway Dashboard](https://railway.app/dashboard)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Next.js and deploy

### Option 3: Deploy via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Empty Project"
3. Add a new service → "GitHub Repo" or "Deploy from local"
4. Configure the domain as `tavvy.com`

## Environment Variables

For production, set these in Railway:

```
# Optional: If you need Supabase on the web
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Custom Domain Setup

After deploying to Railway:

1. Go to your service settings
2. Click "Settings" → "Networking" → "Custom Domain"
3. Add `tavvy.com`
4. Update your DNS records:
   - Add a CNAME record pointing to your Railway domain
   - Or use Railway's provided DNS settings

## File Structure

```
tavvy-web/
├── pages/
│   ├── _app.tsx        # App wrapper
│   ├── index.tsx       # Landing page
│   ├── privacy.tsx     # Privacy Policy
│   └── terms.tsx       # Terms of Service
├── styles/
│   └── globals.css     # Global styles (TavvY branding)
├── public/
│   └── logo-white.png  # TavvY logo
├── package.json
├── tsconfig.json
├── next.config.js
├── railway.json        # Railway deployment config
└── README.md
```

## Adding New Pages

To add a new page, create a file in the `pages/` directory:

```tsx
// pages/about.tsx
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>About | TavvY</title>
      </Head>
      <div>
        <h1>About TavvY</h1>
      </div>
    </>
  );
}
```

This will automatically create a route at `/about`.

## Support

For questions or issues, contact: support@tavvy.com
