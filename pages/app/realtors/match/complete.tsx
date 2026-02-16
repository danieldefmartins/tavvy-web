import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../../components/AppLayout';
import { FiCheck, FiHome } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function MatchCompleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;

  return (
    <>
      <Head><title>Match Complete | TavvY</title></Head>
      <AppLayout hideNav>
        <div style={{minHeight:'100vh',background:'linear-gradient(180deg, #0A0A0F 0%, #0F1520 50%, #1A2535 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',textAlign:'center'}}>
          <div style={{width:'100px',height:'100px',borderRadius:'50px',background:'linear-gradient(135deg, #10B981 0%, #059669 100%)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'32px'}}>
            <FiCheck size={48} color="#FFFFFF" />
          </div>
          <h1 style={{fontSize:'32px',fontWeight:700,color:'#FFFFFF',margin:'0 0 12px'}}>You're All Set!</h1>
          <p style={{fontSize:'16px',color:'#9CA3AF',margin:'0 0 40px',maxWidth:'400px',lineHeight:1.5}}>We've received your request and are matching you with the best realtors in your area. Expect to hear from them within 24 hours.</p>
          <div style={{display:'flex',flexDirection:'column',gap:'16px',width:'100%',maxWidth:'300px'}}>
            <button onClick={() => router.push('/app/realtors', undefined, { locale })} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',color:'#FFFFFF',fontSize:'16px',fontWeight:600,padding:'16px',border:'none',borderRadius:'12px',cursor:'pointer'}}>
              <FiHome size={20} /> Back to Realtors
            </button>
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
