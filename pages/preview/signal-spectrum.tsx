/**
 * Legacy URL for the restaurant place preview — now rendered by the shared,
 * config-driven PlaceScreen so it stays in sync with every other type.
 */
import Head from 'next/head';
import PlaceScreen from '../../components/PreviewPlace';
import { CONFIGS } from '../../components/previewConfigs';

export default function SignalSpectrumPreview() {
  return (
    <>
      <Head>
        <title>Signal Spectrum — Tavvy preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PlaceScreen config={CONFIGS.restaurant} />
    </>
  );
}
