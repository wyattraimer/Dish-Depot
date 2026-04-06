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

  return (
    <div className="modal show" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content shopping-list-modal" onClick={(event) => event.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Shopping List Builder</h2>
        <p className="import-preview-subtitle">
          Start by selecting recipes, then Dish Depot will organize the list into grocery-style sections.
        </p>

        <div className="shopping-list-toolbar">
          <div className="shopping-list-meta-pills">
            <span className="shopping-list-meta-pill">Recipes selected: {selectedShoppingCount}</span>
            <span className="shopping-list-meta-pill">Combined items: {combinedShoppingItems.length}</span>
            {pantryItemCount > 0 ? <span className="shopping-list-meta-pill">Pantry items: {pantryItemCount}</span> : null}
            {hasSavedShoppingDraft ? <span className="shopping-list-meta-pill">Draft saved on this device</span> : null}
            {shoppingHistory.length > 0 ? <span className="shopping-list-meta-pill">Saved lists: {shoppingHistory.length}</span> : null}
          </div>
          <div className="shopping-list-toolbar-actions">
            <button className="btn btn-secondary btn-small" type="button" onClick={onSaveDraft}>
              Save Draft
            </button>
            <button className="btn btn-secondary btn-small" type="button" onClick={onSaveListToHistory}>
              Save List
            </button>
            {hasSavedShoppingDraft ? (
              <button className="btn btn-secondary btn-small" type="button" onClick={onClearSavedDraft}>
                Clear Saved Draft
              </button>
            ) : null}
          </div>
        </div>

        <div className="shopping-builder-controls">
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
            <button className="btn btn-secondary btn-small" type="button" onClick={onExportList}>
              Export List
            </button>
          </div>

          <div className="shopping-unit-toggle" role="group" aria-label="Preferred units">
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
          </div>
          <p className="shopping-panel-note shopping-builder-hint">
            Mark any item with <strong>Have at Home</strong> to add it to pantry. Your pantry items appear in their own section below.
          </p>
        </div>

        {shoppingHistory.length > 0 ? (
          <details className="shopping-panel">
            <summary>Saved Lists ({shoppingHistory.length})</summary>
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
                    <button className="btn btn-small btn-secondary" type="button" onClick={() => onDeleteHistoryEntry(entry.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </details>
        ) : null}

        <details className="shopping-panel shopping-pantry-panel" open={pantryEntries.length > 0}>
          <summary>Pantry / Have at Home ({pantryEntries.length})</summary>
          {pantryEntries.length > 0 ? (
            <>
              <p className="shopping-panel-note">These are the items you marked as already available at home. Remove them here or use Hide Pantry to keep the active list focused.</p>
              <div className="shopping-history-list">
                {pantryEntries.map((entry) => (
                  <article key={entry.key} className="shopping-history-item shopping-pantry-entry">
                    <div className="shopping-history-copy">
                      <strong>{entry.label}</strong>
                      <small>{entry.section} · {entry.detail}</small>
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

        <details className="shopping-panel shopping-section-order-panel">
          <summary>Section Order</summary>
          <p className="shopping-panel-note">Reorder grocery sections to match how you shop in-store.</p>
          <div className="shopping-section-order-list">
            {shoppingSectionOrder.map((section, index) => (
              <div key={section} className="shopping-section-order-item">
                <strong>{section}</strong>
                <div className="shopping-section-order-actions">
                  <button className="btn btn-small btn-secondary" type="button" onClick={() => onMoveShoppingSection(section, 'up')} disabled={index === 0}>
                    Up
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    type="button"
                    onClick={() => onMoveShoppingSection(section, 'down')}
                    disabled={index === shoppingSectionOrder.length - 1}
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

        <div className="shopping-list-layout">
          <details className="shopping-panel" open>
            <summary>1. Choose Recipes</summary>
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

          <details className="shopping-panel" open={selectedShoppingCount > 0}>
            <summary>2. Combined Totals ({visibleCombinedShoppingItems.length})</summary>
            <section className="shopping-list-ingredients">
              {visibleCombinedShoppingItems.length > 0 ? (
                <div className="shopping-group-sections">
                  {visibleGroupedCombinedShoppingItems.map((group) => (
                    <section key={group.section} className="shopping-group-section">
                      <div className="shopping-group-heading">{group.section}</div>
                      <div className="shopping-list-ingredient-items">
                        {group.items.map((item) => (
                          <div key={item.key} className={`shopping-list-ingredient-item ${shoppingPantry[item.key] ? 'shopping-list-pantry-item' : ''}`}>
                            <input type="checkbox" checked={Boolean(shoppingChecklist[item.key])} onChange={() => onToggleShoppingItemChecked(item.key)} />
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
            <details className="shopping-panel">
              <summary>3. Needs Review ({filteredVisibleUnresolvedItems.length})</summary>
              <p className="shopping-panel-note">These ingredients could not be safely combined. You can check them off as-is or merge them manually.</p>
              {nearDuplicateShoppingGroups.length > 0 ? (
                <div className="shopping-suggestion-list">
                  {nearDuplicateShoppingGroups.map((group) => (
                    <article key={group.key} className="shopping-suggestion-item">
                      <div className="shopping-suggestion-copy">
                        <strong>{group.label}</strong>
                        <small>{group.items.map((item) => item.text).join(' · ')}</small>
                      </div>
                      <button className="btn btn-small btn-secondary" type="button" onClick={() => onApplySuggestedShoppingMerge(group)}>
                        Merge Suggestion
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}
              <div className="shopping-manual-tools">
                <input
                  type="text"
                  className="shopping-manual-input"
                  placeholder="Label for merged items"
                  value={shoppingManualText}
                  onChange={(event) => onChangeShoppingManualText(event.target.value)}
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
                          <input type="checkbox" checked={Boolean(shoppingChecklist[item.key])} onChange={() => onToggleShoppingItemChecked(item.key)} title="Checklist done" />
                          <input
                            type="checkbox"
                            className="shopping-merge-check"
                            checked={Boolean(shoppingMergeSelection[item.key])}
                            onChange={() => onToggleShoppingMergeSelection(item.key)}
                            title="Select for manual merge"
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
            </details>
          ) : null}

          {visibleManualShoppingGroups.length > 0 ? (
            <details className="shopping-panel">
              <summary>4. Manual Merge Items ({visibleManualShoppingGroups.length})</summary>
              <div className="shopping-group-sections">
                {visibleGroupedManualShoppingItems.map((section) => (
                  <section key={section.section} className="shopping-group-section">
                    <div className="shopping-group-heading">{section.section}</div>
                    <div className="shopping-list-ingredient-items">
                      {section.items.map((group) => (
                        <div key={group.key} className={`shopping-list-ingredient-item shopping-list-manual-item ${shoppingPantry[group.key] ? 'shopping-list-pantry-item' : ''}`}>
                          <input type="checkbox" checked={Boolean(shoppingChecklist[group.key])} onChange={() => onToggleShoppingItemChecked(group.key)} />
                          {shoppingManualEditingKey === group.key ? (
                            <input
                              type="text"
                              className={`shopping-manual-item-input ${shoppingChecklist[group.key] ? 'shopping-list-item-checked' : ''}`}
                              value={shoppingManualEditDraft}
                              onChange={(event) => onChangeShoppingManualEditDraft(event.target.value)}
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
  )
}
