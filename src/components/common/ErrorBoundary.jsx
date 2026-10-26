import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Application error', error, info.componentStack); }
  render() {
    if (this.state.hasError) return <main className="status-loading"><section className="account-panel"><h1 className="text-xl font-semibold mb-3">We couldn’t open this view</h1><p className="text-sm text-slate-400 mb-5">Reload to try again. Your saved records have not been cleared.</p><button className="primary-button w-full" onClick={() => window.location.reload()}>Reload workspace</button></section></main>;
    return this.props.children;
  }
}
