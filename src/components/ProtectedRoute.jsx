import { Navigate, useLocation } from 'react-router-dom';

import { getToken } from '../services/api';

/**
 * حارس المسارات: يمنع الوصول لصفحات لوحة التحكم بدون توكن.
 * إن لم يوجد توكن، يعيد التوجيه لصفحة الدخول مع حفظ المسار المقصود.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}