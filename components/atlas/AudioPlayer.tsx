/**
 * Atlas AudioPlayer (web)
 * Listen-to-article audiobook player using an HTML <audio> element.
 * Free narration via edge-tts (Microsoft neural voices): Ava (female) / Andrew (male).
 * Includes a female/male voice toggle. Web port of the mobile AudioPlayer.
 */
import React, { useRef, useState } from 'react';
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
  const ref = useRef<HTMLAudioElement>(null);
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const [voice, setVoice] = useState<Voice>(femaleUrl ? 'female' : 'male');
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(durationSeconds || 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const src = voice === 'female' ? femaleUrl : maleUrl;
  if (!src) return null;

  const hasBoth = !!femaleUrl && !!maleUrl;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      setLoading(true);
      a.play().then(() => setLoading(false)).catch(() => setLoading(false));
    }
  };
  const switchVoice = (v: Voice) => {
    if (v === voice) return;
    const a = ref.current;
    resume.current = { t: a?.currentTime || 0, play: playing };
    setVoice(v);
  };
  const onMeta = () => {
    const a = ref.current;
    if (!a) return;
    setDur(a.duration || durationSeconds || 0);
    if (resume.current) {
      try { a.currentTime = Math.min(resume.current.t, a.duration || 0); } catch {}
      a.playbackRate = SPEEDS[speedIdx];
      if (resume.current.play) a.play().catch(() => {});
      resume.current = null;
    }
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(1, pct)) * dur;
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

  const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center', padding: 2 };
  const voiceTab = (active: boolean): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, cursor: 'pointer', border: 'none',
    background: active ? TEAL : 'transparent', color: active ? '#fff' : textColor,
  });

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 14, margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IoHeadset size={14} color={textColor} />
          <span style={{ color: textColor, fontWeight: 700, fontSize: 13 }}>Listen to this article</span>
        </div>
        {hasBoth && (
          <div style={{ display: 'flex', gap: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(13,148,136,0.08)', borderRadius: 999, padding: 2 }}>
            <button style={voiceTab(voice === 'female')} onClick={() => switchVoice('female')}>Female</button>
            <button style={voiceTab(voice === 'male')} onClick={() => switchVoice('male')}>Male</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{ width: 50, height: 50, borderRadius: 999, background: TEAL, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 14px rgba(13,148,136,0.45)' }}
        >
          {loading ? <span style={{ color: '#fff', fontSize: 18 }}>…</span> : playing ? <IoPause size={22} color="#fff" /> : <IoPlay size={22} color="#fff" style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div onClick={seek} style={{ height: 6, background: track, borderRadius: 999, cursor: 'pointer', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: TEAL, borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
            <span style={{ fontSize: 11, color: textColor, minWidth: 34 }}>{fmt(cur)}</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => skip(-15)} aria-label="Back 15 seconds" style={iconBtn}><IoPlayBack size={16} /></button>
              <button onClick={cycleSpeed} style={{ fontSize: 11, fontWeight: 700, color: textColor, background: 'transparent', border: `1px solid ${border}`, borderRadius: 999, padding: '2px 9px', cursor: 'pointer' }}>{SPEEDS[speedIdx]}x</button>
              <button onClick={() => skip(15)} aria-label="Forward 15 seconds" style={iconBtn}><IoPlayForward size={16} /></button>
            </div>
            <span style={{ fontSize: 11, color: textColor, minWidth: 34, textAlign: 'right' }}>{fmt(dur)}</span>
          </div>
        </div>
      </div>

      <audio
        ref={ref}
        key={src}
        src={src}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onTimeUpdate={() => setCur(ref.current?.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0); }}
      />
    </div>
  );
}
