/**
 * ====================================================
 * Iraqi Dates Council — Language Switcher
 * يقرأ البيانات من Firebase ويترجم الصفحة فوراً
 * ====================================================
 */
(function () {
    const EN_KEY  = 'iraq_dates_english';
    const FB_CFG  = {
        apiKey: 'AIzaSyD2Y9jQF7XWmo0uegj3uWrQfTKbCAcH97o',
        authDomain: 'id-council-c1b1d.firebaseapp.com',
        projectId: 'id-council-c1b1d',
        storageBucket: 'id-council-c1b1d.firebasestorage.app',
        messagingSenderId: '2987746191',
        appId: '1:2987746191:web:e8f267db34eb0a903b21fa'
    };

    let enData  = {};
    let lang    = localStorage.getItem('siteLang') || 'ar';
    let dataReady = false;

    // ── جلب البيانات من Firebase ──────────────────────────────
    async function fetchEnData() {
        try {
            const [{ initializeApp, getApps, getApp }, { getFirestore, doc, getDoc }] =
                await Promise.all([
                    import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
                    import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js')
                ]);
            const app = getApps().length ? getApp() : initializeApp(FB_CFG);
            const db  = getFirestore(app);
            const snap = await getDoc(doc(db, 'siteData', EN_KEY));
            if (snap.exists()) {
                const raw = snap.data().value;
                enData = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            }
        } catch {
            try { enData = JSON.parse(localStorage.getItem(EN_KEY) || '{}'); } catch {}
        }
        dataReady = true;
        if (lang === 'en') applyEN();
    }

    // ── تطبيق اللغة الإنجليزية ───────────────────────────────
    function applyEN() {
        document.documentElement.lang = 'en';
        document.documentElement.dir  = 'ltr';
        document.querySelectorAll('[data-en]').forEach(el => {
            const key = el.getAttribute('data-en');
            if (!el.dataset.ar) el.dataset.ar = el.textContent.trim();
            if (enData[key]) el.textContent = enData[key];
        });
        // placeholder inputs
        document.querySelectorAll('[data-en-ph]').forEach(el => {
            if (!el.dataset.arPh) el.dataset.arPh = el.placeholder;
            if (enData[el.dataset.enPh]) el.placeholder = enData[el.dataset.enPh];
        });
        const btn = document.getElementById('langBtnText');
        if (btn) btn.textContent = 'AR';
    }

    // ── استعادة اللغة العربية ────────────────────────────────
    function applyAR() {
        document.documentElement.lang = 'ar';
        document.documentElement.dir  = 'rtl';
        document.querySelectorAll('[data-ar]').forEach(el => {
            el.textContent = el.dataset.ar;
        });
        document.querySelectorAll('[data-ar-ph]').forEach(el => {
            el.placeholder = el.dataset.arPh;
        });
        const btn = document.getElementById('langBtnText');
        if (btn) btn.textContent = 'EN';
    }

    // ── تبديل اللغة (يُستدعى من زر الـ HTML) ────────────────
    window.toggleLang = function () {
        lang = lang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('siteLang', lang);
        lang === 'en' ? applyEN() : applyAR();
    };

    // ── تهيئة ─────────────────────────────────────────────────
    function init() {
        if (lang === 'en') {
            document.documentElement.lang = 'en';
            document.documentElement.dir  = 'ltr';
            const btn = document.getElementById('langBtnText');
            if (btn) btn.textContent = 'AR';
        }
        fetchEnData();
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
