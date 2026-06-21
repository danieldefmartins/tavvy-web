import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import PlaceScreen from '../../components/PreviewPlace';
import { CONFIGS, TYPE_ORDER, TYPE_LABEL } from '../../components/previewConfigs';

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: TYPE_ORDER.map(type => ({ params: { type } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => ({
  props: { type: params!.type as string },
});

export default function PreviewType({ type }: { type: string }) {
  const cfg = CONFIGS[type];
  if (!cfg) return null;
  return (
    <>
      <Head>
        <title>{TYPE_LABEL[type] || cfg.type} — Tavvy preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PlaceScreen config={cfg} />
    </>
  );
}
