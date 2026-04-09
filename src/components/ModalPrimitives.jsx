export function ModalCloseButton({ onClick, label = 'Close dialog' }) {
  return (
    <button type="button" className="modal-close-button" onClick={onClick} aria-label={label}>
      <i className="fas fa-xmark" aria-hidden="true" />
    </button>
  )
}

export function ModalHeader({ title, subtitle, note, titleId, subtitleId, noteId }) {
  return (
    <div className="modal-header-block">
      <div className="modal-header-copy">
        <h2 id={titleId}>{title}</h2>
        {subtitle ? (
          <p id={subtitleId} className="modal-subtitle">
            {subtitle}
          </p>
        ) : null}
      </div>
      {note ? (
        <p id={noteId} className="modal-helper-note">
          {note}
        </p>
      ) : null}
    </div>
  )
}

export function EmptyStateCard({ icon, title, description, compact = false, actions = null }) {
  return (
    <div className={`empty-state-card${compact ? ' empty-state-card-compact' : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </div>
  )
}
