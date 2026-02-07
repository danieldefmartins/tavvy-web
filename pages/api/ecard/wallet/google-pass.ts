/**
 * Google Wallet Pass Generation API
 * POST /api/ecard/wallet/google-pass
 * 
 * Generates a Google Wallet "Add to Wallet" URL for a digital card.
 * Uses the Generic Pass type.
 * 
 * SETUP REQUIRED:
 * 1. Google Cloud Console → Enable Google Wallet API
 * 2. Google Pay & Wallet Console → Create an Issuer Account
 * 3. Create a Service Account with Wallet permissions
 * 4. Set environment variables:
 *    - GOOGLE_WALLET_ISSUER_ID: Your issuer ID from Google Pay Console
 *    - GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: Service account email
 *    - GOOGLE_WALLET_PRIVATE_KEY_BASE64: Base64-encoded service account private key
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PassRequest {
  cardId?: string;
  slug?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardId, slug } = req.body as PassRequest;

    if (!cardId && !slug) {
      return res.status(400).json({ error: 'cardId or slug is required' });
    }

    // Check if Google Wallet is configured
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
    const privateKeyBase64 = process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64;

    if (!issuerId || !serviceAccountEmail || !privateKeyBase64) {
      return res.status(503).json({ 
        error: 'Google Wallet not configured',
        message: 'Google Wallet pass generation requires credentials. See setup guide.',
        setupRequired: true,
      });
    }

    // Fetch card data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase.from('digital_cards').select('*');
    if (cardId) query = query.eq('id', cardId);
    else if (slug) query = query.eq('slug', slug);
    
    const { data: card, error } = await query.single();
    if (error || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const cardUrl = `https://tavvy.com/${card.slug}`;
    const classId = `${issuerId}.tavvy_ecard_class`;
    const objectId = `${issuerId}.tavvy_ecard_${card.id.replace(/-/g, '_')}`;

    // Build the Generic Pass object
    const passObject: any = {
      id: objectId,
      classId: classId,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      hexBackgroundColor: card.gradient_color_1 || '#667eea',
      cardTitle: {
        defaultValue: { language: 'en', value: 'Tavvy Digital Card' },
      },
      header: {
        defaultValue: { language: 'en', value: card.full_name || 'Digital Card' },
      },
      subheader: card.title ? {
        defaultValue: { language: 'en', value: card.title },
      } : undefined,
      textModulesData: [],
      linksModuleData: {
        uris: [
          {
            uri: cardUrl,
            description: 'View Digital Card',
            id: 'card_url',
          },
        ],
      },
      barcode: {
        type: 'QR_CODE',
        value: cardUrl,
        alternateText: cardUrl,
      },
    };

    // Add text modules for contact info
    if (card.phone) {
      passObject.textModulesData.push({
        id: 'phone',
        header: 'Phone',
        body: card.phone,
      });
    }

    if (card.email) {
      passObject.textModulesData.push({
        id: 'email',
        header: 'Email',
        body: card.email,
      });
    }

    if (card.website) {
      passObject.textModulesData.push({
        id: 'website',
        header: 'Website',
        body: card.website,
      });
      passObject.linksModuleData.uris.push({
        uri: card.website.startsWith('http') ? card.website : `https://${card.website}`,
        description: 'Website',
        id: 'website_url',
      });
    }

    if (card.city) {
      passObject.textModulesData.push({
        id: 'location',
        header: 'Location',
        body: [card.city, card.state].filter(Boolean).join(', '),
      });
    }

    if (card.bio) {
      passObject.textModulesData.push({
        id: 'about',
        header: 'About',
        body: card.bio,
      });
    }

    // Add profile photo as hero image
    if (card.profile_photo_url) {
      passObject.heroImage = {
        sourceUri: { uri: card.profile_photo_url },
        contentDescription: { defaultValue: { language: 'en', value: card.full_name } },
      };
    }

    // Build the Generic Pass class (created once, reused)
    const passClass: any = {
      id: classId,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
    };

    // Create JWT for "Save to Google Wallet" link
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    
    const claims = {
      iss: serviceAccountEmail,
      aud: 'google',
      origins: ['https://tavvy.com'],
      typ: 'savetowallet',
      payload: {
        genericClasses: [passClass],
        genericObjects: [passObject],
      },
    };

    const jwt = createJWT(claims, privateKey);
    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    return res.status(200).json({ 
      saveUrl,
      objectId,
      classId,
    });

  } catch (error: any) {
    console.error('Google Wallet pass generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate pass',
      message: error.message,
    });
  }
}

// Create a JWT signed with RS256
function createJWT(payload: any, privateKey: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(claims));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey);
  const signatureB64 = base64url(signature);

  return `${signingInput}.${signatureB64}`;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
