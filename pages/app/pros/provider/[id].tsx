import React from 'react';
import {useRouter} from 'next/router';
import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import ProviderProfile from '../../../../components/providers/ProviderProfile';
export default function Screen(){return <ProviderProfile kind="pros"/>;}
export const getServerSideProps=async({locale}:{locale:string})=>({props:{...(await serverSideTranslations(locale??'en',['common']))}});
