import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { FiArrowLeft, FiMapPin, FiStar, FiPhone, FiMail, FiCheck } from 'react-icons/fi';
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
  bio?: string;
  phone?: string;
  email?: string;
}

export default function RealtorDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (!id) return;
    const fetchRealtor = async () => {
      try {
        const { data, error } = await supabase.from('pro_providers').select('*').eq('id', id).single();
        if (!error && data) setRealtor(data);
        else setRealtor({ id: id as string, business_name: 'Sample Realtor', contact_name: 'John Doe', service_areas: ['Miami, FL'], rating: 4.8, reviews_count: 120, specialties: ['Luxury', 'Waterfront'], is_verified: true, bio: 'Experienced real estate professional with over 10 years in the industry.' });
      } catch (error) {
        console.error('Error fetching realtor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealtor();
  }, [id]);

  if (loading) return <AppLayout><div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:'32px',height:'32px',border:'3px solid #252532',borderTopColor:'#3B82F6',borderRadius:'50%',animation:'spin 1s linear infinite'}} /></div></AppLayout>;
  if (!realtor) return <AppLayout><div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFFFFF'}}>Realtor not found</div></AppLayout>;

  return (
    <>
      <Head><title>{realtor.contact_name || realtor.business_name} | TavvY</title></Head>
      <AppLayout>
        <div style={{minHeight:'100vh',background:'#0A0A0F',paddingBottom:'100px'}}>
          <div style={{position:'relative',height:'250px',background:'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)'}}>
            <button onClick={() => router.back()} style={{position:'absolute',top:'60px',left:'20px',width:'40px',height:'40px',borderRadius:'20px',background:'rgba(0,0,0,0.5)',border:'none',color:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:10}}><FiArrowLeft size={24} /></button>
            {realtor.photo_url ? <img src={realtor.photo_url} alt={realtor.business_name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:'80px',color:'#FFFFFF',fontWeight:600}}>{(realtor.contact_name || realtor.business_name).charAt(0)}</span></div>}
          </div>

          <div style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <h1 style={{fontSize:'24px',fontWeight:700,color:'#FFFFFF',margin:0}}>{realtor.contact_name || realtor.business_name}</h1>
              {realtor.is_verified && <div style={{background:'#3B82F6',borderRadius:'50%',padding:'4px'}}><FiCheck size={14} color="#FFFFFF" /></div>}
            </div>
            <p style={{fontSize:'14px',color:'#9CA3AF',margin:'0 0 12px',display:'flex',alignItems:'center',gap:'6px'}}><FiMapPin size={14} />{realtor.service_areas?.[0] || 'Multiple Locations'}</p>
            {realtor.rating && <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'20px'}}><FiStar size={16} color="#F59E0B" fill="#F59E0B" /><span style={{fontSize:'16px',color:'#FFFFFF',fontWeight:600}}>{realtor.rating}</span><span style={{fontSize:'14px',color:'#6B7280'}}>({realtor.reviews_count} reviews)</span></div>}

            <div style={{display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap'}}>
              {realtor.specialties?.map((specialty) => (<span key={specialty} style={{background:'#1A1A24',color:'#9CA3AF',padding:'8px 12px',borderRadius:'8px',fontSize:'13px'}}>{specialty}</span>))}
            </div>

            <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
              <button style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',color:'#FFFFFF',padding:'14px',borderRadius:'12px',border:'none',fontSize:'16px',fontWeight:600,cursor:'pointer'}}><FiPhone size={18} /> Call</button>
              <button style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#1A1A24',color:'#FFFFFF',padding:'14px',borderRadius:'12px',border:'none',fontSize:'16px',fontWeight:600,cursor:'pointer'}}><FiMail size={18} /> Message</button>
            </div>

            <div style={{display:'flex',borderBottom:'1px solid #252532',marginBottom:'20px'}}>
              {['about', 'listings', 'reviews'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} style={{flex:1,padding:'14px',background:'transparent',border:'none',borderBottom:activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',color:activeTab === tab ? '#FFFFFF' : '#6B7280',fontSize:'14px',fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{tab}</button>))}
            </div>

            {activeTab === 'about' && (<div><h3 style={{fontSize:'18px',fontWeight:600,color:'#FFFFFF',margin:'0 0 12px'}}>About</h3><p style={{fontSize:'15px',color:'#9CA3AF',lineHeight:1.6,margin:0}}>{realtor.bio || 'Experienced real estate professional dedicated to helping clients find their perfect home.'}</p></div>)}
            {activeTab === 'listings' && (<div style={{textAlign:'center',padding:'40px'}}><span style={{fontSize:'48px',display:'block',marginBottom:'16px'}}>🏠</span><p style={{color:'#6B7280'}}>No active listings</p></div>)}
            {activeTab === 'reviews' && (<div style={{textAlign:'center',padding:'40px'}}><span style={{fontSize:'48px',display:'block',marginBottom:'16px'}}>⭐</span><p style={{color:'#6B7280'}}>No reviews yet</p></div>)}
          </div>
        </div>
      </AppLayout>
    </>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
