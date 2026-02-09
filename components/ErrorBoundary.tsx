import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Đã xảy ra lỗi không mong muốn</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            Hệ thống gặp sự cố khi hiển thị nội dung này. Chúng tôi đã ghi nhận lỗi và sẽ khắc phục sớm nhất.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} variant="primary" className="gap-2">
              <RefreshCw size={18} /> Tải lại trang
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="secondary" className="gap-2">
              <Home size={18} /> Về Trang Chủ
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 p-4 bg-gray-200 dark:bg-black rounded text-left overflow-auto max-w-2xl w-full text-xs font-mono text-red-600">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}