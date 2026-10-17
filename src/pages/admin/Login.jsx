import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { IconLock } from '../../components/icons';
import { adminApi, getApiErrorMessage, setToken } from '../../services/api';
import { APP_NAME } from '../../utils/constants';

/**
 * صفحة تسجيل الدخول للوحة التحكم — تطلب كلمة المرور فقط.
 * عند النجاح تحفظ التوكن في localStorage وتوجّه للوحة التحكم.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminApi.post('/admin/login', { password });
      const token = res?.data?.token;
      if (token) {
        setToken(token);
        const to = location.state?.from?.pathname || '/admin';
        navigate(to, { replace: true });
      } else {
        setError('تعذّر الحصول على رمز الدخول.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'فشل تسجيل الدخول. تحقّق من كلمة المرور.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft-beige px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft-blue text-accent">
            <IconLock className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-dark-gray">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-dark-gray/60">{APP_NAME}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="password" className="block text-sm font-semibold text-dark-gray">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-3 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
            placeholder="أدخل كلمة مرور الإدارة"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-button bg-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60"
          >
            {loading ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}