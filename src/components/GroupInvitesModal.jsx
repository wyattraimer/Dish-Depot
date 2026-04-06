function EmptyStateCard({ icon, title, description, compact = false }) {
  return (
    <div className={`empty-state-card${compact ? ' empty-state-card-compact' : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function GroupInvitesModal({
  isOpen,
  onClose,
  groupInvitesLoading,
  pendingGroupInvites,
  IdentityBlock,
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

  return (
    <div className="modal show share-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(event) => event.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Group Invites</h2>
        <p className="share-modal-subtitle">Accept or decline invitations to join collaborative groups.</p>

        {groupInvitesLoading ? <p className="share-empty">Loading invites...</p> : null}
        {!groupInvitesLoading && pendingGroupInvites.length === 0 ? (
          <EmptyStateCard
            icon="fa-envelope-open-text"
            title="No pending invites right now"
            description="When another Dish Depot user invites you into a group, it will appear here so you can accept or decline it."
            compact
          />
        ) : null}

        {!groupInvitesLoading && pendingGroupInvites.length > 0 ? (
          <div className="share-existing-list" aria-label="Pending group invites">
            {pendingGroupInvites.map((invite) => (
              <div key={invite.id} className="share-existing-item">
                <div className="share-existing-item-shell">
                  <IdentityBlock
                    {...getIdentityProps({
                      userId: invite.invitedBy,
                      displayName: invite.inviterDisplayName,
                      username: invite.inviterUsername,
                      fallback: 'Group invite',
                    })}
                    meta={`Invited you to ${invite.groupName || 'Group'}`}
                    tone="invite"
                  />
                  <div className="share-existing-meta-block">
                    <strong>{invite.groupName || 'Group'}</strong>
                    <small>
                      {GROUP_ROLE_LABELS[invite.role] || invite.role} · {formatInviteExpiry(invite.expiresAt)}
                    </small>
                    <small>Sent: {formatInviteTimestamp(invite.createdAt)}</small>
                  </div>
                </div>
                <div className="share-existing-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => onAcceptPendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                    Accept
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => onDeclinePendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
