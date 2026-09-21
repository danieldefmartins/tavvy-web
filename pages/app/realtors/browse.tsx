import React from 'react';
import {useRouter} from 'next/router';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import ProviderDirectory from '../../../components/providers/ProviderDirectory';
export default function Screen(){return <ProviderDirectory kind="realtor"/>;}
export const getServerSideProps=async({locale}:{locale:string})=>({props:{...(await serverSideTranslations(locale??'en',['common']))}});
