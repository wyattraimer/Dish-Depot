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

function LocalIdentityBlock({
  displayName = '',
  username = '',
  fallback = 'Dish Depot user',
  meta = '',
  tone = 'default',
  avatarUrl = '',
  compact = false,
}) {
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
    <div className={`identity-block${compact ? ' identity-block-compact' : ''}`}>
      <LocalIdentityAvatar displayName={displayName} username={username} fallback={fallback} tone={tone} avatarUrl={avatarUrl} />
      <div className="identity-copy">
        <strong>{primary}</strong>
        {secondaryParts.length > 0 ? <small>{secondaryParts.join(' · ')}</small> : null}
      </div>
    </div>
  )
}

export default function GroupManagementModal({
  isOpen,
  onClose,
  IdentityAvatar,
  IdentityBlock,
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
  onDeleteSelectedGroup,
}) {
  if (!isOpen) {
    return null
  }

  const IdentityAvatarComponent = IdentityAvatar || LocalIdentityAvatar
  const IdentityBlockComponent = IdentityBlock || LocalIdentityBlock
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || null
  const selectedGroupName = selectedGroup?.name || 'this group'

  function formatActivityTypeLabel(type = 'activity') {
    return type
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
  }

  return (
    <div
      className="modal show share-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-management-modal-title"
      aria-describedby="group-management-modal-subtitle group-management-modal-note"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content share-modal">
        <div className="modal-shell share-modal-shell">
          <ModalCloseButton onClick={onClose} label="Close groups" />
          <ModalHeader
            title="Groups"
            subtitle="Create a collaboration space, invite people with clear roles, and keep shared recipe activity easy to scan."
            note="Actions stay permission-aware so members can see what they can review, while admins keep invite and role controls in one calm workspace."
            titleId="group-management-modal-title"
            subtitleId="group-management-modal-subtitle"
            noteId="group-management-modal-note"
          />

          <section className="collab-overview-card" aria-label="Group collaboration overview">
            <div className="collab-overview-copy">
              <p className="collab-overview-kicker">Collaboration workspace</p>
              <h3>{selectedGroup ? selectedGroup.name : 'Start a private recipe group'}</h3>
              <p>
                {selectedGroup
                  ? canAdminSelectedGroup
                    ? 'Invite members, tune access, and keep recent group changes visible without leaving this modal.'
                    : 'Review who is involved, what access they have, and what changed recently. Admin-only actions stay clearly labeled.'
                  : 'Create a group for family, roommates, or event planning, then invite people by username when you are ready.'}
              </p>
            </div>
            <div className="collab-overview-metrics">
              <span className="collab-overview-pill">{groups.length === 1 ? '1 group' : `${groups.length} groups`}</span>
              <span className={`collab-overview-pill${selectedGroup && canAdminSelectedGroup ? ' collab-overview-pill-strong' : ''}`}>
                {selectedGroup ? (canAdminSelectedGroup ? 'Admin tools available' : 'Member view active') : 'Invite-only access'}
              </span>
              {isUuidLike(selectedGroupId) ? (
                <span className="collab-overview-pill">
                  {groupMembersLoading ? 'Loading members' : `${groupMembers.length} member${groupMembers.length === 1 ? '' : 's'}`}
                </span>
              ) : null}
            </div>
          </section>

          <details className="modal-section" open>
            <summary>Create Group</summary>
            <div className="collab-section-intro">
              <div className="collab-section-copy">
                <p className="collab-section-kicker">Setup</p>
                <h3>Create a shared space</h3>
                <p>Name the group first. Member invites, role choices, and activity history stay organized underneath once the group exists.</p>
              </div>
              <p className="collab-trust-note">
                <i className="fas fa-shield-heart" aria-hidden="true" />
                Only invited people can join later.
              </p>
            </div>
            <form className="share-form" onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupNameInput">Group Name</label>
                <p className="share-helper-note">Choose a recognizable name so invitees immediately know which household, trip, or event they are joining.</p>
                <div className="share-lookup-row">
                  <input
                    id="groupNameInput"
                    type="text"
                    value={groupNameDraft}
                    onChange={(event) => onChangeGroupNameDraft(event.target.value)}
                    placeholder="The Johnson Family"
                  />
                  <button className="btn btn-primary" type="submit" disabled={groupBusy}>
                    {groupBusy ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            </form>
          </details>

          {groups.length > 0 ? (
            <details className="modal-section" open>
              <summary>Selected Group</summary>
              <div className="collab-section-intro">
                <div className="collab-section-copy">
                  <p className="collab-section-kicker">Context</p>
                  <h3>Choose the group you are reviewing</h3>
                  <p>Switch between groups without losing your place. The invite, member, and activity sections below update for the active group.</p>
                </div>
                <p className="collab-trust-note">
                  <i className="fas fa-users-viewfinder" aria-hidden="true" />
                  Collaboration context follows the selected group.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="groupSelectInModal">Choose Group</label>
                <p className="share-helper-note">Current selection: {selectedGroupName}. Use this to review another group without changing any permissions.</p>
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
                <div className="collab-section-intro">
                  <div className="collab-section-copy">
                    <p className="collab-section-kicker">People</p>
                    <h3>Invite collaborators by username</h3>
                    <p>Search for an existing Dish Depot account, choose the access level, and send an invitation tied to {selectedGroupName}.</p>
                  </div>
                  <p className="collab-trust-note">
                    <i className="fas fa-user-shield" aria-hidden="true" />
                    {canAdminSelectedGroup ? 'Invites stay pending until accepted.' : 'Only admins can send new invites.'}
                  </p>
                </div>
                <form className="share-form" onSubmit={searchGroupInviteCandidates}>
                  <div className="form-group">
                    <label htmlFor="groupInviteLookup">Send Invite by Username</label>
                    <p className="share-helper-note">Invited users will be able to accept or decline before joining, and the chosen role applies only after they accept.</p>
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
                       <select
                         value={groupInviteRole}
                         onChange={(event) => onChangeGroupInviteRole(event.target.value)}
                         disabled={!canAdminSelectedGroup}
                         aria-label={`Invite role for ${selectedGroupName}`}
                       >
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
                  <section className="share-results" aria-label="Group invite results">
                    {groupInviteResults.map((result) => (
                      <div key={result.id} className="share-result-item">
                        <div className="share-existing-item-shell">
                          <IdentityBlockComponent
                            displayName={result.displayName}
                            username={result.username}
                            avatarUrl={result.avatarUrl}
                            fallback={result.id || 'Dish Depot user'}
                            meta="Dish Depot account"
                            tone="search"
                          />
                          <div className="share-existing-meta-block">
                            <div className="collab-badge-row">
                              <span className="collab-access-badge collab-access-badge-warm">Invite as {GROUP_ROLE_LABELS[groupInviteRole] || groupInviteRole}</span>
                              <span className="collab-access-badge collab-access-badge-muted">Acceptance required</span>
                            </div>
                            <small>They will review the invite before joining {selectedGroupName}.</small>
                          </div>
                        </div>
                        <button className="btn btn-primary btn-small" type="button" onClick={() => onAddUserToSelectedGroup(result)} disabled={!canAdminSelectedGroup || groupBusy}>
                          Send Invite
                        </button>
                      </div>
                    ))}
                  </section>
                ) : null}
              </details>

              <details className="modal-section" open>
                <summary>Pending Invites</summary>
                <div className="collab-section-intro">
                  <div className="collab-section-copy">
                    <p className="collab-section-kicker">Follow-up</p>
                    <h3>Track who has not responded yet</h3>
                    <p>Pending invitations stay visible with role context, so it is easy to resend or cancel the right one without second-guessing.</p>
                  </div>
                  <p className="collab-trust-note">
                    <i className="fas fa-paper-plane" aria-hidden="true" />
                    Invite status and expiry stay visible here.
                  </p>
                </div>
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
                          <div className="share-existing-item-shell">
                          <IdentityBlockComponent
                              {...getIdentityProps({
                                userId: invite.invitedUserId,
                                displayName: invite.invitedDisplayName,
                                username: invite.invitedUsername,
                                fallback: invite.invitedUserId || 'Invited member',
                              })}
                              meta="Waiting for response"
                              tone="invite"
                            />
                            <div className="share-existing-meta-block">
                              <div className="collab-badge-row">
                                <span className="collab-access-badge collab-access-badge-warning">{GROUP_ROLE_LABELS[invite.role] || invite.role} access</span>
                                <span className="collab-access-badge collab-access-badge-muted">Pending</span>
                              </div>
                              <small>{formatInviteExpiry(invite.expiresAt)}</small>
                            </div>
                          </div>
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
                <div className="collab-section-intro">
                  <div className="collab-section-copy">
                    <p className="collab-section-kicker">Roles</p>
                    <h3>Review members and access levels</h3>
                    <p>Identity, role, and role meaning stay together so member management feels clear even when a group gets busy.</p>
                  </div>
                  <p className="collab-trust-note">
                    <i className="fas fa-id-card" aria-hidden="true" />
                    Your own access is always labeled.
                  </p>
                </div>
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
                          <div className="share-existing-item-shell">
                            <IdentityBlockComponent
                              {...getIdentityProps({
                                userId: member.userId,
                                displayName: member.displayName,
                                username: member.username,
                                fallback: member.userId === authUser?.id ? 'You' : member.userId,
                              })}
                              meta={member.userId === authUser?.id ? 'You' : 'Active member'}
                              tone={member.userId === authUser?.id ? 'self' : 'member'}
                            />
                            <div className="share-existing-meta-block">
                              <div className="collab-badge-row">
                                <span className={`collab-access-badge${member.userId === authUser?.id ? ' collab-access-badge-success' : ''}`}>
                                  {GROUP_ROLE_LABELS[member.role] || member.role}
                                </span>
                                {member.userId === authUser?.id ? <span className="collab-access-badge collab-access-badge-muted">Your account</span> : null}
                              </div>
                              <small>{GROUP_ROLE_DESCRIPTIONS[member.role] || 'Active collaborator'}</small>
                            </div>
                          </div>
                          <div className="share-existing-actions">
                            <select
                              value={member.role}
                              onChange={(event) => onUpdateGroupMemberRole(member, event.target.value)}
                              disabled={!canAdminSelectedGroup || groupBusy || member.userId === authUser?.id}
                              aria-label={`Role for ${member.displayName || member.username || member.userId || 'group member'}`}
                            >
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
                <div className="collab-section-intro">
                  <div className="collab-section-copy">
                    <p className="collab-section-kicker">Recent changes</p>
                    <h3>Keep the feed quick to read</h3>
                    <p>Each activity card highlights who acted, what happened, and when it happened so members can scan updates at a glance.</p>
                  </div>
                  <p className="collab-trust-note">
                    <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                    Newest events stay visible first.
                  </p>
                </div>
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
                            <IdentityAvatarComponent
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
                            <div className="group-activity-heading">
                              <strong>{activityPresentation.title}</strong>
                              <span className="collab-access-badge collab-access-badge-muted">{formatActivityTypeLabel(activity.type)}</span>
                            </div>
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
                <details className="modal-section modal-section-danger">
                  <summary>Danger Zone</summary>
                  <div className="collab-section-intro">
                    <div className="collab-section-copy">
                      <p className="collab-section-kicker">Admin only</p>
                      <h3>Delete this group carefully</h3>
                      <p>This is the only destructive action in the collaboration workspace. Keep it visually separate from everyday invite and member actions.</p>
                    </div>
                    <p className="collab-trust-note collab-trust-note-danger">
                      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                      This cannot be undone.
                    </p>
                  </div>
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
    </div>
  )
}
