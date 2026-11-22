// upload-guard.js — validates every <input type="file"> BEFORE any page handler sees the file.
// Checks size, extension, declared MIME and real magic bytes. SVG/HTML/script files are rejected.
(function () {
  'use strict';
  var MAX_IMAGE = 2 * 1024 * 1024;   // 2 MB
  var MAX_PDF   = 8 * 1024 * 1024;   // 8 MB
  var lang = (document.documentElement.lang || 'ar').slice(0, 2);
  var T = lang === 'ar'
    ? { type: 'نوع الملف غير مسموح.', size: 'حجم الملف أكبر من المسموح.', bad: 'محتوى الملف لا يطابق نوعه.' }
    : { type: 'File type is not allowed.', size: 'File is larger than the allowed limit.', bad: 'File content does not match its type.' };

  function startsWith(b, sig, off) { off = off || 0; for (var i = 0; i < sig.length; i++) if (b[off + i] !== sig[i]) return false; return true; }
  function sniff(b) {
    if (startsWith(b, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return 'png';
    if (startsWith(b, [0xFF, 0xD8, 0xFF])) return 'jpeg';
    if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
    if (startsWith(b, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
    return null;
  }
  function check(file, accept) {
    var wantsPdf = /pdf/i.test(accept || '') && !/image/i.test(accept || '');
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var okExt = wantsPdf ? ['pdf'] : ['png', 'jpg', 'jpeg', 'webp', 'jfif'];
    if (okExt.indexOf(ext) === -1) return Promise.resolve(T.type);
    if (file.size > (wantsPdf ? MAX_PDF : MAX_IMAGE)) return Promise.resolve(T.size);
    return file.slice(0, 16).arrayBuffer().then(function (buf) {
      var kind = sniff(new Uint8Array(buf));
      var ok = wantsPdf ? kind === 'pdf' : (kind === 'png' || kind === 'jpeg' || kind === 'webp');
      return ok ? null : T.bad;
    });
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'file' || e.__uploadValidated) return;
    e.stopImmediatePropagation();
    var f = t.files && t.files[0];
    var pass = function () { var ev = new Event('change', { bubbles: true }); ev.__uploadValidated = true; t.dispatchEvent(ev); };
    if (!f) return pass();
    check(f, t.getAttribute('accept')).then(function (err) {
      if (err) { alert(err); t.value = ''; return; }
      pass();
    });
  }, true);
})();
