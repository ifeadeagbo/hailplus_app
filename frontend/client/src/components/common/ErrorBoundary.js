import React from 'react';

// Shows a recovery screen instead of a blank page when a component crashes
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-8">Please reload the page. If the problem continues, contact support.</p>
        <button
          onClick={() => window.location.assign('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Back to the home page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
