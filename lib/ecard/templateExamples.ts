import type { Template } from '../../config/eCardTemplates';
const asset = (name: string) => `https://tavvy.com/images/ecard-examples/${name}`;
const photo = (name: string, width = 640) => `https://tavvy.com/_next/image?url=${encodeURIComponent(`/images/ecard-examples/${name}`)}&w=${width}&q=85`;
type Example = { name: string; title: string; company: string; bio: string; portrait?: string; banner?: string; links: string[] };
const examples: Record<string, Example> = {
  executive: { name: 'James Chen', title: 'Financial consultant', company: 'Chen & Company', bio: 'Clear conversations. Thoughtful planning. A practical next step for your goals.', portrait: photo('james-chen.png'), links: ['Schedule a conversation', 'How I work', 'Planning resources'] },
  creator: { name: 'Emma Rodriguez', title: 'Lifestyle writer & creator', company: 'Bloom & Balance', bio: 'A little more intention, every day. Stories, simple recipes, and space to slow down.', portrait: photo('emma-rodriguez.png'), links: ['Read the latest stories', 'My favorite recipes', 'Work with me', 'Join the newsletter'] },
  founder: { name: 'David Kim', title: 'Founder & product designer', company: 'NexaFlow Studio', bio: 'Turning ambitious ideas into useful, thoughtfully designed products.', portrait: photo('david-kim.png'), links: ['Explore our work', 'Start a project', 'Meet the studio'] },
  realtor: { name: 'Jennifer Walsh', title: 'Real estate advisor', company: 'Walsh Properties', bio: 'A thoughtful approach to finding a place you can call home.', portrait: photo('jennifer-walsh.png'), links: ['Explore properties', 'Book a consultation', 'A guide to your next move'] },
  chef: { name: 'Chef Marcus Thompson', title: 'Chef & restaurant owner', company: 'Ember & Oak', bio: 'Seasonal ingredients, a warm welcome, and food made to bring people together.', portrait: photo('chef-marcus-clean.png', 1080), links: ['Explore the menu', 'Plan your visit', 'Private dining'] },
  fitness: { name: 'Jake Morrison', title: 'Personal fitness coach', company: 'Morrison Fitness', bio: 'Build strength at your pace. Simple routines, consistent support, and progress that fits your life.', portrait: photo('jake-fitness-hero.png', 1080), links: ['Find your training plan', 'Book an introduction', 'Meet your coach'] },
  mobile: { name: 'The Neighborhood Kitchen', title: 'Seasonal street food', company: '', bio: 'Fresh ingredients and a changing menu, wherever the day takes us.', portrait: asset('kitchen-mark.svg'), banner: photo('mobile-kitchen-cover.png', 1080), links: ['Upcoming stops', 'Catering & private events', 'Get in touch'] },
  faith: { name: 'Cedar Grove Church', title: 'A place to belong', company: '', bio: 'Come as you are. Find community, share a meal, and make room for what matters.', portrait: asset('cedar-mark.svg'), links: ['Plan your first visit', 'Sunday gatherings', 'Watch a message', 'Community & giving'] },
  civic: { name: 'Emma Rodriguez', title: 'Community representative', company: 'Example civic profile', bio: 'Listening closely, sharing clear plans, and staying connected with the community.', portrait: photo('emma-rodriguez.png'), links: ['Meet Emma', 'Community priorities', 'Upcoming conversations', 'Get in touch'] },
};
const layoutExample: Record<string, string> = {
  'biz-traditional': 'executive', 'biz-modern': 'founder', 'biz-minimalist': 'executive', basic: 'creator', blogger: 'creator',
  'business-card': 'executive', 'pro-card': 'founder', 'cover-card': 'creator', 'full-width': 'chef', 'pro-realtor': 'realtor',
  'pro-creative': 'founder', 'pro-corporate': 'executive', 'premium-static': 'fitness', 'mobile-business': 'mobile', church: 'faith',
};
/** Only reusable decoration follows a design into a new card. Never example identity, links or portraits. */
export function templateDesignDefaults(template: Template) {
  return {
    font_style: 'default',
    ...(template.layout === 'civic-card-flag' ? { banner_image_url: 'https://tavvy.com/images/brazil-flag-vertical.jpg' } : {}),
    ...(['biz-traditional', 'pro-corporate'].includes(template.layout) ? { banner_image_url: asset('soft-folds.svg') } : {}),
  };
}
/** Fictional, display-only examples. Never persist this object as a customer's card. */
export function templatePreviewData(template: Template, schemeId?: string | null) {
  const scheme = template.colorSchemes.find(item => item.id === schemeId) || template.colorSchemes[0];
  const civic = template.layout.startsWith('civic-') || template.layout === 'politician-generic';
  const example = examples[civic ? 'civic' : layoutExample[template.layout] || 'creator'];
  const card = {
    ...templateDesignDefaults(template), id: 'template-preview', slug: `example-${template.id}`, full_name: example.name,
    template_id: template.id, color_scheme_id: scheme?.id, title: example.title, company: example.company, bio: example.bio,
    profile_photo_url: example.portrait, ...(example.banner ? { banner_image_url: example.banner } : {}),
    phone: '+1 202 555 0147', email: 'hello@example.com', website: 'https://example.com', city: 'Boston', state: 'MA', country: 'USA',
    gradient_color_1: scheme?.primary, gradient_color_2: scheme?.secondary,
    social_instagram: 'https://example.com/instagram', social_linkedin: 'https://example.com/linkedin', featured_socials: ['instagram', 'linkedin'],
    show_contact_info: true, show_social_icons: true, is_active: true, is_published: false, theme: 'classic', gallery_images: [], videos: [], testimonials: [],
    ...(civic ? { office_running_for: 'Community council', campaign_slogan: 'Here to listen. Ready to help.', ballot_number: '00000', region: 'Example community' } : {}),
    ...(template.layout === 'mobile-business' ? { menu_title: 'From our kitchen', menu_items: [{ category: 'Favorites', emoji: '🍽️', items: [
      { name: 'Roasted vegetable bowl', description: 'Seasonal vegetables, grains, and lemon tahini.', price: '12' },
      { name: 'Crispy chicken sandwich', description: 'House slaw and herb sauce on a toasted bun.', price: '14' },
    ] }] } : {}),
  };
  const links = example.links.map((title, index) => ({ id: `template-link-${index}`, card_id: card.id, platform: 'website', icon: 'globe', title,
    url: `https://example.com/preview/${index}`, sort_order: index, is_active: true }));
  return { card, links };
}
