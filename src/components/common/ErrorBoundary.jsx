import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러를 로깅합니다.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 폴백 UI를 렌더링합니다.
      return (
        <div className="container py-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">오류가 발생했습니다!</h4>
            <p>페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
            <hr />
            <div className="mb-0">
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={() => window.location.reload()}
              >
                페이지 새로고침
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary>개발자 정보 (클릭하여 확장)</summary>
                <pre className="mt-2" style={{ fontSize: '12px' }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
