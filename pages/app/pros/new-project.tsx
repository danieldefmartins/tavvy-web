/**
 * New Project Page - Customer Quote Request (Matches iOS 7-Step Flow)
 * 
 * Step 0: Customer Info (name, email, phone, privacy preference)
 * Step 1: Parent Category Selection (Construction, Cleaning, Repair, etc.)
 * Step 2: Sub-Service Selection (specific services within the parent category)
 * Step 3: Dynamic Category Questions (from Supabase service_category_questions)
 * Step 4: Project Description
 * Step 5: Location / Address (with OpenStreetMap autocomplete)
 * Step 6: Review & Submit
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import {
  FiArrowLeft, FiArrowRight, FiX, FiCheck, FiSearch,
  FiUser, FiMail, FiPhone, FiShield, FiMessageSquare,
  FiMapPin, FiSend, FiLoader, FiAlertCircle, FiChevronRight
} from 'react-icons/fi';

// Pros brand colors (matching iOS ProsColors)
const ProsColors = {
  primary: '#0D9668',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  secondary: '#F59E0B',
  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  cardBg: '#FFFFFF',
  sectionBg: '#F9FAFB',
  heroBg: '#F0FDF4',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
};

type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
};

type ServiceQuestion = {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'number';
  options?: string[] | null;
  order: number;
  is_required: boolean;
  parent_question_id?: string | null;
};

type FormData = {
  // Step 0
  fullName: string;
  email: string;
  phone: string;
  privacyPreference: 'share' | 'app_only';
  // Step 1 (parent category)
  parentCategoryId: string;
  parentCategoryName: string;
  // Step 2 (sub-service)
  categoryId: string;
  categoryName: string;
  // Step 3
  dynamicAnswers: Record<string, any>;
  // Step 4
  description: string;
  // Step 5
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

const TOTAL_STEPS = 7;

// Parent category emoji mapping
const parentCategoryEmoji: Record<string, string> = {
  'construction': '🏗️',
  'cleaning': '🧹',
  'repair': '🔧',
  'mechanic': '🔩',
  'handyman': '🛠️',
  'realtor': '🏠',
  'landscaping': '🌿',
  'electrical': '⚡',
  'plumbing': '💧',
  'painting': '🎨',
  'pest-control': '🛡️',
  'moving': '📦',
};

// Sub-category emoji mapping
const getCategoryIcon = (icon?: string | null, name?: string) => {
  const ioniconsToEmoji: Record<string, string> = {
    'settings': '⚙️', 'settings-outline': '⚙️',
    'sparkles': '✨', 'sparkles-outline': '✨',
    'flash': '⚡', 'flash-outline': '⚡',
    'hammer': '🔨', 'hammer-outline': '🔨',
    'home': '🏠', 'home-outline': '🏠',
    'car': '🚗', 'car-outline': '🚗',
    'car-sport-outline': '🚗',
    'thermometer': '🌡️', 'thermometer-outline': '🌡️',
    'grid': '🏗️', 'grid-outline': '🏗️',
    'construct': '🏗️', 'construct-outline': '🏗️',
    'water': '💧', 'water-outline': '💧',
    'leaf': '🌿', 'leaf-outline': '🌿',
    'brush': '🖌️', 'brush-outline': '🖌️',
    'bug': '🐛', 'bug-outline': '🐛',
    'business': '💼', 'business-outline': '💼',
    'key': '🔑', 'key-outline': '🔑',
    'cube': '📦', 'cube-outline': '📦',
    'boat': '⛵', 'boat-outline': '⛵',
    'airplane': '✈️', 'airplane-outline': '✈️',
    'sunny': '☀️', 'sunny-outline': '☀️',
    'bulb': '💡', 'bulb-outline': '💡',
    'paw': '🐾', 'paw-outline': '🐾',
  };
  if (icon && ioniconsToEmoji[icon]) return ioniconsToEmoji[icon];

  const nameMap: Record<string, string> = {
    'appliance': '⚙️', 'cleaning': '✨', 'electrical': '⚡', 'electrician': '⚡',
    'flooring': '🏗️', 'garage': '🚗', 'handyman': '🔨', 'home improvement': '🏠',
    'house cleaning': '✨', 'hvac': '🌡️', 'landscaping': '🌿', 'lawn': '🌿',
    'locksmith': '🔑', 'moving': '📦', 'painting': '🎨', 'pest': '🛡️',
    'plumbing': '💧', 'pool': '🏊', 'roofing': '🏠', 'solar': '☀️',
    'tree': '🌳', 'window': '🪟', 'mechanic': '🔩', 'boat': '⛵',
    'rv': '🚐', 'motorcycle': '🏍️', 'diesel': '⛽', 'engine': '⚙️',
    'car wash': '🚿', 'detailing': '✨', 'pressure': '💦',
    'furniture': '🪑', 'drywall': '🧱', 'door': '🚪', 'deck': '🏡',
    'real estate': '🏘️', 'property': '🏢', 'staging': '🛋️', 'inspection': '🔍',
    'drain': '🚿', 'water heater': '🔥', 'sewer': '🕳️', 'fixture': '🚰',
    'interior': '🎨', 'exterior': '🖌️', 'cabinet': '🗄️', 'staining': '🪵',
    'termite': '🪲', 'wildlife': '🦝', 'mosquito': '🦟',
    'local moving': '🚚', 'long distance': '🛣️', 'packing': '📦', 'junk': '🗑️', 'storage': '📦',
    'lighting': '💡', 'generator': '🔋', 'ev charger': '🔌',
    'garden': '🌺', 'irrigation': '💦', 'hardscaping': '🧱',
    'concrete': '🏗️', 'masonry': '🧱', 'fiberglass': '🏊',
    'general construction': '🏗️', 'general handyman': '🔨',
    'general pest': '🛡️',
    'other': '⋯',
  };
  const slug = name?.toLowerCase() || '';
  for (const [key, emoji] of Object.entries(nameMap)) {
    if (slug.includes(key)) return emoji;
  }
  return '🔧';
};

// Progress bar component
function ProgressBar({ step }: { step: number }) {
  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}>
      <div style={{ flex: 1, height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: ProsColors.primary,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: ProsColors.textSecondary, minWidth: '35px', textAlign: 'right' }}>
        {progress}%
      </span>
    </div>
  );
}

export default function NewProjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    privacyPreference: 'app_only',
    parentCategoryId: '',
    parentCategoryName: '',
    categoryId: '',
    categoryName: '',
    dynamicAnswers: {},
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Step 1: Parent categories
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');

  // Step 3: Dynamic questions
  const [questions, setQuestions] = useState<ServiceQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Step 5: Address autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Step 6: Submit
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Fetch all categories once when entering step 1
  useEffect(() => {
    if (step === 1 && allCategories.length === 0) {
      fetchCategories();
    }
  }, [step]);

  // Fetch questions when sub-category is selected and moving to step 3
  useEffect(() => {
    if (step === 3 && formData.categoryId) {
      fetchQuestions(formData.categoryId);
    }
  }, [step, formData.categoryId]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setAllCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchQuestions = async (categoryId: string) => {
    setQuestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_category_questions')
        .select('id, category_id, question_text, question_type, options, "order", is_required, parent_question_id')
        .eq('category_id', categoryId)
        .order('order', { ascending: true });
      if (error) throw error;
      const parsed = (data || []).map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      setQuestions(parsed);
      setCurrentQuestionIndex(0);
      // If no questions, skip to step 4
      if (parsed.length === 0) {
        setStep(4);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setStep(4); // Skip on error
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Derived: parent categories (no parent_id)
  const parentCategories = useMemo(() => {
    return allCategories.filter(c => !c.parent_id);
  }, [allCategories]);

  // Derived: sub-categories for selected parent
  const subCategories = useMemo(() => {
    if (!formData.parentCategoryId) return [];
    return allCategories.filter(c => c.parent_id === formData.parentCategoryId);
  }, [allCategories, formData.parentCategoryId]);

  // Filtered parent categories for search
  const filteredParentCategories = useMemo(() => {
    if (!parentSearch.trim()) return parentCategories;
    const q = parentSearch.toLowerCase();
    return parentCategories.filter(c => c.name.toLowerCase().includes(q));
  }, [parentCategories, parentSearch]);

  // Filtered sub-categories for search
  const filteredSubCategories = useMemo(() => {
    const all = [...subCategories, { id: 'other', slug: 'other', name: 'Other', icon: '⋯', parent_id: formData.parentCategoryId } as ServiceCategory];
    if (!subSearch.trim()) return all;
    const q = subSearch.toLowerCase();
    return all.filter(c => c.name.toLowerCase().includes(q));
  }, [subCategories, subSearch, formData.parentCategoryId]);

  // Visible questions (two-tier logic)
  const visibleQuestions = useMemo(() => {
    const tier1 = questions.filter(q => !q.parent_question_id);
    const tier2 = questions.filter(q => {
      if (!q.parent_question_id) return false;
      return !!formData.dynamicAnswers[q.parent_question_id];
    });
    return [...tier1, ...tier2];
  }, [questions, formData.dynamicAnswers]);

  // Address search with OpenStreetMap
  const searchAddress = useCallback(async (text: string) => {
    if (text.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&countrycodes=us`
      );
      if (!response.ok) {
        console.error('Address search HTTP error:', response.status);
        return;
      }
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.error('Address search error:', err);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const handleAddressTextChange = (text: string) => {
    setFormData(prev => ({ ...prev, address: text }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAddress(text), 500);
  };

  const handleSelectAddress = (item: any) => {
    const addr = item.address || {};
    setFormData(prev => ({
      ...prev,
      address: item.display_name?.split(',')[0] || '',
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      zipCode: addr.postcode || '',
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Cancel handler
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will not be saved.')) {
      router.push('/app/pros', undefined, { locale });
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('project_requests')
        .insert({
          user_id: authData.user?.id || null,
          category_id: formData.categoryId !== 'other' ? formData.categoryId : null,
          zip_code: formData.zipCode,
          city: formData.city,
          state: formData.state,
          description: formData.description,
          dynamic_answers: formData.dynamicAnswers,
          photos: [],
          status: 'pending',
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          privacy_preference: formData.privacyPreference,
          is_anonymous_submission: !authData.user,
          contact_info_approved: false,
        });
      if (error) throw error;
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Submission failed: ' + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Validation per step
  const canProceed = () => {
    switch (step) {
      case 0: return formData.fullName.trim() && formData.email.trim() && formData.phone.trim();
      case 1: return !!formData.parentCategoryId;
      case 2: return !!formData.categoryId;
      case 3: {
        const current = visibleQuestions[currentQuestionIndex];
        if (!current) return true;
        if (current.is_required && !formData.dynamicAnswers[current.id]) return false;
        return true;
      }
      case 4: return formData.description.trim().length >= 10;
      case 5: return formData.address.trim() && formData.city.trim() && formData.state.trim() && formData.zipCode.trim();
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 3) {
      // Handle question-by-question navigation
      if (currentQuestionIndex < visibleQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 3 && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return;
    }
    if (step === 0) {
      router.push('/app/pros', undefined, { locale });
      return;
    }
    // If going back from step 4 and there were no questions, go to step 2
    if (step === 4 && questions.length === 0) {
      setStep(2);
      return;
    }
    // If going back from step 2, clear sub-category selection
    if (step === 2) {
      setFormData(prev => ({ ...prev, categoryId: '', categoryName: '' }));
      setSubSearch('');
    }
    setStep(prev => prev - 1);
  };

  // Handle parent category selection — auto-advance to step 2
  const handleSelectParent = (cat: ServiceCategory) => {
    setFormData(prev => ({
      ...prev,
      parentCategoryId: cat.id,
      parentCategoryName: cat.name,
      categoryId: '',
      categoryName: '',
      dynamicAnswers: {},
    }));
    setSubSearch('');
    setStep(2);
  };

  // Handle sub-category selection
  const handleSelectSubCategory = (cat: ServiceCategory) => {
    setFormData(prev => ({
      ...prev,
      categoryId: cat.id,
      categoryName: cat.name,
    }));
  };

  return (
    <AppLayout>
      <Head>
        <title>Start a Project | Tavvy Pros</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        paddingBottom: '100px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${ProsColors.border}`,
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10,
        }}>
          <button onClick={handleBack} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
            display: 'flex', alignItems: 'center',
          }}>
            <FiArrowLeft size={24} color={ProsColors.textPrimary} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: '600', color: ProsColors.textPrimary }}>
            {step === 6 ? 'Review & Submit' : 'Start a Project'}
          </span>
          <button onClick={handleCancel} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
          }}>
            <FiX size={24} color={ProsColors.textSecondary} />
          </button>
        </div>

        {/* Progress Bar */}
        <ProgressBar step={step} />

        {/* Step Content */}
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>

          {/* ===== STEP 0: Customer Info ===== */}
          {step === 0 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 1 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  Your Information
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary, lineHeight: '24px' }}>
                  Tell us a bit about yourself so pros can reach you.
                </p>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                  Full Name
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                  borderRadius: '8px', padding: '0 12px', background: ProsColors.sectionBg,
                }}>
                  <FiUser style={{ marginRight: '8px', color: ProsColors.textMuted }} />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    style={{
                      flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                      background: 'transparent', outline: 'none', color: ProsColors.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                  Email
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                  borderRadius: '8px', padding: '0 12px', background: ProsColors.sectionBg,
                }}>
                  <FiMail style={{ marginRight: '8px', color: ProsColors.textMuted }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    style={{
                      flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                      background: 'transparent', outline: 'none', color: ProsColors.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                  Phone Number
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                  borderRadius: '8px', padding: '0 12px', background: ProsColors.sectionBg,
                }}>
                  <FiPhone style={{ marginRight: '8px', color: ProsColors.textMuted }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    style={{
                      flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                      background: 'transparent', outline: 'none', color: ProsColors.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Privacy Preference */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '12px' }}>
                  Communication Preference
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacyPreference: 'app_only' }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', border: `2px solid ${formData.privacyPreference === 'app_only' ? ProsColors.primary : ProsColors.border}`,
                      borderRadius: '10px', background: formData.privacyPreference === 'app_only' ? `${ProsColors.primary}10` : 'white',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <FiShield size={20} color={formData.privacyPreference === 'app_only' ? ProsColors.primary : ProsColors.textMuted} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: ProsColors.textPrimary }}>In-app messaging only</div>
                      <div style={{ fontSize: '13px', color: ProsColors.textSecondary }}>Pros contact you through the app</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacyPreference: 'share' }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', border: `2px solid ${formData.privacyPreference === 'share' ? ProsColors.primary : ProsColors.border}`,
                      borderRadius: '10px', background: formData.privacyPreference === 'share' ? `${ProsColors.primary}10` : 'white',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <FiMessageSquare size={20} color={formData.privacyPreference === 'share' ? ProsColors.primary : ProsColors.textMuted} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: ProsColors.textPrimary }}>Share my contact info</div>
                      <div style={{ fontSize: '13px', color: ProsColors.textSecondary }}>Pros can call, text, or email you directly</div>
                    </div>
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px', background: '#F0F9FF', borderRadius: '8px',
                marginTop: '12px',
              }}>
                <FiShield size={16} color="#3B82F6" />
                <span style={{ fontSize: '13px', color: '#3B82F6' }}>
                  Your information is secure and will only be shared with pros who bid on your project.
                </span>
              </div>
            </div>
          )}

          {/* ===== STEP 1: Parent Category Selection ===== */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 2 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  What type of service?
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  Choose a category to get started
                </p>
              </div>

              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                borderRadius: '8px', padding: '0 12px', marginBottom: '20px', background: ProsColors.sectionBg,
              }}>
                <FiSearch style={{ color: ProsColors.textMuted, marginRight: '8px' }} />
                <input
                  type="text"
                  value={parentSearch}
                  onChange={e => setParentSearch(e.target.value)}
                  placeholder="Search categories..."
                  style={{
                    flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                    background: 'transparent', outline: 'none',
                  }}
                />
              </div>

              {categoriesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={32} color={ProsColors.primary} />
                  <p style={{ marginTop: '12px', color: ProsColors.textSecondary }}>Loading categories...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredParentCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectParent(cat)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '18px 16px',
                        border: `2px solid ${formData.parentCategoryId === cat.id ? ProsColors.primary : ProsColors.border}`,
                        borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                        background: formData.parentCategoryId === cat.id ? `${ProsColors.primary}10` : 'white',
                        transition: 'all 0.2s',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: cat.color ? `${cat.color}15` : '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', flexShrink: 0,
                      }}>
                        {parentCategoryEmoji[cat.slug] || getCategoryIcon(cat.icon, cat.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: ProsColors.textPrimary }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: '13px', color: ProsColors.textSecondary, marginTop: '2px' }}>
                          {allCategories.filter(c => c.parent_id === cat.id).length} services
                        </div>
                      </div>
                      <FiChevronRight size={20} color={ProsColors.textMuted} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== STEP 2: Sub-Service Selection ===== */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 3 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  What do you need?
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  Select a specific service under <strong style={{ color: ProsColors.primary }}>{formData.parentCategoryName}</strong>
                </p>
              </div>

              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                borderRadius: '8px', padding: '0 12px', marginBottom: '20px', background: ProsColors.sectionBg,
              }}>
                <FiSearch style={{ color: ProsColors.textMuted, marginRight: '8px' }} />
                <input
                  type="text"
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  placeholder="Search services..."
                  style={{
                    flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                    background: 'transparent', outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filteredSubCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectSubCategory(cat)}
                    style={{
                      padding: '20px 16px', border: `2px solid ${formData.categoryId === cat.id ? ProsColors.primary : ProsColors.border}`,
                      borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      background: formData.categoryId === cat.id ? `${ProsColors.primary}10` : 'white',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {formData.categoryId === cat.id && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: ProsColors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FiCheck size={12} color="white" />
                      </div>
                    )}
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {getCategoryIcon(cat.icon, cat.name)}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary }}>
                      {cat.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== STEP 3: Dynamic Questions ===== */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 4 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  A few more details
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  Help us match you with the right pro
                </p>
              </div>

              {questionsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={32} color={ProsColors.primary} />
                </div>
              ) : visibleQuestions.length > 0 ? (
                <div>
                  {/* Question counter */}
                  <div style={{
                    fontSize: '13px', color: ProsColors.textMuted, marginBottom: '16px',
                  }}>
                    Question {currentQuestionIndex + 1} of {visibleQuestions.length}
                  </div>

                  {(() => {
                    const q = visibleQuestions[currentQuestionIndex];
                    if (!q) return null;
                    return (
                      <div key={q.id}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '16px' }}>
                          {q.question_text}
                          {q.is_required && <span style={{ color: ProsColors.error }}> *</span>}
                        </h3>

                        {/* Single Choice */}
                        {q.question_type === 'single_choice' && q.options && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {q.options.map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  dynamicAnswers: { ...prev.dynamicAnswers, [q.id]: opt }
                                }))}
                                style={{
                                  padding: '14px 16px',
                                  border: `2px solid ${formData.dynamicAnswers[q.id] === opt ? ProsColors.primary : ProsColors.border}`,
                                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                  background: formData.dynamicAnswers[q.id] === opt ? `${ProsColors.primary}10` : 'white',
                                  fontSize: '15px', fontWeight: '500', color: ProsColors.textPrimary,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Multiple Choice */}
                        {q.question_type === 'multiple_choice' && q.options && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {q.options.map((opt, i) => {
                              const selected = Array.isArray(formData.dynamicAnswers[q.id]) && formData.dynamicAnswers[q.id].includes(opt);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(formData.dynamicAnswers[q.id]) ? formData.dynamicAnswers[q.id] : [];
                                    const updated = selected ? current.filter((x: string) => x !== opt) : [...current, opt];
                                    setFormData(prev => ({
                                      ...prev,
                                      dynamicAnswers: { ...prev.dynamicAnswers, [q.id]: updated }
                                    }));
                                  }}
                                  style={{
                                    padding: '14px 16px',
                                    border: `2px solid ${selected ? ProsColors.primary : ProsColors.border}`,
                                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                    background: selected ? `${ProsColors.primary}10` : 'white',
                                    fontSize: '15px', fontWeight: '500', color: ProsColors.textPrimary,
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <div style={{
                                    width: '20px', height: '20px', borderRadius: '4px',
                                    border: `2px solid ${selected ? ProsColors.primary : ProsColors.border}`,
                                    background: selected ? ProsColors.primary : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    {selected && <FiCheck size={12} color="white" />}
                                  </div>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Text */}
                        {q.question_type === 'text' && (
                          <textarea
                            value={formData.dynamicAnswers[q.id] || ''}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              dynamicAnswers: { ...prev.dynamicAnswers, [q.id]: e.target.value }
                            }))}
                            placeholder="Type your answer..."
                            rows={4}
                            style={{
                              width: '100%', padding: '12px', border: `1px solid ${ProsColors.border}`,
                              borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit',
                              background: ProsColors.sectionBg, outline: 'none', resize: 'vertical',
                            }}
                          />
                        )}

                        {/* Number */}
                        {q.question_type === 'number' && (
                          <input
                            type="number"
                            value={formData.dynamicAnswers[q.id] || ''}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              dynamicAnswers: { ...prev.dynamicAnswers, [q.id]: e.target.value }
                            }))}
                            placeholder="Enter a number"
                            style={{
                              width: '100%', padding: '12px', border: `1px solid ${ProsColors.border}`,
                              borderRadius: '8px', fontSize: '16px', background: ProsColors.sectionBg, outline: 'none',
                            }}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          )}

          {/* ===== STEP 4: Project Description ===== */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 5 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  Describe your project
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  The more detail you provide, the better quotes you'll receive.
                </p>
              </div>

              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell us what you need done, any specific requirements, timing preferences, etc."
                rows={8}
                style={{
                  width: '100%', padding: '16px', border: `1px solid ${ProsColors.border}`,
                  borderRadius: '12px', fontSize: '16px', fontFamily: 'inherit',
                  background: ProsColors.sectionBg, outline: 'none', resize: 'vertical',
                  lineHeight: '24px',
                }}
              />
              <div style={{
                fontSize: '13px', color: formData.description.length < 10 ? ProsColors.error : ProsColors.textMuted,
                marginTop: '8px',
              }}>
                {formData.description.length < 10
                  ? `Please provide at least 10 characters (${formData.description.length}/10)`
                  : `${formData.description.length} characters`
                }
              </div>
            </div>
          )}

          {/* ===== STEP 5: Location ===== */}
          {step === 5 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 6 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  Where is the project?
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  This helps us match you with local pros.
                </p>
              </div>

              {/* Address with autocomplete */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                  Street Address
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', border: `1px solid ${ProsColors.border}`,
                  borderRadius: '8px', padding: '0 12px', background: ProsColors.sectionBg,
                }}>
                  <FiMapPin style={{ marginRight: '8px', color: ProsColors.textMuted, flexShrink: 0 }} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => handleAddressTextChange(e.target.value)}
                    onFocus={() => { if (formData.address.length >= 3 && addressSuggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                    placeholder="Start typing your address..."
                    autoComplete="off"
                    autoCorrect="off"
                    style={{
                      flex: 1, padding: '12px 0', fontSize: '16px', border: 'none',
                      background: 'transparent', outline: 'none', color: ProsColors.textPrimary,
                    }}
                  />
                  {addressLoading && <FiLoader style={{ animation: 'spin 1s linear infinite' }} />}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    background: 'white', border: `1px solid ${ProsColors.border}`, borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '200px', overflow: 'auto',
                  }}>
                    {addressSuggestions.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAddress(item)}
                        style={{
                          display: 'block', width: '100%', padding: '12px 16px', border: 'none',
                          background: 'white', cursor: 'pointer', textAlign: 'left',
                          borderBottom: i < addressSuggestions.length - 1 ? `1px solid ${ProsColors.border}` : 'none',
                          fontSize: '14px', color: ProsColors.textPrimary,
                        }}
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  style={{
                    width: '100%', padding: '12px', border: `1px solid ${ProsColors.border}`,
                    borderRadius: '8px', fontSize: '16px', background: ProsColors.sectionBg, outline: 'none',
                  }}
                />
              </div>

              {/* State & Zip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="FL"
                    style={{
                      width: '100%', padding: '12px', border: `1px solid ${ProsColors.border}`,
                      borderRadius: '8px', fontSize: '16px', background: ProsColors.sectionBg, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: ProsColors.textPrimary, marginBottom: '8px' }}>
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={e => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="33301"
                    style={{
                      width: '100%', padding: '12px', border: `1px solid ${ProsColors.border}`,
                      borderRadius: '8px', fontSize: '16px', background: ProsColors.sectionBg, outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 6: Review & Submit ===== */}
          {step === 6 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: ProsColors.primary }}>Step 7 of {TOTAL_STEPS}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                  Review your request
                </h2>
                <p style={{ fontSize: '16px', color: ProsColors.textSecondary }}>
                  Make sure everything looks good before submitting.
                </p>
              </div>

              <div style={{
                background: ProsColors.sectionBg, borderRadius: '16px', padding: '20px',
                border: `1px solid ${ProsColors.border}`,
              }}>
                {/* Category */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: ProsColors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Service
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: ProsColors.textPrimary, marginTop: '4px' }}>
                    {formData.parentCategoryName} &rsaquo; {formData.categoryName || 'Other'}
                  </div>
                </div>

                <div style={{ height: '1px', background: ProsColors.border, margin: '16px 0' }} />

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: ProsColors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Description
                  </span>
                  <div style={{ fontSize: '15px', color: ProsColors.textPrimary, marginTop: '4px', lineHeight: '22px' }}>
                    {formData.description}
                  </div>
                </div>

                <div style={{ height: '1px', background: ProsColors.border, margin: '16px 0' }} />

                {/* Location */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: ProsColors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Location
                  </span>
                  <div style={{ fontSize: '15px', color: ProsColors.textPrimary, marginTop: '4px' }}>
                    {formData.address}
                  </div>
                  <div style={{ fontSize: '14px', color: ProsColors.textSecondary }}>
                    {formData.city}, {formData.state} {formData.zipCode}
                  </div>
                </div>

                <div style={{ height: '1px', background: ProsColors.border, margin: '16px 0' }} />

                {/* Contact */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: ProsColors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Contact
                  </span>
                  <div style={{ fontSize: '15px', color: ProsColors.textPrimary, marginTop: '4px' }}>
                    {formData.fullName}
                  </div>
                  <div style={{ fontSize: '14px', color: ProsColors.textSecondary }}>
                    {formData.email} · {formData.phone}
                  </div>
                  <div style={{ fontSize: '13px', color: ProsColors.textMuted, marginTop: '4px' }}>
                    Privacy: {formData.privacyPreference === 'share' ? 'Sharing contact info' : 'In-app messaging only'}
                  </div>
                </div>

                {/* Dynamic answers */}
                {Object.keys(formData.dynamicAnswers).length > 0 && (
                  <>
                    <div style={{ height: '1px', background: ProsColors.border, margin: '16px 0' }} />
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: ProsColors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Additional Details
                      </span>
                      {Object.entries(formData.dynamicAnswers).map(([qId, answer]) => {
                        const q = questions.find(x => x.id === qId);
                        return (
                          <div key={qId} style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '13px', color: ProsColors.textSecondary }}>{q?.question_text || 'Question'}</div>
                            <div style={{ fontSize: '15px', color: ProsColors.textPrimary }}>
                              {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '18px', marginTop: '24px',
                  background: submitting ? ProsColors.textMuted : ProsColors.primary,
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontSize: '18px', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
                {!submitting && <FiSend size={20} />}
              </button>

              <p style={{ textAlign: 'center', color: ProsColors.textMuted, fontSize: '12px', marginTop: '15px' }}>
                By submitting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}

          {/* ===== Navigation Buttons (Steps 0-5, not step 1 since it auto-advances) ===== */}
          {step < 6 && step !== 1 && (
            <div style={{ marginTop: '32px', paddingBottom: '20px' }}>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: canProceed() ? ProsColors.primary : '#E5E7EB',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '16px', fontWeight: '600', cursor: canProceed() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: canProceed() ? 1 : 0.5,
                }}
              >
                Continue
                <FiArrowRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* ===== Success Modal ===== */}
        {showSuccessModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}>
            <div style={{
              background: 'white', borderRadius: '24px', padding: '30px',
              width: '100%', maxWidth: '400px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: ProsColors.textPrimary, marginBottom: '12px' }}>
                Request Submitted!
              </h3>

              {user ? (
                <>
                  <p style={{ fontSize: '16px', color: ProsColors.textSecondary, marginBottom: '24px', lineHeight: '22px' }}>
                    Your request has been sent to local pros. You'll receive notifications when pros respond.
                  </p>
                  <button
                    onClick={() => router.push('/app/pros', undefined, { locale })}
                    style={{
                      width: '100%', padding: '18px', background: ProsColors.primary,
                      color: 'white', border: 'none', borderRadius: '14px',
                      fontSize: '18px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px',
                    }}
                  >
                    Browse Pros
                  </button>
                  <button
                    onClick={() => router.push('/app', undefined, { locale })}
                    style={{
                      width: '100%', padding: '15px', background: 'transparent',
                      color: ProsColors.textSecondary, border: 'none',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Go to Home
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '16px', color: ProsColors.textSecondary, marginBottom: '24px', lineHeight: '22px' }}>
                    Sign up now to get real-time notifications and chat directly with pros who respond to your request.
                  </p>
                  <button
                    onClick={() => router.push(`/app/signup?email=${encodeURIComponent(formData.email, undefined, { locale })}`)}
                    style={{
                      width: '100%', padding: '18px', background: ProsColors.primary,
                      color: 'white', border: 'none', borderRadius: '14px',
                      fontSize: '18px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px',
                    }}
                  >
                    Sign Up Now
                  </button>
                  <button
                    onClick={() => router.push('/app', undefined, { locale })}
                    style={{
                      width: '100%', padding: '15px', background: 'transparent',
                      color: ProsColors.textSecondary, border: 'none',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Skip for Now
                  </button>
                  <p style={{ fontSize: '12px', color: ProsColors.textMuted, marginTop: '20px' }}>
                    Your contact info stays private until you approve a pro.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
