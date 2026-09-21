import type {PlaceShareMetadata} from '../placeShareMetadata';
import {placeSharePhotoUrl} from '../placeShareMetadata';
import type {CruiseShipDetail} from './catalog';
export function cruiseShareMetadata(detail:CruiseShipDetail):PlaceShareMetadata {
 const {ship}=detail;const image=ship.photo?.permission_verified?placeSharePhotoUrl(ship.photo.url):null;
 return {id:`cruise:${ship.id}`,name:ship.name,title:`${ship.name} — cruise ship | Tavvy`,description:`${ship.name} from ${ship.operator_name}: onboard places, guest reports and sourced ship information.`,category:`${ship.kind} cruise ship`,location:ship.operator_name,url:`https://tavvy.com/app/cruises/${encodeURIComponent(ship.slug)}`,image:image||`https://tavvy.com/api/og/cruise/${encodeURIComponent(ship.slug)}`,imageAlt:image?ship.photo!.alt:`${ship.name} · ${ship.operator_name}`,generatedImage:!image};
}
