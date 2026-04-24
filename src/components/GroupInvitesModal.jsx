import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

function buildIdentityInitials(displayName = '', username = '', fallback = '') {
  const source = displayName || username || fallback || 'Dish Depot'

  if (!source) {
    return 'DD'
  }

  const words = source.split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('')
  return initials || source.slice(0, 2).toUpperCase()
}

function LocalIdentityAvatar({ displayName = '', username = '', fallback = '', tone = 'default', avatarUrl = '' }) {
  const initials = buildIdentityInitials(displayName, username, fallback)

  return (
    <span className={`identity-avatar identity-avatar-${tone}`} aria-hidden="true">
      {avatarUrl ? <img className="identity-avatar-image" src={avatarUrl} alt="" /> : initials}
    </span>
  )
}

function LocalIdentityBlock({ displayName = '', username = '', fallback = 'Dish Depot user', meta = '', tone = 'default', avatarUrl = '' }) {
  const hasDisplayName = Boolean(displayName)
  const hasUsername = Boolean(username)
  const primary = hasDisplayName ? displayName : hasUsername ? `@${username}` : fallback
  const secondaryParts = []

  if (hasDisplayName && hasUsername) {
    secondaryParts.push(`@${username}`)
  } else if (!hasDisplayName && !hasUsername && fallback) {
    secondaryParts.push(fallback)
  } else if (!hasDisplayName && hasUsername) {
    secondaryParts.push('Dish Depot member')
  }

  if (meta) {
    secondaryParts.push(meta)
  }

  return (
    <div className="identity-block">
      <LocalIdentityAvatar displayName={displayName} username={username} fallback={fallback} tone={tone} avatarUrl={avatarUrl} />
      <div className="identity-copy">
        <strong>{primary}</strong>
        {secondaryParts.length > 0 ? <small>{secondaryParts.join(' · ')}</small> : null}
      </div>
    </div>
  )
}

export default function GroupInvitesModal({
  isOpen,
  onClose,
  IdentityBlock,
  groupInvitesLoading,
  pendingGroupInvites,
  getIdentityProps,
  GROUP_ROLE_LABELS,
  formatInviteExpiry,
  formatInviteTimestamp,
  onAcceptPendingGroupInvite,
  onDeclinePendingGroupInvite,
}) {
  if (!isOpen) {
    return null
  }

  const IdentityBlockComponent = IdentityBlock || LocalIdentityBlock
  const pendingCount = pendingGroupInvites.length

  return (
    <div
      className="modal show share-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-invites-modal-title"
      aria-describedby="group-invites-modal-subtitle group-invites-modal-note"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content share-modal">
        <div className="modal-shell share-modal-shell">
          <ModalCloseButton onClick={onClose} label="Close group invites" />
          <ModalHeader
            title="Group Invites"
            subtitle="Review invitations to join collaborative groups, including who invited you and what access the invite grants."
            note="Accepting adds the group to your collaboration list with the listed role. Declining leaves your current access unchanged."
            titleId="group-invites-modal-title"
            subtitleId="group-invites-modal-subtitle"
            noteId="group-invites-modal-note"
          />

          <section className="collab-overview-card" aria-label="Pending group invites overview">
            <div className="collab-overview-copy">
              <p className="collab-overview-kicker">Invitation inbox</p>
              <h3>{pendingCount > 0 ? `${pendingCount} pending invite${pendingCount === 1 ? '' : 's'}` : 'No invites waiting right now'}</h3>
              <p>Use this surface to confirm the group name, inviter identity, and access level before deciding whether to join.</p>
            </div>
            <div className="collab-overview-metrics">
              <span className="collab-overview-pill">{groupInvitesLoading ? 'Refreshing invites' : 'Invite history stays time-stamped'}</span>
              <span className={`collab-overview-pill${pendingCount > 0 ? ' collab-overview-pill-strong' : ''}`}>
                {pendingCount > 0 ? 'Accept or decline with context' : 'You are caught up'}
              </span>
            </div>
          </section>

          <details className="modal-section" open>
            <summary>Pending Invites</summary>
            <div className="collab-section-intro">
              <div className="collab-section-copy">
                <p className="collab-section-kicker">Review</p>
                <h3>Check the inviter, group, and role before joining</h3>
                <p>Every invite keeps the identity block, group name, access level, and sent/expiry timing together for a quick trust check.</p>
              </div>
              <p className="collab-trust-note">
                <i className="fas fa-envelope-open-text" aria-hidden="true" />
                Invite timing is shown before you choose.
              </p>
            </div>

            <section className="share-existing" aria-label="Pending group invites">
              {groupInvitesLoading ? <p className="share-empty">Loading invites...</p> : null}
              {!groupInvitesLoading && pendingGroupInvites.length === 0 ? (
                <EmptyStateCard
                  icon="fa-envelope-open-text"
                  title="No pending invites right now"
                  description="When another Dish Depot user invites you into a group, it will appear here so you can accept or decline it with the group and role details in view."
                  compact
                />
              ) : null}

              {!groupInvitesLoading && pendingGroupInvites.length > 0 ? (
                <div className="share-existing-list">
                  {pendingGroupInvites.map((invite) => (
                    <div key={invite.id} className="share-existing-item">
                      <div className="share-existing-item-shell">
                        <IdentityBlockComponent
                          {...getIdentityProps({
                            userId: invite.invitedBy,
                            displayName: invite.inviterDisplayName,
                            username: invite.inviterUsername,
                            fallback: 'Group invite',
                          })}
                          meta="Sent this invitation"
                          tone="invite"
                        />
                        <div className="share-existing-meta-block">
                          <strong>{invite.groupName || 'Group'}</strong>
                          <div className="collab-badge-row">
                            <span className="collab-access-badge collab-access-badge-warning">{GROUP_ROLE_LABELS[invite.role] || invite.role} access</span>
                            <span className="collab-access-badge collab-access-badge-muted">{formatInviteExpiry(invite.expiresAt)}</span>
                          </div>
                          <small>Sent {formatInviteTimestamp(invite.createdAt)}</small>
                        </div>
                      </div>
                      <div className="share-existing-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => onAcceptPendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                          Accept Invite
                        </button>
                        <button className="btn btn-danger" type="button" onClick={() => onDeclinePendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </details>
        </div>
      </div>
    </div>
  )
}
