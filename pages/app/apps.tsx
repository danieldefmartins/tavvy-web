import { useReleaseCopy } from '../../hooks/useReleaseCopy';
/** A shared, descriptive directory of Tavvy tools. */
import React, { useState } from 'react';
import design from '../../config/design.json';
import { TOOL_DETAILS, TOOL_GROUPS, toolMatches } from '../../lib/toolDirectory';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import ReviewWishlistCard from '../../components/ReviewWishlistCard';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { 
  FiSearch, FiUser
} from 'react-icons/fi';
import { 
  IoConstruct, IoCar, IoPlanet, IoTrain, IoWallet, 
  IoBusinessOutline, IoHeart, IoPersonOutline, IoAddCircle,
  IoHome, IoSparkles, IoBook, IoSettings, IoRestaurant, IoBoat
} from 'react-icons/io5';

// Featured apps (large cards, horizontal scroll)
const FEATURED_APPS = [
  {
    id: 'pros',
    nameKey: 'apps.pros',
    icon: IoConstruct,
    gradient: 'linear-gradient(135deg, #8A05BE 0%, #6B04A0 100%)',
    href: '/app/pros',
  },
  {
    id: 'atlas',
    nameKey: 'apps.atlas',
    icon: IoBook,
    gradient: 'linear-gradient(135deg, #8A05BE 0%, #7C3AED 100%)',
    href: '/app/atlas',
  },
  {
    id: 'ecard',
    nameKey: 'apps.ecard',
    icon: IoHeart,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    href: '/app/ecard',
  },
];

// All apps grid
const ALL_APPS = [
  { id: 'cruises', nameKey: 'release.cruiseToolTitle', icon: IoBoat, color: '#167C9C', href: '/app/cruises' },
  { id: 'experiences', nameKey: 'apps.experiences', icon: IoSparkles, color: '#007F86', href: '/app/experiences' },
  {
    id: 'food-menu',
    nameKey: 'apps.foodMenu',
    icon: IoRestaurant,
    color: '#E65B38',
    href: '/app/food-menu',
  },
  {
    id: 'universes',
    nameKey: 'apps.universes',
    icon: IoPlanet,
    color: '#14B8A6',
    href: '/app/explore',
  },
  {
    id: 'onthego',
    nameKey: 'apps.onTheGo',
    icon: IoCar,
    color: '#00C2CB',
    href: '/app/onthego',
  },
  {
    id: 'rides',
    nameKey: 'apps.rides',
    icon: IoTrain,
    color: '#EF4444',
    href: '/app/rides',
  },
  {
    id: 'rv-camping',
    nameKey: 'apps.rvCamping',
    icon: IoCar,
    color: '#00C2CB',
    href: '/app/rv-camping',
  },
  {
    id: 'messages',
    nameKey: 'apps.messages',
    icon: IoHeart,
    color: '#EF4444',
    href: '/app/messages',
  },
  {
    id: 'wallet',
    nameKey: 'apps.wallet',
    icon: IoWallet,
    color: '#8A05BE',
    href: '/app/wallet',
  },
  {
    id: 'cities',
    nameKey: 'apps.cities',
    icon: IoBusinessOutline,
    color: '#8A05BE',
    href: '/app/cities',
  },
  {
    id: 'saved',
    nameKey: 'apps.saved',
    icon: IoHeart,
    color: '#EC4899',
    href: '/app/saved',
  },
  {
    id: 'account',
    nameKey: 'apps.account',
    icon: IoPersonOutline,
    color: '#94A3B8',
    href: '/app/profile',
  },
  {
    id: 'create',
    nameKey: 'apps.create',
    icon: IoAddCircle,
    color: '#00C2CB',
    href: '/app/add',
  },
  {
    id: 'realtors',
    nameKey: 'apps.realtors',
    icon: IoHome,
    color: '#14B8A6',
    href: '/app/realtors',
  },
  {
    id: 'happening',
    nameKey: 'apps.happening',
    icon: IoSparkles,
    color: '#EC4899',
    href: '/app/happening-now',
  },
  {
    id: 'settings',
    nameKey: 'apps.settingsApp',
    icon: IoSettings,
    color: '#64748B',
    href: '/app/settings',
  },
];

