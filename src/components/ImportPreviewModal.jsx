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
            subtitle="Select which recipes to import. You can uncheck or remove any recipe before importing."
            titleId="import-preview-modal-title"
            subtitleId="import-preview-modal-subtitle"
          />

          {importSummary ? (
            <div className="import-summary">
              <span className="import-summary-chip">File: {importSummary.totalInFile}</span>
              <span className="import-summary-chip">Valid: {importSummary.validCount}</span>
              <span className="import-summary-chip">Duplicates skipped: {importSummary.duplicateCount}</span>
              <span className="import-summary-chip">Invalid skipped: {importSummary.invalidCount}</span>
            </div>
          ) : null}

          <div className="import-preview-actions">
            <button className="btn btn-secondary btn-small" type="button" onClick={onSelectAll}>
              Select All
            </button>
            <button className="btn btn-secondary btn-small" type="button" onClick={onClearAll}>
              Clear All
            </button>
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
                <article key={previewId} className="import-preview-item">
                  <label className="import-preview-check">
                    <input type="checkbox" checked={selected} onChange={() => onToggleCandidate(previewId)} />
                    <span>Include</span>
                  </label>
                  <div className="import-preview-content">
                    <h3>{recipe.name}</h3>
                    <p>{recipeType}</p>
                    {recipe.url ? <a href={recipe.url}>{recipe.url}</a> : null}
                    {categories.length > 0 ? (
                      <div className="import-preview-categories">
                        {categories.map((category) => (
                          <span key={`${previewId}-${category}`}>{formatCategory(category)}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button className="btn btn-danger btn-small" type="button" onClick={() => onRemoveCandidate(previewId)}>
                    Remove
                  </button>
                </article>
              )
            })}
          </div>

          <div className="import-preview-footer">
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
  )
}
