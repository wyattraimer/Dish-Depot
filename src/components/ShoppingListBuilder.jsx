import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function ShoppingListBuilder({
  isOpen,
  onClose,
  selectedShoppingCount,
  combinedShoppingItems,
  pantryItemCount,
  hasSavedShoppingDraft,
  shoppingHistory,
  onSaveDraft,
  onSaveListToHistory,
  onClearSavedDraft,
  onSelectAllCandidates,
  onClearRecipes,
  onClearChecklist,
  onClearPantry,
  onExportList,
  shoppingUnitSystem,
  onSetShoppingUnitSystem,
  hidePantryItems,
  onToggleHidePantry,
  shoppingSectionOrder,
  onMoveShoppingSection,
  onResetShoppingSectionOrder,
  onRestoreHistoryEntry,
  onDeleteHistoryEntry,
  pantryEntries,
  onTogglePantryItem,
  shoppingCandidates,
  onToggleShoppingCandidate,
  visibleCombinedShoppingItems,
  visibleGroupedCombinedShoppingItems,
  shoppingChecklist,
  shoppingPantry,
  onToggleShoppingItemChecked,
  nearDuplicateShoppingGroups,
  onApplySuggestedShoppingMerge,
  filteredVisibleUnresolvedItems,
  filteredGroupedVisibleUnresolvedItems,
  shoppingManualText,
  onChangeShoppingManualText,
  onCreateManualMergeGroup,
  shoppingMergeSelection,
  onToggleShoppingMergeSelection,
  visibleManualShoppingGroups,
  visibleGroupedManualShoppingItems,
  shoppingManualEditingKey,
  shoppingManualEditDraft,
  onChangeShoppingManualEditDraft,
  onToggleManualGroupPantry,
  onSaveEditingManualMergeGroup,
  onCancelEditingManualMergeGroup,
  onStartEditingManualMergeGroup,
  onSplitManualMergeGroup,
  formatRelativeTime,
}) {
  if (!isOpen) {
    return null
  }

  const unresolvedCount = filteredVisibleUnresolvedItems.length
  const combinedCount = visibleCombinedShoppingItems.length
  const manualGroupCount = visibleManualShoppingGroups.length
  const suggestionCount = nearDuplicateShoppingGroups.length
  const exportSignalState = combinedCount === 0 ? 'idle' : unresolvedCount > 0 ? 'review' : 'ready'

  const exportSignalTitle =
    exportSignalState === 'idle'
      ? 'Select recipes to unlock export'
      : exportSignalState === 'review'
        ? `${unresolvedCount} item${unresolvedCount === 1 ? '' : 's'} still need review`
        : 'Ready to export this shopping run'

  const exportSignalDescription =
    exportSignalState === 'idle'
      ? 'Start with recipe picks, then Dish Depot will combine the list into store-friendly sections.'
      : exportSignalState === 'review'
        ? 'Combined totals are ready, but resolving the highlighted items will make the final export easier to trust.'
        : 'Combined totals, pantry choices, and section grouping are in place. Save or export whenever you are ready.'

  const renderPanelSummary = ({ step, title, subtitle, countLabel }) => (
    <span className="shopping-panel-summary">
      {step ? <span className="shopping-panel-summary-step">{step}</span> : null}
      <span className="shopping-panel-summary-copy">
        <span className="shopping-panel-summary-title">{title}</span>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
      {countLabel ? <span className="shopping-panel-summary-count">{countLabel}</span> : null}
    </span>
  )

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-modal-title"
      aria-describedby="shopping-list-modal-subtitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content shopping-list-modal">
        <div className="modal-shell shopping-list-shell">
          <ModalCloseButton onClick={onClose} label="Close shopping list builder" />
          <ModalHeader
            title="Shopping List Builder"
            subtitle="Start by selecting recipes, then Dish Depot will organize the list into grocery-style sections."
            titleId="shopping-list-modal-title"
            subtitleId="shopping-list-modal-subtitle"
          />

          <section className="shopping-builder-hero" aria-label="Shopping builder overview">
            <div className="shopping-builder-hero-copy">
              <p className="shopping-builder-kicker">Shopping workspace</p>
              <div className="shopping-builder-hero-heading">
                <h3>Build, review, and finish one list with confidence.</h3>
                <p>
                  Keep the builder focused on what you need right now: choose recipes, confirm edge cases, and export only when the list feels settled.
                </p>
              </div>
              <div className="shopping-list-meta-pills">
                <span className="shopping-list-meta-pill">Recipes selected: {selectedShoppingCount}</span>
                <span className="shopping-list-meta-pill">Combined items: {combinedShoppingItems.length}</span>
                {pantryItemCount > 0 ? <span className="shopping-list-meta-pill">Pantry items: {pantryItemCount}</span> : null}
                {hasSavedShoppingDraft ? <span className="shopping-list-meta-pill">Draft saved on this device</span> : null}
                {shoppingHistory.length > 0 ? <span className="shopping-list-meta-pill">Saved lists: {shoppingHistory.length}</span> : null}
              </div>
            </div>

            <aside className={`shopping-export-signal shopping-export-signal-${exportSignalState}`}>
              <span className="shopping-export-signal-label">Export confidence</span>
              <strong>{exportSignalTitle}</strong>
              <p>{exportSignalDescription}</p>
              <div className="shopping-export-signal-meta">
                <span>{combinedCount} combined item{combinedCount === 1 ? '' : 's'}</span>
                <span>{unresolvedCount} unresolved</span>
              </div>
            </aside>
          </section>

          <div className="shopping-list-toolbar">
            <section className="shopping-toolbar-section shopping-toolbar-section-primary">
              <div className="shopping-toolbar-heading">
                <span className="shopping-toolbar-kicker">Finish list</span>
                <p>Save a reusable version or export the final shopping sheet once this run looks right.</p>
              </div>
              <div className="shopping-list-toolbar-actions shopping-list-toolbar-actions-primary">
                <button className="btn btn-secondary" type="button" onClick={onSaveListToHistory}>
                  Save List
                </button>
                <button className="btn btn-primary" type="button" onClick={onExportList}>
                  Export List
                </button>
              </div>
            </section>

            <section className="shopping-toolbar-section shopping-toolbar-section-secondary">
              <div className="shopping-toolbar-heading">
                <span className="shopping-toolbar-kicker">Drafts on this device</span>
                <p>Keep quick-progress controls nearby without pulling attention from the main builder.</p>
              </div>
              <div className="shopping-list-toolbar-actions shopping-list-toolbar-actions-secondary">
                <button className="btn btn-secondary btn-small" type="button" onClick={onSaveDraft}>
                  Save Draft
                </button>
                {hasSavedShoppingDraft ? (
                  <button className="btn btn-secondary btn-small" type="button" onClick={onClearSavedDraft}>
                    Clear Saved Draft
                  </button>
                ) : null}
              </div>
            </section>
          </div>

          <div className="shopping-builder-controls">
            <section className="shopping-toolbar-section shopping-toolbar-section-utility">
              <div className="shopping-toolbar-heading">
                <span className="shopping-toolbar-kicker">Quick resets</span>
                <p>Secondary controls stay available for fast cleanup without overpowering the build flow.</p>
              </div>
              <div className="import-preview-actions shopping-list-action-row">
                <button className="btn btn-secondary btn-small" type="button" onClick={onSelectAllCandidates}>
                  Select All
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={onClearRecipes}>
                  Clear Recipes
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={onClearChecklist}>
                  Uncheck Items
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={onClearPantry}>
                  Clear Pantry
                </button>
              </div>
            </section>

            <section className="shopping-toolbar-section shopping-toolbar-section-preferences">
              <div className="shopping-toolbar-heading">
                <span className="shopping-toolbar-kicker">Preferences</span>
                <p>Adjust units and pantry visibility to match the way you shop and scan the aisle.</p>
              </div>
              <fieldset className="shopping-unit-toggle">
                <legend className="visually-hidden">Preferred units</legend>
                <button
                  type="button"
                  className={`btn btn-small ${shoppingUnitSystem === 'us' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onSetShoppingUnitSystem('us')}
                >
                  US Units
                </button>
                <button
                  type="button"
                  className={`btn btn-small ${shoppingUnitSystem === 'metric' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onSetShoppingUnitSystem('metric')}
                >
                  Metric Units
                </button>
                <button
                  type="button"
                  className={`btn btn-small ${hidePantryItems ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={onToggleHidePantry}
                >
                  {hidePantryItems ? 'Show Pantry' : 'Hide Pantry'}
                </button>
              </fieldset>
            </section>

            <p className="shopping-panel-note shopping-builder-hint">
              Mark any item with <strong>Have at Home</strong> to add it to pantry. Pantry stays reviewable below so the active list can stay focused.
            </p>
          </div>

          <div className="shopping-support-grid">
            {shoppingHistory.length > 0 ? (
              <details className="shopping-panel shopping-support-panel">
                <summary>
                  {renderPanelSummary({
                    title: 'Saved Lists',
                    subtitle: 'Restore a past run without rebuilding it from scratch.',
                    countLabel: `${shoppingHistory.length} saved`,
                  })}
                </summary>
                <p className="shopping-panel-note">Reuse a saved shopping setup without rebuilding it from scratch.</p>
                <div className="shopping-history-list">
                  {shoppingHistory.map((entry) => (
                    <article key={entry.id} className="shopping-history-item">
                      <div className="shopping-history-copy">
                        <strong>{entry.label}</strong>
                        <small>
                          {entry.recipeCount} recipe{entry.recipeCount === 1 ? '' : 's'} · {entry.totalCount} combined item{entry.totalCount === 1 ? '' : 's'}
                          {entry.unresolvedCount > 0 ? ` · ${entry.unresolvedCount} needs review` : ''}
                          {entry.pantryCount > 0 ? ` · ${entry.pantryCount} pantry` : ''}
                        </small>
                        <small>Saved {formatRelativeTime(entry.savedAt)}</small>
                      </div>
                      <div className="shopping-history-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => onRestoreHistoryEntry(entry)}>
                          Restore
                        </button>
                        <button className="btn btn-small btn-danger" type="button" onClick={() => onDeleteHistoryEntry(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}

            <details className="shopping-panel shopping-support-panel shopping-pantry-panel" open={pantryEntries.length > 0}>
              <summary>
                {renderPanelSummary({
                  title: 'Pantry / Have at Home',
                  subtitle: 'Keep already-owned ingredients visible without cluttering the active shop.',
                  countLabel: `${pantryEntries.length} tracked`,
                })}
              </summary>
              {pantryEntries.length > 0 ? (
                <>
                  <p className="shopping-panel-note">These are the items you marked as already available at home. Remove them here or use Hide Pantry to keep the active list focused.</p>
                  <div className="shopping-history-list">
                    {pantryEntries.map((entry) => (
                      <article key={entry.key} className="shopping-history-item shopping-pantry-entry">
                        <div className="shopping-history-copy">
                          <strong>{entry.label}</strong>
                          <small>
                            {entry.section} · {entry.detail}
                          </small>
                        </div>
                        <div className="shopping-history-actions">
                          <button className="btn btn-small btn-secondary" type="button" onClick={() => onTogglePantryItem(entry.key)}>
                            Remove from Pantry
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyStateCard
                  icon="fa-box-open"
                  title="No pantry items yet"
                  description="When you tap Have at Home on any ingredient, it will show up here so you can review or remove it later."
                  compact
                />
              )}
            </details>

            <details className="shopping-panel shopping-support-panel shopping-section-order-panel">
              <summary>
                {renderPanelSummary({
                  title: 'Section Order',
                  subtitle: 'Match the grocery path you naturally follow in-store.',
                  countLabel: `${shoppingSectionOrder.length} sections`,
                })}
              </summary>
              <p className="shopping-panel-note">Reorder grocery sections to match how you shop in-store.</p>
              <div className="shopping-section-order-list">
                    {shoppingSectionOrder.map((section, index) => (
                      <div key={section} className="shopping-section-order-item">
                        <strong>{section}</strong>
                        <div className="shopping-section-order-actions">
                          <button
                            className="btn btn-small btn-secondary"
                            type="button"
                            onClick={() => onMoveShoppingSection(section, 'up')}
                            disabled={index === 0}
                            aria-label={`Move ${section} section up`}
                          >
                            Up
                          </button>
                          <button
                            className="btn btn-small btn-secondary"
                            type="button"
                            onClick={() => onMoveShoppingSection(section, 'down')}
                            disabled={index === shoppingSectionOrder.length - 1}
                            aria-label={`Move ${section} section down`}
                          >
                            Down
                          </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="shopping-section-order-footer">
                <button className="btn btn-small btn-secondary" type="button" onClick={onResetShoppingSectionOrder}>
                  Reset to Default
                </button>
              </div>
            </details>
          </div>

          <div className="shopping-list-layout">
            <details className="shopping-panel shopping-stage-panel shopping-stage-panel-recipes" open>
              <summary>
                {renderPanelSummary({
                  step: '1',
                  title: 'Choose Recipes',
                  subtitle: 'Select only what belongs in this shopping run.',
                  countLabel: `${selectedShoppingCount} selected`,
                })}
              </summary>
              <section className="shopping-list-recipes">
                <p className="shopping-panel-note">Pick only the recipes you want to shop for right now.</p>
                <div className="shopping-list-recipe-items">
                  {shoppingCandidates.map((candidate) => (
                    <label key={candidate.previewId} className="shopping-list-recipe-item">
                      <input type="checkbox" checked={candidate.selected} onChange={() => onToggleShoppingCandidate(candidate.previewId)} />
                      <span>
                        {candidate.recipe.name}
                        <small>{(candidate.recipe.ingredients || []).length} ingredients</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </details>

            <details className="shopping-panel shopping-stage-panel shopping-stage-panel-totals" open={selectedShoppingCount > 0}>
              <summary>
                {renderPanelSummary({
                  step: '2',
                  title: 'Combined Totals',
                  subtitle: 'Dish Depot groups the active list into grocery-style sections.',
                  countLabel: `${visibleCombinedShoppingItems.length} items`,
                })}
              </summary>
              <section className="shopping-list-ingredients">
                {visibleCombinedShoppingItems.length > 0 ? (
                  <div className="shopping-group-sections">
                    {visibleGroupedCombinedShoppingItems.map((group) => (
                      <section key={group.section} className="shopping-group-section">
                        <div className="shopping-group-heading">{group.section}</div>
                        <div className="shopping-list-ingredient-items">
                          {group.items.map((item) => (
                            <div key={item.key} className={`shopping-list-ingredient-item ${shoppingPantry[item.key] ? 'shopping-list-pantry-item' : ''}`}>
                              <input
                                type="checkbox"
                                checked={Boolean(shoppingChecklist[item.key])}
                                onChange={() => onToggleShoppingItemChecked(item.key)}
                                aria-label={`Mark ${item.amountLabel} as checked off`}
                              />
                              <span className={shoppingChecklist[item.key] ? 'shopping-list-item-checked' : ''}>
                                {item.amountLabel}
                                {item.sourceCount > 1 ? ` (${item.sourceCount} lines)` : ''}
                                {shoppingPantry[item.key] ? <small className="shopping-pantry-flag">Have at home</small> : null}
                              </span>
                              <button className="btn btn-secondary btn-small shopping-pantry-btn" type="button" onClick={() => onTogglePantryItem(item.key)}>
                                {shoppingPantry[item.key] ? 'In Pantry' : 'Have at Home'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <EmptyStateCard
                    icon="fa-cart-shopping"
                    title="Select recipes to build your list"
                    description="Start on the left by checking the recipes you want to shop for. Dish Depot will combine matching ingredients automatically."
                    compact
                  />
                )}
              </section>
            </details>

            {filteredVisibleUnresolvedItems.length > 0 ? (
              <details className="shopping-panel shopping-stage-panel shopping-stage-panel-review">
                <summary>
                  {renderPanelSummary({
                    step: '3',
                    title: 'Needs Review',
                    subtitle: 'Resolve the items Dish Depot could not safely combine for you.',
                    countLabel: `${filteredVisibleUnresolvedItems.length} unresolved`,
                  })}
                </summary>
                <div className="shopping-review-banner">
                  <div className="shopping-review-banner-copy">
                    <span className="shopping-review-banner-kicker">Resolve edge cases</span>
                    <strong>Suggested merges are quick wins. Manual merges stay fully in your control.</strong>
                    <p>These ingredients could not be safely combined. You can check them off as-is or merge them manually.</p>
                  </div>
                  <div className="shopping-review-banner-stats">
                    <span>{suggestionCount} suggestion{suggestionCount === 1 ? '' : 's'}</span>
                    <span>{filteredVisibleUnresolvedItems.length} unresolved</span>
                    <span>{manualGroupCount} manual group{manualGroupCount === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {nearDuplicateShoppingGroups.length > 0 ? (
                  <section className="shopping-review-card shopping-review-card-suggestions">
                    <div className="shopping-review-card-header">
                      <div className="shopping-review-card-copy">
                        <span className="shopping-review-card-kicker">Suggested merges</span>
                        <strong>Closest matches Dish Depot found</strong>
                        <p>Use these when the ingredients clearly describe the same purchase.</p>
                      </div>
                    </div>
                    <div className="shopping-suggestion-list">
                      {nearDuplicateShoppingGroups.map((group) => (
                        <article key={group.key} className="shopping-suggestion-item">
                          <div className="shopping-suggestion-copy">
                            <span className="shopping-suggestion-badge">Suggested match</span>
                            <strong>{group.label}</strong>
                            <small>{group.items.map((item) => item.text).join(' · ')}</small>
                          </div>
                          <button className="btn btn-small btn-secondary" type="button" onClick={() => onApplySuggestedShoppingMerge(group)}>
                            Merge Suggestion
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="shopping-review-card shopping-review-card-manual">
                  <div className="shopping-review-card-header">
                    <div className="shopping-review-card-copy">
                      <span className="shopping-review-card-kicker">Manual merge</span>
                      <strong>Create your own merged label when the suggestions are not enough</strong>
                      <p>Select unresolved items below, name the merged result, then keep shopping with the cleaner group.</p>
                    </div>
                  </div>
                  <div className="shopping-manual-tools">
                    <input
                      type="text"
                      className="shopping-manual-input"
                      placeholder="Label for merged items"
                      value={shoppingManualText}
                      onChange={(event) => onChangeShoppingManualText(event.target.value)}
                      aria-label="Label for merged shopping items"
                    />
                    <button className="btn btn-secondary btn-small" type="button" onClick={onCreateManualMergeGroup}>
                      Merge Selected
                    </button>
                  </div>
                  <div className="shopping-group-sections">
                    {filteredGroupedVisibleUnresolvedItems.map((group) => (
                      <section key={group.section} className="shopping-group-section">
                        <div className="shopping-group-heading">{group.section}</div>
                        <div className="shopping-list-ingredient-items">
                          {group.items.map((item) => (
                            <div key={item.key} className={`shopping-list-ingredient-item shopping-list-unresolved-item ${shoppingPantry[item.key] ? 'shopping-list-pantry-item' : ''}`}>
                              <input
                                type="checkbox"
                                checked={Boolean(shoppingChecklist[item.key])}
                                onChange={() => onToggleShoppingItemChecked(item.key)}
                                title="Checklist done"
                                aria-label={`Mark ${item.text} as checked off`}
                              />
                              <input
                                type="checkbox"
                                className="shopping-merge-check"
                                checked={Boolean(shoppingMergeSelection[item.key])}
                                onChange={() => onToggleShoppingMergeSelection(item.key)}
                                title="Select for manual merge"
                                aria-label={`Select ${item.text} for manual merge`}
                              />
                              <span className={shoppingChecklist[item.key] ? 'shopping-list-item-checked' : ''}>
                                {item.text}
                                {item.count > 1 ? ` (${item.count} recipes)` : ''}
                                {shoppingPantry[item.key] ? <small className="shopping-pantry-flag">Have at home</small> : null}
                              </span>
                              <button className="btn btn-secondary btn-small shopping-pantry-btn" type="button" onClick={() => onTogglePantryItem(item.key)}>
                                {shoppingPantry[item.key] ? 'In Pantry' : 'Have at Home'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </section>
              </details>
            ) : null}

            {visibleManualShoppingGroups.length > 0 ? (
              <details className="shopping-panel shopping-stage-panel shopping-stage-panel-manual">
                <summary>
                  {renderPanelSummary({
                    step: '4',
                    title: 'Manual Merge Items',
                    subtitle: 'Review the grouped labels you created and keep them tidy.',
                    countLabel: `${visibleManualShoppingGroups.length} groups`,
                  })}
                </summary>
                <div className="shopping-group-sections">
                  {visibleGroupedManualShoppingItems.map((section) => (
                    <section key={section.section} className="shopping-group-section">
                      <div className="shopping-group-heading">{section.section}</div>
                      <div className="shopping-list-ingredient-items">
                        {section.items.map((group) => (
                          <div key={group.key} className={`shopping-list-ingredient-item shopping-list-manual-item ${shoppingPantry[group.key] ? 'shopping-list-pantry-item' : ''}`}>
                            <input
                              type="checkbox"
                              checked={Boolean(shoppingChecklist[group.key])}
                              onChange={() => onToggleShoppingItemChecked(group.key)}
                              aria-label={`Mark ${group.text} as checked off`}
                            />
                            {shoppingManualEditingKey === group.key ? (
                              <input
                                type="text"
                                className={`shopping-manual-item-input ${shoppingChecklist[group.key] ? 'shopping-list-item-checked' : ''}`}
                                value={shoppingManualEditDraft}
                                onChange={(event) => onChangeShoppingManualEditDraft(event.target.value)}
                                aria-label={`Edit merged shopping label for ${group.text}`}
                              />
                            ) : (
                              <span className={`shopping-manual-item-text ${shoppingChecklist[group.key] ? 'shopping-list-item-checked' : ''}`}>{group.text}</span>
                            )}
                            <span className="shopping-manual-item-count">
                              {group.count > 1 ? `${group.count} lines` : '1 line'}
                              {shoppingPantry[group.key] ? ' · Have at home' : ''}
                            </span>
                            <div className="shopping-manual-actions">
                              <button className="btn btn-small btn-secondary" type="button" onClick={() => onToggleManualGroupPantry(group.key)}>
                                {shoppingPantry[group.key] ? 'In Pantry' : 'Have at Home'}
                              </button>
                              {shoppingManualEditingKey === group.key ? (
                                <>
                                  <button className="btn btn-small btn-primary" type="button" onClick={() => onSaveEditingManualMergeGroup(group.key)}>
                                    Save
                                  </button>
                                  <button className="btn btn-small btn-secondary" type="button" onClick={onCancelEditingManualMergeGroup}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button className="btn btn-small btn-secondary" type="button" onClick={() => onStartEditingManualMergeGroup(group)}>
                                  Edit
                                </button>
                              )}
                              <button className="btn btn-small btn-secondary" type="button" onClick={() => onSplitManualMergeGroup(group.key)}>
                                Split
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="import-preview-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
