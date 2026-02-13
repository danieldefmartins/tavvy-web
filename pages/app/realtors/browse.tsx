import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { FiSearch, FiMapPin, FiStar, FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Realtor {
  id: string;
  business_name: string;
  contact_name?: string;
  photo_url?: string;
  service_areas?: string[];
  rating?: number;
  reviews_count?: number;
  specialties?: string[];
  is_verified?: boolean;
}

const SAMPLE_REALTORS: Realtor[] = [
  { id: '1', business_name: 'Sarah Johnson Realty', contact_name: 'Sarah Johnson', service_areas: ['Miami, FL'], rating: 4.9, reviews_count: 127, specialties: ['Luxury', 'Waterfront'], is_verified: true },
  { id: '2', business_name: 'Urban Living Group', contact_name: 'Michael Chen', service_areas: ['New York, NY'], rating: 4.8, reviews_count: 89, specialties: ['Condos', 'Investment'], is_verified: true },
  { id: '3', business_name: 'Family First Realty', contact_name: 'Emily Rodriguez', service_areas: ['Los Angeles, CA'], rating: 4.7, reviews_count: 156, specialties: ['Family Homes'], is_verified: false },
  { id: '4', business_name: 'Commercial Experts', contact_name: 'David Thompson', service_areas: ['Chicago, IL'], rating: 4.9, reviews_count: 203, specialties: ['Commercial'], is_verified: true },
  { id: '5', business_name: 'Coastal Properties', contact_name: 'Jennifer Lee', service_areas: ['San Diego, CA'], rating: 4.6, reviews_count: 78, specialties: ['Waterfront'], is_verified: true },
  { id: '6', business_name: 'Metro Realty Partners', contact_name: 'Robert Wilson', service_areas: ['Austin, TX'], rating: 4.8, reviews_count: 134, specialties: ['Relocation'], is_verified: false },
];

const SPECIALTIES = ['All', 'Luxury', 'First-Time', 'Investment', 'Relocation', 'Commercial', 'Waterfront'];

export default function RealtorsBrowseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const [realtors, setRealtors] = useState<Realtor[]>(SAMPLE_REALTORS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  useEffect(() => {
    const fetchRealtors = async () => {
      try {
        const { data, error } = await supabase.from('pro_providers').select('*').eq('provider_type', 'realtor').eq('is_active', true).order('rating', { ascending: false });
        if (!error && data && data.length > 0) setRealtors(data);
      } catch (error) {
        console.error('Error fetching realtors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealtors();
  }, []);

  const filteredRealtors = realtors.filter(realtor => {
    const name = realtor.business_name || realtor.contact_name || '';
    const location = realtor.service_areas?.join(', ') || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || realtor.specialties?.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <>
      <Head><title>Browse Realtors | TavvY</title></Head>
      <AppLayout>
        <div style={{minHeight:'100vh',background:'#0A0A0F',paddingBottom:'100px'}}>
          <div style={{padding:'60px 20px 20px',background:'linear-gradient(180deg, #0F1520 0%, #0A0A0F 100%)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'20px'}}>
              <button onClick={() => router.back()} style={{width:'40px',height:'40px',borderRadius:'20px',background:'#1A1A24',border:'none',color:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><FiArrowLeft size={24} /></button>
              <h1 style={{fontSize:'24px',fontWeight:700,color:'#FFFFFF',margin:0}}>Browse Realtors</h1>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#1A1A24',padding:'14px 18px',borderRadius:'12px',border:'1px solid #252532'}}>
              <FiSearch size={20} color="#6B7280" />
              <input type="text" placeholder="Search realtors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{flex:1,border:'none',background:'transparent',fontSize:'16px',color:'#FFFFFF',outline:'none'}} />
            </div>
          </div>

          <div style={{display:'flex',gap:'10px',padding:'16px 20px',overflowX:'auto'}}>
            {SPECIALTIES.map((specialty) => (
              <button key={specialty} onClick={() => setSelectedSpecialty(specialty)} style={{padding:'10px 18px',borderRadius:'20px',border:'none',fontSize:'14px',fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',background:selectedSpecialty === specialty ? '#3B82F6' : '#1A1A24',color:selectedSpecialty === specialty ? '#FFFFFF' : '#9CA3AF'}}>{specialty}</button>
            ))}
          </div>

          <div style={{padding:'0 20px'}}>
            {loading ? (
              <div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div style={{width:'32px',height:'32px',border:'3px solid #252532',borderTopColor:'#3B82F6',borderRadius:'50%',animation:'spin 1s linear infinite'}} /></div>
            ) : filteredRealtors.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 20px'}}><span style={{fontSize:'48px',display:'block',marginBottom:'16px'}}>🏠</span><p style={{color:'#6B7280',fontSize:'16px'}}>No realtors found</p></div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'16px'}}>
                {filteredRealtors.map((realtor) => (
                  <Link key={realtor.id} href={`/app/realtor/${realtor.id}`} style={{background:'#1A1A24',borderRadius:'16px',overflow:'hidden',textDecoration:'none'}} locale={locale}>
                    <div style={{position:'relative',width:'100%',aspectRatio:'4/3',overflow:'hidden',background:'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {realtor.is_verified && <div style={{position:'absolute',top:'8px',right:'8px',background:'rgba(239, 68, 68, 0.9)',color:'#FFFFFF',fontSize:'11px',fontWeight:600,padding:'4px 8px',borderRadius:'6px'}}>🔥 Trending</div>}
                      {realtor.photo_url ? <img src={realtor.photo_url} alt={realtor.business_name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{color:'#FFFFFF',fontSize:'48px',fontWeight:600}}>{(realtor.contact_name || realtor.business_name).charAt(0)}</span>}
                    </div>
                    <div style={{padding:'14px'}}>
                      <h3 style={{fontSize:'15px',fontWeight:600,color:'#FFFFFF',margin:'0 0 4px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{realtor.contact_name || realtor.business_name}</h3>
                      <p style={{fontSize:'13px',color:'#9CA3AF',margin:'0 0 6px'}}>{realtor.service_areas?.[0] || 'Multiple Locations'}</p>
                      {realtor.rating && <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'13px',color:'#FFFFFF'}}><FiStar size={12} color="#F59E0B" fill="#F59E0B" /><span>{realtor.rating}</span></div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
