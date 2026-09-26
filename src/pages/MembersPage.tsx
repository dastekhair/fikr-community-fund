import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  UserX,
  UserCheck2,
  Save,
  ShieldCheck,
  Crown,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Member, MemberRole } from '../types';
import { MEMBER_ROLES } from '../lib/constants';

export const MembersPage: React.FC = () => {
  const { members, addNewMember, updateMember, toggleMemberActive } = useData();
  const { currentUser } = useAuth();

  const isAdmin = Boolean(currentUser?.isAdmin);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Add Member form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('Core Member');
  const [newNotes, setNewNotes] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Edit in place state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<MemberRole>('Core Member');
  const [editNotes, setEditNotes] = useState('');

  const startEdit = (m: Member) => {
    if (!isAdmin) return;
    setEditingMemberId(m.id);
    setEditName(m.name);
    setEditRole(m.role);
    setEditNotes(m.notes || '');
    setPageError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!isAdmin || !editName.trim()) return;
    try {
      setPageError(null);
      await updateMember(id, {
        name: editName.trim(),
        role: editRole,
        notes: editNotes.trim() || undefined
      });
      setEditingMemberId(null);
    } catch (err: any) {
      console.error('Save edit error:', err);
      setPageError(err.message || 'Failed to update member role.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setPageError(null);
      await toggleMemberActive(id, currentStatus);
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setPageError(err.message || 'Failed to change member status.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newName.trim()) return;

    try {
      setSubmittingAdd(true);
      setAddError(null);
      await addNewMember({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        role: newRole,
        isActive: true,
        joinedAt: new Date().toISOString().slice(0, 10),
        notes: newNotes.trim() || undefined
      });
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewNotes('');
      setNewRole('Core Member');
    } catch (err: any) {
      console.error('Add member error:', err);
      setAddError(err.message || 'Failed to add new member.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Governance & Administration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Core Member Directory & Roles
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            {isAdmin
              ? 'As an Admin, you have full authority to assign roles, promote other members to Admin, and manage member active status.'
              : 'Official roster of verified core members and designated roles. Member permissions are managed exclusively by the Admin.'}
          </p>
        </div>

        {isAdmin ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setAddError(null);
              setAddModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add New Member
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Admin-only modifications</span>
          </div>
        )}
      </div>

      {pageError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pageError}</span>
          </div>
          <button onClick={() => setPageError(null)} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            You are viewing this roster with <strong>{currentUser?.role}</strong> permissions. Only designated Admins (e.g. Amaan) can modify roles and deactivate members.
          </span>
        </div>
      )}

      {/* Member Roster List */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Current Roster ({members.length} Members • {members.filter((m: Member) => m.isActive).length} Active)
          </span>
          <span className="text-[11px] text-neutral-400">
            Live Firestore Sync
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {members.map((member: Member) => {
            const isEditing = editingMemberId === member.id;

            return (
              <div
                key={member.id}
                className={`p-4 sm:p-6 transition-colors ${
                  !member.isActive
                    ? 'opacity-60 bg-neutral-50/70 dark:bg-neutral-900/30'
                    : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20'
                }`}
              >
                {isEditing && isAdmin ? (
                  /* Edit in place mode (Admin only) */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full p-2.5 sm:p-2 min-h-[42px] sm:min-h-0 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500">Role (Admin Authority)</label>
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value as MemberRole)}
                          className="w-full p-2.5 sm:p-2 min-h-[42px] sm:min-h-0 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold"
                        >
                          {MEMBER_ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-500">Responsibilities / Notes</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="w-full p-2.5 sm:p-2 min-h-[42px] sm:min-h-0 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMemberId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveEdit(member.id)}
                        icon={<Save className="w-3.5 h-3.5" />}
                      >
                        Save & Apply Live
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Standard display mode */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        member.role === 'Admin'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : member.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
                      }`}>
                        {member.role === 'Admin' ? <Crown className="w-4 h-4" /> : member.name.charAt(0)}
                      </div>

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {member.name}
                          </span>
                          <RoleBadge role={member.role} size="sm" />
                          {!member.isActive && (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              Deactivated
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {member.email && <span className="break-all">{member.email}</span>}
                          {member.notes && (
                            <>
                              <span>•</span>
                              <span>{member.notes}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Joined {member.joinedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions (Admin Only) */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(member)}
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>

                        <Button
                          variant={member.isActive ? 'danger' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleStatus(member.id, member.isActive)}
                          icon={member.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                        >
                          {member.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal (Admin Only) */}
      {addModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Add New Core Member
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Tariq Ahmad"
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. tariq@fikr.org"
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Initial Role
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as MemberRole)}
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                >
                  {MEMBER_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Responsibilities / Area Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. Ground inspection for North district cases"
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submittingAdd}
                >
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
