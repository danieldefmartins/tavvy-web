/**
 * vCard (.vcf) Generation API
 * GET /api/ecard/wallet/vcard?slug=username
 * 
 * Generates a .vcf contact file from a digital card.
 * This works as a universal fallback for saving contacts
 * on any device without requiring Apple/Google Wallet setup.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, cardId } = req.query;

    if (!slug && !cardId) {
      return res.status(400).json({ error: 'slug or cardId is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase.from('digital_cards').select('*');
    if (slug) query = query.eq('slug', slug as string);
    else if (cardId) query = query.eq('id', cardId as string);
    
    const { data: card, error } = await query.single();
    if (error || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Parse name
    const nameParts = (card.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build vCard 3.0
    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.full_name || ''}`,
      `N:${lastName};${firstName};;;`,
    ];

    if (card.title) {
      lines.push(`TITLE:${card.title}`);
    }

    if (card.company) {
      lines.push(`ORG:${card.company}`);
    }

    if (card.phone) {
      lines.push(`TEL;TYPE=CELL:${card.phone}`);
    }

    if (card.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${card.email}`);
    }

    if (card.website) {
      const url = card.website.startsWith('http') ? card.website : `https://${card.website}`;
      lines.push(`URL:${url}`);
    }

    if (card.city || card.state) {
      lines.push(`ADR;TYPE=WORK:;;${card.city || ''};${card.state || ''};;;`);
    }

    if (card.bio) {
      lines.push(`NOTE:${card.bio.replace(/\n/g, '\\n')}`);
    }

    // Add card URL
    const cardUrl = `https://tavvy.com/${card.slug}`;
    lines.push(`URL;TYPE=Digital Card:${cardUrl}`);

    // Add profile photo as base64 if available
    if (card.profile_photo_url) {
      try {
        const photoResponse = await fetch(card.profile_photo_url);
        if (photoResponse.ok) {
          const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
          const photoBase64 = photoBuffer.toString('base64');
          lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`);
        }
      } catch (e) {
        // Photo fetch failed, skip
      }
    }

    // Add social links
    const socials = card.featured_socials || [];
    for (const social of socials) {
      const platform = typeof social === 'string' ? social : social.platformId || social.platform;
      const url = typeof social === 'string' ? '' : social.url;
      if (url) {
        lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${url}`);
      }
    }

    lines.push('END:VCARD');

    const vcardContent = lines.join('\r\n');

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug || 'contact'}.vcf"`);
    
    return res.status(200).send(vcardContent);

  } catch (error: any) {
    console.error('vCard generation error:', error);
    return res.status(500).json({ error: 'Failed to generate vCard' });
  }
}
