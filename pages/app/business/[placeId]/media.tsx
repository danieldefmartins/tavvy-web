import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import RestaurantOwnerLayout from '../../../../components/RestaurantOwnerLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabaseClient';
import { isPlaceId } from '../../../../lib/restaurantOwner';
import { getOwnerMedia, OwnerHighlight, OwnerMediaPage, OwnerStory, publishOwnerPhoto, removeOwnerPhoto, removeOwnerStory, setOwnerCover } from '../../../../lib/restaurantOwnerMedia';
import { deleteOwnerHighlight, saveOwnerHighlight, StoryPublishError, storyMediaDetails } from '../../../../lib/storyPublishing';

type MediaTab = 'photos' | 'stories' | 'highlights';
const merge = <T extends { id: string }>(old: T[], incoming: T[]) => Array.from(new Map([...old, ...incoming].map(item => [item.id, item])).values());
export default function RestaurantMediaPage() {
  const router = useRouter(), { user, loading: authLoading } = useAuth();
  const placeId = typeof router.query.placeId === 'string' ? router.query.placeId : '';
  const [media, setMedia] = useState<OwnerMediaPage | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [tab, setTab] = useState<MediaTab>('photos');
  const [file, setFile] = useState<File | null>(null), [caption, setCaption] = useState('');
  const fileInput = useRef<HTMLInputElement>(null), pendingUpload = useRef<{ file: File; path: string } | null>(null);
  const [editing, setEditing] = useState<OwnerHighlight | 'new' | null>(null), [title, setTitle] = useState(''), [selectedStories, setSelectedStories] = useState<string[]>([]);
  const load = async (append = false) => {
    setLoading(true);
    try {
      const result = await getOwnerMedia(supabase, placeId, append && media ? media.nextOffset : 0);
      setMedia(previous => append && previous ? { ...result, photos: merge(previous.photos, result.photos), stories: merge(previous.stories, result.stories), highlights: merge(previous.highlights, result.highlights) } : result);
      setError('');
    } catch (failure) { setError((failure as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    setMedia(null);
    if (user && isPlaceId(placeId)) void load();
    else if (!authLoading) setLoading(false);
  }, [user?.id, placeId, authLoading]);
  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await load(); setMessage(success); }
    catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };
  const upload = async (event: React.FormEvent) => {
    event.preventDefault(); if (!file || !user || !media) return;
    await run(async () => {
      const details = storyMediaDetails(file.name, file.type);
      if (!details || details.type !== 'image') throw new Error('Choose a JPEG, PNG, WebP or HEIC photo.');
      if (file.size > media.maxPhotoBytes) throw new Error('Choose a photo smaller than 10 MB.');
      let path = pendingUpload.current?.file === file ? pendingUpload.current.path : '';
      if (!path) {
        path = `${user.id}/${placeId}/${crypto.randomUUID()}.${details.extension}`;
        const { error: uploadError } = await supabase.storage.from('place-photos').upload(path, file, { contentType: details.mime, upsert: false });
        if (uploadError) {
          try { await supabase.storage.from('place-photos').remove([path]); } catch {}
          throw new Error('The photo upload did not finish. Please try again.');
        }
        pendingUpload.current = { file, path };
      }
      try { await publishOwnerPhoto(supabase, placeId, path, caption); }
      catch (failure) { if (failure instanceof StoryPublishError && !failure.keepUpload) pendingUpload.current = null; throw failure; }
      pendingUpload.current = null; setFile(null); setCaption(''); if (fileInput.current) fileInput.current.value = '';
    }, 'Photo added to your restaurant.');
  };
  const startHighlight = (highlight: OwnerHighlight | 'new') => {
    setEditing(highlight); setTitle(highlight === 'new' ? '' : highlight.title);
    setSelectedStories(highlight === 'new' ? [] : highlight.stories.map(story => story.id));
  };
  const saveHighlight = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return;
    await run(async () => {
      await saveOwnerHighlight(supabase, placeId, title, selectedStories, editing === 'new' ? undefined : editing.id, editing === 'new' ? true : editing.is_active);
      setEditing(null);
    }, 'Highlight saved.');
  };
  const storyChoices = merge(media?.stories.filter(story => story.story_kind === 'owner_highlight') || [], editing && editing !== 'new' ? editing.stories : []);
  const preview = (story: OwnerStory) => story.media_type === 'video'
    ? <video src={story.media_url} controls preload="metadata" playsInline aria-label={story.caption || 'Restaurant story'} />
    : <img src={story.media_url} alt={story.caption || 'Restaurant story'} loading="lazy" />;
  const addStoryHref = `/app/add-story?placeId=${placeId}&placeName=${encodeURIComponent(media?.place.name || '')}&storyKind=owner_highlight`;
  return <RestaurantOwnerLayout title="Photos & stories">
    <Link href={`/app/business/${placeId}`}>← Your restaurant</Link><h1>Photos & stories</h1>
    <p className="muted">Give customers a clear look at {media?.place.name || 'your restaurant'}.</p>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="status" role="status">{message}</p>}
    {authLoading || (loading && !media) ? <p>Loading your media…</p> : !user ? <section className="panel"><p>Sign in to manage your restaurant media.</p><Link className="button" href={`/app/login?returnUrl=${encodeURIComponent(router.asPath)}`}>Sign in</Link></section> : !media ? <section className="panel"><p>Media management is available after restaurant ownership is verified.</p><div className="actions"><Link href={`/app/business/${placeId}`}>Check ownership</Link><button onClick={() => load()}>Try again</button></div></section> : <>
      <div className="media-tabs" role="tablist" aria-label="Restaurant media">
        {(['photos', 'stories', 'highlights'] as const).map(key => <button key={key} role="tab" aria-selected={tab === key} aria-controls={`media-${key}`} id={`tab-${key}`} className={tab === key ? 'selected' : 'secondary'} onClick={() => { setTab(key); setEditing(null); }}>{key === 'photos' ? 'Photos' : key === 'stories' ? 'Stories' : 'Highlights'} <span>({media.totals[key]})</span></button>)}
      </div>
      {tab === 'photos' && <section className="panel" id="media-photos" role="tabpanel" aria-labelledby="tab-photos">
        <h2>Your photos</h2><p className="muted">Upload food, dining room, and team photos. Choose one as your place’s cover.</p>
        <form onSubmit={upload} className="upload-form"><label htmlFor="owner-photo">Add a photo<input ref={fileInput} id="owner-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} /></label><p className="muted">JPEG, PNG, WebP or HEIC · up to 10 MB</p><label htmlFor="photo-caption">Caption (optional)<input id="photo-caption" value={caption} maxLength={500} disabled={busy} onChange={event => setCaption(event.target.value)} /></label><button disabled={busy || !file}>{busy ? 'Saving…' : 'Upload photo'}</button></form>
        {!media.photos.length ? <p>No photos uploaded by your account yet.</p> : <div className="media-grid">{media.photos.map(photo => <article className="media-card" key={photo.id}><img src={photo.url} alt={photo.caption || `${media.place.name} photo`} loading="lazy" />{photo.caption && <p>{photo.caption}</p>}<div className="actions"><button disabled={busy || photo.url === media.place.cover_image_url} onClick={() => run(() => setOwnerCover(supabase, placeId, photo.id), 'Cover photo updated.')}>{photo.url === media.place.cover_image_url ? 'Current cover' : 'Use as cover'}</button><button className="secondary" disabled={busy} onClick={() => { if (window.confirm('Remove your photo from this restaurant?')) void run(() => removeOwnerPhoto(supabase, placeId, photo.id), 'Photo removed from your place.'); }}>Remove</button></div></article>)}</div>}
      </section>}
      {tab === 'stories' && <section className="panel" id="media-stories" role="tabpanel" aria-labelledby="tab-stories"><h2>Your stories</h2><p className="muted">Restaurant stories stay available until you remove them. Group them into highlights to help customers explore.</p><p><Link className="button" href={addStoryHref}>Add restaurant story</Link></p>{!media.stories.length ? <p>No stories published by your account yet.</p> : <div className="media-grid">{media.stories.map(story => <article className="media-card" key={story.id}>{preview(story)}<p className="muted">{story.story_kind === 'owner_highlight' ? 'From the restaurant' : 'Your guest story'}{story.story_kind === 'customer' && story.expires_at && Date.parse(story.expires_at) < Date.now() ? ' · Expired' : ''}</p>{story.caption && <p>{story.caption}</p>}<button className="secondary" disabled={busy} onClick={() => { if (window.confirm('Remove your story from this restaurant?')) void run(() => removeOwnerStory(supabase, story), 'Your story was removed.'); }}>Remove my story</button></article>)}</div>}</section>}
      {tab === 'highlights' && <section className="panel" id="media-highlights" role="tabpanel" aria-labelledby="tab-highlights"><h2>Story highlights</h2><p className="muted">Organize restaurant stories into collections such as Food, Our space, or Meet the team.</p>{!editing ? <><button onClick={() => startHighlight('new')}>Create highlight</button>{!media.highlights.length ? <p>No highlight collections yet.</p> : <div className="media-grid">{media.highlights.map(highlight => <article className="media-card" key={highlight.id}>{highlight.stories[0] && preview(highlight.stories[0])}<h3>{highlight.title}</h3><p>{highlight.stories.length} stories · {highlight.is_active ? 'Visible' : 'Hidden'}</p><div className="actions"><button disabled={busy} onClick={() => startHighlight(highlight)}>Edit</button><button className="secondary" disabled={busy} onClick={() => run(async () => { await saveOwnerHighlight(supabase, placeId, highlight.title, undefined, highlight.id, !highlight.is_active); }, highlight.is_active ? 'Highlight hidden.' : 'Highlight is visible.')}>{highlight.is_active ? 'Hide' : 'Show'}</button><button className="secondary" disabled={busy} onClick={() => { if (window.confirm('Remove this highlight collection? Its stories will remain available.')) void run(() => deleteOwnerHighlight(supabase, highlight.id), 'Highlight removed.'); }}>Remove</button></div></article>)}</div>}</> : <form onSubmit={saveHighlight}><label htmlFor="highlight-title">Collection name<input id="highlight-title" value={title} maxLength={80} required disabled={busy} onChange={event => setTitle(event.target.value)} placeholder="For example, Our food" /></label><p>Choose up to 30 restaurant stories in the order you want them to appear.</p>{!storyChoices.length ? <p><Link href={addStoryHref}>Publish a restaurant story first →</Link></p> : <div className="media-grid">{storyChoices.map(story => <div className="media-card" key={story.id}>{preview(story)}<label className="check"><input type="checkbox" checked={selectedStories.includes(story.id)} disabled={busy || (!selectedStories.includes(story.id) && selectedStories.length >= 30)} onChange={() => setSelectedStories(previous => previous.includes(story.id) ? previous.filter(id => id !== story.id) : [...previous, story.id])} />{selectedStories.includes(story.id) ? `${selectedStories.indexOf(story.id) + 1}. ` : ''}{story.caption || 'Restaurant story'}</label></div>)}</div>}<div className="actions"><button disabled={busy || !title.trim()}>{busy ? 'Saving…' : 'Save highlight'}</button><button type="button" className="secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel</button></div></form>}</section>}
      {media.hasMore && <button className="secondary" disabled={loading || busy} onClick={() => load(true)}>{loading ? 'Loading…' : 'Load more media'}</button>}
    </>}
    <style jsx>{`
      .media-tabs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:24px 0 16px; padding:2px; }
      .media-tabs button { white-space:normal; min-width:0; min-height:52px; padding:10px 6px; font-size:14px; line-height:1.3; }
      .media-tabs button span { display:block; font-weight:400; margin-top:3px; }
      .media-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:18px; margin:22px 0; }
      .media-card { min-width:0; overflow:hidden; border:1px solid var(--owner-border,#d1d5db); border-radius:14px; padding:12px; }
      .media-card :global(img),.media-card :global(video) { width:100%; height:190px; object-fit:cover; border-radius:10px; background:#111827; }
      .media-card p { overflow-wrap:anywhere; }
      .upload-form { max-width:540px; }
      .media-card .actions { gap:8px; }
      .media-card .actions button { flex:1; padding:9px 12px; min-height:40px; }
      .secondary { background:transparent !important; color:inherit !important; border:1px solid #94a3b8 !important; }
      @media(max-width:520px) { .media-grid { grid-template-columns:1fr; } }
    `}</style>
  </RestaurantOwnerLayout>;
}
