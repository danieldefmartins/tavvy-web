import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../../components/AppLayout';
import { FiArrowLeft, FiArrowRight, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { supabase } from '../../../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function MatchContactScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '' });
  const isValid = form.name && form.email && form.phone && form.location;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const matchData = {
        main_goal: sessionStorage.getItem('match_goal') || 'buy',
        property_type: sessionStorage.getItem('match_property_type') || 'single_family',
        location: form.location,
        contact_name: form.name,
        contact_email: form.email,
        contact_phone: form.phone,
        status: 'pending',
      };
      await supabase.from('realtor_match_requests').insert([matchData]);
      sessionStorage.clear();
      router.push('/app/realtors/match/complete', undefined, { locale });
    } catch (error) {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Smart Match - Contact Info | TavvY</title></Head>
      <AppLayout hideNav>
        <div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',flexDirection:'column',padding:'20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px',paddingTop:'40px',marginBottom:'40px'}}>
            <button onClick={() => router.back()} style={{width:'40px',height:'40px',borderRadius:'20px',background:'#1A1A24',border:'none',color:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><FiArrowLeft size={24} /></button>
            <div style={{flex:1,height:'4px',background:'#1A1A24',borderRadius:'2px',overflow:'hidden'}}><div style={{width:'75%',height:'100%',background:'#3B82F6',borderRadius:'2px'}} /></div>
            <span style={{fontSize:'14px',color:'#6B7280'}}>3 of 4</span>
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'28px',fontWeight:700,color:'#FFFFFF',margin:'0 0 8px'}}>Almost there!</h1>
            <p style={{fontSize:'16px',color:'#6B7280',margin:'0 0 32px'}}>Enter your contact info so realtors can reach you.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {[{icon:FiUser,placeholder:'Full Name',key:'name',type:'text'},{icon:FiMail,placeholder:'Email Address',key:'email',type:'email'},{icon:FiPhone,placeholder:'Phone Number',key:'phone',type:'tel'},{icon:FiMapPin,placeholder:'City, State',key:'location',type:'text'}].map(({icon:Icon,placeholder,key,type}) => (
                <div key={key} style={{display:'flex',alignItems:'center',gap:'12px',background:'#1A1A24',padding:'16px',borderRadius:'12px',border:'1px solid #252532'}}>
                  <Icon size={20} color="#6B7280" />
                  <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={(e) => setForm({...form, [key]: e.target.value})} style={{flex:1,background:'transparent',border:'none',color:'#FFFFFF',fontSize:'16px',outline:'none'}} />
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'20px 0 40px'}}>
            <button onClick={handleSubmit} disabled={!isValid || loading} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:isValid && !loading ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)' : '#3B3B4F',color:isValid && !loading ? '#FFFFFF' : '#6B7280',fontSize:'18px',fontWeight:700,padding:'18px',border:'none',borderRadius:'16px',cursor:isValid && !loading ? 'pointer' : 'not-allowed',marginBottom:'16px'}}>{loading ? 'Submitting...' : 'Find My Realtors'} <FiArrowRight size={20} /></button>
            <p style={{fontSize:'12px',color:'#6B7280',textAlign:'center',margin:0}}>Your information is secure and only shared with matched realtors.</p>
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
