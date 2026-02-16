/**
 * CivicCardSection — Interactive civic engagement section for political cards
 * Renders: Ballot Header, Proposals with voting, Community Thermometer, Q&A, Commitments
 * 
 * This component is rendered inside the [username].tsx card page when templateLayout === 'civic-card'
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { supabase } from '../lib/supabaseClient';

interface CivicProposal {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  reactions: { support: number; needs_improvement: number; disagree: number };
}

interface CivicQuestion {
  id: string;
  questionText: string;
  upvoteCount: number;
  answerText: string | null;
  answeredAt: string | null;
  createdAt: string;
}

interface CivicCommitment {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  sortOrder: number;
}

interface CivicRecommendation {
  id: string;
  endorsementNote: string | null;
  card: {
    id: string;
    slug: string;
    fullName: string;
    title: string;
    profilePhotoUrl: string | null;
    partyName: string | null;
    officeRunningFor: string | null;
    region: string | null;
  };
}

interface CivicCardSectionProps {
  cardId: string;
  cardSlug: string;
  fullName: string;
  ballotNumber: string;
  partyName: string;
  officeRunningFor: string;
  electionYear: string;
  campaignSlogan: string;
  region: string;
  profilePhotoUrl: string | null;
  accentColor: string; // party primary color
  secondaryColor: string;
  proposals: CivicProposal[];
  questions: CivicQuestion[];
  commitments: CivicCommitment[];
  recommendations: CivicRecommendation[];
  showVoteCounts: boolean;
  templateLayout?: string;
}

const CivicCardSection: React.FC<CivicCardSectionProps> = ({
  cardId,
  cardSlug,
  fullName,
  ballotNumber,
  partyName,
  officeRunningFor,
  electionYear,
  campaignSlogan,
  region,
  profilePhotoUrl,
  accentColor,
  secondaryColor,
  proposals: initialProposals,
  questions: initialQuestions,
  commitments,
  recommendations,
  showVoteCounts = true,
  templateLayout = 'civic-card',
}) => {
  const { t } = useTranslation('common');
  const [proposals, setProposals] = useState(initialProposals);
  const [questions, setQuestions] = useState(initialQuestions);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'proposals' | 'questions' | 'commitments'>('proposals');

  // Calculate community thermometer from all proposal reactions
  const totalReactions = proposals.reduce((acc, p) => ({
    support: acc.support + p.reactions.support,
    needs_improvement: acc.needs_improvement + p.reactions.needs_improvement,
    disagree: acc.disagree + p.reactions.disagree,
  }), { support: 0, needs_improvement: 0, disagree: 0 });
  const totalVotes = totalReactions.support + totalReactions.needs_improvement + totalReactions.disagree;
  const supportPct = totalVotes > 0 ? Math.round((totalReactions.support / totalVotes) * 100) : 0;
  const improvePct = totalVotes > 0 ? Math.round((totalReactions.needs_improvement / totalVotes) * 100) : 0;
  const disagreePct = totalVotes > 0 ? Math.round((totalReactions.disagree / totalVotes) * 100) : 0;

  const handleReaction = async (proposalId: string, reactionType: string) => {
    // Optimistic update
    const prevReaction = userReactions[proposalId];
    setUserReactions(prev => ({ ...prev, [proposalId]: reactionType }));

    // Optimistic count update
    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      const newReactions = { ...p.reactions };
      if (prevReaction) {
        newReactions[prevReaction as keyof typeof newReactions] = Math.max(0, newReactions[prevReaction as keyof typeof newReactions] - 1);
      }
      newReactions[reactionType as keyof typeof newReactions]++;
      return { ...p, reactions: newReactions };
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/civic/react', {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposalId, reactionType }),
      });

      const data = await res.json();
      if (res.ok && data.reactionCounts) {
        setProposals(prev => prev.map(p =>
          p.id === proposalId ? { ...p, reactions: data.reactionCounts } : p
        ));
      } else if (data.requireLogin) {
        // Save pending reaction and redirect to login
        localStorage.setItem('tavvy_pending_civic_reaction', JSON.stringify({
          proposalId, reactionType, cardSlug,
        }));
        window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
      }
    } catch (err) {
      // Revert on error
      setUserReactions(prev => {
        const next = { ...prev };
        if (prevReaction) next[proposalId] = prevReaction;
        else delete next[proposalId];
        return next;
      });
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || isSubmittingQuestion) return;
    setIsSubmittingQuestion(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/civic/question', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cardId, questionText: newQuestion.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        // Question is now pending approval — do NOT add to visible list
        setNewQuestion('');
        setQuestionSubmitted(true);
        setTimeout(() => setQuestionSubmitted(false), 5000);
      } else if (data.requireLogin) {
        localStorage.setItem('tavvy_pending_civic_question', JSON.stringify({
          cardId, questionText: newQuestion.trim(), cardSlug,
        }));
        window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
      }
    } catch (err) {
      alert('Failed to submit question. Please try again.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/civic/upvote', {
        method: 'POST',
        headers,
        body: JSON.stringify({ questionId }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions(prev => prev.map(q =>
          q.id === questionId ? { ...q, upvoteCount: data.upvoteCount } : q
        ));
      } else if (data.requireLogin) {
        window.location.href = `/app/login?returnUrl=${encodeURIComponent('/' + cardSlug)}`;
      }
    } catch (err) {
      // Silently fail
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      default: return '📋';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('civic.completed');
      case 'in_progress': return t('civic.inProgress');
      default: return t('civic.planned');
    }
  };

  /* ═══ HEADER RENDERERS PER TEMPLATE ═══ */

  const renderClassicHeader = () => (
    <div style={{
      width: '100%',
      background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
      borderRadius: 20,
      padding: '28px 24px 24px',
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.85)' }}>
            {partyName}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 16 }}>
          {officeRunningFor}{region ? ` • ${region}` : ''}{electionYear ? ` • ${electionYear}` : ''}
        </div>
        {ballotNumber && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: '10px 20px', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{t('civic.vote')}</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: 4, fontFamily: "'Inter', -apple-system, sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{ballotNumber}</span>
          </div>
        )}
        {campaignSlogan && (
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 1.4, marginTop: 8, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
            &ldquo;{campaignSlogan}&rdquo;
          </div>
        )}
      </div>
    </div>
  );

  /* ═══ FLAG TEMPLATE — Brazilian flag background ═══ */
  const renderFlagHeader = () => (
    <div style={{
      width: '100%',
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 0,
      position: 'relative',
    }}>
      {/* Real Brazilian flag as background image */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
        backgroundImage: 'url(/images/brazil-flag.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />
      {/* Subtle dark overlay for text readability */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
        background: 'linear-gradient(180deg, rgba(0,60,30,0.35) 0%, rgba(0,40,20,0.5) 100%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px 28px', textAlign: 'center' as const }}>
        {/* Photo with yellow border */}
        {profilePhotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #FFDF00', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <img src={profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: 4 }}>{fullName}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.4)', marginBottom: 16 }}>{officeRunningFor}</div>

        {/* Info box */}
        <div style={{ background: 'rgba(0,39,118,0.7)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#FFDF00', marginBottom: 6 }}>{partyName}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
            {officeRunningFor}{region ? ` • ${region}` : ''}{electionYear ? ` • ${electionYear}` : ''}
          </div>
          {ballotNumber && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFDF00', borderRadius: 12, padding: '10px 24px', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#002776' }}>{t('civic.vote')}</span>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#002776', letterSpacing: 4, fontFamily: "'Inter', -apple-system, sans-serif" }}>{ballotNumber}</span>
            </div>
          )}
          {campaignSlogan && (
            <div style={{ fontSize: 15, fontWeight: 600, color: '#FFDF00', fontStyle: 'italic', marginTop: 8 }}>
              &ldquo;{campaignSlogan}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══ BOLD TEMPLATE — Split layout, large photo, strong typography ═══ */
  const renderBoldHeader = () => (
    <div style={{
      width: '100%',
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 0,
      position: 'relative',
      minHeight: 340,
      background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
    }}>
      {/* Large candidate photo as background on right side */}
      {profilePhotoUrl && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '55%',
          zIndex: 0,
        }}>
          <img src={profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, ' + accentColor + ' 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 100%)' }} />
        </div>
      )}

      {/* Content on left side */}
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px 28px', maxWidth: '60%' }}>
        {/* Party name in accent color */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#FFD700', marginBottom: 16 }}>
          {partyName}
        </div>

        {/* Bold uppercase name */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, textTransform: 'uppercase' as const, letterSpacing: -0.5, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          {fullName}
        </div>

        {/* Position */}
        <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>
          {officeRunningFor}{region ? ` • ${region}` : ''}
        </div>

        {/* Yellow VOTE badge */}
        {ballotNumber && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD700', borderRadius: 12, padding: '10px 24px' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e' }}>{t('civic.vote')}</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#1a1a2e', letterSpacing: 4, fontFamily: "'Inter', -apple-system, sans-serif" }}>{ballotNumber}</span>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══ CLEAN TEMPLATE — White card, minimal, elegant ═══ */
  const renderCleanHeader = () => (
    <div style={{
      width: '100%',
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 0,
      background: '#FFFFFF',
      border: 'none',
      boxShadow: 'none',
    }}>
      <div style={{ padding: '32px 24px 28px', textAlign: 'center' as const }}>
        {/* Centered photo with subtle border */}
        {profilePhotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 110, height: 110, borderRadius: '50%', border: `3px solid ${accentColor}20`, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <img src={profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Name in bold black */}
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>{fullName}</div>

        {/* Position in accent color */}
        <div style={{ fontSize: 15, fontWeight: 600, color: accentColor, marginBottom: 12 }}>{officeRunningFor}</div>

        {/* Pill badge: Party · Region · Year */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: '#f5f5f5', borderRadius: 20, padding: '6px 16px', marginBottom: 16, border: '1px solid #e8e8e8' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
            {partyName}{region ? ` • ${region}` : ''}{electionYear ? ` • ${electionYear}` : ''}
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: '60%', height: 1, background: '#e8e8e8', margin: '0 auto 16px' }} />

        {/* VOTE + Ballot number */}
        {ballotNumber && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#999', letterSpacing: 2 }}>{t('civic.vote')}</span>
            <span style={{ fontSize: 42, fontWeight: 900, color: accentColor, letterSpacing: 6, fontFamily: "'Inter', -apple-system, sans-serif" }}>{ballotNumber}</span>
          </div>
        )}

        {/* Slogan */}
        {campaignSlogan && (
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
            {campaignSlogan}
          </div>
        )}
      </div>
    </div>
  );

  /* ═══ RALLY TEMPLATE — Yellow/gold header, high energy ═══ */
  const renderRallyHeader = () => (
    <div style={{
      width: '100%',
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 0,
    }}>
      {/* Yellow/Gold top section */}
      <div style={{ background: '#FFD700', padding: '28px 24px 24px', textAlign: 'center' as const }}>
        {/* Photo with yellow border */}
        {profilePhotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #e6c200', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <img src={profilePhotoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Bold uppercase name in dark */}
        <div style={{ fontSize: 26, fontWeight: 900, color: accentColor, textTransform: 'uppercase' as const, letterSpacing: -0.5, marginBottom: 4 }}>{fullName}</div>

        {/* Position and region */}
        <div style={{ fontSize: 14, fontWeight: 600, color: accentColor, opacity: 0.8, marginBottom: 16 }}>
          {officeRunningFor}{region ? ` • ${region}` : ''}
        </div>

        {/* Yellow VOTE badge */}
        {ballotNumber && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: accentColor, borderRadius: 12, padding: '10px 24px', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700' }}>{t('civic.vote')}</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#FFD700', letterSpacing: 4, fontFamily: "'Inter', -apple-system, sans-serif" }}>{ballotNumber}</span>
          </div>
        )}
      </div>

      {/* White bottom with slogan */}
      <div style={{ background: '#FFFFFF', padding: '16px 24px 20px', borderBottom: `3px solid ${accentColor}` }}>
        {/* Slogan in accent color italic */}
        {campaignSlogan && (
          <div style={{ fontSize: 16, fontWeight: 700, color: accentColor, fontStyle: 'italic', textAlign: 'center' as const, lineHeight: 1.4 }}>
            &ldquo;{campaignSlogan}&rdquo;
          </div>
        )}
      </div>
    </div>
  );

  /* Select the right header based on templateLayout */
  const isNonClassic = templateLayout !== 'civic-card';

  const renderHeader = () => {
    switch (templateLayout) {
      case 'civic-card-flag': return renderFlagHeader();
      case 'civic-card-bold': return renderBoldHeader();
      case 'civic-card-clean': return renderCleanHeader();
      case 'civic-card-rally': return renderRallyHeader();
      case 'civic-card':
      default: return renderClassicHeader();
    }
  };

  return (
    <div style={{ width: '100%', marginTop: 0 }}>
      {/* ═══ TEMPLATE-SPECIFIC HEADER ═══ */}
      {renderHeader()}

      {/* ═══ COMMUNITY THERMOMETER ═══ */}
      {totalVotes > 0 && showVoteCounts && (
        <div style={{
          width: '100%',
          background: '#FFFFFF',
          borderRadius: isNonClassic ? 0 : 16,
          padding: isNonClassic ? '20px 20px' : '20px',
          marginBottom: isNonClassic ? 0 : 16,
          border: isNonClassic ? 'none' : '1px solid #f0f0f0',
          boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
          borderTop: isNonClassic ? '1px solid #f0f0f0' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>🌡️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{t('civic.communityPulse')}</span>
            <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>{totalVotes} {t('civic.votes')}</span>
          </div>

          {/* Thermometer bar */}
          <div style={{
            width: '100%', height: 12, borderRadius: 6, overflow: 'hidden',
            display: 'flex', background: '#f0f0f0',
          }}>
            {supportPct > 0 && (
              <div style={{ width: `${supportPct}%`, background: '#22c55e', transition: 'width 0.5s ease' }} />
            )}
            {improvePct > 0 && (
              <div style={{ width: `${improvePct}%`, background: '#f59e0b', transition: 'width 0.5s ease' }} />
            )}
            {disagreePct > 0 && (
              <div style={{ width: `${disagreePct}%`, background: '#ef4444', transition: 'width 0.5s ease' }} />
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: '#666' }}>{t('civic.supportPct', { pct: supportPct })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }} />
              <span style={{ fontSize: 11, color: '#666' }}>{t('civic.improvePct', { pct: improvePct })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />
              <span style={{ fontSize: 11, color: '#666' }}>{t('civic.disagreePct', { pct: disagreePct })}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: isNonClassic ? 0 : 16,
        borderRadius: isNonClassic ? 0 : 14, overflow: 'hidden',
        border: isNonClassic ? 'none' : '1px solid #e8e8e8',
        borderTop: isNonClassic ? '1px solid #e8e8e8' : undefined,
        borderBottom: isNonClassic ? '1px solid #e8e8e8' : undefined,
        background: '#f8f8f8',
        ...(isNonClassic ? { padding: '0 0' } : {}),
      }}>
        {(['proposals', 'questions', 'commitments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
              background: activeTab === tab ? accentColor : 'transparent',
              color: activeTab === tab ? '#FFFFFF' : '#666',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {tab === 'proposals' && `📋 ${t('civic.proposals')}${proposals.length > 0 ? ` (${proposals.length})` : ''}`}
            {tab === 'questions' && `❓ ${t('civic.qna')}${questions.length > 0 ? ` (${questions.length})` : ''}`}
            {tab === 'commitments' && `🎯 ${t('civic.goals')}${commitments.length > 0 ? ` (${commitments.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ═══ PROPOSALS TAB ═══ */}
      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isNonClassic ? 0 : 12, ...(isNonClassic ? { padding: '0' } : {}) }}>
          {proposals.length === 0 ? (
            <div style={{
              padding: '32px 20px', textAlign: 'center', background: '#FFFFFF',
              borderRadius: isNonClassic ? 0 : 16, border: isNonClassic ? 'none' : '1px solid #f0f0f0',
              borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
            }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📋</span>
              <span style={{ fontSize: 14, color: '#999' }}>{t('civic.noProposals')}</span>
            </div>
          ) : (
            proposals.sort((a, b) => a.sortOrder - b.sortOrder).map((proposal) => {
              const isExpanded = expandedProposal === proposal.id;
              const pTotal = proposal.reactions.support + proposal.reactions.needs_improvement + proposal.reactions.disagree;
              const pSupportPct = pTotal > 0 ? Math.round((proposal.reactions.support / pTotal) * 100) : 0;
              const userReaction = userReactions[proposal.id];

              return (
                <div key={proposal.id} style={{
                  background: '#FFFFFF',
                  borderRadius: isNonClassic ? 0 : 16,
                  border: isNonClassic ? 'none' : '1px solid #f0f0f0',
                  borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
                  overflow: 'hidden',
                  boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {/* Proposal header */}
                  <button
                    onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                    style={{
                      width: '100%', padding: '16px 20px', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'transparent', textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
                        {proposal.title}
                      </div>
                      {pTotal > 0 && showVoteCounts && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {t('civic.supportVotes', { pct: pSupportPct, total: pTotal })}
                        </div>
                      )}
                    </div>
                    <svg
                      width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px' }}>
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 16px' }}>
                        {proposal.description}
                      </p>

                      {/* Mini thermometer for this proposal */}
                      {pTotal > 0 && showVoteCounts && (
                        <div style={{
                          width: '100%', height: 6, borderRadius: 3, overflow: 'hidden',
                          display: 'flex', background: '#f0f0f0', marginBottom: 16,
                        }}>
                          <div style={{ width: `${pTotal > 0 ? (proposal.reactions.support / pTotal) * 100 : 0}%`, background: '#22c55e', transition: 'width 0.5s' }} />
                          <div style={{ width: `${pTotal > 0 ? (proposal.reactions.needs_improvement / pTotal) * 100 : 0}%`, background: '#f59e0b', transition: 'width 0.5s' }} />
                          <div style={{ width: `${pTotal > 0 ? (proposal.reactions.disagree / pTotal) * 100 : 0}%`, background: '#ef4444', transition: 'width 0.5s' }} />
                        </div>
                      )}

                      {/* Reaction buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { type: 'support', emoji: '👍', labelKey: 'civic.support', color: '#22c55e', count: proposal.reactions.support },
                          { type: 'needs_improvement', emoji: '🤔', labelKey: 'civic.improve', color: '#f59e0b', count: proposal.reactions.needs_improvement },
                          { type: 'disagree', emoji: '👎', labelKey: 'civic.disagree', color: '#ef4444', count: proposal.reactions.disagree },
                        ].map(({ type, emoji, labelKey, color, count }) => (
                          <button
                            key={type}
                            onClick={() => handleReaction(proposal.id, type)}
                            style={{
                              flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none',
                              cursor: 'pointer', display: 'flex', flexDirection: 'column',
                              alignItems: 'center', gap: 4, fontFamily: 'inherit',
                              background: userReaction === type ? `${color}20` : '#f8f8f8',
                              outline: userReaction === type ? `2px solid ${color}` : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span style={{ fontSize: 20 }}>{emoji}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: userReaction === type ? color : '#666' }}>{t(labelKey)}</span>
                            {count > 0 && showVoteCounts && (
                              <span style={{ fontSize: 10, color: '#999' }}>{count}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ QUESTIONS TAB ═══ */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isNonClassic ? 0 : 12 }}>
          {/* Ask a question */}
          <div style={{
            background: '#FFFFFF', borderRadius: isNonClassic ? 0 : 16, padding: '16px 20px',
            border: isNonClassic ? 'none' : '1px solid #f0f0f0',
            borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
            boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
              {t('civic.ask')} {fullName.split(' ')[0]}
            </div>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t('civic.askPlaceholder')}
              maxLength={500}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                background: '#f8f8f8', border: '1px solid #e8e8e8',
                color: '#333', fontSize: 14, resize: 'none', minHeight: 60,
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              rows={2}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: '#999' }}>{newQuestion.length}/500</span>
              <button
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.trim() || isSubmittingQuestion}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: newQuestion.trim() ? accentColor : '#e0e0e0',
                  color: newQuestion.trim() ? '#FFFFFF' : '#999',
                  fontSize: 13, fontWeight: 700, cursor: newQuestion.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                }}
              >
                {isSubmittingQuestion ? t('civic.sending') : t('civic.ask')}
              </button>
            </div>
            {questionSubmitted && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 13, color: '#b45309', border: '1px solid #fde68a' }}>
                ⏳ {t('civic.questionPendingApproval', { defaultValue: 'Your question has been submitted and is pending approval by the card owner.' })}
              </div>
            )}
          </div>

          {/* Question list */}
          {questions.length === 0 ? (
            <div style={{
              padding: '32px 20px', textAlign: 'center', background: '#FFFFFF',
              borderRadius: isNonClassic ? 0 : 16, border: isNonClassic ? 'none' : '1px solid #f0f0f0',
              borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
            }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>❓</span>
              <span style={{ fontSize: 14, color: '#999' }}>{t('civic.noQuestions')}</span>
            </div>
          ) : (
            questions.sort((a, b) => b.upvoteCount - a.upvoteCount).map((q) => (
              <div key={q.id} style={{
                background: '#FFFFFF', borderRadius: isNonClassic ? 0 : 16, padding: '16px 20px',
                border: isNonClassic ? 'none' : '1px solid #f0f0f0',
                borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
                boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Upvote button */}
                  <button
                    onClick={() => handleUpvote(q.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      padding: '8px', borderRadius: 10, border: '1px solid #e8e8e8',
                      background: '#f8f8f8', cursor: 'pointer', minWidth: 44,
                      fontFamily: 'inherit',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{q.upvoteCount}</span>
                  </button>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                      {q.questionText}
                    </p>

                    {/* Answer from candidate */}
                    {q.answerText && (
                      <div style={{
                        marginTop: 10, padding: '12px 14px', borderRadius: 12,
                        background: `${accentColor}08`, borderLeft: `3px solid ${accentColor}`,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginBottom: 4 }}>
                          {t('civic.candidateAnswer', { name: fullName.split(' ')[0] })}
                        </div>
                        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>
                          {q.answerText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ COMMITMENTS TAB ═══ */}
      {activeTab === 'commitments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isNonClassic ? 0 : 12 }}>
          {commitments.length === 0 ? (
            <div style={{
              padding: '32px 20px', textAlign: 'center', background: '#FFFFFF',
              borderRadius: isNonClassic ? 0 : 16, border: isNonClassic ? 'none' : '1px solid #f0f0f0',
              borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
            }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🎯</span>
              <span style={{ fontSize: 14, color: '#999' }}>{t('civic.noCommitments')}</span>
            </div>
          ) : (
            <>
              {/* Progress summary */}
              <div style={{
                background: '#FFFFFF', borderRadius: isNonClassic ? 0 : 16, padding: '16px 20px',
                border: isNonClassic ? 'none' : '1px solid #f0f0f0',
                borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
                boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
                      {commitments.filter(c => c.status === 'completed').length}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>{t('civic.completed')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                      {commitments.filter(c => c.status === 'in_progress').length}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>{t('civic.inProgress')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#94a3b8' }}>
                      {commitments.filter(c => c.status === 'planned').length}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>{t('civic.planned')}</div>
                  </div>
                </div>
              </div>

              {/* Commitment list */}
              {commitments.sort((a, b) => a.sortOrder - b.sortOrder).map((c) => (
                <div key={c.id} style={{
                  background: '#FFFFFF', borderRadius: isNonClassic ? 0 : 16, padding: '16px 20px',
                  border: isNonClassic ? 'none' : '1px solid #f0f0f0',
                  borderBottom: isNonClassic ? '1px solid #f0f0f0' : undefined,
                  boxShadow: isNonClassic ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
                  borderLeft: `4px solid ${c.status === 'completed' ? '#22c55e' : c.status === 'in_progress' ? '#f59e0b' : '#e0e0e0'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, marginTop: 1 }}>{statusIcon(c.status)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}>
                        {c.title}
                      </div>
                      {c.description && (
                        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, margin: '6px 0 0' }}>
                          {c.description}
                        </p>
                      )}
                      <div style={{
                        display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600,
                        background: c.status === 'completed' ? '#f0fdf4' : c.status === 'in_progress' ? '#fffbeb' : '#f8fafc',
                        color: c.status === 'completed' ? '#16a34a' : c.status === 'in_progress' ? '#d97706' : '#94a3b8',
                      }}>
                        {statusLabel(c.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ═══ WHO I RECOMMEND ═══ */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '0 4px',
          }}>
            <span style={{ fontSize: 20 }}>🤝</span>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {t('civic.whoIRecommend', { defaultValue: 'Who I Recommend' })}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((rec) => (
              <a
                key={rec.id}
                href={`/${rec.card.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#FFFFFF', borderRadius: 16, padding: '14px 16px',
                  border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Profile Photo */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
                  flexShrink: 0, background: accentColor + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${accentColor}30`,
                }}>
                  {rec.card.profilePhotoUrl ? (
                    <img
                      src={rec.card.profilePhotoUrl}
                      alt={rec.card.fullName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 22, color: accentColor }}>
                      {rec.card.fullName?.charAt(0) || '?'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: '#1a1a2e',
                    lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {rec.card.fullName}
                  </div>
                  {(rec.card.officeRunningFor || rec.card.title) && (
                    <div style={{
                      fontSize: 12, color: '#666', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {rec.card.officeRunningFor || rec.card.title}
                    </div>
                  )}
                  {rec.card.partyName && (
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      padding: '2px 8px', borderRadius: 6,
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                      background: accentColor + '12', color: accentColor,
                    }}>
                      {rec.card.partyName}
                    </div>
                  )}
                  {rec.endorsementNote && (
                    <div style={{
                      fontSize: 12, color: '#888', marginTop: 4,
                      fontStyle: 'italic', lineHeight: 1.4,
                    }}>
                      "{rec.endorsementNote}"
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                  background: accentColor + '10', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CivicCardSection;
