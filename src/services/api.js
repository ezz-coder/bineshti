import axios from 'axios';

/**
 * نسخة axios جاهزة للاستخدام في كل خدمات الـ API.
 * تقرأ عنوان الـ API من متغيرات البيئة VITE_API_URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default api;

// ===== إدارة رمز الدخول (JWT) في localStorage =====

const TOKEN_KEY = 'adminToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * نسخة axios مخصصة لطلبات لوحة التحكم.
 * تُرفق تلقائياً ترويسة Authorization: Bearer <token> من localStorage،
 * مع ترك Content-Type لـ axios (multipart/form-data) عند إرسال FormData.
 */
export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

adminApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // عند إرسال FormData نترك axios يحدد Content-Type والـ boundary تلقائياً.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// عند استجابة 401 (توكن منتهي/غير صالح) نُخرج المستخدم لصفحة الدخول.
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * استخراج رسالة خطأ واضحة من استجابة الـ backend، مع دعم صيغة الأخطاء المُحقّقة.
 */
export function getApiErrorMessage(error, fallback = 'حدث خطأ غير متوقع.') {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).join(' • ');
  }
  return data.message || fallback;
}
