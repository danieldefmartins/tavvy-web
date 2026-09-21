import type { CardData, FormBlockData } from './publicCardTypes';
import { visibleFormBlock } from './formBlock';
/** Same persisted-field mapping used by public SSR and in-memory previews. */
export function mapPublicCard(data: Record<string, any>, linksData: any[] = [], extras: Partial<CardData> = {}): CardData {
  return {
      id: data.id,
      slug: data.slug,
      templateId: data.template_id || 'classic-blue',
      colorSchemeId: data.color_scheme_id || 'blue',
      fullName: data.full_name,
      title: data.title_role ?? data.title ?? '',
      company: data.company || '',
      bio: data.bio || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      websiteLabel: data.website_label || '',
      // Address fields
      address1: data.address_1 || data.address1 || '',
      address2: data.address_2 || data.address2 || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zip_code || data.zipCode || '',
      country: data.country || 'USA',
      gradientColor1: data.gradient_color_1 || '#1E90FF',
      gradientColor2: data.gradient_color_2 || '#00BFFF',
      profilePhotoUrl: data.profile_photo_url,
      profilePhotoSize: data.profile_photo_size || 'medium',
      // Social links
      socialInstagram: data.social_instagram || '',
      socialFacebook: data.social_facebook || '',
      socialLinkedin: data.social_linkedin || '',
      socialTwitter: data.social_twitter || '',
      socialTiktok: data.social_tiktok || '',
      socialYoutube: data.social_youtube || '',
      socialSnapchat: data.social_snapchat || '',
      socialPinterest: data.social_pinterest || '',
      socialWhatsapp: data.social_whatsapp || '',
      // Featured socials (parse JSON if stored as string)
      featuredSocials: data.featured_socials ? 
        (typeof data.featured_socials === 'string' ? JSON.parse(data.featured_socials) : data.featured_socials) 
        : [],
      // YouTube video block
      youtubeVideoId: data.youtube_video_id || '',
      youtubeTitle: data.youtube_title || '',
      // Gallery block
      galleryImages: data.gallery_images ? 
        (typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images) 
        : [],
      galleryTitle: data.gallery_title || '',
      // Testimonials block
      testimonials: data.testimonials ? 
        (typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials) 
        : [],
      testimonialsTitle: data.testimonials_title || '',
      // Menu block (mobile-business)
      menuItems: data.menu_items ?
        (typeof data.menu_items === 'string' ? JSON.parse(data.menu_items) : data.menu_items)
        : [],
      menuTitle: data.menu_title || '',
      // Form block
      formBlock: visibleFormBlock(data.form_block) as FormBlockData | null,
      // Appearance settings
      theme: data.theme || 'classic',
      backgroundType: data.background_type || 'gradient',
      backgroundImageUrl: data.background_image_url || null,
      buttonStyle: data.button_style || 'fill',
      buttonColor: data.button_color || null,
      iconColor: data.icon_color || null,
      socialIconColor: data.social_icon_color || null,
      fontStyle: data.font_style || 'default',
      tapCount: data.tap_count || 0,
      links: linksData?.map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon || 'link',
        sort_order: l.sort_order,
        clicks: l.clicks || 0,
      })) || [],
      // Videos
      videos: data.videos ?
        (typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos)
        : [],
      // Visibility toggles
      showContactInfo: data.show_contact_info !== false,
      showSocialIcons: data.show_social_icons !== false,
      fontColor: data.font_color || null,
      bannerImageUrl: data.banner_image_url || null,
      companyLogoUrl: data.company_logo_url || null,
      // Professional category & endorsements
      professionalCategory: data.professional_category || '',
      endorsementCount: extras.endorsementCount ?? 0,
      topEndorsementTags: extras.topEndorsementTags ?? [],
      recentEndorsements: extras.recentEndorsements ?? [],
      endorsementSignals: extras.endorsementSignals ?? [],
      // External review URLs
      reviewGoogleUrl: data.review_google_url || '',
      reviewYelpUrl: data.review_yelp_url || '',
      reviewTripadvisorUrl: data.review_tripadvisor_url || '',
      reviewFacebookUrl: data.review_facebook_url || '',
      reviewBbbUrl: data.review_bbb_url || '',
      // Civic card fields
      ballotNumber: data.ballot_number || '',
      partyName: data.party_name || '',
      officeRunningFor: data.office_running_for || '',
      electionYear: data.election_year || '',
      campaignSlogan: data.campaign_slogan || '',
      region: data.region || '',
      civicProposals: extras.civicProposals ?? [],
      civicQuestions: extras.civicQuestions ?? [],
      civicCommitments: extras.civicCommitments ?? [],
      civicRecommendations: extras.civicRecommendations ?? [],
      showVoteCounts: data.show_vote_counts !== false,
      // Missing properties
      description: data.description || '',
      pronouns: data.pronouns || '',
      industryIcons: data.industry_icons ? (typeof data.industry_icons === 'string' ? JSON.parse(data.industry_icons) : data.industry_icons) : [],
      qrStyle: data.qr_style ? (typeof data.qr_style === 'string' ? JSON.parse(data.qr_style) : data.qr_style) : null,
      proCredentials: data.pro_credentials ? (typeof data.pro_credentials === 'string' ? JSON.parse(data.pro_credentials) : data.pro_credentials) : null,
      cardName: data.card_name || '',
      showLicensedBadge: data.show_licensed_badge || false,
      showInsuredBadge: data.show_insured_badge || false,
      showBondedBadge: data.show_bonded_badge || false,
      showTavvyVerifiedBadge: data.show_tavvy_verified_badge || false,
      badgeApprovalStatus: data.badge_approval_status || 'none',
      featuredIcons: data.featured_icons ? (typeof data.featured_icons === 'string' ? JSON.parse(data.featured_icons) : data.featured_icons) : [],
      backgroundVideoUrl: data.background_video_url || null,
      address: data.address || '',
      titleRole: data.title_role || '',
      reviewCount: data.review_count || 0,
      reviewRating: data.review_rating || 0,
      viewCount: data.view_count || 0,
      isPublished: data.is_published !== false,
      // Live session
      liveSession: extras.liveSession ?? null,
      placeId: data.place_id || null,
  };
}