export default function AppsScreen() {
  const copy = useReleaseCopy();
  const router = useRouter();
  const { locale } = router;
  const { isDark } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const allTools = [...FEATURED_APPS, ...ALL_APPS];
  const label = (app: typeof allTools[number]) => t(app.nameKey, { defaultValue: TOOL_DETAILS[app.id].name });
  const filtered = allTools.filter(app => toolMatches(app.id, searchQuery, label(app)));
  const palette = isDark ? design.dark : design.light;
  const text = palette.text;
  const secondary = palette.textSecondary;
  const accent = palette.link;
  return <><Head><title>Apps & tools | Tavvy</title><meta name={"description"} content="Find your next stop, connect with local people and keep your essentials close." /></Head>
    <AppLayout><main className="directory">
      <header className="header"><div><img className="directory-logo" src={isDark ? '/tavvy-logo-white.png' : '/tavvy-logo-dark.png'} alt={copy("Tavvy")} width={160} height={47} /><p className="eyebrow">{copy("A LITTLE HELP FOR EVERY DAY")}</p><h1>{copy("What would you like to do?")}</h1><p className="intro">{copy("Find your next stop. Meet the right people. Make yourself at home.")}</p></div><button className={"profile"} aria-label={user ? 'Your account' : "Sign in"} onClick={() => router.push(user ? '/app/profile' : '/app/login', undefined, { locale })}><FiUser size={22} /></button></header>
      <div className={"search"}><FiSearch size={20} /><input aria-label="Search apps and tools" placeholder={copy("Search food, places, people and more")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />{searchQuery && <button aria-label={copy("Clear search")} onClick={() => setSearchQuery('')}>{copy("Clear")}</button>}</div>
      {!searchQuery.trim() && <ReviewWishlistCard />}
      {!searchQuery.trim() && <section className={"featured"}><div className="section-heading"><h2>{copy("A good place to start")}</h2><span>{copy("Get more out of Tavvy")}</span></div><div className="featured-scroll">{FEATURED_APPS.map(app => { const Icon = app.icon; return <Link key={app.id} href={app.href} locale={locale} className={`featured-card ${app.id}`}><div className="featured-top"><Icon size={26} /><span aria-hidden="true">↗</span></div><h3>{label(app)}</h3><p>{copy(TOOL_DETAILS[app.id].description)}</p></Link>; })}</div></section>}
      {filtered.length === 0 ? <div className="empty" role="status"><h2>{copy("No tools found")}</h2><p>{copy("Try a word like food, cards or places.")}</p><button onClick={() => setSearchQuery('')}>{copy("Show all tools")}</button></div> : TOOL_GROUPS.map(group => { const items = filtered.filter(app => TOOL_DETAILS[app.id].group === group.id); return items.length > 0 && <section className="group" key={group.id}><div className="section-heading"><div><h2>{copy(group.title)}</h2><p>{copy(group.description)}</p></div><span>{items.length} {items.length === 1 ? 'tool' : "tools"}</span></div><div className="tool-grid">{items.map(app => { const Icon = app.icon; return <Link key={app.id} href={app.href} locale={locale} className="tool"><div className={`tool-icon ${group.id}`}><Icon size={23} /></div><div><h3>{label(app)}</h3><p>{copy(TOOL_DETAILS[app.id].description)}</p></div><span className="arrow" aria-hidden="true">›</span></Link>; })}</div></section>; })}
      
    </main><style jsx>{`
      .directory{min-height:100vh;max-width:1120px;margin:auto;padding:36px 28px 110px;color:${text};background:${palette.background}}
      .directory-logo{display:block;object-fit:contain;object-position:left center;margin-bottom:24px}.header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.eyebrow{color:${accent};font-size:11px;font-weight:750;letter-spacing:1.6px;margin:0 0 14px}h1{font-size:clamp(28px,4vw,40px);line-height:1.15;letter-spacing:-1.3px;margin:0;max-width:650px}.intro{color:${secondary};font-size:16px;line-height:1.6;margin:14px 0 0;max-width:570px}.profile{width:46px;height:46px;flex-shrink:0;border-radius:50%;border:1px solid ${isDark ? '#3C2D4A' : '#E4DAEB'};background:${isDark ? '#271C34' : '#FFF'};color:${text};cursor:pointer}
      .search{display:flex;align-items:center;gap:12px;padding:15px 18px;background:${isDark ? '#271C34' : '#FFF'};border:1px solid ${isDark ? '#4A365A' : '#DCCFE6'};border-radius:16px;margin:28px 0 32px;color:${secondary}}.search input{border:0;background:transparent;outline:0;flex:1;min-width:0;font:inherit;color:${text}}.search input::placeholder{color:${secondary}}.search button,.empty button{border:0;background:transparent;color:${accent};cursor:pointer;font:inherit}
      .section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}h2{font-size:20px;letter-spacing:-.4px;margin:0}h3{font-size:16px;margin:0 0 5px}.section-heading p,.appearance p{color:${secondary};font-size:13px;line-height:1.5;margin:6px 0 0}.section-heading>span{font-size:12px;color:${secondary};flex-shrink:0}.featured-scroll{scrollbar-width:none;display:flex;overflow-x:auto;gap:14px;padding-bottom:8px}.featured-scroll::-webkit-scrollbar{display:none}.directory :global(.featured-card){color:${text};text-decoration:none;flex:1;min-width:230px;padding:22px;border-radius:20px;background:${isDark ? '#30203F' : '#EDE3F5'};border:1px solid ${isDark ? '#4D365E' : '#E0D0EE'}}.directory :global(.featured-card.atlas){background:${isDark ? '#193434' : '#E2F0EA'};border-color:${isDark ? '#31534C' : '#C9E4D9'}}.directory :global(.featured-card.ecard){background:${isDark ? '#362B25' : '#F5ECE1'};border-color:${isDark ? '#554236' : '#E8D8C5'}}.featured-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.directory :global(.featured-card) p{font-size:13px;line-height:1.5;color:${secondary};margin:0;max-width:250px}.group{margin-top:34px}.tool-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.directory :global(.tool){display:flex;align-items:center;gap:14px;padding:18px;background:${palette.surface};border:1px solid ${palette.border};border-radius:16px;color:${text};text-decoration:none;transition:border-color .15s}.directory :global(.tool:hover){border-color:${accent}}.tool-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${isDark ? '#3A254B' : '#F0E7F8'};color:${accent}}.tool-icon.discover{background:${isDark ? '#173D3B' : '#E6F2EC'};color:${isDark ? '#83D9C9' : '#14675E'}}.directory :global(.tool) p{font-size:13px;line-height:1.45;margin:0;color:${secondary}}.arrow{margin-left:auto;color:${secondary};font-size:24px}.appearance{margin-top:40px;padding-top:24px;border-top:1px solid ${palette.border};display:flex;align-items:center;justify-content:space-between;gap:20px}.empty{text-align:center;padding:36px 16px}.empty p{color:${secondary}}button:focus-visible,.directory :global(a:focus-visible){outline:3px solid ${accent};outline-offset:4px}@media(max-width:600px){.directory{padding:26px 18px 100px}.tool-grid{grid-template-columns:1fr}.section-heading>span{display:none}.appearance{align-items:flex-start;flex-direction:column}.featured-scroll{margin-right:-18px;padding-right:18px}.directory :global(.featured-card){min-width:220px}.profile{width:42px;height:42px}h1{max-width:300px}}
    `}</style></AppLayout></>;
}
export async function getStaticProps({ locale }: { locale: string }) { return { props: { ...(await serverSideTranslations(locale || 'en', ['common'])) } }; }
