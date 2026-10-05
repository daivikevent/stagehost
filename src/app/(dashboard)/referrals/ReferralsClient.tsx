'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Gift, Share2, Copy, Check, MessageCircle, Trophy,
  Sparkles, ExternalLink, Award, ArrowUpRight, Flame, ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ReferralProgramSettings, ReferralRecord, ReferrerLeaderboardEntry } from '@/types';
import styles from './referrals.module.css';

interface ReferralsClientProps {
  initialData: {
    profile: {
      id: string;
      name: string;
      slug: string;
      artist_type?: string;
      profile_photo_url?: string | null;
    } | null;
    settings: ReferralProgramSettings;
    myReferrals: ReferralRecord[];
    totalInvited: number;
    completedCount: number;
    rewardedCount: number;
    totalRewardValue: number;
    inviteLink: string;
    referralCode: string;
    leaderboard: ReferrerLeaderboardEntry[];
    myRank: number | null;
  };
}

export function ReferralsClient({ initialData }: ReferralsClientProps) {
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);

  const {
    profile,
    settings,
    myReferrals,
    totalInvited,
    completedCount,
    rewardedCount,
    totalRewardValue,
    inviteLink,
    referralCode,
    leaderboard,
    myRank,
  } = initialData;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      error('Failed to copy link. Please select and copy manually.');
    }
  };

  // Pre-crafted, stylish conversion-focused WhatsApp message
  const artistName = profile?.name || 'Fellow Artist';
  const whatsappText = encodeURIComponent(
    `Namaste! 🙏✨\n\nI'm using BookMyArtist to showcase my performances, videos, rate cards and manage direct event bookings. It takes just 2 minutes to create a stunning artist website!\n\nJoin India's verified live artist network using my direct invite link:\n👉 ${inviteLink}\n\nFree forever, create your digital stage today! 🎤🚀`
  );

  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join BookMyArtist — The Platform for Live Artists',
          text: `Join me on BookMyArtist to create your professional artist portfolio!`,
          url: inviteLink,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <Users size={15} />
          <span>Artist Referral & Community Hub</span>
        </div>
        <h1 className={styles.title}>Invite Fellow Artists</h1>
        <p className={styles.subtitle}>
          Share your digital stage with fellow live anchors, singers, DJs, and musicians. Grow our creator network and unlock exclusive perks!
        </p>
      </div>

      {/* Dynamic Reward Banner (Configured by Admin) */}
      <div
        className={`${styles.rewardBanner} ${
          settings.reward_type === 'validity'
            ? styles.rewardBannerValidity
            : settings.reward_type === 'money'
            ? styles.rewardBannerMoney
            : styles.rewardBannerNone
        }`}
      >
        <div className={styles.rewardHeader}>
          <span
            className={`${styles.rewardTag} ${
              settings.reward_type === 'validity'
                ? styles.rewardTagValidity
                : settings.reward_type === 'money'
                ? styles.rewardTagMoney
                : ''
            }`}
          >
            {settings.reward_type === 'validity' && '🎁 Extra Plan Validity'}
            {settings.reward_type === 'money' && '💰 Cash Bonus'}
            {settings.reward_type === 'custom' && '⭐ Exclusive Perk'}
            {settings.reward_type === 'none' && '🏆 Community Spotlight'}
          </span>
          {myRank && (
            <span style={{ fontSize: '13px', color: '#f0a500', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trophy size={15} /> Your Community Rank: #{myRank}
            </span>
          )}
        </div>

        <div className={styles.rewardContent}>
          <h2 className={styles.rewardTitle}>
            {settings.reward_type === 'validity' && (
              <>Get +{settings.reward_value} Days Free Pro Extension on Every Invite</>
            )}
            {settings.reward_type === 'money' && (
              <>Earn ₹{settings.reward_value} Cash Reward for Every Artist You Invite</>
            )}
            {settings.reward_type === 'custom' && settings.reward_title}
            {settings.reward_type === 'none' && (
              <>Climb the Community Leaderboard & Get Top Directory Placement</>
            )}
          </h2>

          <p className={styles.rewardDesc}>
            {settings.reward_description ||
              'Invite performing artists to BookMyArtist. Top referring artists get highlighted at the top of the official directory with verified badge exposure!'}
          </p>

          {settings.terms && <p className={styles.rewardTerms}>* {settings.terms}</p>}
        </div>
      </div>

      {/* Invite Actions Card */}
      <div className={styles.inviteCard}>
        <div className={styles.inviteSectionTitle}>
          <Share2 size={18} color="var(--color-primary, #6c5ce7)" />
          <span>Your Unique Artist Invite Link</span>
        </div>

        <div className={styles.linkBox}>
          <div className={styles.linkInputWrapper}>
            <span className={styles.linkIcon}>🔗</span>
            <input
              type="text"
              readOnly
              value={inviteLink}
              className={styles.linkInput}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.btnCopy}
              onClick={handleCopyLink}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWhatsapp}
            >
              <MessageCircle size={17} />
              <span>1-Click WhatsApp Invite</span>
            </a>
          </div>
        </div>

        <div className={styles.shareOther}>
          <span className={styles.shareOtherLabel}>Also share on:</span>
          <button type="button" className={styles.socialBtn} onClick={handleNativeShare}>
            <Share2 size={13} />
            <span>Device Share Sheet</span>
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialBtn}
          >
            <span>Twitter / X</span>
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialBtn}
          >
            <span>LinkedIn</span>
          </a>
        </div>
      </div>

      {/* Stats Counters */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.statIconPrimary}`}>
            <Users size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalInvited}</span>
            <span className={styles.statLabel}>Artists Invited</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.statIconSuccess}`}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completedCount}</span>
            <span className={styles.statLabel}>Active Portfolios</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.statIconAccent}`}>
            {settings.reward_type === 'money' ? (
              <span style={{ fontSize: '20px', fontWeight: 800 }}>₹</span>
            ) : settings.reward_type === 'validity' ? (
              <Award size={22} />
            ) : (
              <Trophy size={22} />
            )}
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {settings.reward_type === 'money' && `₹${totalRewardValue}`}
              {settings.reward_type === 'validity' && `+${totalRewardValue} Days`}
              {(settings.reward_type === 'none' || settings.reward_type === 'custom') && (myRank ? `#${myRank}` : 'Top 10')}
            </span>
            <span className={styles.statLabel}>
              {settings.reward_type === 'money'
                ? 'Cash Rewards Earned'
                : settings.reward_type === 'validity'
                ? 'Pro Validity Added'
                : 'Community Rank'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Leaderboard & My Referred Artists */}
      <div className={styles.sectionsRow}>
        {/* Leaderboard (Ledger Board) */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                <Trophy size={18} color="#f59e0b" />
                <span>Top Referrers Leaderboard</span>
              </h3>
              <p className={styles.panelSubtitle}>Artists leading the BookMyArtist community</p>
            </div>
            <span className={styles.badge} style={{ fontSize: '11px', padding: '3px 10px' }}>
              <Flame size={12} color="#f0a500" />
              Live Ledger
            </span>
          </div>

          <div className={styles.leaderboardList}>
            {leaderboard.map((entry) => {
              const isMe = profile && (entry.slug === profile.slug || entry.profile_id === profile.id);
              return (
                <div
                  key={entry.profile_id || entry.slug}
                  className={`${styles.leaderboardItem} ${isMe ? styles.leaderboardItemSelf : ''}`}
                >
                  <div
                    className={`${styles.rankBadge} ${
                      entry.rank === 1
                        ? styles.rank1
                        : entry.rank === 2
                        ? styles.rank2
                        : entry.rank === 3
                        ? styles.rank3
                        : ''
                    }`}
                  >
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </div>

                  <div className={styles.leaderboardAvatar}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entry.name} />
                    ) : (
                      entry.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className={styles.leaderboardInfo}>
                    <div className={styles.leaderboardName}>
                      {entry.name} {isMe && <span style={{ color: '#a29bfe', fontSize: '11px' }}>(You)</span>}
                    </div>
                    <div className={styles.leaderboardCategory}>
                      {entry.artist_type || 'Performing Artist'}
                    </div>
                  </div>

                  <div className={styles.leaderboardScore}>
                    <span className={styles.scoreNumber}>{entry.referral_count}</span>
                    <span className={styles.scoreLabel}>Artists</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Referred Artists */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                <Users size={18} color="var(--color-primary, #6c5ce7)" />
                <span>My Referred Artists</span>
              </h3>
              <p className={styles.panelSubtitle}>Creators who joined via your link</p>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
              {myReferrals.length} Total
            </span>
          </div>

          {myReferrals.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Users size={24} />
              </div>
              <p className={styles.emptyText}>
                No artists referred yet. Send your WhatsApp invite above to invite your first fellow performer!
              </p>
            </div>
          ) : (
            <div className={styles.referralsList}>
              {myReferrals.map((ref) => (
                <div key={ref.id} className={styles.referralItem}>
                  <div className={styles.referredArtist}>
                    <div className={styles.leaderboardAvatar} style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                      {ref.referred_avatar ? (
                        <img src={ref.referred_avatar} alt={ref.referred_name} />
                      ) : (
                        ref.referred_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className={styles.referredDetails}>
                      <span className={styles.referredName}>{ref.referred_name}</span>
                      <span className={styles.referredMeta}>
                        {new Date(ref.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`${styles.statusBadge} ${
                        ref.status === 'rewarded'
                          ? styles.statusRewarded
                          : ref.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusPending
                      }`}
                    >
                      {ref.status === 'rewarded'
                        ? '🎁 Rewarded'
                        : ref.status === 'completed'
                        ? '✅ Active'
                        : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
