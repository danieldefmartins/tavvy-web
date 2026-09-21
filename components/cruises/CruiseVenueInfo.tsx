import {useReleaseCopy} from '../../hooks/useReleaseCopy';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {CruiseVenueContext,cruiseVenueShipHref} from '../../lib/cruises/venueContext';
export default function CruiseVenueInfo({context}:{context:CruiseVenueContext}) {
 const {locale}=useRouter();
 const copy=useReleaseCopy();
 return <section className="onboard-context" aria-label={copy('Onboard place information')}>
  <Link href={cruiseVenueShipHref(context)} locale={locale}>← {context.ship_name}</Link>
  <p>{context.operator_name}{context.deck_label?` · ${context.deck_label}`:''}</p>
  {context.included!==null&&<p>{copy(context.included?'Included':'Additional charge')}</p>}
  {context.availability_note&&<p>{context.availability_note}</p>}
  <p className="note">{copy('These reviews describe this place on board. Whole-ship reviews are on the ship page.')}</p>
  {context.official_url&&<a href={context.official_url} target="_blank" rel="noopener noreferrer">{copy('Official ship website ↗')}</a>}
  <style jsx>{`.onboard-context{margin:18px 0;padding:16px;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 18%,transparent);border-radius:16px}.onboard-context p{margin:8px 0;line-height:1.55}.onboard-context a{color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px}.note{font-size:13px;opacity:.82}`}</style>
 </section>;
}
