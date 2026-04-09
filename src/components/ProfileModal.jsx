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

  const subtitle = isResetFlowActive
    ? 'Set a new password for your Dish Depot account.'
    : authUser
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
        <div className="modal-shell profile-modal-shell">
          <ModalCloseButton onClick={onClose} label="Close profile" />
          <ModalHeader title="Profile" subtitle={subtitle} titleId="profile-modal-title" subtitleId="profile-modal-subtitle" />
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
          {isResetFlowActive ? (
            <form className="profile-auth-form" onSubmit={onCompletePasswordReset}>
              <div className="auth-input-row profile-auth-fields">
                <input
                  type="password"
                  value={resetPasswordDraft}
                  onChange={(event) => onChangeResetPasswordDraft(event.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <input
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(event) => onChangeResetPasswordConfirm(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
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
          ) : authUser ? (
            <form className="profile-form" onSubmit={onProfileSave}>
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
                >
                  <i className="fas fa-pen" />
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

                {isAvatarActionMenuOpen ? (
                  <div
                    ref={profileAvatarMenuRef}
                    id="profile-avatar-actions-menu"
                    className="profile-avatar-actions-menu"
                    role="menu"
                    aria-label="Profile photo actions"
                  >
                    <button className="btn btn-secondary" type="button" role="menuitem" onClick={onSelectAvatarPhoto}>
                      <i className="fas fa-image" />
                      Select Photo
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      role="menuitem"
                      onClick={onRemoveAvatarPhoto}
                      disabled={!profileAvatarValue && !profileAvatarUrl}
                    >
                      <i className="fas fa-trash" />
                      Remove Photo
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="form-group">
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

              <div className="form-group">
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
              <fieldset className="auth-mode-toggle">
                <legend className="visually-hidden">Authentication mode</legend>
                <button
                  className={`btn btn-small ${authMode === 'signin' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => onChangeAuthMode('signin')}
                >
                  Sign In
                </button>
                <button
                  className={`btn btn-small ${authMode === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => onChangeAuthMode('signup')}
                >
                  Sign Up
                </button>
              </fieldset>

              <div className="auth-input-row profile-auth-fields">
                {authMode === 'signup' ? (
                  <>
                    <input
                      type="text"
                      value={authDisplayName}
                      onChange={(event) => onChangeAuthDisplayName(event.target.value)}
                      placeholder="Display name (optional)"
                      autoComplete="name"
                    />
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(event) => onChangeAuthUsername(event.target.value.toLowerCase())}
                      placeholder="Username"
                      autoComplete="username"
                      minLength={3}
                      required
                    />
                  </>
                ) : null}

                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => onChangeAuthEmail(event.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => onChangeAuthPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </div>

              <div className="profile-form-actions">
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
