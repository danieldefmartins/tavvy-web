import Head from 'next/head';
import type { PlaceShareMetadata } from '../lib/placeShareMetadata';
export default function PlaceShareHead({metadata}:{metadata:PlaceShareMetadata}) {
  return <Head>
    <title>{metadata.title}</title>
    {metadata.id==='demo-trattoria'&&<meta name="robots" content="noindex,nofollow" key="robots" />}
    <meta name="title" content={metadata.title} key="title" />
    <meta name="description" content={metadata.description} key="description" />
    <link rel="canonical" href={metadata.url} key="canonical" />
    <meta property="og:type" content="website" key="og:type" />
    <meta property="og:site_name" content="Tavvy" key="og:site_name" />
    <meta property="og:title" content={metadata.title} key="og:title" />
    <meta property="og:description" content={metadata.description} key="og:description" />
    <meta property="og:url" content={metadata.url} key="og:url" />
    <meta property="og:image" content={metadata.image} key="og:image" />
    <meta property="og:image:alt" content={metadata.imageAlt} key="og:image:alt" />
    {metadata.generatedImage&&<meta property="og:image:width" content="1200" key="og:image:width" />}
    {metadata.generatedImage&&<meta property="og:image:height" content="630" key="og:image:height" />}
    <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
    <meta name="twitter:title" content={metadata.title} key="twitter:title" />
    <meta name="twitter:description" content={metadata.description} key="twitter:description" />
    <meta name="twitter:url" content={metadata.url} key="twitter:url" />
    <meta name="twitter:image" content={metadata.image} key="twitter:image" />
    <meta name="twitter:image:alt" content={metadata.imageAlt} key="twitter:image:alt" />
  </Head>;
}
