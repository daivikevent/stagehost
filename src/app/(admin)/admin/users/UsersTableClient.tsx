'use client';

import { useState, useTransition } from 'react';
import { Search, ExternalLink, Eye, UserX, UserCheck, Shield, Star, LogIn, Download, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { updateUserPlan, updateUserDirectoryListing, toggleUserStatus, toggleFeaturedAnchor, startImpersonation, bulkUpdateUserStatus } from '@/lib/actions/admin';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from '../dashboard/admin.module.css';

interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  city: string;
  slug: string;
  plan: string;
  status: string; // 'active' | 'inactive'
  profile_complete: boolean;
  is_listed_in_directory: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  joined: string;
}

interface UsersTableClientProps {
  initialUsers: AdminUser[];
}

function exportUsersToCSV(userList: AdminUser[], fileName = 'stagehost_users') {
  const headers = ['Name', 'Email', 'City', 'Slug', 'Plan', 'Status', 'Directory Listed', 'Featured', 'Joined Date'];
  const rows = userList.map((u) => [
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${(u.email || '').replace(/"/g, '""')}"`,
    `"${(u.city || '').replace(/"/g, '""')}"`,
    `"${(u.slug || '').replace(/"/g, '""')}"`,
    `"${u.plan || ''}"`,
    `"${u.status || ''}"`,
    `"${u.is_listed_in_directory ? 'Yes' : 'No'}"`,
    `"${u.is_featured ? 'Yes' : 'No'}"`,
    `"${u.joined || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function UsersTableClient({ initialUsers }: UsersTableClientProps) {
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();


  // Status Modal State (Disable / Reactivate)
  const [statusModalUser, setStatusModalUser] = useState<{
    userId: string;
    name: string;
    targetStatus: 'active' | 'inactive';
  } | null>(null);

  const handlePlanChange = (userId: string, newPlan: string) => {
    startTransition(async () => {
      try {
        await updateUserPlan(userId, newPlan);
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan: newPlan } : u));
        success(`Plan updated to ${newPlan}!`);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to update plan');
      }
    });
  };

  const handleDirectoryToggle = (profileId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      try {
        await updateUserDirectoryListing(profileId, nextStatus);
        setUsers(prev => prev.map(u => u.id === profileId ? { ...u, is_listed_in_directory: nextStatus } : u));
        success(nextStatus ? 'Anchor added to directory!' : 'Anchor removed from directory');
      } catch (err) {
        showError('Failed to update directory status');
      }
    });
  };

  const handleFeaturedToggle = (profileId: string, currentFeatured: boolean) => {
    const nextFeatured = !currentFeatured;
    startTransition(async () => {
      try {
        await toggleFeaturedAnchor(profileId, nextFeatured);
        setUsers(prev => prev.map(u => u.id === profileId ? { ...u, is_featured: nextFeatured } : u));
        success(nextFeatured ? '⭐ Anchor boosted to Top of Directory!' : 'Featured boost removed');
      } catch (err) {
        showError('Failed to update featured status');
      }
    });
  };

  const handleImpersonate = (userId: string, name: string) => {
    startTransition(async () => {
      try {
        await startImpersonation(userId, name);
        success(`Switching to View As ${name}...`);
        window.location.href = '/dashboard';
      } catch (err) {
        showError('Failed to start impersonation');
      }
    });
  };

  const handleConfirmStatusChange = () => {
    if (!statusModalUser) return;
    const { userId, name, targetStatus } = statusModalUser;

    startTransition(async () => {
      try {
        await toggleUserStatus(userId, targetStatus);
        setUsers(prev => prev.map(u => u.user_id === userId ? {
          ...u,
          status: targetStatus,
          is_listed_in_directory: targetStatus === 'inactive' ? false : u.is_listed_in_directory,
        } : u));

        if (targetStatus === 'inactive') {
          success(`Anchor "${name}" has been disabled / marked Inactive.`);
        } else {
          success(`Anchor "${name}" has been reactivated successfully!`);
        }
        setStatusModalUser(null);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to update account status');
      }
    });
  };

  const handleSelectAll = () => {
    const filteredUserIds = filtered.map((u) => u.user_id);
    const allFilteredSelected = filteredUserIds.length > 0 && filteredUserIds.every((id) => selectedUserIds.includes(id));
    if (allFilteredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredUserIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredUserIds])));
    }
  };

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkStatus = (targetStatus: 'active' | 'inactive') => {
    if (!selectedUserIds.length) return;
    startTransition(async () => {
      try {
        await bulkUpdateUserStatus(selectedUserIds, targetStatus);
        setUsers((prev) =>
          prev.map((u) =>
            selectedUserIds.includes(u.user_id)
              ? {
                  ...u,
                  status: targetStatus,
                  is_listed_in_directory: targetStatus === 'inactive' ? false : u.is_listed_in_directory,
                }
              : u
          )
        );
        success(`${selectedUserIds.length} anchors marked ${targetStatus === 'active' ? 'Active' : 'Inactive'}!`);
        setSelectedUserIds([]);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Bulk action failed');
      }
    });
  };

  const handleExportAll = () => {
    exportUsersToCSV(filtered, 'stagehost_all_users');
    success(`Exported ${filtered.length} users to CSV!`);
  };

  const handleExportSelected = () => {
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.user_id));
    exportUsersToCSV(selectedUsers, 'stagehost_selected_users');
    success(`Exported ${selectedUsers.length} selected users to CSV!`);
  };

  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;


  const filtered = users.filter((u) => {
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase()) &&
      !u.city.toLowerCase().includes(search.toLowerCase()) &&
      !u.slug.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filterPlan && u.plan.toLowerCase() !== filterPlan.toLowerCase()) {
      return false;
    }
    if (filterStatus && u.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users & Anchors</h1>
          <p className={styles.pageSubtitle}>Manage anchor accounts, status (Active / Inactive), plans & visibility</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span className="badge badge-ghost">{users.length} total</span>
          <span className="badge badge-success">{activeCount} active</span>
          {inactiveCount > 0 && (
            <span className="badge badge-warning">{inactiveCount} disabled</span>
          )}
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search name, email, city, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ width: '130px' }}
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
        >
          <option value="">All Plans</option>
          <option value="Free">Free</option>
          <option value="Starter">Starter</option>
          <option value="Pro">Pro</option>
          <option value="Premium">Premium</option>
        </select>

        <select
          className="input"
          style={{ width: '130px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleExportAll}
          title="Download filtered anchors list as CSV"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden', width: '100%' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
            No anchors found matching your search.
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table} style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((u) => selectedUserIds.includes(u.user_id))}
                    onChange={handleSelectAll}
                    title="Select all filtered anchors"
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                </th>
                <th>Anchor</th>
                <th>Email</th>
                <th>City</th>
                <th>Public Slug</th>
                <th>Plan (Changeable)</th>
                <th>Status</th>
                <th>In Directory</th>
                <th>Spotlight</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    opacity: u.status === 'inactive' ? 0.65 : 1,
                    backgroundColor: selectedUserIds.includes(u.user_id) ? 'rgba(108, 92, 231, 0.06)' : undefined,
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u.user_id)}
                      onChange={() => handleToggleSelect(u.user_id)}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                  </td>
                  <td>

                    <strong>{u.name}</strong>
                    {u.profile_complete && (
                      <span className="badge badge-success badge-xs" style={{ marginLeft: '6px' }}>
                        Complete
                      </span>
                    )}
                  </td>
                  <td className="text-secondary">{u.email}</td>
                  <td>{u.city}</td>
                  <td>
                    <a
                      href={`/${u.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      /{u.slug} <ExternalLink size={11} />
                    </a>
                  </td>
                  <td>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', fontSize: '12px', height: '28px', width: '100px' }}
                      value={u.plan}
                      disabled={isPending}
                      onChange={(e) => handlePlanChange(u.user_id, e.target.value)}
                    >
                      <option value="Free">Free</option>
                      <option value="Starter">Starter</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </td>
                  <td>
                    {u.status === 'active' ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-warning">Inactive</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`badge badge-${u.is_listed_in_directory ? 'success' : 'ghost'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleDirectoryToggle(u.id, u.is_listed_in_directory)}
                      disabled={isPending}
                      title="Click to toggle directory visibility"
                    >
                      {u.is_listed_in_directory ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`badge ${u.is_featured ? 'badge-warning' : 'badge-ghost'}`}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: u.is_featured ? 'rgba(245, 158, 11, 0.15)' : undefined,
                        color: u.is_featured ? '#f59e0b' : undefined,
                        fontWeight: u.is_featured ? 600 : 400,
                      }}
                      onClick={() => handleFeaturedToggle(u.id, !!u.is_featured)}
                      disabled={isPending}
                      title={u.is_featured ? 'Click to remove Featured boost' : 'Click to boost to Top of Directory'}
                    >
                      <Star size={12} fill={u.is_featured ? '#f59e0b' : 'none'} stroke={u.is_featured ? '#f59e0b' : 'currentColor'} />
                      {u.is_featured ? 'Featured' : 'Boost'}
                    </button>
                  </td>
                  <td className="text-tertiary text-xs">{u.joined}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-xs"
                        style={{ color: 'var(--color-primary)' }}
                        onClick={() => handleImpersonate(u.user_id, u.name)}
                        disabled={isPending}
                        title={`View Dashboard as ${u.name} (Support Mode)`}
                      >
                        <LogIn size={13} />
                      </button>

                      <a
                        href={`/${u.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-xs"
                        title="View Public Profile"
                      >
                        <Eye size={13} />
                      </a>

                      {u.status === 'active' ? (
                        <button
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--color-warning)' }}
                          onClick={() => setStatusModalUser({
                            userId: u.user_id,
                            name: u.name,
                            targetStatus: 'inactive',
                          })}
                          disabled={isPending}
                          title="Disable / Deactivate Account"
                        >
                          <UserX size={13} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--color-success)' }}
                          onClick={() => setStatusModalUser({
                            userId: u.user_id,
                            name: u.name,
                            targetStatus: 'active',
                          })}
                          disabled={isPending}
                          title="Reactivate Account"
                        >
                          <UserCheck size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            zIndex: 900,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span className="badge badge-primary" style={{ fontWeight: 700, padding: '6px 12px' }}>
            {selectedUserIds.length} Selected
          </span>
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={() => handleBulkStatus('active')}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <UserCheck size={13} /> Bulk Activate
          </button>
          <button
            type="button"
            className="btn btn-sm btn-warning"
            onClick={() => handleBulkStatus('inactive')}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <UserX size={13} /> Bulk Suspend
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleExportSelected}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={13} /> Export Selected (CSV)
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setSelectedUserIds([])}
            disabled={isPending}
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Disable / Reactivate Confirm Modal */}
      <ConfirmModal

        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        onConfirm={handleConfirmStatusChange}
        title={
          statusModalUser?.targetStatus === 'inactive'
            ? `Disable Anchor "${statusModalUser?.name}"?`
            : `Reactivate Anchor "${statusModalUser?.name}"?`
        }
        description={
          statusModalUser?.targetStatus === 'inactive'
            ? `This anchor account will be marked as Inactive and hidden from the directory. No data will be deleted, and you can reactivate this account at any time.`
            : `This anchor account will be reactivated and restored to Active status.`
        }
        confirmText={
          statusModalUser?.targetStatus === 'inactive'
            ? 'Disable Account'
            : 'Reactivate Account'
        }
        cancelText="Cancel"
        variant="warning"
        isLoading={isPending}
      />
    </div>
  );
}
