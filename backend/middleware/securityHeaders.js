/**
 * وسيط لإضافة ترويسات الأمان (Security Headers)
 * يقي من XSS و Clickjacking و MIME sniffing وغيرها.
 * (بديل خفيف لـ helmet بدون تبعيات إضافية)
 */
function securityHeaders(req, res, next) {
  // منع تخمين نوع المحتوى (MIME sniffing)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // الحماية من Clickjacking بمنع تضمين الصفحة في iframe
  res.setHeader('X-Frame-Options', 'DENY');

  // تفعيل حماية XSS في المتصفحات القديمة
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // عدم إرسال رابط الصفحة (Referrer) للمواقع الأخرى
  res.setHeader('Referrer-Policy', 'no-referrer');

  // سياسة المحتوى الصارمة (CSP) - تحد من مصادر الموارد
  // نسمح بالصور من أي مصدر لأن الفرونت (5173) يعرض صوراً من الباك (5000).
  // ملاحظة: في الإنتاج يخدم الباك ملف index.html، فتسري هذه السياسة على الصفحة،
  // لذلك يجب السماح صراحةً بخط Google Fonts (Tajawal) وإلا يسقط الخط الافتراضي.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "connect-src 'self'; " +
      "img-src 'self' data: blob: http: https:; object-src 'none'; frame-ancestors 'none'"
  );

  // إزالة ترويسة X-Powered-By التي تكشف عن Express
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = { securityHeaders };
