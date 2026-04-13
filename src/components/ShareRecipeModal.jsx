import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function ShareRecipeModal({
  isOpen,
  onClose,
  shareTargetRecipe,
  searchShareCandidates,
  shareLookupText,
  onChangeShareLookupText,
  shareBusy,
  shareCanEdit,
  onChangeShareCanEdit,
  shareResults,
  IdentityBlock,
  onShareRecipeWithUser,
  shareRecipientsLoading,
  shareRecipients,
  onUpdateSharePermission,
  onRevokeShare,
}) {
  if (!isOpen || !shareTargetRecipe) {
    return null
  }

  const shareAccessSummary = shareCanEdit ? 'Recipient can view and edit' : 'Recipient can only view'

  return (
    <div
      className="modal show share-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-recipe-modal-title"
      aria-describedby="share-recipe-modal-subtitle share-recipe-modal-note"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content share-modal">
        <div className="modal-shell share-modal-shell">
          <ModalCloseButton onClick={onClose} label="Close share recipe" />
          <ModalHeader
            title="Share Recipe"
            subtitle={
              <>
                Share <strong>{shareTargetRecipe.name}</strong> with another Dish Depot user.
              </>
            }
            note="Search by username, choose whether the share is view-only or editable, and review existing recipients without changing the collaboration flow."
            titleId="share-recipe-modal-title"
            subtitleId="share-recipe-modal-subtitle"
            noteId="share-recipe-modal-note"
          />

          <section className="collab-overview-card" aria-label="Recipe sharing overview">
            <div className="collab-overview-copy">
              <p className="collab-overview-kicker">Sharing context</p>
              <h3>{shareTargetRecipe.name}</h3>
              <p>Keep sharing decisions clear by confirming the recipe, the access level you are about to grant, and who already has access.</p>
            </div>
            <div className="collab-overview-metrics">
              <span className="collab-overview-pill">{shareRecipientsLoading ? 'Loading recipients' : `${shareRecipients.length} recipient${shareRecipients.length === 1 ? '' : 's'}`}</span>
              <span className={`collab-overview-pill${shareCanEdit ? ' collab-overview-pill-strong' : ''}`}>{shareAccessSummary}</span>
            </div>
          </section>

          <details className="modal-section" open>
            <summary>Find Recipient</summary>
            <div className="collab-section-intro">
              <div className="collab-section-copy">
                <p className="collab-section-kicker">Search</p>
                <h3>Find the right Dish Depot account</h3>
                <p>Look up an existing username, then share with the permission level that matches how hands-on the recipient should be.</p>
              </div>
              <p className="collab-trust-note">
                <i className="fas fa-user-check" aria-hidden="true" />
                Shares only work with existing accounts.
              </p>
            </div>
            <form className="share-form" onSubmit={searchShareCandidates}>
              <div className="form-group">
                <label htmlFor="shareRecipientLookup">Recipient Username</label>
                <p className="share-helper-note">Search by the recipient&apos;s Dish Depot username so the share lands on the correct account.</p>
                <div className="share-lookup-row">
                  <input
                    id="shareRecipientLookup"
                    type="text"
                    required
                    value={shareLookupText}
                    onChange={(event) => onChangeShareLookupText(event.target.value.toLowerCase())}
                    placeholder="chefmaria"
                    autoComplete="off"
                  />
                  <button className="btn btn-secondary" type="submit" disabled={shareBusy}>
                    {shareBusy ? 'Searching...' : 'Find User'}
                  </button>
                </div>
              </div>

              <div className="collab-permission-card">
                <div className="collab-permission-copy">
                  <p className="collab-section-kicker">Access</p>
                  <strong>{shareCanEdit ? 'Editing is allowed for the next share' : 'The next share is view-only'}</strong>
                  <p>
                    {shareCanEdit
                      ? 'The recipient can update ingredients, notes, and other recipe details after you share it.'
                      : 'The recipient can open and use the recipe, but only you keep editing control.'}
                  </p>
                </div>
                <label className="share-edit-toggle">
                  <input type="checkbox" checked={shareCanEdit} onChange={(event) => onChangeShareCanEdit(event.target.checked)} />
                  Allow recipient to edit this recipe
                </label>
              </div>

              {shareResults.length > 0 ? (
                <section className="share-results" aria-label="Share search results">
                  {shareResults.map((result) => (
                    <div key={result.id} className="share-result-item">
                      <div className="share-existing-item-shell">
                        <IdentityBlock
                          displayName={result.displayName}
                          username={result.username}
                          avatarUrl={result.avatarUrl}
                          fallback="Dish Depot user"
                          meta="Dish Depot account"
                          tone="search"
                        />
                        <div className="share-existing-meta-block">
                          <div className="collab-badge-row">
                            <span className={`collab-access-badge${shareCanEdit ? ' collab-access-badge-success' : ''}`}>{shareCanEdit ? 'Edit access' : 'View only'}</span>
                            <span className="collab-access-badge collab-access-badge-muted">Ready to share</span>
                          </div>
                          <small>The access level above is what this share will grant.</small>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-small" type="button" onClick={() => onShareRecipeWithUser(result)} disabled={shareBusy}>
                        Share Recipe
                      </button>
                    </div>
                  ))}
                </section>
              ) : null}
            </form>
          </details>

          <details className="modal-section" open>
            <summary>Currently Shared With</summary>
            <div className="collab-section-intro">
              <div className="collab-section-copy">
                <p className="collab-section-kicker">Recipients</p>
                <h3>Review who already has access</h3>
                <p>Current recipients keep identity, permission, and management actions grouped together so permission changes feel deliberate rather than risky.</p>
              </div>
              <p className="collab-trust-note">
                <i className="fas fa-share-nodes" aria-hidden="true" />
                Permission updates stay visible here.
              </p>
            </div>
            <section className="share-existing" aria-label="Current shares">
              {shareRecipientsLoading ? <p className="share-empty">Loading shares...</p> : null}

              {!shareRecipientsLoading && shareRecipients.length === 0 ? (
                <EmptyStateCard
                  icon="fa-user-plus"
                  title="No recipients yet"
                  description="Search for a Dish Depot username above to share this recipe. You can make it view-only or allow editing."
                  compact
                />
              ) : null}

              {!shareRecipientsLoading && shareRecipients.length > 0 ? (
                <div className="share-existing-list">
                  {shareRecipients.map((recipient) => (
                    <div key={recipient.userId} className="share-existing-item">
                      <div className="share-existing-item-shell">
                        <IdentityBlock
                          displayName={recipient.displayName}
                          username={recipient.username}
                          avatarUrl={recipient.avatarUrl}
                          fallback={recipient.userId || 'Shared user'}
                          meta="Current recipient"
                          tone={recipient.canEdit ? 'editable' : 'default'}
                        />
                        <div className="share-existing-meta-block">
                          <div className="collab-badge-row">
                            <span className={`collab-access-badge${recipient.canEdit ? ' collab-access-badge-success' : ''}`}>
                              {recipient.canEdit ? 'Can edit' : 'View only'}
                            </span>
                            <span className="collab-access-badge collab-access-badge-muted">Recipe access</span>
                          </div>
                          <small>{recipient.canEdit ? 'They can update this recipe as well as use it.' : 'They can open and use the recipe, but editing stays with you.'}</small>
                        </div>
                      </div>

                      <div className="share-existing-actions">
                        <button className="btn btn-secondary btn-small" type="button" onClick={() => onUpdateSharePermission(recipient, !recipient.canEdit)} disabled={shareBusy}>
                          {recipient.canEdit ? 'Switch to View Only' : 'Allow Editing'}
                        </button>
                        <button className="btn btn-danger btn-small" type="button" onClick={() => onRevokeShare(recipient)} disabled={shareBusy}>
                          Remove Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </details>

          <div className="share-form-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
