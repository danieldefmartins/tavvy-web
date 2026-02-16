/**
 * GET /api/og/[slug]
 * Generates a dynamic Open Graph image (1200×630) for a Tavvy card.
 * Used as the og:image URL in the public card page meta tags.
 *
 * Supports both regular business/personal cards AND civic/politician cards.
 * Civic cards show party, position, ballot number, and campaign slogan.
 *
 * Works on Railway (Node.js) — no Edge runtime required.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Cache the font so we don't re-fetch on every request
let fontCache: ArrayBuffer | null = null;
let fontBoldCache: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontCache) {
    const res = await fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf');
    fontCache = await res.arrayBuffer();
  }
  if (!fontBoldCache) {
    const res = await fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf');
    fontBoldCache = await res.arrayBuffer();
  }
  return { regular: fontCache, bold: fontBoldCache };
}

function isCivicLayout(layout: string | null): boolean {
  return !!layout && layout.startsWith('civic-card');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch card data (including civic-specific fields)
    let { data: card } = await supabase
      .from('digital_cards')
      .select('full_name, title, company, city, state, profile_photo_url, cover_photo_url, professional_category, slug, template_layout, party_name, office_running_for, ballot_number, campaign_slogan, region, election_year, bio')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (!card) {
      // Try custom domain
      const { data: domainData } = await supabase
        .from('custom_domains')
        .select('card_id')
        .eq('domain', slug)
        .single();
      if (domainData) {
        const { data: domainCard } = await supabase
          .from('digital_cards')
          .select('full_name, title, company, city, state, profile_photo_url, cover_photo_url, professional_category, slug, template_layout, party_name, office_running_for, ballot_number, campaign_slogan, region, election_year, bio')
          .eq('id', domainData.card_id)
          .single();
        card = domainCard;
      }
    }

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const isCivic = isCivicLayout(card.template_layout);

    // Get endorsement count (signal taps)
    const { count: endorsementCount } = await supabase
      .from('ecard_endorsement_signals')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', slug);

    // Load fonts
    const fonts = await loadFonts();

    // Fetch profile photo as base64 for embedding
    let profilePhotoBase64 = '';
    if (card.profile_photo_url) {
      try {
        const photoRes = await fetch(card.profile_photo_url);
        if (photoRes.ok) {
          const buffer = await photoRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = photoRes.headers.get('content-type') || 'image/png';
          profilePhotoBase64 = `data:${contentType};base64,${base64}`;
        }
      } catch (e) {
        // Silently fail — we'll show initials instead
      }
    }

    // Build location string
    const location = [card.city, card.state].filter(Boolean).join(', ');

    // Generate initials for fallback
    const initials = (card.full_name || 'T')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    let element;

    if (isCivic) {
      // ========== CIVIC / POLITICIAN CARD OG IMAGE ==========
      const civicLocation = [card.office_running_for, card.region, card.election_year].filter(Boolean).join(' \u2022 ');

      element = React.createElement(
        'div',
        {
          style: {
            width: 1200,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 40%, #0f2035 100%)',
            fontFamily: 'Inter',
            position: 'relative',
            overflow: 'hidden',
          },
        },
        // Decorative accent line at top
        React.createElement('div', {
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'linear-gradient(90deg, #2563EB, #60A5FA, #2563EB)',
            display: 'flex',
          },
        }),
        // Decorative circles
        React.createElement('div', {
          style: {
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(37,99,235,0.15)',
            display: 'flex',
          },
        }),
        React.createElement('div', {
          style: {
            position: 'absolute',
            bottom: -80,
            left: -40,
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '1px solid rgba(37,99,235,0.08)',
            display: 'flex',
          },
        }),
        // Main content area
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '50px 70px',
              flex: 1,
              gap: 50,
            },
          },
          // Left side: Photo + Ballot number
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                flexShrink: 0,
              },
            },
            // Profile photo
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: '4px solid rgba(37,99,235,0.5)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  background: profilePhotoBase64 ? 'transparent' : 'rgba(255,255,255,0.15)',
                },
              },
              profilePhotoBase64
                ? React.createElement('img', {
                    src: profilePhotoBase64,
                    width: 200,
                    height: 200,
                    style: { objectFit: 'cover', borderRadius: '50%' },
                  })
                : React.createElement(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 200,
                        height: 200,
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 64,
                        fontWeight: 700,
                      },
                    },
                    initials
                  )
            ),
            // Ballot number badge
            card.ballot_number
              ? React.createElement(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      background: 'rgba(37,99,235,0.25)',
                      borderRadius: 12,
                      padding: '8px 20px',
                      border: '1px solid rgba(37,99,235,0.4)',
                    },
                  },
                  React.createElement(
                    'div',
                    {
                      style: {
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.1em',
                      },
                    },
                    'VOTE'
                  ),
                  React.createElement(
                    'div',
                    {
                      style: {
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        letterSpacing: '0.08em',
                      },
                    },
                    card.ballot_number
                  )
                )
              : null
          ),
          // Right side: Text content
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 6,
              },
            },
            // Party badge
            card.party_name
              ? React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#60A5FA',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    },
                  },
                  card.party_name
                )
              : null,
            // Name
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 44,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginTop: 4,
                },
              },
              card.full_name || 'Tavvy Card'
            ),
            // Position + Region + Year
            civicLocation
              ? React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 20,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      marginTop: 6,
                    },
                  },
                  civicLocation
                )
              : null,
            // Campaign slogan
            card.campaign_slogan
              ? React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 18,
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.5)',
                      fontStyle: 'italic',
                      marginTop: 12,
                    },
                  },
                  `\u201C${card.campaign_slogan}\u201D`
                )
              : null,
            // Location + Endorsements row
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 24,
                  marginTop: 16,
                },
              },
              location
                ? React.createElement(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.45)',
                      },
                    },
                    React.createElement('div', { style: { display: 'flex' } }, '\u{1F4CD}'),
                    location
                  )
                : null,
              (endorsementCount && endorsementCount > 0)
                ? React.createElement(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 18,
                        color: 'rgba(255,255,255,0.45)',
                      },
                    },
                    React.createElement('div', { style: { display: 'flex', color: '#FFD700' } }, '\u2605'),
                    `${endorsementCount} endorsements`
                  )
                : null
            )
          )
        ),
        // Bottom bar with Tavvy branding
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 70px',
              borderTop: '1px solid rgba(37,99,235,0.2)',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.08em',
                },
              },
              'tavvy'
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: 16,
                color: 'rgba(255,255,255,0.35)',
              },
            },
            'Civic Card \u2022 Digital Political Card'
          )
        )
      );
    } else {
      // ========== REGULAR BUSINESS / PERSONAL CARD OG IMAGE ==========
      element = React.createElement(
        'div',
        {
          style: {
            width: 1200,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #1a2744 0%, #243b5e 40%, #1e3150 100%)',
            fontFamily: 'Inter',
            position: 'relative',
            overflow: 'hidden',
          },
        },
        // Decorative circles (background)
        React.createElement('div', {
          style: {
            position: 'absolute',
            top: -80,
            right: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
          },
        }),
        React.createElement('div', {
          style: {
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
          },
        }),
        // Main content area
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '60px 80px',
              flex: 1,
              gap: 60,
            },
          },
          // Profile photo
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: '4px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
                overflow: 'hidden',
                background: profilePhotoBase64 ? 'transparent' : 'rgba(255,255,255,0.15)',
              },
            },
            profilePhotoBase64
              ? React.createElement('img', {
                  src: profilePhotoBase64,
                  width: 220,
                  height: 220,
                  style: { objectFit: 'cover', borderRadius: '50%' },
                })
              : React.createElement(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 220,
                      height: 220,
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 72,
                      fontWeight: 700,
                    },
                  },
                  initials
                )
          ),
          // Text content
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                gap: 8,
              },
            },
            // Name
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                },
              },
              card.full_name || 'Tavvy Card'
            ),
            // Title
            card.title
              ? React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 26,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                      marginTop: 4,
                    },
                  },
                  card.title
                )
              : null,
            // Company
            card.company
              ? React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 22,
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.6)',
                      fontStyle: 'italic',
                      marginTop: 2,
                    },
                  },
                  card.company
                )
              : null,
            // Location + Endorsements row
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 24,
                  marginTop: 16,
                },
              },
              location
                ? React.createElement(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.55)',
                      },
                    },
                    React.createElement('div', { style: { display: 'flex' } }, '\u25CF'),
                    location
                  )
                : null,
              (endorsementCount && endorsementCount > 0)
                ? React.createElement(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.55)',
                      },
                    },
                    React.createElement('div', { style: { display: 'flex', color: '#FFD700' } }, '\u2605'),
                    `${endorsementCount} endorsements`
                  )
                : null
            )
          )
        ),
        // Bottom bar with Tavvy branding
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 80px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.08em',
                },
              },
              'tavvy'
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                fontSize: 18,
                color: 'rgba(255,255,255,0.4)',
              },
            },
            'Digital Business Card'
          )
        )
      );
    }

    // Render to SVG with satori
    const svg = await satori(element, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fonts.regular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fonts.bold,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // Convert SVG to PNG with resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Set cache headers (cache for 1 hour, stale-while-revalidate for 24 hours)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pngBuffer.length);
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error('OG image generation error:', err);
    return res.status(500).json({ error: 'Failed to generate OG image' });
  }
}
