import OptimizedImage from './OptimizedImage.jsx'

export default function RecipeGrid({
  recipeCardViewModels,
  highlightedId,
  isCompactCardView,
  categoriesMap,
  IdentityBlock,
  canManageRecipe,
  canShareRecipe,
  hasSupabaseConfig,
  hasAuthenticatedUser,
  recipeScope,
  hasSelectedGroup,
  selectedGroupName,
  canContributeToSelectedGroup,
  canRemoveRecipeFromSelectedGroup,
  onOpenRecipe,
  onVisitRecipe,
  onCopyRecipeUrl,
  onPrintRecipe,
  onOpenShareModal,
  onAddRecipeToSelectedGroup,
  onRemoveRecipeFromSelectedGroup,
  onTogglePinnedRecipe,
  onEditRecipe,
  onDeleteRecipe,
}) {
  return (
    <section className="recipe-grid">
      {recipeCardViewModels.map(({ recipe, categories, hasIngredients, hasDirections, hasDetailedRecipe, recipeOriginBadges, recipeProvenanceEntries }) => {
        const canManage = canManageRecipe(recipe)

        return (
          <article
            key={recipe.id}
            className={`recipe-card recipe-card-clickable ${highlightedId === recipe.id ? 'highlighted' : ''}`}
            data-recipe-id={recipe.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenRecipe(recipe)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenRecipe(recipe)
              }
            }}
          >
            <div className="recipe-header">
              <h3 className="recipe-title">{recipe.name}</h3>
              {recipeOriginBadges.length > 0 ? (
                <div className="recipe-origin-badges">
                  {recipeOriginBadges.map((badge) => (
                    <span key={`${recipe.id}-${badge.label}`} className={`recipe-origin-badge recipe-origin-badge-${badge.tone}`}>
                      <i className={`fas ${badge.icon}`} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}
              {recipeProvenanceEntries.length > 0 ? (
                <div className="recipe-provenance-list">
                  {recipeProvenanceEntries.map((entry) => (
                    <div key={`${recipe.id}-${entry.key}`} className="recipe-provenance-item">
                      <span className="recipe-provenance-label">{entry.label}</span>
                      <IdentityBlock
                        displayName={entry.displayName}
                        username={entry.username}
                        avatarUrl={entry.avatarUrl}
                        fallback={entry.fallback}
                        meta={entry.meta}
                        tone={entry.tone}
                        compact
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="recipe-categories">
                {categories.map((cat, categoryIndex) => {
                  const info = categoriesMap[cat] || categoriesMap.other
                  return (
                    <span key={`${recipe.id}-cat-${cat}-${categoryIndex}`} className="recipe-category" style={{ backgroundColor: info.color }}>
                      <i className={`fas ${info.icon}`} />
                      {cat}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className={`recipe-body ${isCompactCardView ? 'recipe-body-compact' : ''}`}>
              {recipe.image ? (
                <OptimizedImage
                  src={recipe.image}
                  alt={recipe.name}
                  className="recipe-image"
                  widthHint={720}
                  quality={74}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
              ) : null}

              {!isCompactCardView && recipe.notes ? <p className="recipe-notes">{recipe.notes}</p> : null}

              {!isCompactCardView && hasDetailedRecipe ? (
                <>
                  {hasIngredients ? (
                    <div className="recipe-section">
                      <h4 className="recipe-section-title">
                        <i className="fas fa-list" />
                        Ingredients
                      </h4>
                      <ul className="recipe-list">
                        {(recipe.ingredients || []).map((item, ingredientIndex) => (
                          <li key={`${recipe.id}-ingredient-${ingredientIndex}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {hasDirections ? (
                    <div className="recipe-section">
                      <h4 className="recipe-section-title">
                        <i className="fas fa-directions" />
                        Directions
                      </h4>
                      <ol className="recipe-list">
                        {(recipe.directions || []).map((step, directionIndex) => (
                          <li key={`${recipe.id}-direction-${directionIndex}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="recipe-actions">
                {recipe.url ? (
                  <>
                    <button
                      className="btn btn-small btn-visit"
                      type="button"
                      aria-label="Visit recipe"
                      title="Visit recipe"
                      onClick={(event) => {
                        event.stopPropagation()
                        onVisitRecipe(recipe.url)
                      }}
                    >
                      <i className="fas fa-external-link-alt" />
                      <span className="visually-hidden">Visit</span>
                    </button>
                    <button
                      className="btn btn-small btn-copy"
                      type="button"
                      aria-label="Copy recipe URL"
                      title="Copy recipe URL"
                      onClick={(event) => {
                        event.stopPropagation()
                        onCopyRecipeUrl(recipe.url)
                      }}
                    >
                      <i className="fas fa-copy" />
                      <span className="visually-hidden">Copy URL</span>
                    </button>
                  </>
                ) : null}
                <button
                  className="btn btn-small btn-print"
                  type="button"
                  aria-label="Print recipe"
                  title="Print recipe"
                  onClick={(event) => {
                    event.stopPropagation()
                    onPrintRecipe(recipe)
                  }}
                >
                  <i className="fas fa-print" />
                  <span className="visually-hidden">Print</span>
                </button>
                {canShareRecipe(recipe) && hasSupabaseConfig && hasAuthenticatedUser ? (
                  <button
                    className="btn btn-small btn-secondary"
                    type="button"
                    aria-label="Share recipe"
                    title="Share recipe"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenShareModal(recipe)
                    }}
                  >
                    <i className="fas fa-share-nodes" />
                    <span className="visually-hidden">Share</span>
                  </button>
                ) : null}
                {recipeScope !== 'group' && hasSupabaseConfig && hasAuthenticatedUser && hasSelectedGroup ? (
                  <button
                    className="btn btn-small btn-secondary"
                    type="button"
                    aria-label="Add recipe to selected group"
                    title={canContributeToSelectedGroup ? `Add to ${selectedGroupName}` : 'No permission to contribute'}
                    onClick={(event) => {
                      event.stopPropagation()
                      void onAddRecipeToSelectedGroup(recipe)
                    }}
                    disabled={!canContributeToSelectedGroup}
                  >
                    <i className="fas fa-users" />
                    <span className="visually-hidden">Add to Group</span>
                  </button>
                ) : null}
                {recipeScope === 'group' ? (
                  <button
                    className="btn btn-small btn-secondary"
                    type="button"
                    aria-label="Remove recipe from selected group"
                    title={canRemoveRecipeFromSelectedGroup(recipe) ? `Remove from ${selectedGroupName}` : 'No permission to remove'}
                    onClick={(event) => {
                      event.stopPropagation()
                      void onRemoveRecipeFromSelectedGroup(recipe)
                    }}
                    disabled={!canRemoveRecipeFromSelectedGroup(recipe)}
                  >
                    <i className="fas fa-user-minus" />
                    <span className="visually-hidden">Remove from Group</span>
                  </button>
                ) : null}
                {canManage ? (
                  <>
                    <button
                      className={`btn btn-small ${recipe.pinned ? 'btn-pin-active' : 'btn-pin'}`}
                      type="button"
                      aria-label={recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}
                      title={recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}
                      onClick={(event) => {
                        event.stopPropagation()
                        void onTogglePinnedRecipe(recipe.id)
                      }}
                    >
                      <i className={`fas ${recipe.pinned ? 'fa-star' : 'fa-star-half-alt'}`} />
                      <span className="visually-hidden">{recipe.pinned ? 'Pinned' : 'Pin'}</span>
                    </button>
                    <button
                      className="btn btn-small btn-primary"
                      type="button"
                      aria-label="Edit recipe"
                      title="Edit recipe"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEditRecipe(recipe)
                      }}
                    >
                      <i className="fas fa-edit" />
                      <span className="visually-hidden">Edit</span>
                    </button>
                    {recipeScope !== 'group' ? (
                      <button
                        className="btn btn-small btn-danger"
                        type="button"
                        aria-label="Delete recipe"
                        title="Delete recipe"
                        onClick={(event) => {
                          event.stopPropagation()
                          void onDeleteRecipe(recipe.id)
                        }}
                      >
                        <i className="fas fa-trash" />
                        <span className="visually-hidden">Delete</span>
                      </button>
                    ) : null}
                  </>
                ) : (
                  <span className="shared-readonly-pill">
                    <i className="fas fa-user-group" />
                    Shared recipe
                  </span>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
