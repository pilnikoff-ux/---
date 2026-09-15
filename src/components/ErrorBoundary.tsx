import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('metamask') ||
      msg.includes('ethereum') ||
      msg.includes('web3') ||
      msg.includes('[vite]')
    ) {
      return { hasError: false, error: null, errorInfo: null };
    }
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('metamask') ||
      msg.includes('ethereum') ||
      msg.includes('web3') ||
      msg.includes('[vite]')
    ) {
      return;
    }
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-100">Виникла помилка під час завантаження</h1>
                <p className="text-xs text-stone-400">Додаток перехопив збій для запобігання білому екрану</p>
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4 text-xs font-mono text-stone-300 overflow-x-auto max-h-48">
              <p className="font-semibold text-rose-400 mb-1">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-stone-500 text-[10px] whitespace-pre-wrap">
                  {this.state.error.stack.slice(0, 500)}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 font-semibold text-sm transition shadow-lg shadow-teal-950/40 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Оновити сторінку
              </button>
              <button
                type="button"
                onClick={this.handleClearStorageAndReset}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-sm transition border border-stone-700 cursor-pointer"
                title="Очистити локальний кеш якщо пошкоджено збережені дані"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Скинути кеш
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
