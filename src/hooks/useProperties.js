import { useEffect, useRef, useState } from 'react';

import api from '../services/api';
import { TYPE_LABEL_MAP } from '../utils/constants';

/**
 * يجلب قائمة عقارات قسم معيّن مع فلترة حسب النوع (الكل / إيجار / تمليك).
 *
 * @param {string} endpoint مسار نقطة النهاية مثل '/apartments'
 * @param {'all'|'rent'|'buy'} typeKey مفتاح النوع القادم من TypeToggle
 *   - 'all'  ⇒ نجلب كل عقارات القسم بدون أي query parameters
 *   - 'rent' ⇒ GET ...?type=إيجار
 *   - 'buy'  ⇒ GET ...?type=تمليك
 *
 * الحالات المُعادة:
 *   items   : مصفوفة العقارات
 *   loading : هل يتم التحميل حالياً (true فقط في التحميل الأول لتجنّب الوميض عند تبديل النوع)
 *   error   : هل حدث خطأ
 */
export default function useProperties(endpoint, typeKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // نُظهر مؤشر التحميل في التحميل الأول فقط، لتفادي الوميض عند تبديل النوع.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!hasLoadedRef.current) setLoading(true);
      setError(false);
      try {
        // "الكل" (أو أي قيمة غير معروفة) ⇒ نجلب كل عقارات القسم بدون معاملات.
        const label = typeKey === 'all' ? null : TYPE_LABEL_MAP[typeKey];
        const res = label
          ? await api.get(endpoint, { params: { type: label } })
          : await api.get(endpoint);
        const data = res?.data?.data;
        if (!active) return;
        setItems(Array.isArray(data) ? data : []);
        hasLoadedRef.current = true;
      } catch (err) {
        if (!active) return;
        setError(true);
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [endpoint, typeKey]);

  return { items, loading, error };
}
