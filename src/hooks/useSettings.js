import { useEffect, useState } from 'react';

import api from '../services/api';

/**
 * يجلب رقمي التواصل (الاتصال + الواتساب) من /api/settings.
 * يُرجع كائناً: { contactPhone, whatsappPhone }.
 * يتعامل مع الأخطاء بهدوء (تُرجع قيماً فارغة بدل كسر الصفحة).
 */
export default function useSettings() {
  const [phones, setPhones] = useState({ contactPhone: '', whatsappPhone: '' });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await api.get('/settings');
        const data = res?.data?.data;
        if (active && data) {
          setPhones({
            contactPhone: typeof data.contactPhone === 'string' ? data.contactPhone.trim() : '',
            whatsappPhone:
              typeof data.whatsappPhone === 'string' ? data.whatsappPhone.trim() : '',
          });
        }
      } catch (err) {
        // نتجاهل الخطأ بصمت — أرقام التواصل اختيارية
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return phones;
}
