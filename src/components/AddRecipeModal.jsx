import { EmptyStateCard, ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function AddRecipeModal({
  currentEditingId,
  currentRecipeType,
  setRecipeCreationMode,
  handleSubmit,
  form,
  setForm,
  handleExtractFromUrl,
  isExtracting,
  isOnline,
  isApiReachable,
  cardScanInputRef,
  isPreparingCardScan,
  handleCardScanFileChange,
  cardScanFile,
  cardScanPreviewUrl,
  cardScanPreparationNote,
  handleExtractFromCard,
  extractCandidate,
  extractReviewSummary,
  extractFieldReview,
  extractWarnings,
  applyExtractCandidate,
  discardExtractCandidate,
  updateRecipeFormField,
  applyRecipeFieldCleanup,
  categoryOptions,
  formatCategory,
  toggleCategory,
  hasSupabaseConfig,
  closeModal,
}) {
  const isCustomMode = currentRecipeType === 'custom'
  const isUrlMode = currentRecipeType === 'url'
  const modalTitle = currentEditingId ? 'Edit Recipe' : 'Add New Recipe'
  const modalSubtitle = isUrlMode
    ? 'Paste a recipe link first, let Dish Depot stage the details, then tune anything before you save.'
    : currentRecipeType === 'card'
      ? 'Upload a clear recipe card photo first, then review the scanned fields before you save.'
      : 'Enter the essentials first, then add the finishing touches once the recipe feels complete.'
  const modalNote = isCustomMode
    ? 'A calm two-part flow: capture the recipe body first, then handle categories, notes, and sharing details.'
    : isUrlMode
      ? 'Bring in the source, review the staged fields, and only then commit them into your draft below.'
      : 'Scan first, double-check anything that looks uncertain, and keep refining the final recipe below.'
  const hasSourcePrepared = isUrlMode ? Boolean((form.url ?? '').trim()) : Boolean(cardScanFile)
  const hasRecipeBasics = Boolean((form.name ?? '').trim() || (form.ingredients ?? '').trim() || (form.directions ?? '').trim())
  const hasFinishingTouches = Boolean(
    (form.image ?? '').trim() ||
      (form.notes ?? '').trim() ||
      (form.categories?.length ?? 0) > 0 ||
      (hasSupabaseConfig && form.visibility && form.visibility !== 'private'),
  )

  const journeySteps = isCustomMode
    ? [
        {
          key: 'details',
          number: '01',
          title: 'Recipe details',
          description: 'Name the recipe and shape the ingredients and directions first.',
          status: hasFinishingTouches ? 'complete' : 'current',
        },
        {
          key: 'finish',
          number: '02',
          title: 'Finishing touches',
          description: 'Add the image, categories, notes, and visibility once the recipe body feels right.',
          status: hasFinishingTouches ? 'current' : 'upcoming',
        },
      ]
    : [
        {
          key: 'source',
          number: '01',
          title: isUrlMode ? 'Bring in the source link' : 'Stage a clean card photo',
          description: isUrlMode
            ? 'Start with the recipe URL so Dish Depot can pull in as much structure as possible.'
            : 'Start with a bright, full-frame photo so the scanner has the clearest read.',
          status: extractCandidate || hasRecipeBasics ? 'complete' : 'current',
        },
        {
          key: 'review',
          number: '02',
          title: 'Review the extraction',
          description: 'Dish Depot stages the fields here before they touch your editable draft.',
          status: extractCandidate ? 'current' : hasRecipeBasics ? 'complete' : hasSourcePrepared ? 'upcoming' : 'upcoming',
        },
        {
          key: 'details',
          number: '03',
          title: 'Finalize the recipe',
          description: 'Tune the title, ingredients, and directions until the recipe reads cleanly.',
          status: !extractCandidate && hasRecipeBasics ? 'current' : 'upcoming',
        },
        {
          key: 'finish',
          number: '04',
          title: 'Add the finishing touches',
          description: 'Set the image, categories, notes, and visibility before saving.',
          status: hasFinishingTouches ? 'complete' : !extractCandidate && hasRecipeBasics ? 'upcoming' : 'upcoming',
        },
      ]

  const getReviewToneLabel = (status) => {
    if (status === 'strong') {
      return 'Looks good'
    }
    if (status === 'missing') {
      return 'Needs info'
    }
    return 'Quick check'
  }

  const getReviewToneIcon = (status) => {
    if (status === 'strong') {
      return 'fa-circle-check'
    }
    if (status === 'missing') {
      return 'fa-circle-minus'
    }
    return 'fa-eye'
  }

  const renderSuspiciousList = (items, heading, emptyText) => {
    if (!items || items.length === 0) {
      return <p className="extract-field-empty">{emptyText}</p>
    }

    return (
      <div className="extract-suspicious-block">
        <p className="extract-suspicious-heading">{heading}</p>
        <ul className="extract-suspicious-list">
          {items.map((item) => (
            <li key={`${item.index}-${item.text}`} className="extract-suspicious-item">
              <div className="extract-suspicious-line">{item.text}</div>
              <small>{item.reason}</small>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-recipe-modal-title"
      aria-describedby="add-recipe-modal-subtitle"
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeModal()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          closeModal()
        }
      }}
    >
      <div className="modal-content add-recipe-modal">
        <div className="modal-shell add-recipe-modal-shell">
          <ModalCloseButton onClick={closeModal} label="Close add recipe dialog" />
          <ModalHeader title={modalTitle} subtitle={modalSubtitle} note={modalNote} titleId="add-recipe-modal-title" subtitleId="add-recipe-modal-subtitle" noteId="add-recipe-modal-note" />

          <section className="add-recipe-journey-shell" aria-label="Recipe creation flow">
            <ol className="add-recipe-journey">
              {journeySteps.map((step) => (
                <li key={step.key} className={`add-recipe-journey-step add-recipe-journey-step-${step.status}`}>
                  <span className="add-recipe-journey-number">{step.number}</span>
                  <div className="add-recipe-journey-copy">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <fieldset className="form-group recipe-type-toggle">
            <legend>How do you want to start?</legend>
            <div className="toggle-buttons">
              <button type="button" className={`toggle-btn ${currentRecipeType === 'url' ? 'toggle-btn-active' : ''}`} onClick={() => setRecipeCreationMode('url')}>
                <i className="fas fa-link" />
                Recipe from URL
              </button>
              <button type="button" className={`toggle-btn ${currentRecipeType === 'card' ? 'toggle-btn-active' : ''}`} onClick={() => setRecipeCreationMode('card')}>
                <i className="fas fa-camera" />
                Scan Recipe Card
              </button>
              <button type="button" className={`toggle-btn ${currentRecipeType === 'custom' ? 'toggle-btn-active' : ''}`} onClick={() => setRecipeCreationMode('custom')}>
                <i className="fas fa-pencil-alt" />
                Your Recipe
              </button>
            </div>
          </fieldset>

          <form className="add-recipe-form" onSubmit={handleSubmit}>
          {currentRecipeType !== 'custom' ? (
            <section className="add-recipe-panel add-recipe-source-panel">
              <div className="add-recipe-panel-header">
                <span className="add-recipe-panel-kicker">Step 1</span>
                <h3>{currentRecipeType === 'url' ? '1. Extract from a recipe link' : '1. Scan your recipe card'}</h3>
                <p>
                  {currentRecipeType === 'url'
                    ? 'Start with the source so Dish Depot can pull in as much of the recipe as possible for you.'
                    : 'Start with the photo so Dish Depot can read the card before you edit anything manually.'}
                </p>
              </div>
              {currentRecipeType === 'url' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="recipeUrl">Recipe URL</label>
                    <input id="recipeUrl" type="url" required value={form.url ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} />
                  </div>

                  <div className="extract-actions-card">
                    <div className="extract-actions-card-copy">
                      <span className="add-recipe-panel-kicker">Bring in the draft</span>
                      <strong>Stage the recipe before you edit the final fields.</strong>
                      <p className="extract-notice">
                        {!isOnline
                          ? 'You are offline. URL extraction needs internet, but your saved recipes, planner, and cached pages still work.'
                          : !isApiReachable
                            ? 'The extraction service is currently unreachable. Your recipes are safe locally; try extraction again in a moment.'
                            : 'First extract can take 30 - 50 seconds while the API wakes up. After that, extracts are usually much faster.'}
                      </p>
                    </div>
                    <div className="extract-actions">
                      <button className="btn btn-secondary" type="button" onClick={handleExtractFromUrl} disabled={isExtracting}>
                        <i className={`fas ${isExtracting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} />
                        {isExtracting
                          ? 'Extracting...'
                          : !isOnline
                            ? 'Extraction Unavailable Offline'
                            : !isApiReachable
                              ? 'Extraction Service Unreachable'
                              : 'Extract Details from URL'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="recipeCardScan">Recipe Card Image</label>
                    <div className="card-scan-action-row">
                      <button className="btn btn-secondary" type="button" onClick={() => cardScanInputRef.current?.click()} disabled={isPreparingCardScan || isExtracting}>
                        <i className="fas fa-image" />
                        Choose or Take Photo
                      </button>
                    </div>
                    <input
                      ref={cardScanInputRef}
                      id="recipeCardScan"
                      className="card-scan-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/bmp,application/pdf"
                      onChange={handleCardScanFileChange}
                      disabled={isPreparingCardScan || isExtracting}
                    />
                    <p className="card-scan-helper">
                      {isPreparingCardScan
                        ? 'Optimizing your image for scanning...'
                        : 'Use a bright photo with the full recipe card in frame for the best handwriting results.'}
                    </p>
                    {cardScanFile ? (
                      <div className="card-scan-preview-card">
                        {cardScanPreviewUrl && cardScanFile.type.startsWith('image/') ? (
                          <div className="card-scan-preview-image-wrap">
                            <img className="card-scan-preview-image" src={cardScanPreviewUrl} alt="Recipe card preview" />
                          </div>
                        ) : cardScanFile.type === 'application/pdf' ? (
                          <div className="card-scan-preview-file-state">
                            <i className="fas fa-file-pdf" />
                            <span>PDF selected — Dish Depot will still scan it after upload, but inline preview is not available.</span>
                          </div>
                        ) : null}
                        <div className="card-scan-preview-meta">
                          <div className="card-scan-file-chip"><i className="fas fa-file-image" /> {cardScanFile.name}</div>
                          {cardScanPreparationNote ? <p className="card-scan-prep-note">{cardScanPreparationNote}</p> : null}
                          <div className="card-scan-tips-grid">
                            <span><i className="fas fa-sun" /> Bright light</span>
                            <span><i className="fas fa-expand" /> Fill the frame</span>
                            <span><i className="fas fa-eye" /> Review handwriting carefully</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="extract-actions-card">
                    <div className="extract-actions-card-copy">
                      <span className="add-recipe-panel-kicker">Read the card</span>
                      <strong>Let Dish Depot stage the handwriting for review first.</strong>
                      <p className="extract-notice">
                        {!isOnline
                          ? 'You are offline. Recipe card scanning needs internet right now.'
                          : !isApiReachable
                            ? 'The scanning service is currently unreachable. Please try again in a moment.'
                            : 'Scan works best with high contrast handwriting and an evenly lit recipe card photo.'}
                      </p>
                    </div>
                    <div className="extract-actions">
                      <button className="btn btn-secondary" type="button" onClick={handleExtractFromCard} disabled={isPreparingCardScan || isExtracting || !cardScanFile}>
                        <i className={`fas ${isExtracting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} />
                        {isPreparingCardScan
                          ? 'Preparing...'
                          : isExtracting
                            ? 'Scanning...'
                            : !isOnline
                              ? 'Scanning Unavailable Offline'
                              : !isApiReachable
                                ? 'Scanner Service Unreachable'
                                : 'Read Recipe Card'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {extractCandidate ? (
            <section className="add-recipe-panel extract-preview-card">
              <div className="add-recipe-panel-header extract-preview-panel-header">
                <span className="add-recipe-panel-kicker">Step 2</span>
                <h3>2. Review the extracted recipe</h3>
                <p>Check the staged preview first, then decide whether to bring it into your editable recipe draft.</p>
              </div>
              {extractReviewSummary ? (
                <div className={`extract-review-banner extract-review-banner-${extractReviewSummary.status}`}>
                  <div className="extract-review-banner-text">
                    <strong>{extractReviewSummary.headline}</strong>
                    <p>{extractReviewSummary.detail}</p>
                  </div>
                  <div className="extract-review-banner-stats">
                    <span>{extractReviewSummary.ingredientsCount} ingredients</span>
                    <span>{extractReviewSummary.directionsCount} directions</span>
                    <span>{extractReviewSummary.warningCount} warnings</span>
                  </div>
                </div>
              ) : null}
              {extractFieldReview?.sectionsNeedingReview?.length > 0 ? (
                <div className="extract-review-checklist">
                  <strong>Give these sections a second look before you apply them:</strong>
                  <div className="extract-review-checklist-items">
                    {extractFieldReview.sectionsNeedingReview.map((section) => (
                      <span key={section.key} className={`extract-review-checklist-item extract-review-checklist-item-${section.status}`}>
                        <i className={`fas ${getReviewToneIcon(section.status)}`} />
                        {section.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="extract-preview-shell">
                <div className="extract-preview-header">
                  <div className="extract-preview-heading">
                    <span className="add-recipe-panel-kicker">Preview ready</span>
                    <strong>{extractCandidate.data.name || 'Unnamed recipe'}</strong>
                    {extractCandidate.meta ? <span className="extract-meta">Source: {extractCandidate.meta.source} ({extractCandidate.meta.domain})</span> : null}
                  </div>
                </div>
                <div className="extract-preview-stats">
                  <span>Ingredients: {(extractCandidate.data.ingredients || []).length}</span>
                  <span>Directions: {(extractCandidate.data.directions || []).length}</span>
                  <span>Categories: {(extractCandidate.data.categories || []).length}</span>
                </div>

                {extractWarnings.length > 0 ? (
                  <div className="extract-warning-box">
                    <strong>Heads up before you apply</strong>
                    {extractWarnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                {extractFieldReview ? (
                  <div className="extract-field-review-grid">
                    <section className={`extract-field-card extract-field-card-${extractFieldReview.fields.name.status}`}>
                      <div className="extract-field-card-header">
                        <div>
                          <h4>Title</h4>
                          <p>{extractFieldReview.fields.name.detail}</p>
                        </div>
                        <span className={`extract-field-status extract-field-status-${extractFieldReview.fields.name.status}`}>
                          <i className={`fas ${getReviewToneIcon(extractFieldReview.fields.name.status)}`} />
                          {getReviewToneLabel(extractFieldReview.fields.name.status)}
                        </span>
                      </div>
                      <div className="extract-field-card-body">
                        <strong>{extractCandidate.data.name || 'No title captured yet'}</strong>
                      </div>
                    </section>

                    <section className={`extract-field-card extract-field-card-${extractFieldReview.fields.ingredients.status}`}>
                      <div className="extract-field-card-header">
                        <div>
                          <h4>Ingredients</h4>
                          <p>{extractFieldReview.fields.ingredients.detail}</p>
                        </div>
                        <span className={`extract-field-status extract-field-status-${extractFieldReview.fields.ingredients.status}`}>
                          <i className={`fas ${getReviewToneIcon(extractFieldReview.fields.ingredients.status)}`} />
                          {getReviewToneLabel(extractFieldReview.fields.ingredients.status)}
                        </span>
                      </div>
                      {renderSuspiciousList(
                        extractFieldReview.suspiciousIngredients,
                        'Ingredient lines worth a quick double-check',
                        'No ingredient lines were flagged for follow-up.',
                      )}
                    </section>

                    <section className={`extract-field-card extract-field-card-${extractFieldReview.fields.directions.status}`}>
                      <div className="extract-field-card-header">
                        <div>
                          <h4>Directions</h4>
                          <p>{extractFieldReview.fields.directions.detail}</p>
                        </div>
                        <span className={`extract-field-status extract-field-status-${extractFieldReview.fields.directions.status}`}>
                          <i className={`fas ${getReviewToneIcon(extractFieldReview.fields.directions.status)}`} />
                          {getReviewToneLabel(extractFieldReview.fields.directions.status)}
                        </span>
                      </div>
                      {renderSuspiciousList(
                        extractFieldReview.suspiciousDirections,
                        'Direction steps worth a quick double-check',
                        'No direction steps were flagged for follow-up.',
                      )}
                    </section>

                    <section className={`extract-field-card extract-field-card-${extractFieldReview.fields.categories.status}`}>
                      <div className="extract-field-card-header">
                        <div>
                          <h4>Categories</h4>
                          <p>{extractFieldReview.fields.categories.detail}</p>
                        </div>
                        <span className={`extract-field-status extract-field-status-${extractFieldReview.fields.categories.status}`}>
                          <i className={`fas ${getReviewToneIcon(extractFieldReview.fields.categories.status)}`} />
                          {getReviewToneLabel(extractFieldReview.fields.categories.status)}
                        </span>
                      </div>
                      {Array.isArray(extractCandidate.data.categories) && extractCandidate.data.categories.length > 0 ? (
                        <div className="extract-category-chips">
                          {extractCandidate.data.categories.map((category) => (
                            <span key={category} className="extract-category-chip">{formatCategory(category)}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="extract-field-empty">No category suggestions yet.</p>
                      )}
                    </section>
                  </div>
                ) : null}

                {extractCandidate.data.image ? (
                  <div className="extract-image-preview">
                    <img src={extractCandidate.data.image} alt="Extracted recipe" />
                  </div>
                ) : null}

                <div className="extract-preview-footer">
                  <div className="extract-preview-footer-copy">
                    <span className="add-recipe-panel-kicker">Apply or discard</span>
                    <p>Apply fills the editable form below so you can keep refining. Discard leaves your current draft untouched.</p>
                  </div>
                  <div className="extract-preview-actions">
                    <button className="btn btn-secondary btn-small" type="button" onClick={discardExtractCandidate}>
                      Discard Extract
                    </button>
                    <button className="btn btn-primary btn-small" type="button" onClick={applyExtractCandidate}>
                      Apply Extracted Fields
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : currentRecipeType !== 'custom' ? (
            <section className="add-recipe-panel extract-preview-card extract-preview-card-empty">
              <div className="add-recipe-panel-header extract-preview-panel-header">
                <span className="add-recipe-panel-kicker">Step 2</span>
                <h3>2. Review the extracted recipe</h3>
                <p>Your preview will appear here after you run the extractor or recipe card scan.</p>
              </div>
              <EmptyStateCard
                compact
                icon={currentRecipeType === 'url' ? 'fa-link' : 'fa-camera'}
                title={currentRecipeType === 'url' ? 'Extract first, then review' : 'Scan first, then review'}
                description={
                  currentRecipeType === 'url'
                    ? 'Once the link is processed, Dish Depot will stage the title, ingredients, directions, and categories here before anything is applied.'
                    : 'Once the card is scanned, Dish Depot will stage the title, handwriting, and suggested categories here before anything is applied.'
                }
              />
            </section>
          ) : null}

          <section className="add-recipe-panel add-recipe-details-panel">
            <div className="add-recipe-panel-header">
              <span className="add-recipe-panel-kicker">{currentRecipeType === 'custom' ? 'Step 1' : 'Step 3'}</span>
              <h3>{currentRecipeType === 'custom' ? '1. Add your recipe details' : '3. Finalize recipe details'}</h3>
              <p>Edit the fields below so the saved recipe reads cleanly and feels intentional when you revisit it later.</p>
            </div>

            <div className="add-recipe-group-stack">
              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Recipe identity</span>
                  <h4>Start with the name</h4>
                  <p>Give the recipe a clear title first so every other detail has an anchor.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="recipeName">Recipe Name</label>
                  <input id="recipeName" type="text" required value={form.name ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                </div>
              </section>

              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Ingredients</span>
                  <h4>{currentRecipeType === 'custom' ? 'Shape the ingredient list' : 'Refine the extracted ingredients'}</h4>
                  <p>{currentRecipeType === 'custom' ? 'One ingredient per line keeps the recipe easier to scan later.' : 'Use the cleanup tools if the extraction merged ingredients or left them too dense.'}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="recipeIngredients">{currentRecipeType === 'custom' ? 'Ingredients' : 'Ingredients (optional / extracted)'}</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">{currentRecipeType === 'custom' ? 'Paste a list or type one ingredient per line.' : 'One ingredient per line works best.'}</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients')}>
                        Clean Lines
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients', { splitCommas: true })}>
                        Split Commas
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeIngredients" rows="4" placeholder={currentRecipeType === 'custom' ? 'Enter ingredients, one per line' : 'Extracted ingredients will appear here'} value={form.ingredients ?? ''} onChange={(event) => updateRecipeFormField('ingredients', event.target.value)} />
                </div>
              </section>

              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Directions</span>
                  <h4>{currentRecipeType === 'custom' ? 'Shape the step flow' : 'Refine the extracted directions'}</h4>
                  <p>{currentRecipeType === 'custom' ? 'Keep one step per line for easier reading later.' : 'Review each step and renumber after major edits so the recipe stays easy to follow.'}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="recipeDirections">{currentRecipeType === 'custom' ? 'Directions' : 'Directions (optional / extracted)'}</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">{currentRecipeType === 'custom' ? 'Keep one step per line for easier reading later.' : 'Review each step and renumber after major edits.'}</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions')}>
                        Clean Steps
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions', { numberSteps: true })}>
                        Number Steps
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeDirections" rows="4" placeholder={currentRecipeType === 'custom' ? 'Enter directions, one step per line' : 'Extracted directions will appear here'} value={form.directions ?? ''} onChange={(event) => updateRecipeFormField('directions', event.target.value)} />
                </div>
              </section>
            </div>
          </section>

          <section className="add-recipe-panel add-recipe-extra-panel">
            <div className="add-recipe-panel-header">
              <span className="add-recipe-panel-kicker">{currentRecipeType === 'custom' ? 'Step 2' : 'Step 4'}</span>
              <h3>{currentRecipeType === 'custom' ? '2. Add finishing touches' : '4. Add finishing touches'}</h3>
              <p>Add the optional presentation details that make the saved recipe feel complete instead of rushed.</p>
            </div>

            <div className="add-recipe-group-stack">
              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Presentation</span>
                  <h4>Add an image if it helps the recipe feel recognizable</h4>
                  <p>A photo is optional, but it can make the saved card feel more inviting when you browse later.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="recipeImage">Recipe Image URL (optional)</label>
                  <input id="recipeImage" type="url" placeholder="https://example.com/recipe-image.jpg" value={form.image ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))} />
                </div>

                {form.image ? (
                  <div className="recipe-image-editor">
                    <div className="extract-image-preview">
                      <img src={form.image} alt="Recipe preview" />
                    </div>
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => setForm((prev) => ({ ...prev, image: '' }))}>
                      <i className="fas fa-image" />
                      Remove Image
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Organization</span>
                  <h4>Choose the categories people will look for later</h4>
                  <p>Use categories to make browsing and sharing feel obvious instead of guesswork.</p>
                </div>

                <fieldset className="form-group form-group-fieldset">
                  <legend>Categories (select at least one)</legend>
                  <div className="field-tools-row field-tools-row-categories">
                    <span className="field-helper-text">
                      {form.categories.length === 0 ? 'Choose at least one category.' : `${form.categories.length} categor${form.categories.length === 1 ? 'y' : 'ies'} selected`}
                    </span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => updateRecipeFormField('categories', categoryOptions)}>
                        Select All
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => updateRecipeFormField('categories', [])}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="category-checkboxes">
                    {categoryOptions.map((category) => (
                      <div key={category} className="checkbox-item">
                        <input id={`cat-${category}`} type="checkbox" checked={form.categories.includes(category)} onChange={() => toggleCategory(category)} />
                        <label htmlFor={`cat-${category}`}>{formatCategory(category)}</label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </section>

              <section className="add-recipe-field-group">
                <div className="add-recipe-field-group-header">
                  <span className="add-recipe-panel-kicker">Context</span>
                  <h4>Leave helpful notes and set who should see it</h4>
                  <p>Use notes for serving tips, family context, or reminders that should live with the recipe.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="recipeNotes">Notes (optional)</label>
                  <textarea id="recipeNotes" rows="3" value={form.notes ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </div>

                {hasSupabaseConfig ? (
                  <div className="form-group">
                    <label htmlFor="recipeVisibility">Visibility</label>
                    <select id="recipeVisibility" value={form.visibility || 'private'} onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}>
                      <option value="private">Private</option>
                      <option value="shared">Shared</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          <div className="add-recipe-footer">
            <div className="add-recipe-footer-copy">
              <span className="add-recipe-panel-kicker">Final step</span>
              <strong>{currentEditingId ? 'Save when this updated version feels right.' : 'Save when this recipe feels ready to revisit later.'}</strong>
              <p>{currentEditingId ? 'Your existing recipe only changes after you save this update.' : 'Nothing is added to Dish Depot until you save this recipe.'}</p>
            </div>
            <div className="add-recipe-submit-row">
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                {currentEditingId ? 'Close Without Saving' : 'Discard Draft'}
              </button>
              <button className="btn btn-primary" type="submit">
                {currentEditingId ? 'Update Recipe' : 'Add Recipe'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
