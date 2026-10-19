import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useSiteSettings from '../hooks/useSiteSettings';
import { APP_NAME, resolveImageUrl } from '../utils/constants';
import useSettings from '../hooks/useSettings';
import { IconFacebook, IconPhone } from '../components/icons';
import {
  buildAboutMessage,
  buildCallHref,
  buildWhatsappHref,
  isWhatsappNumber,
} from '../utils/contact';

/**
 * صفحة "من نحن" الاحترافية — تعرض بيانات ديناميكية من إعدادات الموقع:
 * الشعار في إطار دائري + اسم الشركة، العنوان الرئيسي، ثلاثة أقسام،
 * صورة إضافية بإطار أنيق، وأزرار التواصل (تظهر/تختفي حسب وجود البيانات).
 */
export default function About() {
  const { t } = useTranslation();
  const { settings, loading } = useSiteSettings();

  // أرقام التواصل: من إعدادات الموقع أولاً، ثم من الـ Hook القديم كاحتياطي
  const hookPhones = useSettings() || {};
  const contactPhone = (settings?.contactPhone || hookPhones.contactPhone || '').trim();
  const whatsappPhone = (settings?.whatsappPhone || hookPhones.whatsappPhone || '').trim();
  const facebookUrl = (settings?.facebookUrl || '').trim();
  const companyName = (settings?.companyName || '').trim() || APP_NAME;
  const logoUrl = settings?.logoUrl?.trim() ? resolveImageUrl(settings.logoUrl) : '';
  const aboutImageUrl = settings?.aboutImageUrl?.trim()
    ? resolveImageUrl(settings.aboutImageUrl)
    : '';

  // إخفاء الصور بلطف إذا فشل تحميلها (ملف مفقود على السيرفر مثلاً) بدل أيقونة مكسورة.
  const [logoFailed, setLogoFailed] = useState(false);
  const [aboutImageFailed, setAboutImageFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);
  useEffect(() => {
    setAboutImageFailed(false);
  }, [aboutImageUrl]);

  // النصوص الديناميكية (فارغ = لا يظهر)
  const aboutTitle = (settings?.aboutTitle || '').trim();
  const aboutSubtitle = (settings?.aboutSubtitle || '').trim();
  const aboutText = (settings?.aboutText || '').trim();
  const sections = [
    {
      title: (settings?.aboutSection1Title || '').trim(),
      content: (settings?.aboutSection1Content || '').trim(),
    },
    {
      title: (settings?.aboutSection2Title || '').trim(),
      content: (settings?.aboutSection2Content || '').trim(),
    },
    {
      title: (settings?.aboutSection3Title || '').trim(),
      content: (settings?.aboutSection3Content || '').trim(),
    },
  ].filter((s) => s.title || s.content);

  // زر الاتصال: tel: برقم الاتصال — زر الواتساب: wa.me برقم الواتساب برسالة جاهزة
  const callHref = buildCallHref(contactPhone);
  const whatsappHref = isWhatsappNumber(whatsappPhone)
    ? buildWhatsappHref(whatsappPhone, buildAboutMessage(companyName))
    : '';

  const features = [
    t('about.feature1'),
    t('about.feature2'),
    t('about.feature3'),
    t('about.feature4'),
  ];

  return (
    <section className="animate-fade-in">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="rounded-card border border-border bg-card p-6 shadow-sm sm:p-10">
          {/* ===== الشعار في إطار دائري + اسم الشركة (في مكانهما الطبيعي أعلى الصفحة) ===== */}
          <div className="flex flex-col items-center text-center">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt="شعار بي نيشتي"
                onError={() => setLogoFailed(true)}
                className="h-32 w-32 rounded-full border-4 border-soft-blue object-contain shadow-lg transition-all duration-300 hover:scale-105 sm:h-36 sm:w-36 lg:h-40 lg:w-40"
              />
            ) : (
              <span className="text-3xl font-extrabold tracking-tight text-dark-gray transition-all duration-300 sm:text-4xl">
                {t('site.short')}
              </span>
            )}
            <p className="mt-4 text-xl font-semibold leading-tight text-dark-gray sm:text-2xl">{companyName}</p>
          </div>

          {/* ===== العنوان الرئيسي والفرعي (ديناميكي) ===== */}
          {(aboutTitle || aboutSubtitle) && (
            <div className="mt-8 text-center">
              {aboutTitle && (
                <h1 className="text-2xl font-bold leading-tight text-dark-gray sm:text-3xl">{aboutTitle}</h1>
              )}
              {aboutSubtitle && (
                <p className="mt-2 text-sm font-medium text-dark-gray/60 sm:text-base">
                  {aboutSubtitle}
                </p>
              )}
            </div>
          )}

          {/* ===== الصورة الإضافية (فوق أقسام النصوص — تظهر فقط إن وُجدت) ===== */}
          {aboutImageUrl && !aboutImageFailed && (
            <div className="my-8 sm:my-12">
              <img
                src={aboutImageUrl}
                alt="صورة من نحن"
                onError={() => setAboutImageFailed(true)}
                className="mx-auto w-full max-w-2xl rounded-xl border-4 border-accent/20 object-cover shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
              />
            </div>
          )}

          {/* ===== النبذة العامة (ديناميكية من الإعدادات) ===== */}
          {loading ? (
            <div className="mt-8 space-y-3">
              <div className="h-4 animate-pulse rounded bg-dark-gray/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-dark-gray/10" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-dark-gray/10" />
            </div>
          ) : aboutText ? (
            <p className="mt-8 whitespace-pre-wrap text-center text-sm leading-relaxed text-dark-gray/80 sm:text-base">
              {aboutText}
            </p>
          ) : (
            !(aboutTitle || sections.length > 0) && (
              <div className="mt-8 space-y-4 leading-relaxed text-dark-gray/80">
                <p>{t('about.p1')}</p>
                <p>{t('about.p2')}</p>
                <p>{t('about.p3')}</p>
              </div>
            )
          )}

          {/* ===== الأقسام الثلاثة (ديناميكية) ===== */}
          {sections.map((section, index) => (
            <div key={index} className="my-8 text-center sm:my-12">
              {section.title && (
                <h2 className="text-xl font-semibold leading-tight text-dark-gray">
                  {section.title}
                </h2>
              )}
              {section.content && (
                <p className="mx-auto mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-dark-gray/80 sm:text-base">
                  {section.content}
                </p>
              )}
            </div>
          ))}

          {/* ===== أزرار التواصل: اتصال + واتساب + فيسبوك (تظهر حسب وجود البيانات) ===== */}
          {(callHref || whatsappHref || facebookUrl) && (
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              {callHref && (
                <a
                  href={callHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-button bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 sm:w-auto"
                >
                  <IconPhone className="h-5 w-5" />
                  اتصال
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-button bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#1fb857] active:scale-95 sm:w-auto"
                >
                  تواصل عبر واتساب
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-button bg-soft-blue px-6 py-3 text-sm font-semibold text-dark-gray transition-all duration-200 hover:scale-105 hover:bg-dark-gray/10 active:scale-95 sm:w-auto"
                >
                  <IconFacebook className="h-5 w-5" />
                  صفحة فيسبوك
                </a>
              )}
            </div>
          )}

          {/* ===== المميزات ===== */}
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 rounded-xl bg-soft-beige px-4 py-3 text-sm font-medium text-dark-gray"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* ===== شريط الحقوق (أسفل الصفحة) — mb-20 لمنع تغطيته بالـ Dock على الموبايل ===== */}
        <div className="mb-20 mt-6 rounded-xl bg-dark-gray/5 px-4 py-4 text-center text-xs font-medium text-dark-gray/60 sm:mb-4 sm:text-sm">
          جميع الحقوق محفوظة لصالح {APP_NAME} © {new Date().getFullYear()}
        </div>
      </div>
    </section>
  );
}
