import React from 'react';
import {useRouter} from 'next/router';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import ProviderDirectory from '../../../../components/providers/ProviderDirectory';
export default function Screen(){const router=useRouter();const category=typeof router.query.slug==='string'?router.query.slug:undefined;return <ProviderDirectory key={category||'all'} kind="pros" category={category}/>;}
export const getServerSideProps=async({locale}:{locale:string})=>({props:{...(await serverSideTranslations(locale??'en',['common']))}});
