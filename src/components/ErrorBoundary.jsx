import { Component } from 'react';

/**
 * Error Boundary: يلتقط أي خطأ غير متوقع في شجرة React (مثل أخطاء وقت التشغيل)
 * ويعرض رسالة واضحة بدلاً من الصفحة البيضاء الفارغة.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // طباعة تفاصيل الخطأ في الـ Console لتسهيل التتبع.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-soft-beige px-4">
          <div className="w-full max-w-md rounded-card bg-card p-8 text-center shadow-card ring-1 ring-dark-gray/5">
            <h1 className="text-xl font-extrabold text-dark-gray">حدث خطأ غير متوقع</h1>
            <p className="mt-3 text-sm leading-relaxed text-dark-gray/70">
              عذراً، حدثت مشكلة أثناء عرض هذه الصفحة. يمكنك المحاولة مرة أخرى.
            </p>
            {this.state.error?.message && (
              <pre
                dir="ltr"
                className="mt-4 max-h-40 overflow-auto rounded-xl bg-soft-blue px-4 py-3 text-right text-xs text-dark-gray/70"
              >
                {String(this.state.error.message)}
              </pre>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-button bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  window.history.back();
                }}
                className="rounded-button bg-soft-blue px-5 py-2.5 text-sm font-semibold text-dark-gray transition-all duration-300 hover:bg-soft-blue/70"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}