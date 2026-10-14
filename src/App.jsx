import { Route, Routes } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import About from './pages/About';
import Apartments from './pages/Apartments';
import Home from './pages/Home';
import Lands from './pages/Lands';
import Placeholder from './pages/Placeholder';
import PropertyDetails from './pages/PropertyDetails';
import SearchResults from './pages/SearchResults';
import Villas from './pages/Villas';
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProperties from './pages/admin/AdminProperties';
import AdminSettings from './pages/admin/AdminSettings';
import PropertyForm from './pages/admin/PropertyForm';
import useTheme from './hooks/useTheme';

export default function App() {
  // تطبيق ثيم الموقع (داكن/دافئ) على <html> عند بدء التطبيق ومتابعته
  useTheme();

  return (
    <ErrorBoundary>
      <Routes>
        {/* ===== الموقع العام (مع الشريط العلوي والسفلي) ===== */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/villas" element={<Villas />} />
          <Route path="/lands" element={<Lands />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<SearchResults />} />

          {/* صفحات تفاصيل العقار */}
          <Route path="/apartment/:id" element={<PropertyDetails category="apartment" />} />
          <Route path="/villa/:id" element={<PropertyDetails category="villa" />} />
          <Route path="/land/:id" element={<PropertyDetails category="land" />} />
        </Route>

        {/* ===== لوحة التحكم (بدون شريط الموقع) ===== */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />

          {/* إدارة الشقق */}
          <Route path="apartments" element={<AdminProperties category="apartment" />} />
          <Route
            path="apartments/new"
            element={
              <ErrorBoundary>
                <PropertyForm category="apartment" />
              </ErrorBoundary>
            }
          />
          <Route
            path="apartments/:id/edit"
            element={
              <ErrorBoundary>
                <PropertyForm category="apartment" />
              </ErrorBoundary>
            }
          />

          {/* إدارة الفلل */}
          <Route path="villas" element={<AdminProperties category="villa" />} />
          <Route
            path="villas/new"
            element={
              <ErrorBoundary>
                <PropertyForm category="villa" />
              </ErrorBoundary>
            }
          />
          <Route
            path="villas/:id/edit"
            element={
              <ErrorBoundary>
                <PropertyForm category="villa" />
              </ErrorBoundary>
            }
          />

          {/* إدارة الأراضي */}
          <Route path="lands" element={<AdminProperties category="land" />} />
          <Route
            path="lands/new"
            element={
              <ErrorBoundary>
                <PropertyForm category="land" />
              </ErrorBoundary>
            }
          />
          <Route
            path="lands/:id/edit"
            element={
              <ErrorBoundary>
                <PropertyForm category="land" />
              </ErrorBoundary>
            }
          />

          {/* الإعدادات */}
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* مسار غير معروف */}
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </ErrorBoundary>
  );
}
