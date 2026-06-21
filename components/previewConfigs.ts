import { PlaceConfig } from './PreviewPlace';

export const CONFIGS: Record<string, PlaceConfig> = {
  restaurant: {
    type: 'Restaurant', name: 'Tatte Bakery & Café', photo: '/preview-bakery.jpg',
    meta: 'Bakery · Boston, MA · 0.4 mi', openLine: 'Open till 8pm', reviewsSub: '642 signals · 142 people', cta: 'Add Review',
    actions: [{ key: 'phone', label: 'Call' }, { key: 'website', label: 'Website' }, { key: 'menu', label: 'Menu' }, { key: 'order', label: 'Order' }, { key: 'share', label: 'Share' }],
    groups: [
      { key: 'good', items: [
        { label: 'Amazing Pastries', tapCount: 142, category: 'good', emoji: '🥐' }, { label: 'Great Coffee', tapCount: 98, category: 'good', emoji: '☕' },
        { label: 'Fresh Ingredients', tapCount: 64, category: 'good', emoji: '🥗' }, { label: 'Friendly Staff', tapCount: 52, category: 'good', emoji: '😊' }, { label: 'Good Wifi', tapCount: 31, category: 'good', emoji: '📶' }] },
      { key: 'vibe', items: [{ label: 'Cozy', tapCount: 76, category: 'vibe', emoji: '🛋️' }, { label: 'Instagrammable', tapCount: 58, category: 'vibe', emoji: '📸' }, { label: 'Good for Work', tapCount: 40, category: 'vibe', emoji: '💻' }] },
      { key: 'headsup', items: [{ label: 'Long Wait', tapCount: 45, category: 'headsup', emoji: '⏳' }, { label: 'Cash Only', tapCount: 22, category: 'headsup', emoji: '💵' }, { label: 'Cramped', tapCount: 14, category: 'headsup', emoji: '🪑' }] },
    ],
    description: 'A beloved all-day café where the pastry case does the talking — flaky croissants, shakshuka and seasonal tarts in a sunlit, plant-filled room. Reviewers keep coming back for the coffee and the cozy work-friendly vibe; just expect a line at peak hours.',
    popularLabel: 'Popular for', popular: ['Pastries', 'Coffee', 'Working', 'Brunch'],
    extras: [{ title: 'Menu highlights', kind: 'list', items: [{ label: 'Shakshuka', sub: '$16' }, { label: 'Almond Croissant', sub: '$5.5' }, { label: 'Halloumi Sandwich', sub: '$14' }, { label: 'Pistachio Tart', sub: '$7' }] }],
    info: [{ icon: '📍', main: '399 Boylston St, Boston, MA 02116', act: 'Directions' }, { icon: '🕐', main: '<b style="color:#16a34a">Open</b> · till 8:00 PM', hours: [['Mon – Fri', '7AM – 8PM'], ['Saturday', '8AM – 8PM'], ['Sunday', '8AM – 6PM']] }, { icon: '💵', main: '$$ · Bakery, Café' }],
    reviews: [
      { initial: 'M', color: '#00C2CB', name: 'Maya R.', when: '2 days ago', signals: [{ label: 'Amazing Pastries', category: 'good' }, { label: 'Cozy', category: 'vibe' }, { label: 'Long Wait', category: 'headsup' }] },
      { initial: 'J', color: '#8A05BE', name: 'Jordan K.', when: '1 week ago', signals: [{ label: 'Good for Work', category: 'vibe' }, { label: 'Great Coffee', category: 'good' }, { label: 'Good Wifi', category: 'good' }] },
    ],
  },

  hotel: {
    type: 'Hotel', name: 'The Liberty Hotel', photo: '/preview-hotel.jpg',
    meta: '4-star Hotel · Beacon Hill, Boston · 1.1 mi', openLine: 'Rooms available tonight', reviewsSub: '1,204 signals · 318 guests', cta: 'Add Review',
    actions: [{ key: 'book', label: 'Book' }, { key: 'rooms', label: 'Rooms' }, { key: 'amenities', label: 'Amenities' }, { key: 'phone', label: 'Call' }, { key: 'website', label: 'Website' }],
    groups: [
      { key: 'good', items: [
        { label: 'Comfy Beds', tapCount: 210, category: 'good', emoji: '🛏️' }, { label: 'Great Location', tapCount: 188, category: 'good', emoji: '📍' },
        { label: 'Clean Rooms', tapCount: 156, category: 'good', emoji: '✨' }, { label: 'Friendly Staff', tapCount: 132, category: 'good', emoji: '🛎️' }, { label: 'Great Bar', tapCount: 104, category: 'good', emoji: '🍸' }] },
      { key: 'vibe', items: [{ label: 'Historic Charm', tapCount: 142, category: 'vibe', emoji: '🏛️' }, { label: 'Romantic', tapCount: 120, category: 'vibe', emoji: '🥂' }, { label: 'Lively Scene', tapCount: 88, category: 'vibe', emoji: '🎉' }] },
      { key: 'headsup', items: [{ label: 'Pricey Parking', tapCount: 96, category: 'headsup', emoji: '🅿️' }, { label: 'Noisy at Night', tapCount: 54, category: 'headsup', emoji: '🔊' }, { label: 'Small Rooms', tapCount: 33, category: 'headsup', emoji: '📐' }] },
    ],
    description: 'A landmark hotel set in a beautifully restored 19th-century jailhouse on Beacon Hill — soaring atrium, buzzing bars and a see-and-be-seen scene. Guests love the location and design; the trade-off is a lively (sometimes loud) crowd and steep valet parking.',
    popularLabel: 'Known for', popular: ['Romantic stays', 'Nightlife', 'Design', 'City views'],
    extras: [
      { title: 'Room types', kind: 'list', sub: 'from $349/night', items: [{ label: 'Liberty King', sub: 'from $349' }, { label: 'Double Queen', sub: 'from $399' }, { label: 'City-View Suite', sub: 'from $629' }, { label: 'Jailhouse Loft', sub: 'from $899' }] },
      { title: 'Amenities', kind: 'chips', items: ['Free Wifi', 'Pool', 'Fitness Center', 'Spa', '2 Restaurants', '3 Bars', 'Valet Parking', 'Pet Friendly', '24h Room Service', 'Concierge'] },
    ],
    info: [{ icon: '📍', main: '215 Charles St, Boston, MA 02114', act: 'Directions' }, { icon: '🕐', main: 'Check-in 3:00 PM · Check-out 12:00 PM' }, { icon: '💵', main: 'From $349 / night · 4-star' }, { icon: '🐾', main: 'Pet friendly · Free cancellation' }],
    reviews: [
      { initial: 'A', color: '#00C2CB', name: 'Aisha M.', when: '3 days ago', signals: [{ label: 'Comfy Beds', category: 'good' }, { label: 'Historic Charm', category: 'vibe' }, { label: 'Pricey Parking', category: 'headsup' }] },
      { initial: 'T', color: '#8A05BE', name: 'Tom B.', when: '2 weeks ago', signals: [{ label: 'Great Location', category: 'good' }, { label: 'Lively Scene', category: 'vibe' }, { label: 'Noisy at Night', category: 'headsup' }] },
    ],
  },

  service: {
    type: 'Service · Plumber', name: 'BrightFlow Plumbing', photo: '/preview-service.jpg',
    meta: 'Plumber · Serving Greater Boston · Licensed', openLine: 'Available today', reviewsSub: '486 signals · 140 customers', cta: 'Add Review',
    actions: [{ key: 'phone', label: 'Call' }, { key: 'quote', label: 'Quote' }, { key: 'book', label: 'Book' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'website', label: 'Website' }],
    groups: [
      { key: 'good', items: [
        { label: 'Fair Pricing', tapCount: 188, category: 'good', emoji: '💲' }, { label: 'On Time', tapCount: 164, category: 'good', emoji: '⏱️' },
        { label: 'Quality Work', tapCount: 152, category: 'good', emoji: '🔧' }, { label: 'Clean Worksite', tapCount: 119, category: 'good', emoji: '🧹' }, { label: 'Licensed & Insured', tapCount: 101, category: 'good', emoji: '🛡️' }] },
      { key: 'vibe', items: [{ label: 'Professional', tapCount: 140, category: 'vibe', emoji: '👔' }, { label: 'Friendly', tapCount: 98, category: 'vibe', emoji: '😊' }, { label: 'Responsive', tapCount: 86, category: 'vibe', emoji: '⚡' }] },
      { key: 'headsup', items: [{ label: 'Booked Out', tapCount: 52, category: 'headsup', emoji: '📅' }, { label: 'Cash Preferred', tapCount: 28, category: 'headsup', emoji: '💵' }, { label: 'Weekend Surcharge', tapCount: 19, category: 'headsup', emoji: '➕' }] },
    ],
    description: 'A family-run plumbing crew known for fast, tidy work and straight pricing — from leaky faucets to full repipes. Customers rave about clear upfront quotes and on-time arrivals; they do book up fast, so call ahead for non-emergencies.',
    popularLabel: 'Specializes in', popular: ['Emergencies', 'Water heaters', 'Repipes', 'Drains'],
    extras: [
      { title: 'Services', kind: 'chips', items: ['Leak Repair', 'Water Heaters', 'Drain Cleaning', 'Repiping', 'Fixture Install', 'Sump Pumps', 'Gas Lines', '24/7 Emergency'] },
      { title: 'Credentials', kind: 'list', items: [{ label: 'Master Plumber License', sub: '#MA-12345' }, { label: 'Fully Insured & Bonded' }, { label: 'In business since', sub: '2009' }, { label: 'Free written estimates' }] },
    ],
    info: [{ icon: '📍', main: 'Service area: Greater Boston (25 mi)', act: 'Map' }, { icon: '🕐', main: '<b style="color:#16a34a">Open</b> · Mon–Sat 7AM–7PM · 24/7 emergency', hours: [['Mon – Sat', '7AM – 7PM'], ['Sunday', 'Emergency only'], ['Emergency', '24 / 7']] }, { icon: '💵', main: 'Free estimates · ~$120/hr' }],
    reviews: [
      { initial: 'R', color: '#00C2CB', name: 'Rosa P.', when: '4 days ago', signals: [{ label: 'Fair Pricing', category: 'good' }, { label: 'On Time', category: 'good' }, { label: 'Professional', category: 'vibe' }] },
      { initial: 'D', color: '#F5A623', name: 'Derek L.', when: '3 weeks ago', signals: [{ label: 'Quality Work', category: 'good' }, { label: 'Responsive', category: 'vibe' }, { label: 'Booked Out', category: 'headsup' }] },
    ],
  },

  construction: {
    type: 'General Contractor', name: 'Keystone Builders', photo: '/preview-construction.jpg',
    meta: 'General Contractor · Greater Boston · 18 yrs', openLine: 'Booking 2026 projects', reviewsSub: '912 signals · 211 clients', cta: 'Add Review',
    actions: [{ key: 'phone', label: 'Call' }, { key: 'quote', label: 'Quote' }, { key: 'portfolio', label: 'Portfolio' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'website', label: 'Website' }],
    groups: [
      { key: 'good', items: [
        { label: 'Quality Work', tapCount: 204, category: 'good', emoji: '🏗️' }, { label: 'On Budget', tapCount: 176, category: 'good', emoji: '💲' },
        { label: 'On Schedule', tapCount: 158, category: 'good', emoji: '📆' }, { label: 'Great Communication', tapCount: 141, category: 'good', emoji: '📞' }, { label: 'Licensed & Bonded', tapCount: 112, category: 'good', emoji: '🛡️' }] },
      { key: 'vibe', items: [{ label: 'Professional', tapCount: 150, category: 'vibe', emoji: '👷' }, { label: 'Detail-Oriented', tapCount: 110, category: 'vibe', emoji: '📐' }, { label: 'Trustworthy', tapCount: 92, category: 'vibe', emoji: '🤝' }] },
      { key: 'headsup', items: [{ label: 'Long Lead Time', tapCount: 64, category: 'headsup', emoji: '⏳' }, { label: 'Premium Pricing', tapCount: 47, category: 'headsup', emoji: '💎' }, { label: 'Books Out Early', tapCount: 31, category: 'headsup', emoji: '📅' }] },
    ],
    description: 'An award-winning design-build firm specializing in high-end home renovations, additions and custom builds. Clients consistently flag on-budget, on-schedule delivery and tight communication — the trade-off is a premium rate and a waitlist for new projects.',
    popularLabel: 'Specializes in', popular: ['Kitchens', 'Additions', 'Custom homes', 'Decks'],
    extras: [
      { title: 'Specialties', kind: 'chips', items: ['Kitchen Remodels', 'Bath Remodels', 'Home Additions', 'Custom Homes', 'Decks & Porches', 'Basements', 'Historic Restoration'] },
      { title: 'Recent projects', kind: 'list', items: [{ label: 'Beacon Hill Brownstone Reno', sub: '2025' }, { label: 'Cambridge Kitchen + Addition', sub: '2025' }, { label: 'Wellesley Custom Build', sub: '2024' }] },
      { title: 'Credentials', kind: 'list', items: [{ label: 'CSL & HIC Licensed', sub: '#CS-098765' }, { label: 'Bonded & Insured' }, { label: '18 years in business' }, { label: 'BBB A+ · 4.9★ across platforms' }] },
    ],
    info: [{ icon: '📍', main: 'Service area: Greater Boston & MetroWest', act: 'Map' }, { icon: '🕐', main: 'Office Mon–Fri 8AM–5PM · Free consults' }, { icon: '💵', main: 'By estimate · premium tier' }],
    reviews: [
      { initial: 'S', color: '#00C2CB', name: 'Sandra W.', when: '1 week ago', signals: [{ label: 'On Budget', category: 'good' }, { label: 'Detail-Oriented', category: 'vibe' }, { label: 'Long Lead Time', category: 'headsup' }] },
      { initial: 'M', color: '#8A05BE', name: 'Marcus T.', when: '1 month ago', signals: [{ label: 'Quality Work', category: 'good' }, { label: 'Great Communication', category: 'good' }, { label: 'Professional', category: 'vibe' }] },
    ],
  },

  airport: {
    type: 'International Airport', name: 'Boston Logan (BOS)', photo: '/preview-airport.jpg',
    meta: 'International Airport · East Boston, MA', openLine: 'Open 24 hours', reviewsSub: '3,820 signals · 1.1k travelers', cta: 'Add Review',
    actions: [{ key: 'flights', label: 'Flights' }, { key: 'terminals', label: 'Map' }, { key: 'parking', label: 'Parking' }, { key: 'map', label: 'Directions' }, { key: 'website', label: 'Website' }],
    groups: [
      { key: 'good', items: [
        { label: 'Easy Navigation', tapCount: 312, category: 'good', emoji: '🧭' }, { label: 'Good Food', tapCount: 268, category: 'good', emoji: '🍽️' },
        { label: 'Clean', tapCount: 241, category: 'good', emoji: '✨' }, { label: 'Free Wifi', tapCount: 220, category: 'good', emoji: '📶' }, { label: 'Fast Rideshare', tapCount: 150, category: 'good', emoji: '🚕' }] },
      { key: 'vibe', items: [{ label: 'Modern', tapCount: 180, category: 'vibe', emoji: '🏙️' }, { label: 'Spacious', tapCount: 140, category: 'vibe', emoji: '🌀' }, { label: 'Ocean Views', tapCount: 96, category: 'vibe', emoji: '🌊' }] },
      { key: 'headsup', items: [{ label: 'Long Security Lines', tapCount: 188, category: 'headsup', emoji: '🛂' }, { label: 'Expensive Parking', tapCount: 154, category: 'headsup', emoji: '🅿️' }, { label: 'Few Outlets', tapCount: 72, category: 'headsup', emoji: '🔌' }] },
    ],
    description: "New England's largest airport — five terminals, 50+ airlines and a growing roster of local food and shops just minutes from downtown. Travelers love how easy it is to get to via the tunnel and Blue Line; peak-hour security and pricey parking are the main gripes.",
    popularLabel: 'Good for', popular: ['Domestic', 'International', 'Dining', 'Lounges'],
    extras: [
      { title: 'Airlines', kind: 'chips', sub: '50+ carriers', items: ['JetBlue', 'Delta', 'American', 'United', 'Southwest', 'Cape Air', 'Lufthansa', 'British Airways', 'Aer Lingus', 'Emirates', 'Air France', 'Icelandair'] },
      { title: 'Terminals', kind: 'list', items: [{ label: 'Terminal A', sub: 'Delta, WestJet' }, { label: 'Terminal B', sub: 'American, United, Southwest, Spirit' }, { label: 'Terminal C', sub: 'JetBlue, Cape Air' }, { label: 'Terminal E', sub: 'International arrivals' }] },
      { title: 'Shops & dining', kind: 'chips', items: ['Legal Sea Foods', 'Dunkin', 'Boston Beer Works', 'Hudson News', 'Lucky Strike', 'Cibo', 'Starbucks', 'Sephora'] },
      { title: 'Getting here', kind: 'list', items: [{ label: 'Blue Line · Airport stop', sub: 'free shuttle' }, { label: 'Sumner / Ted Williams Tunnel', sub: 'from downtown' }, { label: 'Silver Line SL1', sub: 'from South Station' }, { label: 'Logan Express', sub: 'Back Bay, Braintree, Framingham' }] },
    ],
    info: [{ icon: '📍', main: '1 Harborside Dr, East Boston, MA 02128', act: 'Directions' }, { icon: '🕐', main: '<b style="color:#16a34a">Open 24 hours</b> · TSA 3:30AM–10PM' }, { icon: '🅿️', main: 'Central Parking $39/day · Economy $27/day' }, { icon: '✈️', main: 'IATA: BOS · 5 terminals · 50+ airlines' }],
    reviews: [
      { initial: 'N', color: '#00C2CB', name: 'Nina G.', when: '1 day ago', signals: [{ label: 'Easy Navigation', category: 'good' }, { label: 'Good Food', category: 'good' }, { label: 'Long Security Lines', category: 'headsup' }] },
      { initial: 'K', color: '#F5A623', name: 'Kofi A.', when: '5 days ago', signals: [{ label: 'Modern', category: 'vibe' }, { label: 'Free Wifi', category: 'good' }, { label: 'Expensive Parking', category: 'headsup' }] },
    ],
  },
};

export const TYPE_ORDER = ['restaurant', 'hotel', 'service', 'construction', 'airport'];
export const TYPE_LABEL: Record<string, string> = {
  restaurant: 'Restaurant', hotel: 'Hotel', service: 'Service business', construction: 'Construction', airport: 'Airport',
};
