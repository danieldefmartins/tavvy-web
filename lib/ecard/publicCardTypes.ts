/** Existing public card view contract, shared with private studio previews. */
export interface CardLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  clicks: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface FormBlockData {
  formType: 'native' | 'gohighlevel' | 'typeform' | 'jotform' | 'googleforms' | 'calendly' | 'webhook';
  title: string;
  description?: string;
  buttonText: string;
  fields?: FormField[];
  successMessage?: string;
  ghlFormId?: string;
  ghlLocationId?: string;
  ghlWebhookUrl?: string;
  ghlEmbedCode?: string;
  embedUrl?: string;
  embedCode?: string;
  webhookUrl?: string;
  webhookMethod?: 'POST' | 'GET';
}

export interface CardData {
  id: string;
  slug: string;
  templateId: string;
  colorSchemeId: string;
  fullName: string;
  title: string;
  company: string;
  bio: string;
  description: string;
  pronouns: string;
  phone: string;
  email: string;
  website: string;
  websiteLabel: string;
  // Address fields
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  gradientColor1: string;
  gradientColor2: string;
  profilePhotoUrl: string | null;
  profilePhotoSize: 'small' | 'medium' | 'large' | 'xlarge';
  // Social links
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  socialYoutube: string;
  socialSnapchat: string;
  socialPinterest: string;
  socialWhatsapp: string;
  // Featured socials (array of platform IDs or objects with platform+url)
  featuredSocials: (string | { platform: string; url: string })[];
  // YouTube video block
  youtubeVideoId: string;
  youtubeTitle: string;
  // Gallery block
  galleryImages: { id: string; url: string; uri?: string; caption?: string }[];
  galleryTitle: string;
  // Testimonials block
  testimonials: { id: string; customerName: string; reviewText: string; rating: number; customerPhoto?: string; date?: string; source?: string }[];
  testimonialsTitle: string;
  // Form block
  formBlock: FormBlockData | null;
  // Appearance settings
  theme: string;
  backgroundType: string;
  backgroundImageUrl: string | null;
  buttonStyle: string;
  buttonColor: string | null;
  iconColor: string | null;
  socialIconColor: string | null;
  fontStyle: string;
  links: CardLink[];
  // Videos (Tavvy Shorts, external URLs)
  videos: { type: string; url: string; thumbnail_url?: string }[];
  tapCount: number;
  showContactInfo: boolean;
  showSocialIcons: boolean;
  fontColor: string | null;
  bannerImageUrl: string | null;
  // Professional category & endorsements
  professionalCategory: string;
  endorsementCount: number;
  topEndorsementTags: { label: string; emoji: string; count: number }[];
  recentEndorsements: { id?: string; endorserName: string; note: string; createdAt: string }[];
  endorsementSignals: { id: string; label: string; emoji: string; category: string }[];
  // External review URLs
  reviewGoogleUrl: string;
  reviewYelpUrl: string;
  reviewTripadvisorUrl: string;
  reviewFacebookUrl: string;
  reviewBbbUrl: string;
  // Civic Card fields (political santinho)
  ballotNumber: string;
  partyName: string;
  officeRunningFor: string;
  electionYear: string;
  campaignSlogan: string;
  region: string;
  civicProposals: { id: string; title: string; description: string; sortOrder: number; reactions: { support: number; needs_improvement: number; disagree: number } }[];
  civicQuestions: { id: string; questionText: string; upvoteCount: number; answerText: string | null; answeredAt: string | null; createdAt: string }[];
  civicCommitments: { id: string; title: string; description: string; status: 'planned' | 'in_progress' | 'completed'; sortOrder: number }[];
  civicRecommendations: { id: string; endorsementNote: string | null; card: { id: string; slug: string; fullName: string; title: string; profilePhotoUrl: string | null; partyName: string | null; officeRunningFor: string | null; region: string | null } }[];
  showVoteCounts: boolean;
  companyLogoUrl: string | null;
  // Industry icons
  industryIcons: any[];
  // QR style
  qrStyle: any;
  // Pro credentials
  proCredentials: any;
  // Card name
  cardName: string;
  // Badges
  showLicensedBadge: boolean;
  showInsuredBadge: boolean;
  showBondedBadge: boolean;
  showTavvyVerifiedBadge: boolean;
  badgeApprovalStatus: string;
  // Featured icons
  featuredIcons: any[];
  // Background video
  backgroundVideoUrl: string | null;
  // Address
  address: string;
  // Title role
  titleRole: string;
  // Review count/rating
  reviewCount: number;
  reviewRating: number;
  // View count
  viewCount: number;
  // Published
  isPublished: boolean;
  // Menu block (mobile-business template)
  menuItems: { category: string; emoji?: string; items: { name: string; description?: string; price: string; popular?: boolean; image_url?: string }[] }[];
  menuTitle: string;
  // Live session (mobile-business)
  liveSession: {
    isLive: boolean;
    locationLabel: string;
    sessionAddress: string;
    sessionLat: number;
    sessionLng: number;
    todayNote: string;
    startedAt: string;
    scheduledEndAt: string;
    specials: { title: string; description: string; urgencyLabel: string }[];
  } | null;
  placeId: string | null;
}

export interface PageProps {
  cardData: CardData | null;
  error: string | null;
  isPreview?: boolean;
  previewOnly?: boolean;
}

