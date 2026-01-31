/**
 * New Project Page - Customer Quote Request
 * Allows customers to submit project details and get matched with pros
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/AppLayout';
import { Colors } from '../../../constants/Colors';
import { FiCheck, FiChevronRight } from 'react-icons/fi';

const categories = [
  { id: 'home', name: 'Home Services', icon: '🏠', services: ['Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'Cleaning', 'Handyman'] },
  { id: 'auto', name: 'Auto Services', icon: '🚗', services: ['Mechanic', 'Detailing', 'Towing', 'Body Shop'] },
  { id: 'marine', name: 'Marine Services', icon: '⛵', services: ['Boat Repair', 'Detailing', 'Storage'] },
  { id: 'events', name: 'Events', icon: '🎉', services: ['Catering', 'DJ', 'Photography', 'Planning'] },
  { id: 'business', name: 'Business Services', icon: '💼', services: ['Accounting', 'Legal', 'Marketing', 'IT'] },
  { id: 'creative', name: 'Creative Services', icon: '🎨', services: ['Design', 'Video', 'Writing', 'Music'] },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    service: '',
    description: '',
    location: '',
    timeline: '',
    budget: '',
    contactMethod: 'email',
    proCount: '3',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Submit to API
    console.log('Project submitted:', formData);
    
    // Redirect to success page
    router.push('/app/pros/project-submitted');
  };

  const selectedCategory = categories.find(c => c.id === formData.category);

  return (
    <AppLayout>
      <Head>
        <title>Start a Project | Tavvy Pros</title>
      </Head>

      <div style={{ 
        minHeight: '100vh',
        background: Colors.light.background,
        paddingBottom: '80px'
      }}>
        {/* Header */}
        <div style={{
          background: Colors.light.primary,
          color: 'white',
          padding: '24px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Start a Project
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            Get matched with vetted professionals
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 20px',
          gap: '12px'
        }}>
          {[1, 2, 3].map(num => (
            <div key={num} style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step >= num ? Colors.light.tint : '#E5E7EB',
              color: step >= num ? 'white' : '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {step > num ? <FiCheck /> : num}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
          {/* Step 1: Category & Service */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                What do you need help with?
              </h2>

              {/* Category Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                  Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id, service: '' })}
                      style={{
                        padding: '16px',
                        border: `2px solid ${formData.category === cat.id ? Colors.light.tint : '#E5E7EB'}`,
                        borderRadius: '12px',
                        background: formData.category === cat.id ? `${Colors.light.tint}10` : 'white',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{cat.icon}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Selection */}
              {selectedCategory && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                    Service Type
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    required
                  >
                    <option value="">Select a service...</option>
                    {selectedCategory.services.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.category || !formData.service}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: formData.category && formData.service ? Colors.light.tint : '#E5E7EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: formData.category && formData.service ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continue <FiChevronRight />
              </button>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                Tell us about your project
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Project Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you need done..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Location (City or ZIP)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your location..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                >
                  <option value="">Select timeline...</option>
                  <option value="urgent">Urgent (ASAP)</option>
                  <option value="week">Within a week</option>
                  <option value="month">Within a month</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Budget (Optional)
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g., $500-1000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'white',
                    color: Colors.light.tint,
                    border: `2px solid ${Colors.light.tint}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.description || !formData.location || !formData.timeline}
                  style={{
                    flex: 2,
                    padding: '16px',
                    background: formData.description && formData.location && formData.timeline ? Colors.light.tint : '#E5E7EB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: formData.description && formData.location && formData.timeline ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Continue <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Preferences */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                How many pros do you want to hear from?
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {['1', '3', '5'].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setFormData({ ...formData, proCount: count })}
                      style={{
                        padding: '20px',
                        border: `2px solid ${formData.proCount === count ? Colors.light.tint : '#E5E7EB'}`,
                        borderRadius: '12px',
                        background: formData.proCount === count ? `${Colors.light.tint}10` : 'white',
                        cursor: 'pointer',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '12px' }}>
                  More pros = more options, but also more messages
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                  Preferred Contact Method
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { id: 'email', label: 'Email' },
                    { id: 'phone', label: 'Phone' },
                    { id: 'both', label: 'Both' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, contactMethod: method.id })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: `2px solid ${formData.contactMethod === method.id ? Colors.light.tint : '#E5E7EB'}`,
                        borderRadius: '8px',
                        background: formData.contactMethod === method.id ? `${Colors.light.tint}10` : 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ 
                background: '#F3F4F6',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  🔒 Your Privacy is Protected
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280' }}>
                  Your contact info stays private until you choose to hire a pro. Pros can message you through Tavvy, but they won't see your email or phone number.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'white',
                    color: Colors.light.tint,
                    border: `2px solid ${Colors.light.tint}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '16px',
                    background: Colors.light.tint,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Submit Project
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
