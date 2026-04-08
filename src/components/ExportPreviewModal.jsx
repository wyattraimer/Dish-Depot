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

  return (
    <div className="modal show" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content export-preview-modal" onClick={(event) => event.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Review Export</h2>
        <p className="import-preview-subtitle">Select which recipes to export. All recipes are selected by default.</p>

        <div className="import-preview-actions">
          <button className="btn btn-secondary btn-small" type="button" onClick={onSelectAll}>
            Select All
          </button>
          <button className="btn btn-secondary btn-small" type="button" onClick={onClearAll}>
            Clear All
          </button>
        </div>

        <div className="export-preview-list">
          {exportCandidates.map((candidate) => {
            const { recipe, previewId, selected } = candidate
            const categories = recipe.categories || []

            return (
              <article key={previewId} className="export-preview-item">
                <label className="import-preview-check">
                  <input type="checkbox" checked={selected} onChange={() => onToggleCandidate(previewId)} />
                  <span>Include</span>
                </label>
                <div className="export-preview-content">
                  <h3>
                    {recipe.pinned ? <i className="fas fa-star" aria-hidden="true" /> : null}
                    {recipe.name}
                  </h3>
                  {recipe.url ? <a href={recipe.url}>{recipe.url}</a> : <p>Custom recipe</p>}
                  {categories.length > 0 ? (
                    <div className="import-preview-categories">
                      {categories.map((category, categoryIndex) => (
                        <span key={`${previewId}-${category}-${categoryIndex}`}>{formatCategory(category)}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        <div className="import-preview-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-print" type="button" onClick={onConfirmPrint}>
            Print / Save PDF ({selectedExportCount})
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirmExport}>
            Export Selected ({selectedExportCount})
          </button>
        </div>
      </div>
    </div>
  )
}
