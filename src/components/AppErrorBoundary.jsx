import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary] UI error captured', {
      error,
      errorInfo,
      scope: this.props.scope || 'app',
    })
  }

  resetBoundary = () => {
    this.setState({ hasError: false, error: null })
    if (typeof this.props.onReset === 'function') {
      this.props.onReset()
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const isModalScope = this.props.scope === 'modal'
    const title = isModalScope ? 'This dialog could not finish opening' : 'Dish Depot ran into a display problem'
    const detail = isModalScope
      ? 'Close this dialog and try the same action again. If it keeps failing, reload the app to rebuild the screen cleanly.'
      : 'Reloading the app is the fastest way to recover. Your saved recipes and synced data remain stored.'
    const scopeLabel = isModalScope ? 'Dialog recovery' : 'App recovery'
    const reassurance = isModalScope
      ? 'Nothing has been deleted. This interruption is limited to the current dialog surface.'
      : 'This usually means the current screen failed to render, not that your saved Dish Depot data was lost.'
    const recoverySteps = isModalScope
      ? ['Close the dialog and reopen it.', 'If it happens again, reload the app.']
      : ['Try the screen again with Try Again.', 'Reload the app if the problem continues.']
    const technicalNote = this.state.error?.message ? `Technical note: ${this.state.error.message}` : ''

    if (isModalScope) {
      return (
        <div className="modal show" role="dialog" aria-modal="true">
          <div className="modal-content modal-error-content">
            <div className="app-error-card app-error-card-modal">
              <div className="app-error-badge">
                <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                <span>{scopeLabel}</span>
              </div>
              <div className="app-error-copy">
                <h2>{title}</h2>
                <p>{detail}</p>
              </div>
              <div className="app-error-reassurance">
                <strong>What happened</strong>
                <p>{reassurance}</p>
              </div>
              <ol className="app-error-steps">
                {recoverySteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {technicalNote ? <p className="app-error-technical">{technicalNote}</p> : null}
              <div className="app-error-actions">
                <button className="btn btn-secondary" type="button" onClick={this.resetBoundary}>
                  Try Again
                </button>
                <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
                  Reload App
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="app-error-shell">
        <div className="app-error-card">
          <img className="app-error-logo" src={this.props.logoSrc} alt="Dish Depot logo" />
          <div className="app-error-badge">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <span>{scopeLabel}</span>
          </div>
          <div className="app-error-copy">
            <h1>{title}</h1>
            <p>{detail}</p>
          </div>
          <div className="app-error-reassurance">
            <strong>What happened</strong>
            <p>{reassurance}</p>
          </div>
          <ol className="app-error-steps">
            {recoverySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {technicalNote ? <p className="app-error-technical">{technicalNote}</p> : null}
          <div className="app-error-actions">
            <button className="btn btn-secondary" type="button" onClick={this.resetBoundary}>
              Try Again
            </button>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      </div>
    )
  }
}
