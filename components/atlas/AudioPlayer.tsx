/**
 * Atlas AudioPlayer (web)
 * Listen-to-article audiobook player using an HTML <audio> element.
 * Free narration via edge-tts (Microsoft neural voices): Ava (female) / Andrew (male).
 * Includes a female/male voice toggle. Web port of the mobile AudioPlayer.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import { IoPlay, IoPause, IoPlayBack, IoPlayForward, IoHeadset } from 'react-icons/io5';

const TEAL = '#0D9488';
const SPEEDS = [1.0, 1.25, 1.5, 2.0, 0.75];
type Voice = 'female' | 'male';

interface AudioPlayerProps {
  femaleUrl?: string | null;
  maleUrl?: string | null;
  isDark?: boolean;
  durationSeconds?: number | null;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ femaleUrl, maleUrl, isDark = false, durationSeconds }: AudioPlayerProps) {
  const copy = useReleaseCopy();
  const ref = useRef<HTMLAudioElement>(null);
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const [voice, setVoice] = useState<Voice>(femaleUrl ? 'female' : 'male');
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(durationSeconds || 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(false);
  const activeVoice = voice === 'female' && femaleUrl ? 'female' : voice === 'male' && maleUrl ? 'male' : femaleUrl ? 'female' : 'male';
  const src = activeVoice === 'female' ? femaleUrl : maleUrl;
  useEffect(() => {
    setCur(0); setDur(activeVoice === 'female' ? durationSeconds || 0 : 0); setPlaying(false); setLoading(false); setError(false);
    const audio = ref.current;
    return () => { audio?.pause(); };
  }, [src]);
  if (!src) return <div style={{ padding: 16, borderRadius: 16, margin: '20px 0', background: isDark ? '#163837' : '#F0FDFA', color: isDark ? '#99F6E4' : '#115E59' }}><strong>{copy('Listen to this article')}</strong><p>{copy('Audio is not available for this article yet.')}</p></div>;

  const hasBoth = !!femaleUrl && !!maleUrl;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
    } else {
      setLoading(true); setError(false);
      a.play().then(() => setLoading(false)).catch(() => { setLoading(false); setError(true); });
    }
  };
  const switchVoice = (v: Voice) => {
    if (v === activeVoice) return;
    const a = ref.current;
    resume.current = { t: a?.currentTime || 0, play: !!a && !a.paused && !a.ended };
    setVoice(v);
  };
  const onMeta = () => {
    const a = ref.current;
    if (!a) return;
    const total = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : activeVoice === 'female' ? durationSeconds || 0 : 0;
    setDur(total); a.playbackRate = SPEEDS[speedIdx];
    if (resume.current) {
      try { a.currentTime = Math.min(resume.current.t, Math.max(0, total - 0.1)); } catch {}
      a.playbackRate = SPEEDS[speedIdx];
      if (resume.current.play) a.play().catch(() => setError(true));
      resume.current = null;
    }
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = ref.current;
    if (a && dur > 0) { a.currentTime = Math.max(0, Math.min(dur, Number(e.target.value))); setCur(a.currentTime); }
  };
  const cycleSpeed = () => {
    const ni = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(ni);
    if (ref.current) ref.current.playbackRate = SPEEDS[ni];
  };
  const skip = (d: number) => {
    const a = ref.current;
    if (a) a.currentTime = Math.max(0, Math.min(dur || a.duration || 0, a.currentTime + d));
  };

  const bg = isDark ? 'rgba(13,148,136,0.16)' : '#F0FDFA';
  const border = isDark ? 'rgba(94,234,212,0.25)' : '#CCFBF1';
  const textColor = isDark ? '#5EEAD4' : '#115E59';
  const track = isDark ? 'rgba(255,255,255,0.15)' : '#CCFBF1';
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, padding: 2 };
  const voiceTab = (active: boolean): React.CSSProperties => ({
    fontSize: 12, fontWeight: 700, minHeight: 44, padding: '3px 12px', borderRadius: 999, cursor: 'pointer', border: 'none',
    background: active ? TEAL : 'transparent', color: active ? '#fff' : textColor,
  });

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 14, margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IoHeadset size={14} color={textColor} />
          <span style={{ color: textColor, fontWeight: 700, fontSize: 13 }}>{copy('Listen to this article')}</span>
        </div>
        {hasBoth && (
          <div style={{ display: 'flex', gap: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(13,148,136,0.08)', borderRadius: 999, padding: 2 }}>
            <button aria-pressed={activeVoice === 'female'} style={voiceTab(activeVoice === 'female')} onClick={() => switchVoice('female')}>{copy('Female')}</button>
            <button aria-pressed={activeVoice === 'male'} style={voiceTab(activeVoice === 'male')} onClick={() => switchVoice('male')}>{copy('Male')}</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={toggle}
          aria-label={copy(playing ? 'Pause' : 'Play')}
          style={{ width: 50, height: 50, borderRadius: 999, background: TEAL, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 14px rgba(13,148,136,0.45)' }}
        >
          {loading ? <span style={{ color: '#fff', fontSize: 18 }}>…</span> : playing ? <IoPause size={22} color="#fff" /> : <IoPlay size={22} color="#fff" style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <input type="range" aria-label={copy('Audio position')} aria-valuetext={`${fmt(cur)} / ${fmt(dur)}`} min={0} max={Math.max(0, dur)} step={0.1} value={Math.max(0, Math.min(cur, dur))} disabled={!dur} onChange={seek} style={{ width: '100%', minHeight: 44, accentColor: TEAL, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
            <span style={{ fontSize: 11, color: textColor, minWidth: 34 }}>{fmt(cur)}</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => skip(-15)} aria-label={copy('Back 15 seconds')} style={iconBtn}><IoPlayBack size={16} /></button>
              <button onClick={cycleSpeed} aria-label={copy('Playback speed')} style={{ fontSize: 11, fontWeight: 700, color: textColor, background: 'transparent', border: `1px solid ${border}`, borderRadius: 999, padding: '2px 9px', minWidth: 44, minHeight: 44, cursor: 'pointer' }}>{SPEEDS[speedIdx]}x</button>
              <button onClick={() => skip(15)} aria-label={copy('Forward 15 seconds')} style={iconBtn}><IoPlayForward size={16} /></button>
            </div>
            <span style={{ fontSize: 11, color: textColor, minWidth: 34, textAlign: 'right' }}>{fmt(dur)}</span>
          </div>
        </div>
      </div>

      {error && <p role="alert" style={{ color: textColor, fontSize: 13 }}>{copy('Audio could not play. Tap Play to try again.')}</p>}
      <audio
        ref={ref}
        key={src}
        src={src}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onDurationChange={() => { const value = ref.current?.duration; if (value && Number.isFinite(value)) setDur(value); }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onError={() => { setLoading(false); setPlaying(false); setError(true); }}
        onTimeUpdate={() => setCur(ref.current?.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0); }}
      />
    </div>
  );
}
