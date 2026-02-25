/**
 * FullCardPreview — Renders a full realistic preview of an eCard template
 * with sample data. Used in TemplateGallery carousel and other preview contexts.
 */

import React from 'react';
import {
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoYoutube,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoFacebook,
  IoGlobe,
  IoMail,
  IoCall,
} from 'react-icons/io5';
import { Template } from '../../../config/eCardTemplates';

const SAMPLE_AVATAR = '/images/sample-avatar.png';
const SAMPLE_BANNER = '/images/sample-banner.jpg';

export const SAMPLE_DATA = {
  name: 'Jane Smith',
  title: 'Content Creator & Designer',
  company: 'Creative Studio',
  bio: 'Helping brands tell their story through design and strategy.',
  phone: '+1 (555) 123-4567',
  email: 'jane@creativestudio.com',
  website: 'www.janesmith.com',
  location: 'Los Angeles, CA',
  handle: '@janesmith',
  pronouns: '(She/Her)',
  links: ['Get in Touch', 'Freebies & Resources', 'Read our Latest Blog Post', 'Shop Templates', 'Visit the Website'],
  bloggerLinks: ['ABOUT', 'MY BLOG', 'SHOP', 'NEWSLETTER', 'FREEBIE', 'CONTACT'],
  realtorLinks: ['ALL ABOUT ME', 'CLIENT TESTIMONIALS', 'VISIT MY WEBSITE', 'BOOK A FREE CONSULTATION'],
  socials: ['instagram', 'twitter', 'linkedin', 'facebook'] as string[],
  realtorSocials: ['instagram', 'twitter', 'linkedin', 'facebook', 'website'] as string[],
  industry: 'Marketing & Design',
  services: ['Branding', 'Web Design', 'Photography', 'Social Media'],
};

