import React, { useState } from 'react';
import { X, Mail, Loader2, Shield, Users } from 'lucide-react';
import { useStory } from '../context/StoryContext';
import { useTheme } from '../hooks';
import { cn } from '../lib/utils';

const ShareProjectModal: React.FC = () => {
  const {
    isShareModalOpen,
    closeShareModal,
    currentProject,
    currentProjectShares,
    inviteCollaborator,
    revokeShare,
    currentProjectPermission,
  } = useStory();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message?: string }>({ type: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (!isShareModalOpen || !currentProject) {
    return null;
  }

  const canManage = currentProjectPermission === 'owner';

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Please provide an email address.' });
      return;
    }

    setIsSubmitting(true);
    const result = await inviteCollaborator(email.trim(), permission);
    setIsSubmitting(false);

    if (!result.success) {
      setStatus({ type: 'error', message: result.error || 'Failed to send invite.' });
    } else {
      setStatus({ type: 'success', message: 'Invite sent!' });
      setEmail('');
    }
  };

  const handleRevoke = async (shareId: string) => {
    setRevokingId(shareId);
    const result = await revokeShare(shareId);
    setRevokingId(null);

    if (!result.success) {
      setStatus({ type: 'error', message: result.error || 'Failed to revoke invite.' });
    }
  };

  const permissionLabel = (value: 'view' | 'edit') => (value === 'edit' ? 'Can edit' : 'View only');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={closeShareModal}
    >
      <div
        className={cn(
          'w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden',
          theme === 'dark' ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'
        )}
        onClick={event => event.stopPropagation()}
      >
        <div
          className={cn(
            'px-6 py-5 flex items-center justify-between border-b',
            theme === 'dark' ? 'border-stone-800' : 'border-stone-200'
          )}
        >
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">Share project</p>
            <h2 className="text-lg font-semibold">{currentProject.name}</h2>
          </div>
          <button
            onClick={closeShareModal}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
            )}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Invite collaborator</label>
              <div
                className={cn(
                  'flex flex-col gap-3 rounded-2xl border px-4 py-4',
                  theme === 'dark' ? 'border-stone-800 bg-stone-900/40' : 'border-stone-200 bg-stone-50'
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-transparent">
                    <Mail size={16} className="opacity-60" />
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="name@email.com"
                      className={cn(
                        'flex-1 bg-transparent text-sm outline-none',
                        !canManage && 'opacity-60 cursor-not-allowed'
                      )}
                      disabled={!canManage || isSubmitting}
                      required
                    />
                  </div>
                  <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={() => setPermission('edit')}
                      className={cn(
                        'flex-1 h-9 rounded-xl border transition-colors',
                        permission === 'edit'
                          ? theme === 'dark'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-100'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : theme === 'dark'
                            ? 'border-stone-800 text-stone-300'
                            : 'border-stone-200 text-stone-500',
                        (!canManage || isSubmitting) && 'cursor-not-allowed opacity-60'
                      )}
                      disabled={!canManage || isSubmitting}
                    >
                      Can edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermission('view')}
                      className={cn(
                        'flex-1 h-9 rounded-xl border transition-colors',
                        permission === 'view'
                          ? theme === 'dark'
                            ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                            : 'border-sky-500 bg-sky-50 text-sky-700'
                          : theme === 'dark'
                            ? 'border-stone-800 text-stone-300'
                            : 'border-stone-200 text-stone-500',
                        (!canManage || isSubmitting) && 'cursor-not-allowed opacity-60'
                      )}
                      disabled={!canManage || isSubmitting}
                    >
                      View only
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!canManage || isSubmitting}
                  className={cn(
                    'h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors',
                    canManage
                      ? theme === 'dark'
                        ? 'bg-emerald-500 text-stone-900 hover:bg-emerald-400'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                  Send invite
                </button>
                {!canManage && (
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <Shield size={14} />
                    Only project owners can invite collaborators.
                  </p>
                )}
                {status.type !== 'idle' && (
                  <p
                    className={cn(
                      'text-xs font-medium',
                      status.type === 'error'
                        ? 'text-red-500'
                        : theme === 'dark'
                          ? 'text-emerald-300'
                          : 'text-emerald-600'
                    )}
                  >
                    {status.message}
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Collaborators</p>
              <span className="text-xs opacity-60">{currentProjectShares.length} invited</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentProjectShares.length === 0 ? (
                <div
                  className={cn(
                    'text-sm px-4 py-3 rounded-xl border',
                    theme === 'dark' ? 'border-stone-800 text-stone-400' : 'border-stone-200 text-stone-500'
                  )}
                >
                  No collaborators yet. Invite someone using the form above.
                </div>
              ) : (
                currentProjectShares.map(share => (
                  <div
                    key={share.id}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl border',
                      theme === 'dark' ? 'border-stone-800 bg-stone-900/40' : 'border-stone-200 bg-stone-50'
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{share.shared_with_email}</p>
                      <div className="flex gap-2 text-xs opacity-70">
                        <span>{permissionLabel(share.permission)}</span>
                        <span>•</span>
                        <span>{share.accepted ? 'Accepted' : 'Pending'}</span>
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        disabled={revokingId === share.id}
                        className={cn(
                          'text-xs font-semibold px-3 h-8 rounded-lg border transition-colors',
                          theme === 'dark' ? 'border-red-400 text-red-300 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50',
                          revokingId === share.id && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        {revokingId === share.id ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
