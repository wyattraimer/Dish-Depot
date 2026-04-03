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
  return (
    <div className="modal show" role="dialog" aria-modal="true" onClick={closeModal}>
      <div className="modal-content add-recipe-modal" onClick={(event) => event.stopPropagation()}>
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        <h2>{currentEditingId ? 'Edit Recipe' : 'Add New Recipe'}</h2>
        <p className="add-recipe-subtitle">
          {currentRecipeType === 'url'
            ? 'Paste a recipe link first, extract the details, then fine-tune anything before saving.'
            : currentRecipeType === 'card'
              ? 'Upload a clear recipe card photo first, then review the scanned text before saving.'
              : 'Enter your recipe details manually and save when everything looks right.'}
        </p>

        <div className="form-group recipe-type-toggle">
          <label>How do you want to start?</label>
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
        </div>

        <form className="add-recipe-form" onSubmit={handleSubmit}>
          {currentRecipeType !== 'custom' ? (
            <section className="add-recipe-panel add-recipe-source-panel">
              <div className="add-recipe-panel-header">
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
                    <p className="extract-notice">
                      {!isOnline
                        ? 'You are offline. URL extraction needs internet, but your saved recipes, planner, and cached pages still work.'
                        : !isApiReachable
                          ? 'The extraction service is currently unreachable. Your recipes are safe locally; try extraction again in a moment.'
                          : 'First extract can take 30 - 50 seconds while the API wakes up. After that, extracts are usually much faster.'}
                    </p>
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
                    <p className="extract-notice">
                      {!isOnline
                        ? 'You are offline. Recipe card scanning needs internet right now.'
                        : !isApiReachable
                          ? 'The scanning service is currently unreachable. Please try again in a moment.'
                          : 'Scan works best with high contrast handwriting and an evenly lit recipe card photo.'}
                    </p>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {extractCandidate ? (
            <section className="add-recipe-panel extract-preview-card">
              <div className="add-recipe-panel-header extract-preview-panel-header">
                <h3>2. Review the extracted recipe</h3>
                <p>Check the preview before you apply the fields into your recipe form.</p>
              </div>
              {extractReviewSummary ? (
                <div className={`extract-review-banner extract-review-banner-${extractReviewSummary.status}`}>
                  <div className="extract-review-banner-text">
                    <strong>{extractReviewSummary.headline}</strong>
                    <p>{extractReviewSummary.detail}</p>
                  </div>
                  <div className="extract-review-banner-stats" aria-label="Scan review summary">
                    <span>{extractReviewSummary.ingredientsCount} ingredients</span>
                    <span>{extractReviewSummary.directionsCount} directions</span>
                    <span>{extractReviewSummary.warningCount} warnings</span>
                  </div>
                </div>
              ) : null}
              <div className="extract-preview-shell">
                <div className="extract-preview-header">
                  <strong>{extractCandidate.data.name || 'Unnamed recipe'}</strong>
                  {extractCandidate.meta ? <span className="extract-meta">Source: {extractCandidate.meta.source} ({extractCandidate.meta.domain})</span> : null}
                </div>
                <div className="extract-preview-stats">
                  <span>Ingredients: {(extractCandidate.data.ingredients || []).length}</span>
                  <span>Directions: {(extractCandidate.data.directions || []).length}</span>
                  <span>Categories: {(extractCandidate.data.categories || []).length}</span>
                </div>

                {extractWarnings.length > 0 ? (
                  <div className="extract-warning-box">
                    {extractWarnings.map((warning, warningIndex) => (
                      <p key={`extract-warning-${warningIndex}`}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                {extractCandidate.data.image ? (
                  <div className="extract-image-preview">
                    <img src={extractCandidate.data.image} alt="Extracted recipe" />
                  </div>
                ) : null}

                <div className="extract-preview-actions">
                  <button className="btn btn-primary btn-small" type="button" onClick={applyExtractCandidate}>
                    Apply Extracted Fields
                  </button>
                  <button className="btn btn-secondary btn-small" type="button" onClick={discardExtractCandidate}>
                    Discard
                  </button>
                </div>
              </div>
            </section>
          ) : currentRecipeType !== 'custom' ? (
            <section className="add-recipe-panel extract-preview-card extract-preview-card-empty">
              <div className="add-recipe-panel-header extract-preview-panel-header">
                <h3>2. Review the extracted recipe</h3>
                <p>Your preview will appear here after you run the extractor or recipe card scan.</p>
              </div>
            </section>
          ) : null}

          <section className="add-recipe-panel add-recipe-details-panel">
            <div className="add-recipe-panel-header">
              <h3>{currentRecipeType === 'custom' ? '1. Add your recipe details' : '3. Finalize recipe details'}</h3>
              <p>Edit the fields below so the saved recipe looks exactly how you want.</p>
            </div>

            <div className="form-group">
              <label htmlFor="recipeName">Recipe Name</label>
              <input id="recipeName" type="text" required value={form.name ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>

            {currentRecipeType !== 'custom' ? (
              <>
                <div className="form-group">
                  <label htmlFor="recipeIngredients">Ingredients (optional / extracted)</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">One ingredient per line works best.</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients')}>
                        Clean Lines
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients', { splitCommas: true })}>
                        Split Commas
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeIngredients" rows="4" placeholder="Extracted ingredients will appear here" value={form.ingredients ?? ''} onChange={(event) => updateRecipeFormField('ingredients', event.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="recipeDirections">Directions (optional / extracted)</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">Review each step and renumber after major edits.</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions')}>
                        Clean Steps
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions', { numberSteps: true })}>
                        Number Steps
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeDirections" rows="4" placeholder="Extracted directions will appear here" value={form.directions ?? ''} onChange={(event) => updateRecipeFormField('directions', event.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="recipeIngredients">Ingredients</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">Paste a list or type one ingredient per line.</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients')}>
                        Clean Lines
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('ingredients', { splitCommas: true })}>
                        Split Commas
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeIngredients" rows="4" placeholder="Enter ingredients, one per line" value={form.ingredients ?? ''} onChange={(event) => updateRecipeFormField('ingredients', event.target.value)} />
                </div>

                <div className="form-group">
                  <label htmlFor="recipeDirections">Directions</label>
                  <div className="field-tools-row">
                    <span className="field-helper-text">Keep one step per line for easier reading later.</span>
                    <div className="field-tools-actions">
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions')}>
                        Clean Steps
                      </button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => applyRecipeFieldCleanup('directions', { numberSteps: true })}>
                        Number Steps
                      </button>
                    </div>
                  </div>
                  <textarea id="recipeDirections" rows="4" placeholder="Enter directions, one step per line" value={form.directions ?? ''} onChange={(event) => updateRecipeFormField('directions', event.target.value)} />
                </div>
              </>
            )}
          </section>

          <section className="add-recipe-panel add-recipe-extra-panel">
            <div className="add-recipe-panel-header">
              <h3>{currentRecipeType === 'custom' ? '2. Add finishing touches' : '4. Add finishing touches'}</h3>
              <p>Add an optional image, then choose categories, notes, and visibility settings.</p>
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

            <div className="form-group">
              <label>Categories (select at least one)</label>
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

          <div className="add-recipe-submit-row">
            <button className="btn btn-primary" type="submit">
              {currentEditingId ? 'Update Recipe' : 'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
