/**
 * Apple Wallet Pass Generation API
 * POST /api/ecard/wallet/apple-pass
 * 
 * Generates a .pkpass file for Apple Wallet from a digital card.
 * 
 * SETUP REQUIRED:
 * 1. Apple Developer Account → Certificates, Identifiers & Profiles
 * 2. Create a Pass Type ID (e.g., pass.com.tavvy.ecard)
 * 3. Generate a Pass Type ID Certificate (.p12)
 * 4. Set environment variables:
 *    - APPLE_PASS_TYPE_ID: Your pass type identifier
 *    - APPLE_TEAM_ID: Your Apple Developer Team ID
 *    - APPLE_PASS_CERT_BASE64: Base64-encoded .pem certificate
 *    - APPLE_PASS_KEY_BASE64: Base64-encoded .pem private key
 *    - APPLE_WWDR_CERT_BASE64: Base64-encoded Apple WWDR certificate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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

    // Check if Apple Wallet is configured
    const passTypeId = process.env.APPLE_PASS_TYPE_ID;
    const teamId = process.env.APPLE_TEAM_ID;
    const certBase64 = process.env.APPLE_PASS_CERT_BASE64;
    const keyBase64 = process.env.APPLE_PASS_KEY_BASE64;
    const wwdrBase64 = process.env.APPLE_WWDR_CERT_BASE64;

    if (!passTypeId || !teamId || !certBase64 || !keyBase64 || !wwdrBase64) {
      return res.status(503).json({ 
        error: 'Apple Wallet not configured',
        message: 'Apple Wallet pass generation requires certificates. See setup guide.',
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

    // Generate the pass using passkit-generator
    // This requires the passkit-generator package: npm install passkit-generator
    const { PKPass } = await import('passkit-generator');

    const cert = Buffer.from(certBase64, 'base64');
    const key = Buffer.from(keyBase64, 'base64');
    const wwdr = Buffer.from(wwdrBase64, 'base64');

    const cardUrl = `https://tavvy.com/${card.slug}`;
    const pass = new PKPass({}, {
      wwdr,
      signerCert: cert,
      signerKey: key,
    }, {
      // Pass metadata
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      organizationName: 'Tavvy',
      serialNumber: `tavvy-ecard-${card.id}`,
      description: `${card.full_name}'s Digital Card`,
      
      // Colors from card gradient
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: hexToRgbString(card.gradient_color_1 || '#667eea'),
      labelColor: 'rgb(255, 255, 255)',
    });

    // Set pass type to generic
    pass.type = 'generic';

    // Primary fields
    pass.primaryFields.push({
      key: 'name',
      label: 'NAME',
      value: card.full_name || 'Digital Card',
    });

    // Secondary fields
    if (card.title) {
      pass.secondaryFields.push({
        key: 'title',
        label: 'TITLE',
        value: card.title,
      });
    }

    if (card.company) {
      pass.secondaryFields.push({
        key: 'company',
        label: 'COMPANY',
        value: card.company,
      });
    }

    // Auxiliary fields
    if (card.phone) {
      pass.auxiliaryFields.push({
        key: 'phone',
        label: 'PHONE',
        value: card.phone,
      });
    }

    if (card.email) {
      pass.auxiliaryFields.push({
        key: 'email',
        label: 'EMAIL',
        value: card.email,
      });
    }

    if (card.website) {
      pass.auxiliaryFields.push({
        key: 'website',
        label: 'WEBSITE',
        value: card.website,
      });
    }

    // Back fields (shown when card is flipped)
    pass.backFields.push({
      key: 'cardUrl',
      label: 'DIGITAL CARD',
      value: cardUrl,
    });

    if (card.bio) {
      pass.backFields.push({
        key: 'bio',
        label: 'ABOUT',
        value: card.bio,
      });
    }

    if (card.city) {
      pass.backFields.push({
        key: 'location',
        label: 'LOCATION',
        value: [card.city, card.state].filter(Boolean).join(', '),
      });
    }

    // Add barcode (QR code linking to card)
    pass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: cardUrl,
      messageEncoding: 'iso-8859-1',
      altText: cardUrl,
    });

    // Add profile photo as thumbnail if available
    if (card.profile_photo_url) {
      try {
        const photoResponse = await fetch(card.profile_photo_url);
        if (photoResponse.ok) {
          const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
          pass.addBuffer('thumbnail.png', photoBuffer);
          pass.addBuffer('thumbnail@2x.png', photoBuffer);
        }
      } catch (e) {
        // Photo fetch failed, continue without thumbnail
      }
    }

    // Generate the .pkpass file
    const passBuffer = pass.getAsBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug || 'tavvy-card'}.pkpass"`);
    res.setHeader('Content-Length', passBuffer.length.toString());
    
    return res.status(200).send(passBuffer);

  } catch (error: any) {
    console.error('Apple Wallet pass generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate pass',
      message: error.message,
    });
  }
}

function hexToRgbString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'rgb(102, 126, 234)';
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
}
