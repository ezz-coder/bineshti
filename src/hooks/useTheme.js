import { useEffect } from 'react';

import { applyTheme, getSavedTheme } from '../utils/theme';
import api from '../services/api';

/**
 * يجلب الثيم المحفوظ من /api/settings ويطبّقه على <html> عبر data-theme.
 * - عند توفر قيمة الثيم من الخادم نطبّقها (ليرى الزائر اختيار الأدمن).
 * - عند غيابها أو فشل الطلب نستخدم الثيم المحفوظ محلياً أو الافتراضي ('dark').
 * - استطلاع خفيف كل 30 ثانية حتى يظهر تبديل الأدمن دون إعادة تحميل الصفحة.
 */
const useTheme = () => {
  useEffect(() => {
    let active = true;

    const fetchAndApplyTheme = async () => {
      try {
        const response = await api.get('/settings');
        // شكل الاستجابة: { success, data: { ..., theme } }
        const serverTheme = response?.data?.data?.theme;
        if (active) {
          applyTheme(serverTheme || getSavedTheme());
        }
      } catch (error) {
        if (active) applyTheme(getSavedTheme());
      }
    };

    fetchAndApplyTheme();
    const interval = setInterval(fetchAndApplyTheme, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
};

export default useTheme;
