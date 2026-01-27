/**
 * Universal Add Screen (Atlas) - Web Version
 * Matches the iOS UniversalAddScreenV3 implementation
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import TabBar from '../../components/TabBar';
import ECardAddressAutocomplete from '../../components/atlas/ECardAddressAutocomplete';
import { useDrafts, ContentType, ContentSubtype } from '../../hooks/useDrafts';
import { 
  FiArrowLeft, FiMapPin, FiCheck, FiX, FiCamera, FiPlus, 
  FiChevronRight, FiAlertTriangle, FiLoader, FiHome, FiTruck, FiUsers
} from 'react-icons/fi';
import { 
  MdStorefront, MdDirectionsCar, MdBusiness, MdEvent, MdLocalParking,
  MdWc, MdLocalAtm, MdWaterDrop, MdPets, MdCameraAlt, MdRvHookup
} from 'react-icons/md';

// Types
type StepType = 'location' | 'business_type' | 'service_location' | 'content_type' | 'details' | 'photos' | 'review';
type BusinessType = 'physical' | 'service' | 'on_the_go';

interface AddressData {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
}

// Step arrays
const STEPS: StepType[] = ['location', 'business_type', 'service_location', 'content_type', 'details', 'photos', 'review'];
const STEPS_WITHOUT_SERVICE_LOCATION: StepType[] = ['location', 'business_type', 'content_type', 'details', 'photos', 'review'];

// Colors
const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#0F172A';
const ACCENT = '#0F8A8A';

// Business type options
const BUSINESS_TYPES = [
  { id: 'physical', label: 'Physical Location', description: 'A store, restaurant, office, etc.', icon: MdStorefront },
  { id: 'service', label: 'Service Business', description: 'Plumber, electrician, consultant, etc.', icon: FiUsers },
  { id: 'on_the_go', label: 'On-the-Go', description: 'Food truck, mobile vendor, etc.', icon: MdDirectionsCar },
];

// Content type options
const CONTENT_TYPES = [
  { id: 'business', label: 'Business / Place', description: 'Add a local business or point of interest', icon: MdBusiness },
  { id: 'event', label: 'Event', description: 'Add a local event or happening', icon: MdEvent },
  { id: 'rv_campground', label: 'RV / Camping', description: 'Add an RV park or campground', icon: MdRvHookup },
  { id: 'quick_add', label: 'Quick Add', description: 'Restroom, parking, ATM, etc.', icon: FiPlus },
];

// Quick add subtypes
const QUICK_ADD_TYPES = [
  { id: 'restroom', label: 'Restroom', icon: MdWc },
  { id: 'parking', label: 'Parking', icon: MdLocalParking },
  { id: 'atm', label: 'ATM', icon: MdLocalAtm },
  { id: 'water_fountain', label: 'Water Fountain', icon: MdWaterDrop },
  { id: 'pet_relief', label: 'Pet Relief Area', icon: MdPets },
  { id: 'photo_spot', label: 'Photo Spot', icon: MdCameraAlt },
];

// Category options for businesses
const BUSINESS_CATEGORIES = [
  'Restaurant', 'Cafe', 'Bar', 'Retail', 'Grocery', 'Health & Wellness',
  'Beauty & Spa', 'Fitness', 'Entertainment', 'Services', 'Automotive',
  'Home & Garden', 'Professional', 'Education', 'Religious', 'Other'
];

export default function UniversalAddScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const {
    currentDraft, pendingDraft, isLoading, isSaving,
    createDraft, updateDraft, deleteDraft, snoozeDraft, submitDraft,
    resumeDraft, dismissPendingDraft
  } = useDrafts();

  // UI State
  const [currentStep, setCurrentStep] = useState<StepType>('location');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Form State
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [manualAddressData, setManualAddressData] = useState<AddressData>({
    address1: '', address2: '', city: '', state: '', zipCode: '', country: 'USA', formattedAddress: ''
  });

  // Colors
  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';

  // Show resume modal when there's a pending draft
  useEffect(() => {
    if (isLoading) return;
    if (pendingDraft && !currentDraft && !isResuming) {
      setShowResumeModal(true);
    }
  }, [pendingDraft, currentDraft, isLoading, isResuming]);

  // Initialize - request location if no draft
  useEffect(() => {
    if (isLoading) return;
    if (hasInitialized) return;
    if (isResuming) return;
    if (pendingDraft) {
      setHasInitialized(true);
      return;
    }
    if (currentDraft) {
      setHasInitialized(true);
      return;
    }
    handleRequestLocation();
    setHasInitialized(true);
  }, [isLoading, currentDraft, pendingDraft, hasInitialized, isResuming]);

  // Restore draft state when currentDraft changes
  useEffect(() => {
    if (currentDraft) {
      console.log('[UniversalAdd] Restoring draft:', currentDraft.id, 'status:', currentDraft.status);
      
      // Restore address data
      if (currentDraft.address_line1 || currentDraft.city || currentDraft.formatted_address) {
        setManualAddressData({
          address1: currentDraft.address_line1 || '',
          address2: currentDraft.address_line2 || '',
          city: currentDraft.city || '',
          state: currentDraft.region || '',
          zipCode: currentDraft.postal_code || '',
          country: currentDraft.country || 'USA',
          formattedAddress: currentDraft.formatted_address || '',
          latitude: currentDraft.latitude || undefined,
          longitude: currentDraft.longitude || undefined,
        });
      }
      
      // Restore business type / subtype
      if (currentDraft.content_subtype) {
        if (['physical', 'service', 'on_the_go'].includes(currentDraft.content_subtype)) {
          setSelectedBusinessType(currentDraft.content_subtype as BusinessType);
        } else {
          setSelectedSubtype(currentDraft.content_subtype);
        }
      }
      if (currentDraft.content_type) setSelectedContentType(currentDraft.content_type);
      if (currentDraft.data) setFormData(currentDraft.data);
      if (currentDraft.photos?.length > 0) setPhotos(currentDraft.photos);
      
      // Restore step
      switch (currentDraft.status) {
        case 'draft_location': setCurrentStep('location'); break;
        case 'draft_type_selected': setCurrentStep('business_type'); break;
        case 'draft_subtype_selected': setCurrentStep('content_type'); break;
        case 'draft_details': setCurrentStep('details'); break;
        case 'draft_review': setCurrentStep('review'); break;
        default:
          if (currentDraft.current_step >= 1 && currentDraft.current_step <= 7) {
            const steps = currentDraft.content_subtype === 'service' ? STEPS : STEPS_WITHOUT_SERVICE_LOCATION;
            setCurrentStep(steps[Math.min(currentDraft.current_step - 1, steps.length - 1)]);
          }
      }
    }
  }, [currentDraft?.id]);

  // Helper to check if address has a street number
  const hasStreetNumber = (address: string | null | undefined): boolean => {
    if (!address) return false;
    return /^\d+\s/.test(address.trim());
  };

  // Get active steps based on business type
  const getActiveSteps = useCallback(() => {
    if (selectedBusinessType === 'service') {
      return STEPS;
    }
    return STEPS_WITHOUT_SERVICE_LOCATION;
  }, [selectedBusinessType]);

  // Request browser geolocation
  const handleRequestLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        setShowManualAddress(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode using Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            const address = data.address || {};
            const formattedAddress = data.display_name || '';
            
            const draft = await createDraft({
              latitude,
              longitude,
              address_line1: `${address.house_number || ''} ${address.road || ''}`.trim() || null,
              city: address.city || address.town || address.village || null,
              region: address.state || null,
              postal_code: address.postcode || null,
              country: address.country || 'USA',
              formatted_address: formattedAddress,
            });
            
            if (draft) {
              setManualAddressData({
                address1: `${address.house_number || ''} ${address.road || ''}`.trim(),
                address2: '',
                city: address.city || address.town || address.village || '',
                state: address.state || '',
                zipCode: address.postcode || '',
                country: address.country || 'USA',
                formattedAddress,
                latitude,
                longitude,
              });
            }
          } catch (e) {
            console.error('Geocoding error:', e);
            await createDraft({ latitude, longitude });
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          setShowManualAddress(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } catch (error) {
      console.error('Location error:', error);
      setIsLoadingLocation(false);
      setShowManualAddress(true);
    }
  };

  // Handle location confirmation
  const handleConfirmLocation = async (confirmed: boolean) => {
    if (!currentDraft) return;
    
    const addressLine = currentDraft.address_line1 || currentDraft.formatted_address;
    const isMissingStreetNumber = !hasStreetNumber(addressLine);
    
    if (confirmed && isMissingStreetNumber) {
      alert('The address appears to be missing a street number. Please add the complete address.');
      setShowManualAddress(true);
      return;
    }
    
    if (confirmed) {
      await updateDraft({ status: 'draft_type_selected', current_step: 2 }, true);
      setCurrentStep('business_type');
    } else {
      setShowManualAddress(true);
    }
  };

  // Handle manual address save
  const handleSaveManualAddress = async () => {
    const { address1, city, state } = manualAddressData;
    
    if (!address1.trim() || !city.trim() || !state.trim()) {
      alert('Please enter at least Address, City, and State.');
      return;
    }
    
    const formattedParts = [
      manualAddressData.address1,
      manualAddressData.address2,
      manualAddressData.city,
      manualAddressData.state,
      manualAddressData.zipCode,
      manualAddressData.country,
    ].filter(Boolean);
    const formatted = formattedParts.join(', ');
    
    if (currentDraft) {
      await updateDraft({
        address_line1: manualAddressData.address1,
        address_line2: manualAddressData.address2 || null,
        city: manualAddressData.city,
        region: manualAddressData.state || null,
        postal_code: manualAddressData.zipCode || null,
        country: manualAddressData.country || 'USA',
        formatted_address: formatted,
        latitude: manualAddressData.latitude || null,
        longitude: manualAddressData.longitude || null,
        status: 'draft_type_selected',
        current_step: 2,
      }, true);
    } else {
      await createDraft({
        latitude: manualAddressData.latitude || 0,
        longitude: manualAddressData.longitude || 0,
        address_line1: manualAddressData.address1,
        address_line2: manualAddressData.address2,
        city: manualAddressData.city,
        region: manualAddressData.state,
        postal_code: manualAddressData.zipCode,
        country: manualAddressData.country,
        formatted_address: formatted,
      });
    }
    
    setShowManualAddress(false);
    setCurrentStep('business_type');
  };

  // Handle business type selection
  const handleSelectBusinessType = async (type: BusinessType) => {
    setSelectedBusinessType(type);
    await updateDraft({ 
      content_subtype: type,
      status: 'draft_type_selected',
      current_step: 2 
    }, true);
    
    if (type === 'service') {
      setCurrentStep('service_location');
    } else {
      setCurrentStep('content_type');
    }
  };

  // Handle service location answer
  const handleServiceLocationAnswer = async (hasPhysicalLocation: boolean) => {
    await updateDraft({
      data: { has_physical_location: hasPhysicalLocation },
      status: 'draft_subtype_selected',
      current_step: 3,
    }, true);
    
    if (!hasPhysicalLocation) {
      setManualAddressData(prev => ({
        ...prev,
        address1: '', address2: '', city: '', state: '', zipCode: '', formattedAddress: ''
      }));
    }
    
    setCurrentStep('content_type');
  };

  // Handle content type selection
  const handleSelectContentType = async (type: ContentType) => {
    setSelectedContentType(type);
    await updateDraft({
      content_type: type,
      status: 'draft_subtype_selected',
      current_step: 4,
    }, true);
    
    if (type === 'quick_add') {
      // Show quick add subtypes (handled in render)
    } else {
      setCurrentStep('details');
    }
  };

  // Handle quick add subtype selection
  const handleSelectQuickAddType = async (subtype: string) => {
    setSelectedSubtype(subtype);
    await updateDraft({
      content_subtype: subtype as ContentSubtype,
      status: 'draft_details',
      current_step: 5,
    }, true);
    setCurrentStep('details');
  };

  // Handle form data change
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateDraft({ data: { [field]: value } });
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // For now, just store file names - in production, upload to storage
    const newPhotos = Array.from(files).map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...newPhotos]);
    updateDraft({ photos: [...photos, ...newPhotos] });
  };

  // Handle submit
  const handleSubmit = async () => {
    const result = await submitDraft();
    if (result.success) {
      alert('Place submitted successfully!');
      router.push('/app');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    const steps = getActiveSteps();
    const stepIndex = steps.indexOf(currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1]);
    } else {
      if (confirm('Save draft and exit?')) {
        router.back();
      }
    }
  };

  // Handle resume/discard draft
  const handleResumeDraft = () => {
    setIsResuming(true);
    if (pendingDraft) resumeDraft(pendingDraft);
    setShowResumeModal(false);
    setHasInitialized(true);
  };

  const handleDiscardDraft = async () => {
    if (pendingDraft) await deleteDraft(pendingDraft.id);
    setShowResumeModal(false);
    handleRequestLocation();
  };

  const handleSnoozeDraft = async () => {
    if (pendingDraft) {
      resumeDraft(pendingDraft);
      await snoozeDraft(24);
    }
    setShowResumeModal(false);
    router.back();
  };

  // Calculate progress
  const activeSteps = getActiveSteps();
  const stepIndex = activeSteps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / activeSteps.length) * 100;

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'location': return 'Confirm Location';
      case 'business_type': return 'Business Type';
      case 'service_location': return 'Service Location';
      case 'content_type': return 'What are you adding?';
      case 'details': return 'Details';
      case 'photos': return 'Photos';
      case 'review': return 'Review';
      default: return 'Add Place';
    }
  };

  return (
    <>
      <Head>
        <title>Add Place | TavvY</title>
        <meta name="description" content="Add a new place to Tavvy" />
      </Head>

      <div className="add-screen" style={{ backgroundColor: bgColor }}>
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={handleBack}>
            <FiArrowLeft size={24} color={textColor} />
          </button>
          <h1 style={{ color: textColor }}>{getStepTitle()}</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: ACCENT }} />
        </div>
        <div className="step-indicator" style={{ color: subtextColor }}>
          Step {stepIndex + 1} of {activeSteps.length}
        </div>

        {/* Content */}
        <div className="content">
          {/* Loading State */}
          {isLoadingLocation && (
            <div className="loading-container">
              <FiLoader className="spinner" size={48} color={ACCENT} />
              <p style={{ color: subtextColor }}>Getting your location...</p>
            </div>
          )}

          {/* Location Step */}
          {currentStep === 'location' && !isLoadingLocation && (
            showManualAddress ? (
              <div className="manual-address-form">
                <h3 style={{ color: textColor }}>Enter Address</h3>
                <ECardAddressAutocomplete
                  value={manualAddressData}
                  onChange={setManualAddressData}
                  isDark={isDark}
                />
                <div className="button-row" style={{ marginTop: 24 }}>
                  <button className="secondary-btn" onClick={() => setShowManualAddress(false)}>
                    Cancel
                  </button>
                  <button 
                    className="primary-btn" 
                    onClick={handleSaveManualAddress}
                    disabled={!manualAddressData.address1 || !manualAddressData.city || !manualAddressData.state}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : currentDraft?.formatted_address ? (
              <div className="location-confirm">
                <div className="location-card" style={{ backgroundColor: cardBg }}>
                  <FiMapPin size={32} color={ACCENT} />
                  <p className="address" style={{ color: textColor }}>{currentDraft.formatted_address}</p>
                  <p className="coords" style={{ color: subtextColor }}>
                    ({currentDraft.latitude?.toFixed(6)}, {currentDraft.longitude?.toFixed(6)})
                  </p>
                </div>
                
                {!hasStreetNumber(currentDraft.address_line1 || currentDraft.formatted_address) && (
                  <div className="address-warning">
                    <FiAlertTriangle size={18} color="#FF9500" />
                    <span>This address may be missing a street number</span>
                  </div>
                )}
                
                <h3 style={{ color: textColor }}>Is this the correct address?</h3>
                <div className="confirm-buttons">
                  <button className="confirm-btn yes" onClick={() => handleConfirmLocation(true)}>
                    <FiCheck size={24} />
                    <span>Yes</span>
                  </button>
                  <button className="confirm-btn no" onClick={() => handleConfirmLocation(false)}>
                    <FiX size={24} />
                    <span>No</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-location">
                <FiMapPin size={48} color={subtextColor} />
                <p style={{ color: subtextColor }}>Unable to get location</p>
                <button className="primary-btn" onClick={handleRequestLocation}>Try Again</button>
                <button className="link-btn" onClick={() => setShowManualAddress(true)}>
                  Enter address manually
                </button>
              </div>
            )
          )}

          {/* Business Type Step */}
          {currentStep === 'business_type' && (
            <div className="options-list">
              <p className="step-description" style={{ color: subtextColor }}>
                What type of business is this?
              </p>
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  className="option-card"
                  style={{ backgroundColor: cardBg }}
                  onClick={() => handleSelectBusinessType(type.id as BusinessType)}
                >
                  <div className="option-icon" style={{ backgroundColor: `${ACCENT}15` }}>
                    <type.icon size={24} color={ACCENT} />
                  </div>
                  <div className="option-content">
                    <h4 style={{ color: textColor }}>{type.label}</h4>
                    <p style={{ color: subtextColor }}>{type.description}</p>
                  </div>
                  <FiChevronRight size={24} color={subtextColor} />
                </button>
              ))}
            </div>
          )}

          {/* Service Location Step */}
          {currentStep === 'service_location' && (
            <div className="service-location-step">
              <p className="step-description" style={{ color: subtextColor }}>
                Do you have a physical location where customers can visit?
              </p>
              <p className="hint" style={{ color: subtextColor }}>
                For example: an office, storefront, or workshop
              </p>
              
              <button
                className="option-card"
                style={{ backgroundColor: cardBg }}
                onClick={() => handleServiceLocationAnswer(true)}
              >
                <div className="option-icon" style={{ backgroundColor: '#34C75915' }}>
                  <MdStorefront size={32} color="#34C759" />
                </div>
                <div className="option-content">
                  <h4 style={{ color: textColor }}>Yes, I have a physical location</h4>
                  <p style={{ color: subtextColor }}>Customers can visit my business address</p>
                </div>
                <FiChevronRight size={24} color={subtextColor} />
              </button>
              
              <button
                className="option-card"
                style={{ backgroundColor: cardBg }}
                onClick={() => handleServiceLocationAnswer(false)}
              >
                <div className="option-icon" style={{ backgroundColor: '#0A84FF15' }}>
                  <MdDirectionsCar size={32} color="#0A84FF" />
                </div>
                <div className="option-content">
                  <h4 style={{ color: textColor }}>No, I go to my customers</h4>
                  <p style={{ color: subtextColor }}>I provide services at customer locations</p>
                </div>
                <FiChevronRight size={24} color={subtextColor} />
              </button>
              
              <button className="link-btn" onClick={() => { setSelectedBusinessType(null); setCurrentStep('business_type'); }}>
                Back to business type
              </button>
            </div>
          )}

          {/* Content Type Step */}
          {currentStep === 'content_type' && (
            <div className="options-list">
              {selectedContentType === 'quick_add' ? (
                <>
                  <p className="step-description" style={{ color: subtextColor }}>
                    What type of quick add?
                  </p>
                  {QUICK_ADD_TYPES.map((type) => (
                    <button
                      key={type.id}
                      className="option-card"
                      style={{ backgroundColor: cardBg }}
                      onClick={() => handleSelectQuickAddType(type.id)}
                    >
                      <div className="option-icon" style={{ backgroundColor: `${ACCENT}15` }}>
                        <type.icon size={24} color={ACCENT} />
                      </div>
                      <div className="option-content">
                        <h4 style={{ color: textColor }}>{type.label}</h4>
                      </div>
                      <FiChevronRight size={24} color={subtextColor} />
                    </button>
                  ))}
                  <button className="link-btn" onClick={() => setSelectedContentType(null)}>
                    Back
                  </button>
                </>
              ) : (
                <>
                  <p className="step-description" style={{ color: subtextColor }}>
                    What would you like to add?
                  </p>
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      className="option-card"
                      style={{ backgroundColor: cardBg }}
                      onClick={() => handleSelectContentType(type.id as ContentType)}
                    >
                      <div className="option-icon" style={{ backgroundColor: `${ACCENT}15` }}>
                        <type.icon size={24} color={ACCENT} />
                      </div>
                      <div className="option-content">
                        <h4 style={{ color: textColor }}>{type.label}</h4>
                        <p style={{ color: subtextColor }}>{type.description}</p>
                      </div>
                      <FiChevronRight size={24} color={subtextColor} />
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div className="details-form">
              <input
                type="text"
                placeholder="Business Name *"
                value={formData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              
              <textarea
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="input-field textarea"
                style={{ backgroundColor: cardBg, color: textColor }}
                rows={4}
              />
              
              <select
                value={formData.tavvy_category || ''}
                onChange={(e) => handleFormChange('tavvy_category', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                <option value="">Select Category</option>
                {BUSINESS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
              
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone || ''}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => handleFormChange('email', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              
              <input
                type="url"
                placeholder="Website"
                value={formData.website || ''}
                onChange={(e) => handleFormChange('website', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              
              <h4 style={{ color: textColor, marginTop: 24 }}>Social Media</h4>
              <input
                type="text"
                placeholder="Instagram @username"
                value={formData.instagram || ''}
                onChange={(e) => handleFormChange('instagram', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              <input
                type="text"
                placeholder="Facebook"
                value={formData.facebook || ''}
                onChange={(e) => handleFormChange('facebook', e.target.value)}
                className="input-field"
                style={{ backgroundColor: cardBg, color: textColor }}
              />
              
              <button 
                className="primary-btn" 
                onClick={() => setCurrentStep('photos')}
                disabled={!formData.name}
                style={{ marginTop: 24 }}
              >
                Continue to Photos
              </button>
            </div>
          )}

          {/* Photos Step */}
          {currentStep === 'photos' && (
            <div className="photos-step">
              <p className="step-description" style={{ color: subtextColor }}>
                Add photos of this place (optional)
              </p>
              
              <div className="photos-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img src={photo} alt={`Photo ${index + 1}`} />
                    <button 
                      className="remove-photo"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
                
                <label className="add-photo-btn" style={{ backgroundColor: cardBg }}>
                  <FiCamera size={32} color={ACCENT} />
                  <span style={{ color: subtextColor }}>Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              
              <button 
                className="primary-btn" 
                onClick={() => setCurrentStep('review')}
                style={{ marginTop: 24 }}
              >
                Continue to Review
              </button>
              
              <button 
                className="link-btn" 
                onClick={() => setCurrentStep('review')}
              >
                Skip photos
              </button>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="review-step">
              <div className="review-card" style={{ backgroundColor: cardBg }}>
                <h3 style={{ color: textColor }}>{formData.name || 'Unnamed Place'}</h3>
                
                {currentDraft?.formatted_address && (
                  <p style={{ color: subtextColor }}>
                    <FiMapPin size={16} style={{ marginRight: 8 }} />
                    {currentDraft.formatted_address}
                  </p>
                )}
                
                {formData.description && (
                  <p style={{ color: textColor, marginTop: 16 }}>{formData.description}</p>
                )}
                
                {formData.tavvy_category && (
                  <p style={{ color: subtextColor }}>Category: {formData.tavvy_category}</p>
                )}
                
                {formData.phone && (
                  <p style={{ color: subtextColor }}>Phone: {formData.phone}</p>
                )}
                
                {formData.website && (
                  <p style={{ color: subtextColor }}>Website: {formData.website}</p>
                )}
                
                {photos.length > 0 && (
                  <div className="review-photos">
                    {photos.slice(0, 3).map((photo, i) => (
                      <img key={i} src={photo} alt="" className="review-photo" />
                    ))}
                    {photos.length > 3 && (
                      <span style={{ color: subtextColor }}>+{photos.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
              
              <button 
                className="submit-btn" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
                {!isLoading && <FiCheck size={20} />}
              </button>
            </div>
          )}
        </div>

        {/* Resume Modal */}
        {showResumeModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ backgroundColor: cardBg }}>
              <h2 style={{ color: textColor }}>Continue Draft?</h2>
              <p style={{ color: subtextColor }}>
                You have an unfinished place. Would you like to continue?
              </p>
              {pendingDraft?.formatted_address && (
                <p className="draft-address" style={{ color: textColor }}>
                  <FiMapPin size={16} /> {pendingDraft.formatted_address}
                </p>
              )}
              <div className="modal-buttons">
                <button className="modal-btn primary" onClick={handleResumeDraft}>
                  Continue
                </button>
                <button className="modal-btn secondary" onClick={handleSnoozeDraft}>
                  Remind Later
                </button>
                <button className="modal-btn danger" onClick={handleDiscardDraft}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <div className="saving-indicator">
            <FiLoader className="spinner" size={16} />
            <span>Saving...</span>
          </div>
        )}

        <TabBar />
      </div>

      <style jsx>{`
        .add-screen {
          min-height: 100vh;
          padding-bottom: 100px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          padding-top: max(16px, env(safe-area-inset-top));
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .header h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .progress-container {
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
          margin: 0 20px;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .step-indicator {
          text-align: right;
          padding: 8px 20px;
          font-size: 14px;
        }

        .content {
          padding: 20px;
          max-width: 500px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .location-card {
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 24px;
        }

        .location-card .address {
          font-size: 18px;
          font-weight: 600;
          margin: 12px 0 4px;
        }

        .location-card .coords {
          font-size: 12px;
        }

        .address-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFF3E0;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          color: #E65100;
          font-size: 14px;
        }

        .confirm-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .confirm-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          border-radius: 12px;
          border: none;
          font-size: 18px;
          font-weight: 600;
          color: white;
          cursor: pointer;
        }

        .confirm-btn.yes { background: #34C759; }
        .confirm-btn.no { background: #FF3B30; }

        .step-description {
          text-align: center;
          margin-bottom: 24px;
          font-size: 16px;
        }

        .hint {
          text-align: center;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s;
        }

        .option-card:hover {
          transform: translateY(-2px);
        }

        .option-icon {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
        }

        .option-content h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px;
        }

        .option-content p {
          font-size: 14px;
          margin: 0;
        }

        .input-field {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          font-size: 16px;
          margin-bottom: 12px;
          outline: none;
        }

        .input-field:focus {
          border-color: ${ACCENT};
        }

        .textarea {
          resize: vertical;
          min-height: 100px;
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .button-row {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .primary-btn {
          flex: 1;
          padding: 16px 24px;
          background: ${ACCENT};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-btn {
          flex: 1;
          padding: 16px 24px;
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
        }

        .link-btn {
          background: none;
          border: none;
          color: ${ACCENT};
          font-size: 14px;
          cursor: pointer;
          padding: 12px;
          margin-top: 16px;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
        }

        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-photo {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-photo-btn {
          aspect-ratio: 1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          border: 2px dashed rgba(0, 0, 0, 0.2);
        }

        .review-card {
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .review-card h3 {
          font-size: 20px;
          margin: 0 0 12px;
        }

        .review-photos {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          align-items: center;
        }

        .review-photo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
        }

        .submit-btn {
          width: 100%;
          padding: 18px;
          background: ${ACCENT};
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:disabled {
          opacity: 0.7;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 400px;
          padding: 24px;
          border-radius: 20px;
        }

        .modal h2 {
          margin: 0 0 12px;
        }

        .draft-address {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
          padding: 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
        }

        .modal-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-btn {
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .modal-btn.primary {
          background: ${ACCENT};
          color: white;
        }

        .modal-btn.secondary {
          background: rgba(0, 0, 0, 0.1);
        }

        .modal-btn.danger {
          background: transparent;
          color: #FF3B30;
        }

        .saving-indicator {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .no-location {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 20px;
          text-align: center;
        }

        .no-location p {
          margin: 12px 0 24px;
        }

        .service-location-step {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .details-form {
          display: flex;
          flex-direction: column;
        }

        .photos-step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .review-step {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </>
  );
}
