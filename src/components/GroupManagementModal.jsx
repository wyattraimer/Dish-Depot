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

export default function GroupManagementModal({
  isOpen,
  onClose,
  handleCreateGroup,
  groupNameDraft,
  onChangeGroupNameDraft,
  groupBusy,
  groups,
  selectedGroupId,
  onChangeSelectedGroup,
  isUuidLike,
  searchGroupInviteCandidates,
  groupInviteLookup,
  onChangeGroupInviteLookup,
  canAdminSelectedGroup,
  groupInviteRole,
  onChangeGroupInviteRole,
  GROUP_ROLE_OPTIONS,
  GROUP_ROLE_LABELS,
  GROUP_ROLE_DESCRIPTIONS,
  groupInviteResults,
  IdentityBlock,
  onAddUserToSelectedGroup,
  groupInvitesLoading,
  groupPendingInvites,
  getIdentityProps,
  formatInviteExpiry,
  onResendGroupInvite,
  onCancelGroupInvite,
  groupMembersLoading,
  groupMembers,
  authUser,
  onUpdateGroupMemberRole,
  onRemoveUserFromSelectedGroup,
  groupActivityLoading,
  groupActivityViewModels,
  IdentityAvatar,
  onDeleteSelectedGroup,
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
        <h2>Groups</h2>
        <p className="share-modal-subtitle">Create and manage collaborative groups for shared recipes.</p>
        <p className="share-helper-note">Sections below can be expanded or collapsed to keep things focused.</p>

        <details className="modal-section" open>
          <summary>Create Group</summary>
          <form className="share-form" onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label htmlFor="groupNameInput">Group Name</label>
              <div className="share-lookup-row">
                <input
                  id="groupNameInput"
                  type="text"
                  value={groupNameDraft}
                  onChange={(event) => onChangeGroupNameDraft(event.target.value)}
                  placeholder="The Johnson Family"
                />
                <button className="btn btn-secondary" type="submit" disabled={groupBusy}>
                  {groupBusy ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </details>

        {groups.length > 0 ? (
          <details className="modal-section" open>
            <summary>Selected Group</summary>
            <div className="form-group">
              <label htmlFor="groupSelectInModal">Choose Group</label>
              <select id="groupSelectInModal" value={selectedGroupId} onChange={(event) => onChangeSelectedGroup(event.target.value)}>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </details>
        ) : null}

        {isUuidLike(selectedGroupId) ? (
          <>
            <details className="modal-section" open>
              <summary>Invite Members</summary>
              <form className="share-form" onSubmit={searchGroupInviteCandidates}>
                <div className="form-group">
                  <label htmlFor="groupInviteLookup">Send Invite by Username</label>
                  <p className="share-helper-note">Invited users will be able to accept or decline before joining.</p>
                  <div className="share-lookup-row">
                    <input
                      id="groupInviteLookup"
                      type="text"
                      value={groupInviteLookup}
                      onChange={(event) => onChangeGroupInviteLookup(event.target.value.toLowerCase())}
                      placeholder="chefmaria"
                      autoComplete="off"
                      disabled={!canAdminSelectedGroup}
                    />
                    <select value={groupInviteRole} onChange={(event) => onChangeGroupInviteRole(event.target.value)} disabled={!canAdminSelectedGroup}>
                      {GROUP_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {`${GROUP_ROLE_LABELS[role]} — ${GROUP_ROLE_DESCRIPTIONS[role]}`}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary" type="submit" disabled={groupBusy || !canAdminSelectedGroup}>
                      {groupBusy ? 'Searching...' : 'Find User'}
                    </button>
                  </div>
                </div>
              </form>

              {groupInviteResults.length > 0 ? (
                <div className="share-results" aria-label="Group invite results">
                  {groupInviteResults.map((result) => (
                    <div key={result.id} className="share-result-item">
                      <IdentityBlock
                        displayName={result.displayName}
                        username={result.username}
                        avatarUrl={result.avatarUrl}
                        fallback={result.id || 'Dish Depot user'}
                        meta="Ready to invite"
                        tone="search"
                      />
                      <button className="btn btn-secondary" type="button" onClick={() => onAddUserToSelectedGroup(result)} disabled={!canAdminSelectedGroup || groupBusy}>
                        Send Invite
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </details>

            <details className="modal-section" open>
              <summary>Pending Invites</summary>
              <section className="share-existing" aria-label="Pending invites for selected group">
                {groupInvitesLoading ? <p className="share-empty">Loading pending invites...</p> : null}
                {!groupInvitesLoading && groupPendingInvites.length === 0 ? (
                  <EmptyStateCard
                    icon="fa-paper-plane"
                    title="No pending invites"
                    description="Invite someone by username to bring collaborators into this group. New invites will appear here until they are accepted or canceled."
                    compact
                  />
                ) : null}
                {!groupInvitesLoading && groupPendingInvites.length > 0 ? (
                  <div className="share-existing-list">
                    {groupPendingInvites.map((invite) => (
                      <div key={invite.id} className="share-existing-item">
                        <IdentityBlock
                          {...getIdentityProps({
                            userId: invite.invitedUserId,
                            displayName: invite.invitedDisplayName,
                            username: invite.invitedUsername,
                            fallback: invite.invitedUserId || 'Invited member',
                          })}
                          meta={`${GROUP_ROLE_LABELS[invite.role] || invite.role} · ${formatInviteExpiry(invite.expiresAt)}`}
                          tone="invite"
                        />
                        <div className="share-existing-actions">
                          <button className="btn btn-secondary" type="button" onClick={() => onResendGroupInvite(invite)} disabled={!canAdminSelectedGroup || groupBusy}>
                            Resend
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => onCancelGroupInvite(invite)} disabled={!canAdminSelectedGroup || groupBusy}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </details>

            <details className="modal-section" open>
              <summary>Members</summary>
              <section className="share-existing" aria-label="Group members">
                {groupMembersLoading ? <p className="share-empty">Loading members...</p> : null}
                {!groupMembersLoading && groupMembers.length === 0 ? (
                  <EmptyStateCard
                    icon="fa-user-group"
                    title="No members yet"
                    description="Invite people into this group so they can browse, contribute, and help manage shared recipes."
                    compact
                  />
                ) : null}
                {!groupMembersLoading && groupMembers.length > 0 ? (
                  <div className="share-existing-list">
                    {groupMembers.map((member) => (
                      <div key={member.userId} className="share-existing-item">
                        <IdentityBlock
                          {...getIdentityProps({
                            userId: member.userId,
                            displayName: member.displayName,
                            username: member.username,
                            fallback: member.userId === authUser?.id ? 'You' : member.userId,
                          })}
                          meta={`${GROUP_ROLE_LABELS[member.role] || member.role}${member.userId === authUser?.id ? ' · You' : ''}`}
                          tone={member.userId === authUser?.id ? 'self' : 'member'}
                        />
                        <div className="share-existing-actions">
                          <select value={member.role} onChange={(event) => onUpdateGroupMemberRole(member, event.target.value)} disabled={!canAdminSelectedGroup || groupBusy || member.userId === authUser?.id}>
                            {GROUP_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {`${GROUP_ROLE_LABELS[role]} — ${GROUP_ROLE_DESCRIPTIONS[role]}`}
                              </option>
                            ))}
                          </select>
                          {!(member.userId === authUser?.id && groupMembers.length === 1) ? (
                            <button className="btn btn-danger" type="button" onClick={() => onRemoveUserFromSelectedGroup(member)} disabled={groupBusy || (!canAdminSelectedGroup && member.userId !== authUser?.id)}>
                              {member.userId === authUser?.id ? 'Leave' : 'Remove'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </details>

            <details className="modal-section" open>
              <summary>Recent Activity</summary>
              <section className="group-activity-list" aria-label="Recent group activity">
                {groupActivityLoading ? <p className="share-empty">Loading activity...</p> : null}
                {!groupActivityLoading && groupActivityViewModels.length === 0 ? (
                  <EmptyStateCard
                    icon="fa-clock-rotate-left"
                    title="No activity yet"
                    description="Invite members or add recipes to this group. Dish Depot will keep the recent activity feed here so everyone can follow along."
                    compact
                  />
                ) : null}
                {!groupActivityLoading && groupActivityViewModels.length > 0 ? (
                  <div className="group-activity-items">
                    {groupActivityViewModels.map(({ activity, activityPresentation, activityMeta, identity, relativeTime }) => (
                      <article key={activity.id} className="group-activity-item">
                        <div className="group-activity-identity">
                          <IdentityAvatar
                            displayName={identity.displayName}
                            username={identity.username}
                            avatarUrl={identity.avatarUrl}
                            fallback={identity.fallback}
                            tone="activity"
                          />
                          <span className="group-activity-type-badge" aria-hidden="true">
                            <i className={`fas ${activityPresentation.icon}`} />
                          </span>
                        </div>
                        <div className="group-activity-content">
                          <strong>{activityPresentation.title}</strong>
                          <small>{activityMeta}</small>
                        </div>
                        <time className="group-activity-time" dateTime={activity.occurredAt || undefined}>
                          {relativeTime}
                        </time>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            </details>

            {canAdminSelectedGroup ? (
              <details className="modal-section">
                <summary>Danger Zone</summary>
                <div className="share-form-actions group-danger-zone">
                  <button className="btn btn-danger" type="button" onClick={onDeleteSelectedGroup} disabled={groupBusy}>
                    <i className="fas fa-trash" />
                    Delete Group
                  </button>
                </div>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
