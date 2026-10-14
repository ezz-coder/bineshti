import { useEffect, useState } from 'react';

import api from '../services/api';

/**
 * يجلب كامل إعدادات الموقع (الشعار، النبذة، روابط التواصل...) من /api/settings.
 * يتعامل مع الأخطاء بهدوء (يُرجع null بدل كسر الصفحة).
 * ملاحظة: هذا Hook جديد ومستقل — الـ Hook القديم useSettings (رقم الهاتف فقط)
 * ما زال موجوداً كما هو ولم يُمس لضمان عدم كسر الصفحات التي تستخدمه.
 */
export default function useSiteSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await api.get('/settings');
        const data = res?.data?.data;
        if (active && data) {
          setSettings(data);
        }
      } catch (err) {
        // نتجاهل الخطأ بصمت — الإعدادات اختيارية ولها قيم افتراضية
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}