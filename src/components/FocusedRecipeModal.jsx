import OptimizedImage from './OptimizedImage.jsx'

export default function FocusedRecipeModal({
  focusedRecipe,
  closeFocusedRecipe,
  getRecipeOriginBadges,
  getRecipeProvenanceEntries,
  categoriesMap,
  canShareRecipe,
  hasSupabaseConfig,
  authUser,
  openShareModal,
  isUuidLike,
  selectedGroupId,
  addRecipeToSelectedGroup,
  canContributeToSelectedGroup,
  selectedGroup,
  recipeScope,
  removeRecipeFromSelectedGroup,
  canRemoveRecipeFromSelectedGroup,
  visitRecipe,
  copyRecipeUrl,
  printRecipesAsPdf,
  canManageRecipe,
  togglePinnedRecipe,
  openModal,
  handleDeleteRecipe,
}) {
  const buildIdentityInitials = (...parts) => {
    const source = parts
      .filter(Boolean)
      .join(' ')
      .replace(/[@_-]+/g, ' ')
      .trim()

    if (!source) {
      return 'DD'
    }

    const words = source.split(/\s+/).filter(Boolean)
    const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('')
    return initials || source.slice(0, 2).toUpperCase()
  }

  const recipeOriginBadges = getRecipeOriginBadges(focusedRecipe)
  const recipeProvenanceEntries = getRecipeProvenanceEntries(focusedRecipe)
  const focusedCategories = focusedRecipe.categories || (focusedRecipe.category ? [focusedRecipe.category] : [])
  const canManage = canManageRecipe(focusedRecipe)

  return (
    <div
      className="focused-recipe-overlay"
      role="dialog"
      aria-modal="true"
      onClick={closeFocusedRecipe}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          closeFocusedRecipe()
        }
      }}
    >
      <article className="focused-recipe-panel" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
        <div className="focused-recipe-topbar">
          <p className="focused-recipe-kicker">Recipe details</p>
          <button className="focused-recipe-close" type="button" onClick={closeFocusedRecipe}>
            <i className="fas fa-times" />
            Close
          </button>
        </div>

        <header className="focused-recipe-header">
          <div className="focused-recipe-title-block">
            <h2>{focusedRecipe.name}</h2>

            {recipeOriginBadges.length > 0 ? (
              <div className="recipe-origin-badges recipe-origin-badges-focused">
                {recipeOriginBadges.map((badge) => (
                  <span key={`focused-${focusedRecipe.id}-${badge.label}`} className={`recipe-origin-badge recipe-origin-badge-${badge.tone}`}>
                    <i className={`fas ${badge.icon}`} />
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}

            {focusedCategories.length > 0 ? (
              <div className="recipe-categories recipe-categories-focused">
                {focusedCategories.map((cat) => {
                  const info = categoriesMap[cat] || categoriesMap.other
                  return (
                    <span key={`focused-${focusedRecipe.id}-${cat}`} className="recipe-category" style={{ backgroundColor: info.color }}>
                      <i className={`fas ${info.icon}`} />
                      {cat}
                    </span>
                  )
                })}
              </div>
            ) : null}
          </div>
        </header>

        {focusedRecipe.image || focusedRecipe.notes || recipeProvenanceEntries.length > 0 ? (
          <section className={`focused-recipe-summary${focusedRecipe.image ? ' focused-recipe-summary-has-image' : ' focused-recipe-summary-no-image'}`}>
            {focusedRecipe.image ? (
              <div className="focused-recipe-image-wrap">
                <OptimizedImage
                  src={focusedRecipe.image}
                  alt={focusedRecipe.name}
                  className="focused-recipe-image"
                  widthHint={1400}
                  quality={82}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="min(1100px, 100vw)"
                />
              </div>
            ) : null}

            {recipeProvenanceEntries.length > 0 || focusedRecipe.notes ? (
              <div className="focused-recipe-aside">
                {recipeProvenanceEntries.length > 0 ? (
                  <section className="focused-recipe-aside-panel focused-recipe-provenance-panel">
                    <p className="focused-recipe-panel-kicker">Provenance</p>
                    <div className="recipe-provenance-list recipe-provenance-list-focused">
                      {recipeProvenanceEntries.map((entry) => (
                        <div key={`focused-${focusedRecipe.id}-${entry.key}`} className="recipe-provenance-item recipe-provenance-item-focused">
                          <span className="recipe-provenance-label">{entry.label}</span>
                          <div className="identity-block">
                            <span className={`identity-avatar identity-avatar-${entry.tone}`} aria-hidden="true">
                              {entry.avatarUrl ? <img className="identity-avatar-image" src={entry.avatarUrl} alt="" /> : buildIdentityInitials(entry.displayName, entry.username, entry.fallback)}
                            </span>
                            <div className="identity-copy">
                              <strong>{entry.displayName || (entry.username ? `@${entry.username}` : entry.fallback)}</strong>
                              {entry.meta || entry.username ? <small>{[entry.displayName && entry.username ? `@${entry.username}` : !entry.displayName && entry.username ? 'Dish Depot member' : '', entry.meta].filter(Boolean).join(' · ')}</small> : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {focusedRecipe.notes ? (
                  <section className="focused-recipe-aside-panel focused-recipe-notes-panel">
                    <p className="focused-recipe-panel-kicker">Recipe note</p>
                    <p className="recipe-notes recipe-notes-focused">{focusedRecipe.notes}</p>
                  </section>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="focused-recipe-content-grid">
          {Array.isArray(focusedRecipe.ingredients) && focusedRecipe.ingredients.length > 0 ? (
            <section className="focused-recipe-section">
              <h3 className="recipe-section-title">
                <i className="fas fa-list" />
                Ingredients
              </h3>
              <ul className="recipe-list">
                {focusedRecipe.ingredients.map((item) => (
                  <li key={`focused-ing-${focusedRecipe.id}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {Array.isArray(focusedRecipe.directions) && focusedRecipe.directions.length > 0 ? (
            <section className="focused-recipe-section">
              <h3 className="recipe-section-title">
                <i className="fas fa-directions" />
                Directions
              </h3>
              <ol className="recipe-list">
                {focusedRecipe.directions.map((step) => (
                  <li key={`focused-step-${focusedRecipe.id}-${step}`}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <div className="focused-recipe-actions-shell">
          <div className="focused-recipe-actions">
            <div className="focused-recipe-action-group">
              {canShareRecipe(focusedRecipe) && hasSupabaseConfig && authUser ? (
                <button className="btn btn-secondary" type="button" onClick={() => openShareModal(focusedRecipe)}>
                  <i className="fas fa-share-nodes" />
                  Share
                </button>
              ) : null}
              {recipeScope !== 'group' && hasSupabaseConfig && authUser && isUuidLike(selectedGroupId) ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void addRecipeToSelectedGroup(focusedRecipe)}
                  disabled={!canContributeToSelectedGroup}
                >
                  <i className="fas fa-users" />
                  Add to {selectedGroup?.name || 'Group'}
                </button>
              ) : null}
              {recipeScope === 'group' ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void removeRecipeFromSelectedGroup(focusedRecipe)}
                  disabled={!canRemoveRecipeFromSelectedGroup(focusedRecipe)}
                >
                  <i className="fas fa-user-minus" />
                  Remove from {selectedGroup?.name || 'Group'}
                </button>
              ) : null}
              {focusedRecipe.url ? (
                <>
                  <button className="btn btn-visit" type="button" onClick={() => visitRecipe(focusedRecipe.url)}>
                    <i className="fas fa-external-link-alt" />
                    Visit
                  </button>
                  <button className="btn btn-copy" type="button" onClick={() => copyRecipeUrl(focusedRecipe.url)}>
                    <i className="fas fa-copy" />
                    Copy URL
                  </button>
                </>
              ) : null}
              <button className="btn btn-print" type="button" onClick={() => printRecipesAsPdf([focusedRecipe])}>
                <i className="fas fa-print" />
                Print / Save PDF
              </button>
            </div>

            {canManage ? (
              <div className="focused-recipe-action-group focused-recipe-action-group-manage">
                <button className={`btn ${focusedRecipe.pinned ? 'btn-pin-active' : 'btn-pin'}`} type="button" onClick={() => void togglePinnedRecipe(focusedRecipe.id)}>
                  <i className={`fas ${focusedRecipe.pinned ? 'fa-star' : 'fa-star-half-alt'}`} />
                  {focusedRecipe.pinned ? 'Pinned' : 'Pin'}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    openModal(focusedRecipe)
                    closeFocusedRecipe()
                  }}
                >
                  <i className="fas fa-edit" />
                  Edit Recipe
                </button>
                {recipeScope !== 'group' ? (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={async () => {
                      const deleted = await handleDeleteRecipe(focusedRecipe.id)
                      if (deleted) {
                        closeFocusedRecipe()
                      }
                    }}
                  >
                    <i className="fas fa-trash" />
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}
