import { ModalCloseButton, ModalHeader } from './ModalPrimitives'

export default function ProfileModal({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  isResetFlowActive,
  onCompletePasswordReset,
  resetPasswordDraft,
  onChangeResetPasswordDraft,
  resetPasswordConfirm,
  onChangeResetPasswordConfirm,
  onCancelPasswordReset,
  resetPasswordBusy,
  authUser,
  onProfileSave,
  profileAvatarEditBtnRef,
  onAvatarEditClick,
  profileUploading,
  isAvatarActionMenuOpen,
  profileAvatarUrl,
  dishDepotLogo,
  profileAvatarInputRef,
  onAvatarUpload,
  profileAvatarMenuRef,
  onSelectAvatarPhoto,
  onRemoveAvatarPhoto,
  profileAvatarValue,
  profileDisplayName,
  onChangeProfileDisplayName,
  profileUsername,
  onChangeProfileUsername,
  onSignOut,
  profileBusy,
  onAuthSubmit,
  authMode,
  onChangeAuthMode,
  authDisplayName,
  onChangeAuthDisplayName,
  authUsername,
  onChangeAuthUsername,
  authEmail,
  onChangeAuthEmail,
  authPassword,
  onChangeAuthPassword,
  onRequestPasswordReset,
  authBusy,
}) {
  if (!isOpen) {
    return null
  }

  const isSignedIn = Boolean(authUser)
  const isSignUpMode = authMode === 'signup'
  const surfaceState = isResetFlowActive ? 'reset' : isSignedIn ? 'signed-in' : 'signed-out'
  const profileIdentityLabel = profileDisplayName.trim() || profileUsername.trim() || authUser?.email || 'Dish Depot member'
  const profileIdentityMeta = profileUsername.trim() ? `@${profileUsername.trim()}` : authUser?.email || 'Account details'
  const authModeTitle = isSignUpMode ? 'Create your Dish Depot account' : 'Sign in to Dish Depot'
  const authModeDescription = isSignUpMode
    ? 'Choose the name people will recognize when you share recipes. You can always refine the details after you are in.'
    : 'Use the email and password already connected to your Dish Depot account to get back to your recipes.'
  const authTrustCues = isSignUpMode
    ? [
        { icon: 'fa-id-card', label: 'Display name optional' },
        { icon: 'fa-at', label: 'Username for sharing' },
        { icon: 'fa-palette', label: 'Theme stays nearby' },
      ]
    : [
        { icon: 'fa-envelope', label: 'Email sign-in' },
        { icon: 'fa-cloud', label: 'Recipes and sync' },
        { icon: 'fa-key', label: 'Reset when needed' },
      ]

  const subtitle = isResetFlowActive
    ? 'Set a new password for your Dish Depot account.'
    : isSignedIn
      ? 'Update how other Dish Depot users find and recognize you.'
      : 'Sign in to sync recipes, sharing, and your account profile.'

  return (
    <div
      className="modal show profile-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      aria-describedby="profile-modal-subtitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-content profile-modal">
        <div className={`modal-shell profile-modal-shell profile-modal-shell-${surfaceState}`}>
          <ModalCloseButton onClick={onClose} label="Close profile" />
          <ModalHeader title="Profile" subtitle={subtitle} titleId="profile-modal-title" subtitleId="profile-modal-subtitle" />
          <div className="profile-top-rail">
            <section className={`profile-state-card profile-state-card-${surfaceState}`} aria-label="Account state overview">
              <div className="profile-state-copy">
                <span className="profile-section-kicker">
                  {isResetFlowActive ? 'Password recovery' : isSignedIn ? 'Signed in' : 'Cloud account'}
                </span>
                <strong>
                  {isResetFlowActive ? 'Choose a new password calmly.' : isSignedIn ? 'Your Dish Depot identity is ready.' : authModeTitle}
                </strong>
                <p>
                  {isResetFlowActive
                    ? 'Enter your new password once, confirm it, and you are back in without leaving this account space.'
                    : isSignedIn
                      ? 'Photo, name, username, and theme now live together so your account feels deliberate instead of scattered.'
                      : authModeDescription}
                </p>
              </div>
              <div className="profile-state-chips">
                {isResetFlowActive ? (
                  <>
                    <span className="profile-inline-chip profile-inline-chip-reset">
                      <i className="fas fa-shield-heart" />
                      Recovery mode
                    </span>
                    <span className="profile-inline-chip">
                      <i className="fas fa-lock" />
                      New password
                    </span>
                  </>
                ) : isSignedIn ? (
                  <>
                    <span className="profile-inline-chip profile-inline-chip-success">
                      <i className="fas fa-circle-check" />
                      Account ready
                    </span>
                    <span className="profile-inline-chip">
                      <i className="fas fa-user-circle" />
                      Identity first
                    </span>
                  </>
                ) : (
                  authTrustCues.map((cue) => (
                    <span key={cue.label} className="profile-inline-chip">
                      <i className={`fas ${cue.icon}`} />
                      {cue.label}
                    </span>
                  ))
                )}
              </div>
            </section>

            <div className="profile-theme-card">
              <div className="profile-theme-copy">
                <span className="profile-section-kicker">Appearance</span>
                <strong>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</strong>
                <p>{isSignedIn ? 'Keep account and theme controls together while you make profile changes.' : 'Pick the look you want before you continue with account setup.'}</p>
              </div>
              <div className="profile-theme-row">
                <span className="profile-theme-label">Theme</span>
                <label className="theme-switch" aria-label="Toggle dark mode">
                  <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme} />
                  <span className="theme-switch-track">
                    <span className="theme-switch-knob">
                      <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
                    </span>
                  </span>
                  <span className="theme-switch-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </label>
              </div>
            </div>
          </div>
          {isResetFlowActive ? (
            <form className="profile-auth-form" onSubmit={onCompletePasswordReset}>
              <div className="profile-form-card profile-form-card-emphasis">
                <div className="profile-card-heading">
                  <span className="profile-section-kicker">Reset password</span>
                  <strong>Save a fresh password</strong>
                  <p>Use the same calm flow for both fields, then confirm once to finish recovery.</p>
                </div>

                <div className="profile-auth-fields">
                  <div className="form-group profile-auth-field">
                    <label htmlFor="profileResetPassword">New password</label>
                    <input
                      id="profileResetPassword"
                      type="password"
                      value={resetPasswordDraft}
                      onChange={(event) => onChangeResetPasswordDraft(event.target.value)}
                      placeholder="New password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="form-group profile-auth-field">
                    <label htmlFor="profileResetPasswordConfirm">Confirm new password</label>
                    <input
                      id="profileResetPasswordConfirm"
                      type="password"
                      value={resetPasswordConfirm}
                      onChange={(event) => onChangeResetPasswordConfirm(event.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-actions">
                <button className="btn btn-secondary" type="button" onClick={onCancelPasswordReset} disabled={resetPasswordBusy}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={resetPasswordBusy}>
                  {resetPasswordBusy ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          ) : isSignedIn ? (
            <form className="profile-form" onSubmit={onProfileSave}>
              <div className="profile-form-card profile-form-card-emphasis">
                <div className="profile-account-summary">
                  <div className="profile-avatar-stack">
                    <div className="profile-avatar-row">
                      <button
                        ref={profileAvatarEditBtnRef}
                        className="profile-avatar-edit-btn"
                        type="button"
                        onClick={onAvatarEditClick}
                        disabled={profileUploading}
                        aria-label="Edit profile picture"
                        aria-expanded={isAvatarActionMenuOpen}
                        aria-controls="profile-avatar-actions-menu"
                        aria-haspopup="true"
                      >
                        <i className="fas fa-pen" />
                        <span>{profileUploading ? 'Updating' : 'Edit'}</span>
                      </button>
                      <img className="profile-avatar-preview" src={profileAvatarUrl || dishDepotLogo} alt="Profile avatar preview" />
                      <input
                        ref={profileAvatarInputRef}
                        id="profileAvatarUpload"
                        className="profile-avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={onAvatarUpload}
                        disabled={profileUploading}
                      />

                    </div>
                    {isAvatarActionMenuOpen ? (
                      <fieldset
                        ref={profileAvatarMenuRef}
                        id="profile-avatar-actions-menu"
                        className="profile-avatar-actions-menu profile-avatar-actions-menu-inline"
                        aria-label="Profile photo actions"
                      >
                        <legend className="visually-hidden">Profile photo actions</legend>
                        <button className="btn btn-secondary" type="button" onClick={onSelectAvatarPhoto}>
                          <i className="fas fa-image" />
                          Choose Photo
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={onRemoveAvatarPhoto}
                          disabled={!profileAvatarValue && !profileAvatarUrl}
                        >
                          <i className="fas fa-trash" />
                          Remove Photo
                        </button>
                      </fieldset>
                    ) : null}
                    <p className="profile-avatar-caption">Optional profile photo for your account card and sharing surfaces.</p>
                  </div>

                  <div className="profile-account-copy">
                    <span className="profile-section-kicker">Identity</span>
                    <strong>{profileIdentityLabel}</strong>
                    <p>{authUser?.email || 'Keep the details below tidy so people recognize you right away.'}</p>
                    <div className="profile-state-chips profile-state-chips-inline">
                      <span className="profile-inline-chip profile-inline-chip-success">
                        <i className="fas fa-circle-check" />
                        Signed in
                      </span>
                      <span className="profile-inline-chip">
                        <i className="fas fa-at" />
                        {profileIdentityMeta}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-form-card">
                <div className="profile-card-heading">
                  <span className="profile-section-kicker">Profile details</span>
                  <strong>Keep your account recognizable</strong>
                  <p>Display name shapes how you appear across Dish Depot, while username stays clean and easy to find.</p>
                </div>

                <div className="profile-field-grid">
                  <div className="form-group profile-field-grid-item">
                    <label htmlFor="profileDisplayName">Display Name</label>
                    <input
                      id="profileDisplayName"
                      type="text"
                      value={profileDisplayName}
                      onChange={(event) => onChangeProfileDisplayName(event.target.value)}
                      placeholder="How your name appears"
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group profile-field-grid-item">
                    <label htmlFor="profileUsername">Username</label>
                    <input
                      id="profileUsername"
                      type="text"
                      required
                      minLength={3}
                      value={profileUsername}
                      onChange={(event) => onChangeProfileUsername(event.target.value.toLowerCase())}
                      placeholder="username"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {authUser?.email ? (
                  <div className="profile-readonly-row">
                    <span className="profile-readonly-label">Email</span>
                    <strong>{authUser.email}</strong>
                  </div>
                ) : null}
              </div>

              <div className="profile-form-actions">
                <button className="btn btn-secondary" type="button" onClick={onSignOut}>
                  <i className="fas fa-right-from-bracket" />
                  Sign Out
                </button>
                <button className="btn btn-primary" type="submit" disabled={profileBusy || profileUploading}>
                  {profileBusy ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <form className="profile-auth-form" onSubmit={onAuthSubmit}>
              <div className="profile-form-card profile-form-card-emphasis">
                <div className="profile-card-heading profile-card-heading-tight">
                  <span className="profile-section-kicker">Account access</span>
                  <strong>{authModeTitle}</strong>
                  <p>{authModeDescription}</p>
                </div>

                <fieldset className="auth-mode-toggle profile-auth-mode-toggle">
                  <legend className="visually-hidden">Authentication mode</legend>
                  <button
                    className={`btn btn-small ${authMode === 'signin' ? 'btn-primary' : 'btn-secondary'} profile-auth-mode-button`}
                    type="button"
                    onClick={() => onChangeAuthMode('signin')}
                    aria-pressed={authMode === 'signin'}
                  >
                    <span>Sign In</span>
                    <small>Use your existing account</small>
                  </button>
                  <button
                    className={`btn btn-small ${authMode === 'signup' ? 'btn-primary' : 'btn-secondary'} profile-auth-mode-button`}
                    type="button"
                    onClick={() => onChangeAuthMode('signup')}
                    aria-pressed={authMode === 'signup'}
                  >
                    <span>Sign Up</span>
                    <small>Create your account</small>
                  </button>
                </fieldset>

                <div className="profile-auth-fields">
                  {authMode === 'signup' ? (
                    <>
                      <div className="form-group profile-auth-field">
                        <label htmlFor="profileAuthDisplayName">Display Name</label>
                        <input
                          id="profileAuthDisplayName"
                          type="text"
                          value={authDisplayName}
                          onChange={(event) => onChangeAuthDisplayName(event.target.value)}
                          placeholder="Display name (optional)"
                          autoComplete="name"
                        />
                      </div>
                      <div className="form-group profile-auth-field">
                        <label htmlFor="profileAuthUsername">Username</label>
                        <input
                          id="profileAuthUsername"
                          type="text"
                          value={authUsername}
                          onChange={(event) => onChangeAuthUsername(event.target.value.toLowerCase())}
                          placeholder="Username"
                          autoComplete="username"
                          minLength={3}
                          required
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="form-group profile-auth-field">
                    <label htmlFor="profileAuthEmail">Email</label>
                    <input
                      id="profileAuthEmail"
                      type="email"
                      value={authEmail}
                      onChange={(event) => onChangeAuthEmail(event.target.value)}
                      placeholder="Email"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="form-group profile-auth-field">
                    <label htmlFor="profileAuthPassword">Password</label>
                    <input
                      id="profileAuthPassword"
                      type="password"
                      value={authPassword}
                      onChange={(event) => onChangeAuthPassword(event.target.value)}
                      placeholder="Password"
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="profile-state-chips profile-state-chips-inline">
                  {authTrustCues.map((cue) => (
                    <span key={cue.label} className="profile-inline-chip">
                      <i className={`fas ${cue.icon}`} />
                      {cue.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-form-actions profile-auth-actions">
                {authMode === 'signin' ? (
                  <button className="btn btn-secondary" type="button" onClick={onRequestPasswordReset} disabled={authBusy}>
                    Forgot Password?
                  </button>
                ) : null}
                <button className="btn btn-primary" type="submit" disabled={authBusy}>
                  {authBusy ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
