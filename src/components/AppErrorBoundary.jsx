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
    const title = isModalScope ? 'This dialog could not load' : 'Dish Depot hit a problem'
    const detail = isModalScope
      ? 'You can close this dialog and try again. If the problem persists, reload the app.'
      : 'Try reloading the app. Your saved recipes and synced data are still stored.'

    if (isModalScope) {
      return (
        <div className="modal show" role="dialog" aria-modal="true">
          <div className="modal-content modal-error-content">
            <div className="app-error-card app-error-card-modal">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              <h2>{title}</h2>
              <p>{detail}</p>
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
          <h1>{title}</h1>
          <p>{detail}</p>
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
