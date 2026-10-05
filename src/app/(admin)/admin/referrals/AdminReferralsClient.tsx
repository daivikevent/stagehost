'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Gift, Trophy, Users, Shield, Check, Save, ExternalLink,
  Flame, Award, DollarSign, Clock, AlertCircle, Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  updateReferralProgramSettings,
  updateReferralStatusAdmin,
} from '@/lib/actions/referrals';
import type {
  ReferralProgramSettings,
  ReferralRecord,
  ReferralRewardType,
} from '@/types';
import styles from './admin-referrals.module.css';

interface AdminReferralsClientProps {
  initialData: {
    settings: ReferralProgramSettings;
    referrals: ReferralRecord[];
    stats: {
      totalReferrals: number;
      completedCount: number;
      rewardedCount: number;
      pendingCount: number;
      activeReferrers: number;
    };
    topReferrers: Array<{
      name: string;
      slug: string;
      count: number;
      rewarded: number;
    }>;
  };
}

export function AdminReferralsClient({ initialData }: AdminReferralsClientProps) {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<ReferralProgramSettings>(initialData.settings);
  const [referrals, setReferrals] = useState<ReferralRecord[]>(initialData.referrals);
  const [stats, setStats] = useState(initialData.stats);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await updateReferralProgramSettings(settings);
      if (res.success) {
        success('Referral program settings saved successfully!');
      } else {
        error(res.error || 'Failed to save settings.');
      }
    } catch {
      error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    referralId: string,
    newStatus: 'pending' | 'completed' | 'rewarded'
  ) => {
    setUpdatingId(referralId);
    try {
      const res = await updateReferralStatusAdmin(referralId, newStatus);
      if (res.success) {
        setReferrals((prev) =>
          prev.map((r) => (r.id === referralId ? { ...r, status: newStatus } : r))
        );
        success(`Referral marked as ${newStatus}!`);
      } else {
        error(res.error || 'Failed to update referral.');
      }
    } catch {
      error('Failed to update referral status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Artist Referral & Rewards Studio</h1>
        <p className={styles.subtitle}>
          Configure peer-to-peer referral incentives, rewards policy (extra validity, cash rewards, or leaderboard stats), and manage referral records.
        </p>
      </div>

      {/* Overview Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricValue}>{stats.totalReferrals}</span>
          <span className={styles.metricLabel}>Total Referrals</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue} style={{ color: '#34d399' }}>
            {stats.completedCount}
          </span>
          <span className={styles.metricLabel}>Active Portfolios</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue} style={{ color: '#f59e0b' }}>
            {stats.rewardedCount}
          </span>
          <span className={styles.metricLabel}>Rewarded Referrals</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricValue} style={{ color: '#a29bfe' }}>
            {stats.activeReferrers}
          </span>
          <span className={styles.metricLabel}>Active Referrer Artists</span>
        </div>
      </div>

      {/* Program Settings Studio */}
      <div className={styles.configCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>
              <Gift size={20} color="var(--color-primary, #6c5ce7)" />
              <span>Referral Incentive Rules & Policy</span>
            </h2>
            <p className={styles.cardSubtitle}>
              Changes made here are instantly displayed in every artist&apos;s dashboard under the &quot;Referrals&quot; tab.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #6c5ce7)' }}
            />
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: settings.enabled ? '#34d399' : '#94a3b8' }}>
              {settings.enabled ? 'Program Active' : 'Program Paused'}
            </span>
          </label>
        </div>

        {/* Reward Type Selector */}
        <div>
          <label className={styles.label} style={{ marginBottom: '10px', display: 'block' }}>
            Select Reward Mode
          </label>
          <div className={styles.rewardTypesGrid}>
            {/* 1. None (Stats & Leaderboard Only) */}
            <div
              className={`${styles.typeOption} ${settings.reward_type === 'none' ? styles.typeOptionActive : ''}`}
              onClick={() =>
                setSettings({
                  ...settings,
                  reward_type: 'none',
                  reward_unit: 'perks',
                  reward_title: 'Community Champion',
                  reward_description: 'Invite fellow artists and live performers to BookMyArtist. Help build India\'s largest live artist community and climb the Top Referrers Leaderboard!',
                })
              }
            >
              <div className={styles.typeOptionTitle}>
                <Trophy size={16} color="#f59e0b" />
                <span>Leaderboard Only</span>
              </div>
              <p className={styles.typeOptionDesc}>
                No financial/validity commitment. Artists earn recognition & directory spotlight.
              </p>
            </div>

            {/* 2. Extra Validity */}
            <div
              className={`${styles.typeOption} ${settings.reward_type === 'validity' ? styles.typeOptionActive : ''}`}
              onClick={() =>
                setSettings({
                  ...settings,
                  reward_type: 'validity',
                  reward_unit: 'days',
                  reward_value: settings.reward_value || 30,
                  reward_title: 'Extra Pro Plan Validity',
                  reward_description: `Get +${settings.reward_value || 30} Days free Pro plan extension for every artist who registers and creates their profile!`,
                })
              }
            >
              <div className={styles.typeOptionTitle}>
                <Clock size={16} color="#34d399" />
                <span>Extra Validity</span>
              </div>
              <p className={styles.typeOptionDesc}>
                Reward artists with free days / months added to their subscription validity.
              </p>
            </div>

            {/* 3. Cash / Money Reward */}
            <div
              className={`${styles.typeOption} ${settings.reward_type === 'money' ? styles.typeOptionActive : ''}`}
              onClick={() =>
                setSettings({
                  ...settings,
                  reward_type: 'money',
                  reward_unit: 'inr',
                  reward_value: settings.reward_value || 500,
                  reward_title: 'Cash Bonus Per Invite',
                  reward_description: `Earn ₹${settings.reward_value || 500} direct payout / credits for every verified performing artist you invite!`,
                })
              }
            >
              <div className={styles.typeOptionTitle}>
                <DollarSign size={16} color="#fbbf24" />
                <span>Cash / Money</span>
              </div>
              <p className={styles.typeOptionDesc}>
                Reward artists with monetary incentives (UPI / Razorpay credits).
              </p>
            </div>

            {/* 4. Custom Perk */}
            <div
              className={`${styles.typeOption} ${settings.reward_type === 'custom' ? styles.typeOptionActive : ''}`}
              onClick={() =>
                setSettings({
                  ...settings,
                  reward_type: 'custom',
                  reward_unit: 'perks',
                  reward_title: 'VIP Spotlight & Free Verification',
                  reward_description: 'Top referring artists receive free VIP badge verification and prime placement in the national event directory!',
                })
              }
            >
              <div className={styles.typeOptionTitle}>
                <Sparkles size={16} color="#a29bfe" />
                <span>Custom Perk</span>
              </div>
              <p className={styles.typeOptionDesc}>
                Custom platform perks like VIP verified badges or spotlight banner feature.
              </p>
            </div>
          </div>
        </div>

        {/* Input Details */}
        <div className={styles.formGrid}>
          {settings.reward_type !== 'none' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {settings.reward_type === 'validity' ? 'Reward Days (e.g. 30 Days)' : 'Reward Amount (₹)'}
              </label>
              <input
                type="number"
                min="1"
                value={settings.reward_value || 0}
                onChange={(e) => setSettings({ ...settings, reward_value: Number(e.target.value) })}
                className={styles.input}
              />
            </div>
          )}

          <div className={`${styles.inputGroup} ${settings.reward_type === 'none' ? styles.inputGroupFull : ''}`}>
            <label className={styles.label}>Reward Title (Shown in User Banner)</label>
            <input
              type="text"
              value={settings.reward_title}
              onChange={(e) => setSettings({ ...settings, reward_title: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={`${styles.inputGroup} ${styles.inputGroupFull}`}>
            <label className={styles.label}>Reward Description</label>
            <textarea
              value={settings.reward_description}
              onChange={(e) => setSettings({ ...settings, reward_description: e.target.value })}
              className={styles.textarea}
            />
          </div>

          <div className={`${styles.inputGroup} ${styles.inputGroupFull}`}>
            <label className={styles.label}>Terms & Eligibility Notes</label>
            <input
              type="text"
              value={settings.terms}
              onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
              className={styles.input}
              placeholder="e.g. Valid when referred artist signs up and verifies their profile."
            />
          </div>
        </div>

        <div className={styles.saveRow}>
          <button
            type="button"
            className={styles.btnSave}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Referral Rules'}</span>
          </button>
        </div>
      </div>

      {/* Top Referrers Summary */}
      {initialData.topReferrers.length > 0 && (
        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle}>
            <Trophy size={18} color="#f59e0b" />
            <span>Top Evangelist Artists</span>
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Rank</th>
                <th className={styles.th}>Artist Name</th>
                <th className={styles.th}>Stage URL</th>
                <th className={styles.th}>Total Referred</th>
                <th className={styles.th}>Rewarded</th>
              </tr>
            </thead>
            <tbody>
              {initialData.topReferrers.map((ref, idx) => (
                <tr key={ref.slug || idx} className={styles.tr}>
                  <td className={styles.td}>
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td className={styles.td}>
                    <strong>{ref.name}</strong>
                  </td>
                  <td className={styles.td}>
                    <Link href={`/${ref.slug}`} target="_blank" style={{ color: '#a29bfe', textDecoration: 'none' }}>
                      /{ref.slug} ↗
                    </Link>
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{ref.count}</span> artists
                  </td>
                  <td className={styles.td}>{ref.rewarded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Referrals Master Table */}
      <div className={styles.tableCard}>
        <div className={styles.cardHeader} style={{ border: 'none', padding: 0 }}>
          <h3 className={styles.cardTitle}>
            <Users size={18} color="var(--color-primary, #6c5ce7)" />
            <span>All Referral Records ({referrals.length})</span>
          </h3>
        </div>

        {referrals.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>
            No referrals recorded yet. Once artists invite others via their invite link, records will appear here.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Referrer (Invited By)</th>
                <th className={styles.th}>Referred Artist</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Reward Type</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div>
                      <strong>{r.referrer_name}</strong>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>@{r.referrer_slug}</div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div>
                      <strong>{r.referred_name}</strong>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{r.referred_email}</div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className={styles.td}>
                    <span style={{ textTransform: 'capitalize' }}>{r.reward_type || 'None'}</span>
                  </td>
                  <td className={styles.td}>
                    {r.status === 'rewarded' ? (
                      <span className={styles.badgeRewarded}>
                        <Check size={12} /> Rewarded
                      </span>
                    ) : (
                      <span style={{ color: '#34d399', fontWeight: 600 }}>Active</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {r.status !== 'rewarded' ? (
                      <button
                        type="button"
                        className={`${styles.actionBtnSmall} ${styles.actionBtnReward}`}
                        onClick={() => handleStatusChange(r.id, 'rewarded')}
                        disabled={updatingId === r.id}
                      >
                        {updatingId === r.id ? 'Updating...' : 'Credit Reward'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionBtnSmall}
                        onClick={() => handleStatusChange(r.id, 'completed')}
                        disabled={updatingId === r.id}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
