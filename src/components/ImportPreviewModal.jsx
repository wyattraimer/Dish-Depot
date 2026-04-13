import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function ImportPreviewModal({
  isOpen,
  onClose,
  importSummary,
  onSelectAll,
  onClearAll,
  importCandidates,
  onToggleCandidate,
  formatCategory,
  onRemoveCandidate,
  onConfirmImport,
  selectedImportCount,
}) {
  if (!isOpen) {
    return null
  }

  const candidateCount = importCandidates.length
  const customCount = importCandidates.filter(({ recipe }) => recipe.type === 'custom' || !recipe.url).length
  const linkedCount = candidateCount - customCount
  const reviewState =
    candidateCount === 0 ? 'idle' : selectedImportCount === 0 ? 'review' : selectedImportCount === candidateCount ? 'ready' : 'partial'
  const reviewTitle =
    reviewState === 'idle'
      ? 'No import candidates are staged yet'
      : reviewState === 'review'
        ? 'Choose at least one recipe to continue'
        : reviewState === 'partial'
          ? `${selectedImportCount} of ${candidateCount} candidate${candidateCount === 1 ? '' : 's'} selected`
          : 'Ready to bring these recipes into your library'
  const reviewDescription =
    reviewState === 'idle'
      ? 'Once Dish Depot parses a valid file, every recipe candidate will appear here for a final check.'
      : reviewState === 'review'
        ? 'Clear skips are fine, but you need at least one checked recipe before Dish Depot can continue.'
        : reviewState === 'partial'
          ? 'Use this review step to keep the recipes you want and leave the rest out without changing the original file.'
          : 'The selection looks settled. Confirm import when you are comfortable with the recipe names, sources, and categories below.'

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-preview-modal-title"
      aria-describedby="import-preview-modal-subtitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content import-preview-modal">
        <div className="modal-shell import-preview-shell">
          <ModalCloseButton onClick={onClose} label="Close import review" />
          <ModalHeader
            title="Review Import"
            subtitle="Review the parsed file before anything is added. You can keep, skip, or remove recipes here without changing the import behavior."
            note="This step only controls which recipes Dish Depot will add from the current file."
            titleId="import-preview-modal-title"
            subtitleId="import-preview-modal-subtitle"
            noteId="import-preview-modal-note"
          />

          <section className="transfer-preview-hero" aria-label="Import review overview">
            <div className="transfer-preview-hero-copy">
              <p className="transfer-preview-kicker">Import workflow</p>
              <div className="transfer-preview-heading-group">
                <h3>Confirm what belongs in your library before you commit the file.</h3>
                <p>
                  Start with the overview, scan each candidate, then finish with one clear import action. The file stays unchanged while
                  you make this selection.
                </p>
              </div>
              <div className="transfer-preview-meta">
                {importSummary ? <span className="transfer-preview-meta-pill">Recipes in file: {importSummary.totalInFile}</span> : null}
                <span className="transfer-preview-meta-pill">Ready for review: {candidateCount}</span>
                <span className="transfer-preview-meta-pill">Selected now: {selectedImportCount}</span>
                <span className="transfer-preview-meta-pill">Linked recipes: {linkedCount}</span>
                <span className="transfer-preview-meta-pill">Custom recipes: {customCount}</span>
                {importSummary?.duplicateCount ? (
                  <span className="transfer-preview-meta-pill">Duplicates skipped: {importSummary.duplicateCount}</span>
                ) : null}
                {importSummary?.invalidCount ? (
                  <span className="transfer-preview-meta-pill">Invalid skipped: {importSummary.invalidCount}</span>
                ) : null}
              </div>
            </div>

            <aside className={`transfer-preview-signal transfer-preview-signal-${reviewState}`}>
              <span className="transfer-preview-signal-label">Import status</span>
              <strong>{reviewTitle}</strong>
              <p>{reviewDescription}</p>
              <div className="transfer-preview-signal-meta">
                <span>{candidateCount} candidate{candidateCount === 1 ? '' : 's'}</span>
                <span>{selectedImportCount} selected</span>
              </div>
            </aside>
          </section>

          <section className="transfer-preview-toolbar" aria-label="Import review controls">
            <div className="transfer-preview-toolbar-copy">
              <p className="transfer-preview-toolbar-kicker">Selection controls</p>
              <h3>Adjust the list before anything is imported</h3>
              <p>Use quick actions to select the whole review set or clear it, then remove anything you do not want to keep in this pass.</p>
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

          <section className="transfer-preview-review-card" aria-label="Import candidates">
            <div className="transfer-preview-review-header">
              <div className="transfer-preview-review-copy">
                <p className="transfer-preview-toolbar-kicker">Candidate review</p>
                <h3>Check names, source details, and categories</h3>
                <p>Each card keeps the recipe identity, selection state, and remove action together so it is easy to see what happens next.</p>
              </div>
              <span className="transfer-preview-review-count">{candidateCount} candidate{candidateCount === 1 ? '' : 's'}</span>
            </div>

            <div className="import-preview-list">
            {importCandidates.length === 0 ? (
              <EmptyStateCard
                icon="fa-file-import"
                title="No recipes ready to import"
                description="When a valid file is parsed, Dish Depot will show each candidate here so you can review it before importing."
                compact
              />
            ) : null}

            {importCandidates.map((candidate) => {
              const { recipe, previewId, selected } = candidate
              const categories = recipe.categories || []
              const recipeType = recipe.type === 'custom' || !recipe.url ? 'Custom recipe' : 'URL recipe'

              return (
                <article key={previewId} className={`import-preview-item${selected ? ' import-preview-item-selected' : ''}`}>
                  <div className="transfer-preview-item-top">
                    <label className="import-preview-check">
                      <input type="checkbox" checked={selected} onChange={() => onToggleCandidate(previewId)} />
                      <span>{selected ? 'Selected for import' : 'Not selected'}</span>
                    </label>
                    <span className={`transfer-preview-state-pill transfer-preview-state-pill-${selected ? 'selected' : 'muted'}`}>
                      {selected ? 'Will import' : 'Skipped'}
                    </span>
                  </div>
                  <div className="import-preview-content">
                    <h3>{recipe.name}</h3>
                    <p>{selected ? `${recipeType} ready for this import pass.` : `${recipeType} left out for now.`}</p>
                    {recipe.url ? <a href={recipe.url}>Source: {recipe.url}</a> : <p className="transfer-preview-source-note">No source link in the file. Dish Depot will import the saved recipe body as provided.</p>}
                    {categories.length > 0 ? (
                      <div className="import-preview-categories">
                        {categories.map((category) => (
                          <span key={`${previewId}-${category}`}>{formatCategory(category)}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="transfer-preview-item-actions">
                    <button className="btn btn-danger btn-small" type="button" onClick={() => onRemoveCandidate(previewId)}>
                      Remove
                    </button>
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
                {selectedImportCount > 0
                  ? `Import ${selectedImportCount} selected recipe${selectedImportCount === 1 ? '' : 's'} when the review looks right.`
                  : 'Choose at least one recipe to continue with import.'}
              </p>
            </div>
            <div className="transfer-preview-footer-actions">
              <button className="btn btn-secondary" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={onConfirmImport}>
                Import Selected ({selectedImportCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
