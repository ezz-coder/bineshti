import { useEffect } from 'react';

import { applyTheme, applyThemeToDom, getSavedTheme, getUserTheme } from '../utils/theme';
import api from '../services/api';

/**
 * يطبّق ثيم الموقع على <html> عبر data-theme.
 * - أولوية أولى: الثيم الخاص الذي اختاره المستخدم من زر الهيدر (user-theme) — يتقدّم دائماً.
 * - وإلا: الثيم الرئيسي القادم من /api/settings (اختيار الأدمن).
 * - وإلا: الثيم المحفوظ محلياً أو الافتراضي ('dark').
 * - استطلاع خفيف كل 30 ثانية حتى يظهر تبديل الأدمن دون إعادة تحميل الصفحة،
 *   دون المساس باختيار المستخدم الخاص إن وُجد.
 */
const useTheme = () => {
  useEffect(() => {
    let active = true;

    const fetchAndApplyTheme = async () => {
      // اختيار المستخدم الخاص له الأولوية المطلقة ولا يتأثر بثيم الأدمن.
      const userTheme = getUserTheme();
      if (userTheme) {
        applyThemeToDom(userTheme);
        return;
      }

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