// SVG icon components for the preview — sized appropriately
const PIcon = ({ d, size = 16 }: { d: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d}/></svg>;
const PreviewPhoneIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />;
const PreviewEmailIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />;
const PreviewGlobeIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />;
const PreviewLocationIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />;
const PreviewMsgIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />;
const PreviewWhatsAppIcon = ({ size }: { size?: number }) => <PIcon size={size} d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.22.54-.27.72-.27l.58.01c.17.01.43-.07.68.52.25.6.83 2.09.9 2.24.07.15.05.34-.07.55-.12.21-.18.34-.35.52-.17.19-.37.42-.52.56-.17.16-.35.33-.15.65.2.32.89 1.48 1.88 2.38 1.27 1.14 2.38 1.52 2.72 1.69.34.17.54.14.74-.09.2-.23.83-.97 1.05-1.31.22-.34.44-.28.74-.17.3.11 1.95.92 2.28 1.08z" />;

// Social icon for preview
function PreviewSocialIcon({ platform, size = 16, color = '#fff' }: { platform: string; size?: number; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <IoLogoInstagram size={size} color={color} />,
    tiktok: <IoLogoTiktok size={size} color={color} />,
    youtube: <IoLogoYoutube size={size} color={color} />,
    linkedin: <IoLogoLinkedin size={size} color={color} />,
    twitter: <IoLogoTwitter size={size} color={color} />,
    facebook: <IoLogoFacebook size={size} color={color} />,
    website: <IoGlobe size={size} color={color} />,
  };
  return <>{icons[platform] || <IoGlobe size={size} color={color} />}</>;
}

export function FullCardPreview({ tmpl }: { tmpl: Template }) {
  const cs = tmpl.colorSchemes[0];
  const primary = cs?.primary || '#333';
  const secondary = cs?.secondary || '#555';
  const txtCol = cs?.text || '#fff';
  const txtSec = cs?.textSecondary || 'rgba(255,255,255,0.7)';
  const accentCol = cs?.accent || '#00C853';
  const cardBgCol = cs?.cardBg || '#fff';
  const isLightBg = cs?.text === '#2d2d2d' || cs?.text === '#1f2937';

  // Real photo avatar
  const PhotoAvatar = ({ size, border: avatarBorder, borderRadius, shadow, style: extraStyle }: { size: number; border?: string; borderRadius?: string; shadow?: string; style?: React.CSSProperties }) => (
    <div style={{
      width: size, height: size, borderRadius: borderRadius || '50%',
      border: avatarBorder || 'none',
      flexShrink: 0, overflow: 'hidden',
      boxShadow: shadow || 'none',
      ...extraStyle,
    }}>
      <img src={SAMPLE_AVATAR} alt="Jane Smith" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     1. BASIC — Linktree style
     Reference: Linktree+Alternatives-min.png.webp
     White bg, circle photo, @handle, dark rounded link buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'basic') {
    // Basic template always has a white/light card background
    const btnBg = '#2D3436';
    const btnTxt = '#FFFFFF';
    const nameTxt = '#1a1a1a';
    const subTxt = '#555';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px 36px', background: '#fff', borderRadius: 16 }}>
        <PhotoAvatar size={110} border="3px solid rgba(0,0,0,0.06)" shadow="0 4px 20px rgba(0,0,0,0.1)" />
        <div style={{ fontSize: 20, fontWeight: 700, color: nameTxt, marginTop: 16, textAlign: 'center' }}>{SAMPLE_DATA.handle}</div>
        <div style={{ fontSize: 13, color: subTxt, marginTop: 6, textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>
          Helping brands tell their story through design and creative strategy
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
          {SAMPLE_DATA.links.map(l => (
            <div key={l} style={{
              width: '100%', height: 54, borderRadius: 12, background: btnBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: btnTxt }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     2. BLOGGER — Hannah Stone style
     Reference: blogger.jpg
     Pastel bg, white card cutout, large circle photo, script name,
     uppercase subtitle, pastel link buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'blogger') {
    const btnBg = `${accentCol}20`;
    const cardTxt = '#1a1a1a';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 24px' }}>
        {/* White inner card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '0 24px 28px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          position: 'relative',
          marginTop: 50,
        }}>
          {/* Photo overlapping top of card */}
          <div style={{ marginTop: -50 }}>
            <PhotoAvatar size={100} border="4px solid #fff" shadow="0 4px 20px rgba(0,0,0,0.1)" />
          </div>
          {/* Script name */}
          <div style={{ fontSize: 28, fontWeight: 400, color: cardTxt, marginTop: 14, fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic', letterSpacing: -0.5 }}>
            {SAMPLE_DATA.name}
          </div>
          <div style={{ fontSize: 10, color: '#777', marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: 2.5, fontWeight: 600, textAlign: 'center' }}>
            BUSINESS COACH &amp; ENTREPRENEUR
          </div>
          {/* Link buttons */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            {SAMPLE_DATA.bloggerLinks.map(l => (
              <div key={l} style={{
                width: '100%', height: 46, borderRadius: 4, background: btnBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: cardTxt, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     3. BUSINESS CARD — EdgeKart / Thomas Smith style
     Reference: Digital-Business-Card-1.webp
     Deep navy top, company name + logo, circle photo with white
     border, name, pronouns, title, company, colored action icons,
     white bottom "About Me"
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'business-card') {
    const darkBg = primary;
    const lightBottom = cardBgCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark navy top */}
        <div style={{ background: darkBg, padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* Company name at top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>T</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
          </div>
          {/* Circle photo */}
          <PhotoAvatar size={100} border="4px solid rgba(255,255,255,0.9)" shadow="0 4px 20px rgba(0,0,0,0.3)" />
          {/* Name & details */}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 10, textAlign: 'center' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'center' }}>{SAMPLE_DATA.pronouns}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', textAlign: 'center', marginTop: 2 }}>Solutions Manager</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{SAMPLE_DATA.company} Public Solutions LLP</div>
        </div>
        {/* Action icon row at the transition */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '16px 0', background: lightBottom }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewGlobeIcon, PreviewLocationIcon].map((Icon, i) => (
            <div key={i} style={{ width: 46, height: 46, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <span style={{ color: '#fff' }}><Icon size={18} /></span>
            </div>
          ))}
        </div>
        {/* White bottom — About Me */}
        <div style={{ background: lightBottom, padding: '4px 28px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 8 }}>About Me</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            I am a skilled Solutions Manager with seven years of experience in solving problems and engaging customers across industries.
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     4. FULL WIDTH — John Richards style
     Reference: FullwidtheCard.jpg
     Full-bleed B&W hero photo, bold white name overlaid left,
     title, company logo pill, action icon row, white "About Me"
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'full-width') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Full-bleed hero photo with overlay */}
        <div style={{ width: '100%', height: 300, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'grayscale(80%) brightness(0.6) contrast(1.1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
          {/* Name overlaid at bottom-left */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24, zIndex: 2 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: -1, textTransform: 'uppercase' as const }}>
              JANE<br/>SMITH
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: 500 }}>Marketing Manager</div>
            {/* Company pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 20, background: `${accentCol}cc` }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: accentCol }}>T</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{SAMPLE_DATA.company}</span>
            </div>
          </div>
        </div>
        {/* Action icon row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '14px 0', background: '#111' }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewMsgIcon, PreviewWhatsAppIcon, PreviewGlobeIcon].map((Icon, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff' }}><Icon size={16} /></span>
            </div>
          ))}
        </div>
        {/* White bottom — About Me */}
        <div style={{ background: '#fff', padding: '20px 28px 28px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>About Me</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginTop: 8 }}>
            Hi, I am Jane, working as a marketing manager at {SAMPLE_DATA.company}. Expert in building client relationships and driving growth.
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     5. PRO REALTOR — Realtor Hannah style
     Reference: realtor.jpg
     Full-width banner photo, arch-framed portrait overlapping,
     "Hi I'm Jane," bold heading, tan/beige link buttons,
     social icon row, company footer bar
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-realtor') {
    const btnBg = `${accentCol}30`;
    const btnTxt = txtCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* Full-width banner photo */}
        <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* Arch-framed portrait overlapping banner */}
        <div style={{ marginTop: -70, zIndex: 2, position: 'relative' }}>
          <div style={{
            width: 130, height: 160, borderRadius: '65px 65px 65px 65px',
            overflow: 'hidden', border: `3px solid ${cardBgCol}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        {/* Name section */}
        <div style={{ textAlign: 'center', marginTop: 14, padding: '0 28px' }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: txtSec }}>HI <span style={{ fontSize: 24, fontWeight: 800, color: txtCol, letterSpacing: -0.5 }}>I&apos;M JANE,</span></div>
          <div style={{ fontSize: 12, color: txtSec, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 2, fontWeight: 500 }}>YOUR LOCAL REALTOR</div>
        </div>
        {/* Link buttons */}
        <div style={{ width: '82%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {SAMPLE_DATA.realtorLinks.map(l => (
            <div key={l} style={{
              width: '100%', height: 44, borderRadius: 4, background: btnBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: btnTxt, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>{l}</span>
            </div>
          ))}
        </div>
        {/* Social icons row */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          {SAMPLE_DATA.realtorSocials.map(s => (
            <div key={s} style={{ width: 36, height: 36, borderRadius: '50%', background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={16} color="#fff" />
            </div>
          ))}
        </div>
        {/* Company footer bar */}
        <div style={{ width: '100%', padding: '10px 0', marginTop: 16, borderTop: `2px solid ${accentCol}`, textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: accentCol, letterSpacing: 2, textTransform: 'uppercase' as const }}>YOUR COMPANY NAME HERE</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     6. PRO CREATIVE — Arianne / A.Rich Culture style
     Reference: Digital-Business-Card-3.jpg
     Purple/colored gradient top with large photo, company logo,
     white bottom with name, title, company, bio, contact rows
     with colored circle icons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-creative') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Colored gradient top with photo */}
        <div style={{ position: 'relative', padding: '28px 24px 60px', display: 'flex', justifyContent: 'center' }}>
          {/* Company logo in top-right */}
          <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>CS</span>
            </div>
          </div>
          {/* Large circle photo */}
          <PhotoAvatar size={140} border="4px solid rgba(255,255,255,0.3)" shadow="0 8px 32px rgba(0,0,0,0.25)" />
        </div>
        {/* White bottom section */}
        <div style={{ background: cardBgCol, padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 14, color: '#555', fontWeight: 500 }}>Founder &amp; Principal Consultant</div>
          <div style={{ fontSize: 13, color: accentCol, fontStyle: 'italic', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5, marginTop: 8 }}>
            Business Consulting &amp; Talent Management for Creative Professionals
          </div>
          {/* Contact rows with colored circle icons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[
              { icon: <PreviewEmailIcon size={16} />, text: SAMPLE_DATA.email, bg: '#FF6B35' },
              { icon: <PreviewPhoneIcon size={16} />, text: SAMPLE_DATA.phone, bg: '#4CAF50' },
              { icon: <PreviewMsgIcon size={16} />, text: '+1 (555) 987-6543', bg: '#2196F3' },
              { icon: <PreviewGlobeIcon size={16} />, text: SAMPLE_DATA.website, bg: accentCol },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff' }}>{row.icon}</span>
                </div>
                <span style={{ fontSize: 13, color: '#444' }}>{row.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     7. PRO CORPORATE — Arch Gleason / Blue corporate style
     Reference: qrcc_dbc_key_benefits.png.webp
     Blue gradient top with abstract shapes, circle photo,
     name + title centered, action icon circles, Schedule Meeting
     section with CTA buttons
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-corporate') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Blue gradient top with decorative shapes */}
        <div style={{ position: 'relative', padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: -20, left: -30, width: 100, height: 100, borderRadius: '50%', background: `${accentCol}40`, zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `${accentCol}20`, zIndex: 0 }} />
          {/* Photo */}
          <div style={{ zIndex: 1, marginTop: 16 }}>
            <PhotoAvatar size={100} border="4px solid rgba(255,255,255,0.9)" shadow="0 4px 20px rgba(0,0,0,0.2)" />
          </div>
        </div>
        {/* Name section on white */}
        <div style={{ background: cardBgCol, padding: '16px 24px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 14, color: '#777', marginTop: 4 }}>General Contractor</div>
        </div>
        {/* Action icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '12px 0', background: cardBgCol }}>
          {[PreviewPhoneIcon, PreviewEmailIcon, PreviewMsgIcon, PreviewWhatsAppIcon].map((Icon, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span style={{ color: '#555' }}><Icon size={18} /></span>
            </div>
          ))}
        </div>
        {/* Industry + Services section */}
        <div style={{ background: cardBgCol, padding: '12px 24px 24px' }}>
          {/* Industry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={accentCol}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Industry</span>
          </div>
          <div style={{ background: `${accentCol}15`, padding: '8px 14px', borderRadius: 8, marginBottom: 14, display: 'inline-block', borderLeft: `3px solid ${accentCol}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: accentCol }}>Construction</span>
          </div>

          {/* Services */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={accentCol}><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Services</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Remodeling', 'Roofing', 'Plumbing', 'Electrical', 'Painting', 'Flooring'].map((service, i) => (
              <div key={i} style={{ background: `${accentCol}12`, padding: '6px 12px', borderRadius: 16, border: `1px solid ${accentCol}30`, fontSize: 11, fontWeight: 500, color: accentCol }}>
                {service}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     8. PRO CARD — Craft Media / Aisha Khan style
     Reference: eCardBusinessCard.webp
     Dark navy top with company logo, left-aligned name + pronouns
     + title + company, large circle photo on right with decorative
     ring, diagonal split to white bottom, bio, contact rows with
     icon circles, "Add to Contacts" button
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'pro-card') {
    const darkBg = primary;
    const goldAccent = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark top section */}
        <div style={{ background: darkBg, padding: '24px 28px 0', position: 'relative', minHeight: 280 }}>
          {/* Company logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={goldAccent}><path d="M2 21l10-9L2 3v18zm10 0l10-9L12 3v18z" opacity="0.8"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{SAMPLE_DATA.company}</div>
              <div style={{ fontSize: 8, color: goldAccent, letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 600 }}>CREATIVE AGENCY</div>
            </div>
          </div>
          {/* Name + details (left) and photo (right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: goldAccent, lineHeight: 1.2 }}>Ms. {SAMPLE_DATA.name.split(' ')[0]}<br/>{SAMPLE_DATA.name.split(' ')[1] || 'Smith'}</div>
              <div style={{ fontSize: 12, color: `${goldAccent}99`, fontStyle: 'italic', marginTop: 4 }}>{SAMPLE_DATA.pronouns}</div>
              <div style={{ fontSize: 14, color: goldAccent, fontWeight: 600, marginTop: 10 }}>Creative Director</div>
              <div style={{ fontSize: 12, color: goldAccent, opacity: 0.7, marginTop: 2 }}>{SAMPLE_DATA.company}</div>
            </div>
            {/* Large photo with decorative ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 130, height: 130, borderRadius: '50%',
                border: `2px solid ${goldAccent}40`,
                padding: 4,
                position: 'relative',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: `2px dashed ${goldAccent}30`,
                  padding: 3,
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                    <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Angled transition */}
        <div style={{ position: 'relative', height: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: darkBg }} />
          <svg viewBox="0 0 400 40" style={{ width: '100%', height: 40, display: 'block', position: 'relative', zIndex: 1 }} preserveAspectRatio="none">
            <path d="M0 40 L400 0 L400 40 Z" fill={cardBgCol} />
          </svg>
        </div>
        {/* White bottom section */}
        <div style={{ background: cardBgCol, padding: '8px 28px 28px' }}>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
            Passionate creative director with a love for storytelling and brand strategy.
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 16 }} />
          {/* Contact rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <PreviewPhoneIcon size={16} />, text: SAMPLE_DATA.phone, label: 'Work' },
              { icon: <PreviewEmailIcon size={16} />, text: SAMPLE_DATA.email, label: 'Work' },
              { icon: <PreviewGlobeIcon size={16} />, text: SAMPLE_DATA.website, label: 'Company' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: goldAccent }}>{row.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{row.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Add to Contacts button */}
          <div style={{ width: '100%', height: 48, borderRadius: 10, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>+ Add to Contacts</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── COVER CARD ─── Cover photo top, white bottom
  if (tmpl.layout === 'cover-card') {
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Cover photo */}
        <div style={{ width: '100%', height: 200, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Logo overlay */}
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={primary}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: primary }}>Logo</span>
          </div>
        </div>
        {/* Wavy accent */}
        <svg viewBox="0 0 400 20" style={{ width: '100%', height: 16, display: 'block', marginTop: -12 }} preserveAspectRatio="none">
          <path d="M0 20 C100 0 200 18 300 4 C350 -2 380 8 400 0 L400 20 Z" fill={cardBgCol} />
          <path d="M0 20 C80 6 160 20 260 6 C320 -1 370 12 400 4 L400 20 Z" fill={accentC} opacity="0.12" />
        </svg>
        {/* White bottom */}
        <div style={{ background: cardBgCol, padding: '4px 28px 28px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>Arianne S. Richardson</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 2 }}>Founder & Principal Consultant</div>
          <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 8 }}>A.Rich Culture</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>Business Consulting & Talent Management for Caribbean Creatives</div>
          {/* Contact rows */}
          {[
            { icon: <PreviewEmailIcon size={14} />, text: 'mail@arichculture.com', bg: primary },
            { icon: <PreviewPhoneIcon size={14} />, text: '+1 561 485 7408', bg: accentC },
            { icon: <PreviewMsgIcon size={14} />, text: 'Send a Text', bg: primary },
            { icon: <PreviewGlobeIcon size={14} />, text: 'www.arichculture.com', bg: accentC },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{row.icon}</div>
              <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     10. BIZ TRADITIONAL — Classic centered business card
     White card, logo top, circle photo, name/title/company centered,
     thin divider, contact rows with icons, social row at bottom
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-traditional') {
    const darkBg = primary;
    const accentC = accentCol;
    const borderC = cs?.border || '#c9a84c';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', overflow: 'hidden' }}>
        {/* Colored accent bar at top */}
        <div style={{ width: '100%', height: 6, background: darkBg }} />
        {/* Logo area */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={accentC}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: darkBg, letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
        </div>
        {/* Thin accent line */}
        <div style={{ width: 50, height: 2, background: accentC, margin: '16px auto' }} />
        {/* Circle photo */}
        <PhotoAvatar size={100} border={`3px solid ${borderC}`} shadow="0 4px 16px rgba(0,0,0,0.1)" />
        {/* Name / Title / Company */}
        <div style={{ textAlign: 'center', padding: '14px 28px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{SAMPLE_DATA.name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: darkBg, marginTop: 4 }}>Solutions Manager</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
        </div>
        {/* Divider */}
        <div style={{ width: '80%', height: 1, background: '#e5e5e5', margin: '16px auto' }} />
        {/* Contact rows */}
        <div style={{ width: '100%', padding: '0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: <PreviewPhoneIcon size={14} />, text: SAMPLE_DATA.phone },
            { icon: <PreviewEmailIcon size={14} />, text: SAMPLE_DATA.email },
            { icon: <PreviewGlobeIcon size={14} />, text: SAMPLE_DATA.website },
            { icon: <PreviewLocationIcon size={14} />, text: '123 Main St, Los Angeles, CA 90001' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${darkBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: darkBg }}>{row.icon}</div>
              <span style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>{row.text}</span>
            </div>
          ))}
        </div>
        {/* Social icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '18px 0 6px' }}>
          {['instagram', 'tiktok', 'linkedin'].map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={14} color="#fff" />
            </div>
          ))}
        </div>
        {/* Save Contact button */}
        <div style={{ width: 'calc(100% - 56px)', margin: '12px 28px 24px', height: 44, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>+ Save Contact</span>
        </div>
        {/* Bottom accent bar */}
        <div style={{ width: '100%', height: 4, background: accentC }} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     11. BIZ MODERN — Split layout modern business card
     Colored top with logo + name + title, photo overlapping,
     curved transition, white bottom with contact rows + social
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-modern') {
    const darkBg = primary;
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Colored top section */}
        <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`, padding: '28px 24px 60px', position: 'relative' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>{SAMPLE_DATA.company}</span>
          </div>
          {/* Name + Title (left) */}
          <div style={{ paddingRight: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{SAMPLE_DATA.name}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>Solutions Manager</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
          </div>
          {/* Photo (right, overlapping) */}
          <div style={{ position: 'absolute', right: 24, bottom: -40 }}>
            <PhotoAvatar size={110} border="4px solid #fff" shadow="0 4px 20px rgba(0,0,0,0.2)" />
          </div>
        </div>
        {/* Curved transition */}
        <svg viewBox="0 0 400 30" style={{ width: '100%', height: 24, display: 'block', marginTop: -1 }} preserveAspectRatio="none">
          <path d="M0 0 L400 0 L400 30 C300 0 100 0 0 30 Z" fill={`url(#modernGrad_${tmpl.id})`} />
          <defs><linearGradient id={`modernGrad_${tmpl.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={primary}/><stop offset="100%" stopColor={secondary}/></linearGradient></defs>
        </svg>
        {/* White bottom */}
        <div style={{ background: '#fff', padding: '28px 24px 24px' }}>
          {/* Contact rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <PreviewPhoneIcon size={14} />, text: SAMPLE_DATA.phone, label: 'Work' },
              { icon: <PreviewEmailIcon size={14} />, text: SAMPLE_DATA.email, label: 'Work' },
              { icon: <PreviewGlobeIcon size={14} />, text: SAMPLE_DATA.website, label: 'Company' },
              { icon: <PreviewLocationIcon size={14} />, text: '123 Main St, LA, CA 90001', label: 'Office' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{row.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{row.text}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{row.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Social icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            {['instagram', 'tiktok', 'linkedin'].map(s => (
              <div key={s} style={{ width: 34, height: 34, borderRadius: '50%', background: accentC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PreviewSocialIcon platform={s} size={14} color="#fff" />
              </div>
            ))}
          </div>
          {/* Save Contact button */}
          <div style={{ width: '100%', height: 44, borderRadius: 8, background: darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>+ Save Contact</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     12. BIZ MINIMALIST — Ultra-clean minimal business card
     Lots of whitespace, small logo, square photo, thin type,
     minimal contact rows, text-style social handles
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'biz-minimalist') {
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '32px 28px 28px' }}>
        {/* Small logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${accentC}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={accentC}><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: 1, textTransform: 'uppercase' as const }}>{SAMPLE_DATA.company}</span>
        </div>
        {/* Square photo */}
        <PhotoAvatar size={120} borderRadius="12px" border="none" shadow="0 2px 12px rgba(0,0,0,0.06)" />
        {/* Name */}
        <div style={{ fontSize: 26, fontWeight: 300, color: primary, marginTop: 20, letterSpacing: -0.5 }}>{SAMPLE_DATA.name}</div>
        {/* Title */}
        <div style={{ fontSize: 11, fontWeight: 500, color: '#999', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 2 }}>Solutions Manager</div>
        {/* Company */}
        <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{SAMPLE_DATA.company}</div>
        {/* Thin line */}
        <div style={{ width: 40, height: 1, background: '#e0e0e0', margin: '20px 0' }} />
        {/* Contact info — minimal style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Phone', text: SAMPLE_DATA.phone },
            { label: 'Email', text: SAMPLE_DATA.email },
            { label: 'Web', text: SAMPLE_DATA.website },
            { label: 'Address', text: '123 Main St, Los Angeles, CA 90001' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#bbb', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#444', fontWeight: 400, marginTop: 1 }}>{row.text}</span>
            </div>
          ))}
        </div>
        {/* Social handles as text */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { platform: 'Instagram', handle: '@janesmith' },
            { platform: 'TikTok', handle: '@janesmith' },
            { platform: 'LinkedIn', handle: 'in/janesmith' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#bbb', width: 60 }}>{s.platform}</span>
              <span style={{ fontSize: 12, color: accentC, fontWeight: 500 }}>{s.handle}</span>
            </div>
          ))}
        </div>
        {/* Save Contact — minimal */}
        <div style={{ width: '100%', height: 40, borderRadius: 6, border: `1.5px solid ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: primary }}>Save Contact</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     13b. PREMIUM STATIC — Full-width hero photo with gradient overlay
     Large hero image, gradient overlay, frosted glass name card,
     about section, action icons, social links
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'premium-static') {
    const bgCol = cs?.background || '#0a0a0a';
    const accentC = accentCol;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: bgCol }}>
        {/* Full-width hero photo with gradient overlay */}
        <div style={{ width: '100%', height: 280, position: 'relative', overflow: 'hidden' }}>
          <img src={SAMPLE_BANNER} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${primary} 100%)` }} />
          {/* Name overlay at bottom of hero */}
          <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Maya Johnson</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Fitness Coach & Wellness Expert</div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '20px 20px 24px', background: cardBgCol }}>
          {/* About card */}
          <div style={{ background: `${primary}10`, borderRadius: 14, padding: '16px 18px', marginBottom: 16, borderLeft: `3px solid ${accentC}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: accentC, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>About</div>
            <div style={{ fontSize: 12, color: cs?.text || '#FFFFFF', lineHeight: 1.6, opacity: 0.85 }}>Certified personal trainer helping you achieve your fitness goals. 10+ years of experience in strength training and nutrition.</div>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['Call', 'Email', 'Website'].map((label, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                background: i === 0 ? primary : 'rgba(255,255,255,0.08)',
                border: i === 0 ? 'none' : `1px solid ${cs?.text || '#FFFFFF'}20`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                {i === 0 && <PreviewPhoneIcon size={16} />}
                {i === 1 && <PreviewEmailIcon size={16} />}
                {i === 2 && <PreviewGlobeIcon size={16} />}
                <span style={{ fontSize: 10, fontWeight: 600, color: i === 0 ? '#fff' : (cs?.text || '#FFFFFF') }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Social icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {['IG', 'FB', 'YT', 'TT'].map((s, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${cs?.text || '#FFFFFF'}10`, border: `1px solid ${cs?.text || '#FFFFFF'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: cs?.text || '#FFFFFF', opacity: 0.7,
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     14. CIVIC CARD — Brazilian political santinho
     Matches the live Nikolas template: photo, name, title, bio,
     action buttons, social icons, dark info card with ballot #,
     community pulse, tabbed proposals, send message CTA
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'civic-card') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: '#f5f5f5', borderRadius: 16, overflow: 'hidden' }}>
        {/* Hero section — light bg, circle photo, name, title, bio, location */}
        <div style={{ width: '100%', padding: '28px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PhotoAvatar size={120} border={`3px solid ${primary}30`} shadow="0 4px 20px rgba(0,0,0,0.12)" />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5, marginTop: 16 }}>Maria Silva</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#555', marginTop: 4 }}>Vereadora</div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: '#666', textAlign: 'center', margin: '10px 0 0', maxWidth: 280 }}>
            Defensora da liberdade e dos valores da família. Comprometida com a transparência e o bem-estar da comunidade.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: '#f0f0f0', borderRadius: 20, padding: '5px 14px', border: '1px solid #e0e0e0' }}>
            <PreviewLocationIcon size={12} />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#555' }}>São Paulo, SP</span>
          </div>
        </div>
        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 12, padding: '18px 24px 12px' }}>
          {[{ icon: '\u260E', label: 'Call' }, { icon: '\u2709', label: 'Email' }, { icon: '\uD83C\uDF10', label: 'Website' }].map((a, i) => (
            <div key={i} style={{ width: 64, height: 56, borderRadius: 12, background: '#fff', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#555' }}>{a.label}</span>
            </div>
          ))}
        </div>
        {/* Social icons */}
        <div style={{ display: 'flex', gap: 10, padding: '4px 0 16px' }}>
          {['instagram', 'facebook', 'twitter', 'youtube'].map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={14} color="#555" />
            </div>
          ))}
        </div>
        {/* Dark info card — party, position, ballot number, slogan */}
        <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', borderRadius: 16, background: `linear-gradient(135deg, ${primary}, ${secondary})`, padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accentCol, letterSpacing: 2, textTransform: 'uppercase' as const }}>PL - PARTIDO LIBERAL</div>
          <div style={{ fontSize: 12, color: txtSec, marginTop: 4 }}>Vereadora • São Paulo • 2026</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: txtSec }}>VOTE</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: txtCol, letterSpacing: 6 }}>12345</span>
          </div>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: accentCol, marginTop: 12 }}>&quot;Pela liberdade, pela família e pelo Brasil&quot;</div>
        </div>
        {/* Community Pulse */}
        <div style={{ width: 'calc(100% - 32px)', margin: '0 16px 12px', background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Community Pulse</span>
            <span style={{ fontSize: 11, color: '#888' }}>96 votes</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: '59%', background: '#22c55e' }} />
            <div style={{ width: '27%', background: '#f59e0b' }} />
            <div style={{ width: '14%', background: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>Support 59%</span>
            <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600 }}>Improve 27%</span>
            <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Disagree 14%</span>
          </div>
        </div>
        {/* Tabbed proposals section */}
        <div style={{ width: 'calc(100% - 32px)', margin: '0 16px 12px' }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ flex: 1, padding: '8px 0', background: primary, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Proposals (3)</span>
            </div>
            <div style={{ flex: 1, padding: '8px 0', background: '#f0f0f0', textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Q&amp;A (3)</span>
            </div>
            <div style={{ flex: 1, padding: '8px 0', background: '#f0f0f0', textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Goals (3)</span>
            </div>
          </div>
          {['Defesa da Liberdade', 'Segurança Pública', 'Educação de Qualidade'].map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 6, border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{75 - i * 12}% support • 16 votes</div>
              </div>
              <span style={{ fontSize: 14, color: '#ccc' }}>&#9660;</span>
            </div>
          ))}
        </div>
        {/* Send Message CTA */}
        <div style={{ width: 'calc(100% - 32px)', margin: '4px 16px 20px' }}>
          <div style={{ width: '100%', height: 44, borderRadius: 12, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <PreviewMsgIcon size={16} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Send Message</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     15. CIVIC CARD FLAG — Brazilian flag background
     Same structure as civic-card but with flag bg + gradient overlay
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'civic-card-flag') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
        {/* Flag background with gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${primary} 0%, ${secondary} 50%, ${primary} 100%)`, opacity: 0.95 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://flagcdn.com/w640/br.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)' }} />
        {/* Content on top */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Photo + Name */}
          <div style={{ padding: '28px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PhotoAvatar size={110} border={`3px solid ${accentCol}`} shadow="0 4px 24px rgba(0,0,0,0.3)" />
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginTop: 14, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Maria Silva</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Vereadora</div>
          </div>
          {/* Ballot number card */}
          <div style={{ width: 'calc(100% - 40px)', margin: '16px 20px 0', borderRadius: 14, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: accentCol, letterSpacing: 2, textTransform: 'uppercase' as const }}>PL - PARTIDO LIBERAL</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Vereadora • São Paulo • 2026</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 18px' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>VOTE</span>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: 6 }}>12345</span>
            </div>
            <div style={{ fontSize: 11, fontStyle: 'italic', color: accentCol, marginTop: 10 }}>&quot;Pela liberdade, pela família e pelo Brasil&quot;</div>
          </div>
          {/* Proposals */}
          <div style={{ width: 'calc(100% - 40px)', margin: '12px 20px' }}>
            {['Defesa da Liberdade', 'Segurança Pública', 'Educação de Qualidade'].map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 6, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{p}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{75 - i * 12}% support</div>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>&#9660;</span>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{ width: 'calc(100% - 40px)', margin: '0 20px 20px' }}>
            <div style={{ width: '100%', height: 44, borderRadius: 12, background: accentCol, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: primary }}>VOTE 12345</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     16. CIVIC CARD BOLD — Split layout, large photo, strong typography
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'civic-card-bold') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: '#f5f5f5' }}>
        {/* Bold hero with photo and name overlay */}
        <div style={{ width: '100%', position: 'relative', background: `linear-gradient(135deg, ${primary}, ${secondary})`, minHeight: 220 }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', overflow: 'hidden' }}>
            <img src={SAMPLE_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${primary} 0%, transparent 100%)` }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '28px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: accentCol, letterSpacing: 3, textTransform: 'uppercase' as const }}>PL - PARTIDO LIBERAL</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, marginTop: 12, lineHeight: 1.1 }}>MARIA<br/>SILVA</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Vereadora • São Paulo</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, background: accentCol, borderRadius: 8, padding: '10px 20px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: primary }}>VOTE</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: primary, letterSpacing: 4 }}>12345</span>
            </div>
          </div>
        </div>
        {/* Content cards below */}
        <div style={{ padding: '16px' }}>
          {/* Community Pulse */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Community Pulse</div>
            <div style={{ width: '100%', height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '59%', background: '#22c55e' }} />
              <div style={{ width: '27%', background: '#f59e0b' }} />
              <div style={{ width: '14%', background: '#ef4444' }} />
            </div>
          </div>
          {/* Proposals */}
          {['Defesa da Liberdade', 'Segurança Pública'].map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 6, border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{75 - i * 12}% support</div>
              </div>
              <span style={{ fontSize: 14, color: '#ccc' }}>&#9660;</span>
            </div>
          ))}
          {/* CTA */}
          <div style={{ width: '100%', height: 44, borderRadius: 10, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Send Message</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     17. CIVIC CARD CLEAN — Modern minimal white card design
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'civic-card-clean') {
    const bgCol = cs?.background || '#eff6ff';
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: bgCol, borderRadius: 16, overflow: 'hidden' }}>
        {/* Colored top strip */}
        <div style={{ width: '100%', height: 8, background: `linear-gradient(90deg, ${primary}, ${accentCol})` }} />
        {/* White card */}
        <div style={{ width: 'calc(100% - 32px)', margin: '20px 16px', background: '#fff', borderRadius: 16, padding: '28px 20px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PhotoAvatar size={90} border={`3px solid ${primary}30`} shadow="0 4px 16px rgba(0,0,0,0.08)" />
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginTop: 14 }}>Maria Silva</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: primary, marginTop: 4 }}>Vereadora</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: `${primary}10`, borderRadius: 20, padding: '4px 14px', border: `1px solid ${primary}15` }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: primary }}>PL • São Paulo • 2026</span>
            </div>
          </div>
          {/* Ballot number */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: '12px 0', borderTop: `1px solid ${primary}15`, borderBottom: `1px solid ${primary}15` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: primary }}>VOTE</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: primary, letterSpacing: 4 }}>12345</span>
          </div>
          {/* Bio */}
          <p style={{ fontSize: 12, lineHeight: 1.6, color: '#666', textAlign: 'center', margin: '14px 0 0' }}>
            Defensora da liberdade e dos valores da família. Comprometida com a transparência.
          </p>
        </div>
        {/* Proposals on bg */}
        <div style={{ width: 'calc(100% - 32px)', margin: '0 16px 12px' }}>
          {['Defesa da Liberdade', 'Segurança Pública', 'Educação de Qualidade'].map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{75 - i * 12}% support</div>
              </div>
              <span style={{ fontSize: 14, color: '#ccc' }}>&#9660;</span>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ width: 'calc(100% - 32px)', margin: '0 16px 20px' }}>
          <div style={{ width: '100%', height: 44, borderRadius: 22, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Send Message</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     18. CIVIC CARD RALLY — Campaign style, diagonal cuts, high energy
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'civic-card-rally') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 16, overflow: 'hidden', background: '#f5f5f5' }}>
        {/* Diagonal hero */}
        <div style={{ width: '100%', position: 'relative', background: `linear-gradient(135deg, ${primary}, ${secondary})`, paddingBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '24px 24px 0' }}>
            <PhotoAvatar size={80} border={`3px solid ${accentCol}`} shadow="0 4px 16px rgba(0,0,0,0.3)" />
            <div style={{ marginLeft: 16, flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1.1 }}>MARIA SILVA</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Vereadora • São Paulo</div>
            </div>
          </div>
          {/* Big ballot number */}
          <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: accentCol, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: primary }}>VOTE</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: primary, letterSpacing: 4 }}>12345</span>
            </div>
          </div>
          {/* Diagonal cut */}
          <svg viewBox="0 0 400 30" style={{ width: '100%', height: 30, display: 'block', position: 'absolute', bottom: 0 }} preserveAspectRatio="none">
            <path d="M0 30 L400 0 L400 30 Z" fill="#f5f5f5" />
          </svg>
        </div>
        {/* Content */}
        <div style={{ width: '100%', padding: '0 16px 16px' }}>
          {/* Slogan */}
          <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>
            <span style={{ fontSize: 12, fontStyle: 'italic', fontWeight: 600, color: primary }}>&quot;Pela liberdade, pela família e pelo Brasil&quot;</span>
          </div>
          {/* Community Pulse */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Community Pulse</div>
            <div style={{ width: '100%', height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '59%', background: '#22c55e' }} />
              <div style={{ width: '27%', background: '#f59e0b' }} />
              <div style={{ width: '14%', background: '#ef4444' }} />
            </div>
          </div>
          {/* Proposals */}
          {['Defesa da Liberdade', 'Segurança Pública', 'Educação de Qualidade'].map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 6, border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{75 - i * 12}% support</div>
              </div>
              <span style={{ fontSize: 14, color: '#ccc' }}>&#9660;</span>
            </div>
          ))}
          {/* CTA */}
          <div style={{ width: '100%', height: 48, borderRadius: 8, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, boxShadow: `0 4px 16px ${primary}40` }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>SEND MESSAGE</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     19. POLITICIAN GENERIC — International politician card
     Photo, bio, platform positions, endorsements
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'politician-generic') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0', background: cardBgCol, borderRadius: 16, overflow: 'hidden' }}>
        {/* Hero banner with gradient */}
        <div style={{ width: '100%', height: 180, position: 'relative', background: `linear-gradient(135deg, ${primary}, ${secondary})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
          {/* Decorative accent line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accentCol }} />
          <PhotoAvatar size={100} border={`3px solid ${accentCol}`} shadow="0 4px 20px rgba(0,0,0,0.3)" style={{ position: 'relative', zIndex: 1, marginBottom: -50 }} />
        </div>
        {/* Name + Title */}
        <div style={{ padding: '56px 20px 12px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: isLightBg ? '#1a1a1a' : txtCol, letterSpacing: -0.5 }}>John Doe</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: isLightBg ? '#666' : txtSec, marginTop: 4 }}>City Council Member</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: `${primary}15`, borderRadius: 20, padding: '4px 14px', border: `1px solid ${primary}25` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: primary }}>District 5</span>
          </div>
        </div>
        {/* Bio */}
        <div style={{ width: '100%', padding: '8px 24px 16px' }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: isLightBg ? '#555' : txtSec, textAlign: 'center', margin: 0 }}>
            Dedicated to building stronger communities through transparent governance and inclusive policy.
          </p>
        </div>
        {/* Platform Positions */}
        <div style={{ width: '100%', padding: '12px 20px', borderTop: `1px solid ${isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: primary, textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 10 }}>Platform</div>
          {['Education & Youth Programs', 'Infrastructure Investment', 'Public Safety Reform'].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: primary }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 13, color: isLightBg ? '#333' : txtCol, fontWeight: 500 }}>{p}</span>
            </div>
          ))}
        </div>
        {/* Endorsements */}
        <div style={{ width: '100%', padding: '12px 20px', borderTop: `1px solid ${isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: primary, textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 10 }}>Endorsements</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {['Trustworthy', 'Gets Results', 'Accessible'].map((s, i) => (
              <div key={i} style={{ background: `${primary}10`, borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${primary}20` }}>
                <span style={{ fontSize: 10, color: isLightBg ? '#444' : txtCol }}>{s}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: primary }}>{(38 - i * 12)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Contact CTA */}
        <div style={{ width: '100%', padding: '12px 20px 20px' }}>
          <div style={{ width: '100%', height: 44, borderRadius: 10, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${primary}40` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Contact Representative</span>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     20. MOBILE BUSINESS — On-the-go / mobile business card
     Gradient background, badge-style layout
     ═══════════════════════════════════════════════════════════ */
  if (tmpl.layout === 'mobile-business') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', background: `linear-gradient(135deg, ${primary}, ${secondary})`, padding: '32px 24px 28px', borderRadius: 16 }}>
        <PhotoAvatar size={100} border={`3px solid ${accentCol}`} shadow="0 4px 20px rgba(0,0,0,0.2)" />
        <div style={{ fontSize: 22, fontWeight: 700, color: txtCol, marginTop: 14, textAlign: 'center' }}>{SAMPLE_DATA.name}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: txtSec, marginTop: 4 }}>{SAMPLE_DATA.title}</div>
        <div style={{ fontSize: 12, color: accentCol, marginTop: 6 }}>{SAMPLE_DATA.company}</div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {[
            { icon: <PreviewPhoneIcon size={14} />, text: SAMPLE_DATA.phone },
            { icon: <PreviewEmailIcon size={14} />, text: SAMPLE_DATA.email },
            { icon: <PreviewGlobeIcon size={14} />, text: SAMPLE_DATA.website },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: txtCol }}>{row.icon}</div>
              <span style={{ fontSize: 12, color: txtCol, fontWeight: 500 }}>{row.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {SAMPLE_DATA.socials.map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PreviewSocialIcon platform={s} size={14} color={txtCol} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
