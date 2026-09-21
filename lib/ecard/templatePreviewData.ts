import type { Template } from '../../config/eCardTemplates';

/** Display-only examples for the public renderer; never persisted or published. */
export function templatePreviewData(template: Template, schemeId?: string | null) {
  const scheme = template.colorSchemes.find(item => item.id === schemeId) || template.colorSchemes[0];
  const card = {
    id: 'template-preview', full_name: 'Jane Smith', slug: 'template-preview',
    template_id: template.id, color_scheme_id: scheme?.id,
    title: 'Designer & Creative Consultant', company: 'Creative Studio',
    bio: 'Design, ideas, and useful connections. Explore my work and get in touch.',
    profile_photo_url: 'https://tavvy.com/images/sample-avatar.png',
    banner_image_url: 'https://tavvy.com/images/sample-banner.jpg',
    phone: '+1 555 010 0100', email: 'jane@example.com', website: 'https://example.com',
    city: 'Los Angeles', state: 'CA', country: 'USA',
    gradient_color_1: scheme?.primary, gradient_color_2: scheme?.secondary,
    social_instagram: 'https://example.com/instagram', social_linkedin: 'https://example.com/linkedin',
    featured_socials: ['instagram', 'linkedin'], show_contact_info: true, show_social_icons: true,
    is_active: true, is_published: false, theme: 'classic', gallery_images: [], videos: [], testimonials: [],
    ...(template.layout.startsWith('civic-') || template.layout === 'politician-generic'
      ? { title: 'Community Representative', company: '', campaign_slogan: 'Working together for our community', office_running_for: 'City Council', ballot_number: '12345' } : {}),
    ...(template.layout === 'church' ? { full_name: 'Community Church', title: 'A place to belong', company: '', bio: 'Join our community for worship, connection, and service.' } : {}),
    ...(template.layout === 'mobile-business' ? { full_name: 'The Neighborhood Kitchen', title: 'Fresh food, wherever we go', company: '', bio: 'Find our next stop and explore our menu.' } : {}),
  };
  const links = ['Explore my work', 'Book a conversation', 'Latest updates', 'Get in touch'].map((title, index) => ({
    id: `template-link-${index}`, card_id: card.id, platform: 'website', icon: 'globe', title,
    url: `https://example.com/preview/${index}`, sort_order: index, is_active: true,
  }));
  return { card, links };
}
