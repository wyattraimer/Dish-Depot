import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function ExportPreviewModal({
  isOpen,
  onClose,
  onSelectAll,
  onClearAll,
  exportCandidates,
  onToggleCandidate,
  formatCategory,
  onConfirmPrint,
  onConfirmExport,
  selectedExportCount,
}) {
  if (!isOpen) {
    return null
  }

  const candidateCount = exportCandidates.length
  const pinnedCount = exportCandidates.filter(({ recipe }) => recipe.pinned).length
  const customCount = exportCandidates.filter(({ recipe }) => !recipe.url).length
  const linkedCount = candidateCount - customCount
  const reviewState =
    candidateCount === 0 ? 'idle' : selectedExportCount === 0 ? 'review' : selectedExportCount === candidateCount ? 'ready' : 'partial'
  const reviewTitle =
    reviewState === 'idle'
      ? 'No recipes are staged for export yet'
      : reviewState === 'review'
        ? 'Choose at least one recipe to print or export'
        : reviewState === 'partial'
          ? `${selectedExportCount} of ${candidateCount} recipes selected`
          : 'Ready to print or export this selection'
  const reviewDescription =
    reviewState === 'idle'
      ? 'Open export again after choosing recipes in Dish Depot and the review list will appear here.'
      : reviewState === 'review'
        ? 'Clear skips are fine, but Dish Depot needs at least one checked recipe before it can print or export the set.'
        : reviewState === 'partial'
          ? 'This review keeps the final export focused without changing the recipes saved in your library.'
          : 'The selection looks settled. You can print a shareable review or export the checked recipes as JSON.'

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-preview-modal-title"
      aria-describedby="export-preview-modal-subtitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content export-preview-modal">
        <div className="modal-shell export-preview-shell">
          <ModalCloseButton onClick={onClose} label="Close export review" />
          <ModalHeader
            title="Review Export"
            subtitle="Review the outgoing set before you print or export it. All recipes start selected, and you can trim the list here without changing your library."
            note="This review step only changes the current export set, not the recipes stored in Dish Depot."
            titleId="export-preview-modal-title"
            subtitleId="export-preview-modal-subtitle"
            noteId="export-preview-modal-note"
          />

          <section className="transfer-preview-hero" aria-label="Export review overview">
            <div className="transfer-preview-hero-copy">
              <p className="transfer-preview-kicker">Export workflow</p>
              <div className="transfer-preview-heading-group">
                <h3>Finish the outgoing set before you print, save, or share it.</h3>
                <p>
                  Review the recipes first, confirm the ones that belong in this export, then use the final action row for the output you want.
                </p>
              </div>
              <div className="transfer-preview-meta">
                <span className="transfer-preview-meta-pill">Available recipes: {candidateCount}</span>
                <span className="transfer-preview-meta-pill">Selected now: {selectedExportCount}</span>
                <span className="transfer-preview-meta-pill">Pinned favorites: {pinnedCount}</span>
                <span className="transfer-preview-meta-pill">Linked recipes: {linkedCount}</span>
                <span className="transfer-preview-meta-pill">Custom recipes: {customCount}</span>
              </div>
            </div>

            <aside className={`transfer-preview-signal transfer-preview-signal-${reviewState}`}>
              <span className="transfer-preview-signal-label">Export status</span>
              <strong>{reviewTitle}</strong>
              <p>{reviewDescription}</p>
              <div className="transfer-preview-signal-meta">
                <span>{candidateCount} available</span>
                <span>{selectedExportCount} selected</span>
              </div>
            </aside>
          </section>

          <section className="transfer-preview-toolbar" aria-label="Export review controls">
            <div className="transfer-preview-toolbar-copy">
              <p className="transfer-preview-toolbar-kicker">Selection controls</p>
              <h3>Trim the export set before you send it out</h3>
              <p>Use the quick actions to keep everything in view, then refine the final set recipe by recipe below.</p>
            </div>
            <div className="import-preview-actions">
              <button className="btn btn-secondary btn-small" type="button" onClick={onSelectAll}>
                Select All
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={onClearAll}>
                Clear All
              </button>
            </div>
          </section>

          <section className="transfer-preview-review-card" aria-label="Export candidates">
            <div className="transfer-preview-review-header">
              <div className="transfer-preview-review-copy">
                <p className="transfer-preview-toolbar-kicker">Candidate review</p>
                <h3>Check names, source details, and pinned favorites</h3>
                <p>Each recipe card keeps the export selection and recipe details together so the outgoing set feels deliberate instead of temporary.</p>
              </div>
              <span className="transfer-preview-review-count">{candidateCount} recipe{candidateCount === 1 ? '' : 's'}</span>
            </div>

            <div className="export-preview-list">
            {exportCandidates.length === 0 ? (
              <EmptyStateCard
                icon="fa-file-export"
                title="No recipes ready to export"
                description="Choose recipes in Dish Depot first, then reopen export review to print or export a selection."
                compact
              />
            ) : null}

            {exportCandidates.map((candidate) => {
              const { recipe, previewId, selected } = candidate
              const categories = recipe.categories || []

              return (
                <article key={previewId} className={`export-preview-item${selected ? ' export-preview-item-selected' : ''}`}>
                  <div className="transfer-preview-item-top">
                    <label className="import-preview-check">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleCandidate(previewId)}
                        aria-label={`Include ${recipe.name} in this export`}
                      />
                      <span>{selected ? 'Selected for export' : 'Not selected'}</span>
                    </label>
                    <span className={`transfer-preview-state-pill transfer-preview-state-pill-${selected ? 'selected' : 'muted'}`}>
                      {selected ? 'Included' : 'Skipped'}
                    </span>
                  </div>
                  <div className="export-preview-content">
                    <h3>
                      {recipe.pinned ? <i className="fas fa-star" aria-hidden="true" /> : null}
                      {recipe.name}
                    </h3>
                    <p>
                      {recipe.pinned ? 'Pinned favorite' : 'Saved recipe'}
                      {' · '}
                      {recipe.url ? 'Includes source link' : 'Custom recipe'}
                    </p>
                    {recipe.url ? <a href={recipe.url}>Source: {recipe.url}</a> : <p className="transfer-preview-source-note">No source link saved. Dish Depot will export the recipe details exactly as stored.</p>}
                    {categories.length > 0 ? (
                      <div className="import-preview-categories">
                        {categories.map((category) => (
                          <span key={`${previewId}-${category}`}>{formatCategory(category)}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
            </div>
          </section>

          <div className="import-preview-footer">
            <div className="transfer-preview-footer-copy">
              <span className="transfer-preview-signal-label">Next step</span>
              <p>
                {selectedExportCount > 0
                  ? `Print ${selectedExportCount} recipe${selectedExportCount === 1 ? '' : 's'} for a readable handoff, or export them as a portable JSON file.`
                  : 'Choose at least one recipe before printing or exporting this review set.'}
              </p>
            </div>
            <div className="transfer-preview-footer-actions">
              <button className="btn btn-secondary" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-secondary" type="button" onClick={onConfirmPrint}>
                Print / Save PDF ({selectedExportCount})
              </button>
              <button className="btn btn-primary" type="button" onClick={onConfirmExport}>
                Export Selected ({selectedExportCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
