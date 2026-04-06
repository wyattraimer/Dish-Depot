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

  return (
    <div className="modal show share-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(event) => event.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Share Recipe</h2>
        <p className="share-modal-subtitle">
          Share <strong>{shareTargetRecipe.name}</strong> with another Dish Depot user.
        </p>
        <p className="share-helper-note">Search by username. Recipient must already have an account.</p>

        <details className="modal-section" open>
          <summary>Find Recipient</summary>
          <form className="share-form" onSubmit={searchShareCandidates}>
            <div className="form-group">
              <label htmlFor="shareRecipientLookup">Recipient Username</label>
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

            <label className="share-edit-toggle">
              <input type="checkbox" checked={shareCanEdit} onChange={(event) => onChangeShareCanEdit(event.target.checked)} />
              Allow recipient to edit this recipe
            </label>

            {shareResults.length > 0 ? (
              <div className="share-results" aria-label="Share search results">
                {shareResults.map((result) => (
                  <div key={result.id} className="share-result-item">
                    <IdentityBlock
                      displayName={result.displayName}
                      username={result.username}
                      avatarUrl={result.avatarUrl}
                      fallback="Dish Depot user"
                      meta="Ready to share"
                      tone="search"
                    />
                    <button className="btn btn-primary btn-small" type="button" onClick={() => onShareRecipeWithUser(result)} disabled={shareBusy}>
                      Share
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </form>
        </details>

        <details className="modal-section" open>
          <summary>Currently Shared With</summary>
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
                    <IdentityBlock
                      displayName={recipient.displayName}
                      username={recipient.username}
                      avatarUrl={recipient.avatarUrl}
                      fallback={recipient.userId || 'Shared user'}
                      meta={recipient.canEdit ? 'Can edit this recipe' : 'View only'}
                      tone={recipient.canEdit ? 'editable' : 'default'}
                    />

                    <div className="share-existing-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => onUpdateSharePermission(recipient, !recipient.canEdit)} disabled={shareBusy}>
                        {recipient.canEdit ? 'Set View Only' : 'Allow Edit'}
                      </button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => onRevokeShare(recipient)} disabled={shareBusy}>
                        Remove
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
  )
}
