// =====================================================================
// script-en.js  —  Iraqi Dates Council  (English front-end)
// Reads data written by admin-en.js / admin.js via unifiedStorage
// =====================================================================

// ── Storage key constants (MUST match admin-en.js) ──────────────────
const StorageKeysEn = {
    EVENTS:   'iraq_dates_events_en',
    DATES:    'iraq_dates_types_en',
    COUNCIL:  'iraq_dates_council_en',   // English council members storage
    STUDIES:  'iraq_dates_studies_en',
    ADS:      'iraq_dates_ads_en',
    SETTINGS: 'iraq_dates_settings',      // shared settings
    MESSAGES: 'iraq_dates_messages_en',
    // Arabic fallbacks
    EVENTS_AR:  'iraq_dates_events',
    DATES_AR:   'iraq_dates_types',
    ADS_AR:     'iraq_dates_ads',
    STUDIES_AR: 'iraq_dates_studies',
};

// ── Helpers ──────────────────────────────────────────────────────────
function escapeHTML(v) {
    return String(v ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function sanitizeHttpUrl(v) {
    const raw = String(v ?? '').trim();
    if (!raw) return '';
    try { const u = new URL(raw, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; }
    catch { return ''; }
}
function sanitizeImageSrc(v) {
    const raw = String(v ?? '').trim();
    if (!raw) return '';
    if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(raw)) return raw;
    try { const u = new URL(raw, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; }
    catch { return ''; }
}

// ── Get data from unifiedStorage (with Arabic fallback) ─────────────
async function getStorageData(keyEn, keyAr) {
    const st = window.unifiedStorage;
    if (!st) return null;
    let raw = await st.getItem(keyEn);
    if (!raw || raw === 'null' || raw === '[]' || raw === '') {
        if (keyAr) raw = await st.getItem(keyAr);
    }
    if (!raw || raw === 'null' || raw === '[]' || raw === '') return null;
    try { return JSON.parse(raw); } catch { return null; }
}

const knownDateTranslations = {
    'البرحي': { name: 'Barhi', size: 'Medium', classification: 'Premium', description: 'Premium dates with a golden color and a balanced sweet flavor.' },
    'الزهدي': { name: 'Zahdi', size: 'Large', classification: 'Popular', description: 'One of the most popular varieties, with a golden yellow color and delicious taste.' },
    'الخستاوي': { name: 'Khadrawi', size: 'Small', classification: 'Rare', description: 'Rare dates with a soft texture and a distinctive flavor.' },
    'الديري': { name: 'Dayri', size: 'Large', classification: 'Premium', description: 'One of the finest varieties, red in color and rich in benefits.' }
};

const knownCouncilTranslations = {
    'أ.د محمد عبدالله الخيال': { name: 'Prof. Dr. Mohammed Abdullah Al-Khayal', position: 'Council President', category: 'Management', bio: 'A specialist in agricultural economics and the development of the Iraqi dates industry, with more than 20 years of experience.' },
    'أ.د فاطمة محمود': { name: 'Prof. Dr. Fatima Mahmoud', position: 'Vice President', category: 'Management', bio: 'An expert in agricultural marketing and international trade who has led several successful export projects.' },
    'د. علي حسن الشمري': { name: 'Dr. Ali Hassan Al-Shammari', position: 'Deputy Director General', category: 'Management', bio: 'A specialist in scientific research and date varieties development with recognized international publications.' },
    'أ. سامح عبدالرحمن': { name: 'Samih Abdulrahman', position: 'Head of Quality and Standards', category: 'Specialist', bio: 'An expert in international quality standards who oversees auditing and certification operations.' },
    'م. زيد الحسين': { name: 'Zaid Al-Hussein', position: 'Head of Technical Affairs', category: 'Technical', bio: 'A specialist in modern date processing and packaging technologies who provides consulting to farmers.' },
    'أ. هيفاء سالم': { name: 'Haifa Salem', position: 'Basra Governorate Representative', category: 'Governorates', bio: 'Responsible for representing Basra Governorate and coordinating activities in the governorate.' }
};

async function getTranslatedList(keyEn, keyAr, translate) {
    const english = await getStorageData(keyEn, null) || [];
    const arabic = await getStorageData(keyAr, null) || [];
    if (!arabic.length) return english;

    const englishById = new Map(english.map(item => [Number(item.id), item]));
    const merged = arabic.map(item => {
        const existingEnglish = englishById.get(Number(item.id)) || {};
        const translated = translate(item) || {};
        return {
            ...item,
            ...existingEnglish,
            ...translated,
            image: item.image || existingEnglish.image || ''
        };
    });

    if (window.unifiedStorage && JSON.stringify(merged) !== JSON.stringify(english)) {
        window.unifiedStorage.setItem(keyEn, JSON.stringify(merged)).catch(error => {
            console.warn(`English migration failed for ${keyEn}:`, error);
        });
    }
    return merged;
}

// ── Placeholder card ─────────────────────────────────────────────────
function emptyMsg(msg) {
    return `<div class="col-span-full text-center py-12 text-stone-400 italic">${msg}</div>`;
}

// =====================================================================
// 1. DATES
// =====================================================================
async function loadDatesDataEn() {
    const container = document.getElementById('datesContainerEn');
    if (!container) return;
    container.innerHTML = emptyMsg('Loading...');

    const dates = await getTranslatedList(StorageKeysEn.DATES, StorageKeysEn.DATES_AR, date => knownDateTranslations[date.name]);
    if (!dates || !dates.length) {
        container.innerHTML = emptyMsg('No date varieties available yet');
        return;
    }

    container.innerHTML = dates.map(d => {
        const img = sanitizeImageSrc(d.image || '');
        return `
        <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl hover:bg-white/20 transition-all group cursor-pointer text-center">
            <div class="relative overflow-hidden rounded-xl h-32 mb-3">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(d.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">`
                    : `<div class="w-full h-full bg-white/10 flex items-center justify-center"><i data-lucide="image-off" class="w-8 h-8 text-stone-400"></i></div>`}
            </div>
            <h3 class="font-bold text-white text-sm">${escapeHTML(d.name)}</h3>
            <p class="text-xs text-amber-300 mt-1">${escapeHTML(d.classification || d.class || '')}</p>
            <p class="text-xs text-stone-400 mt-1 line-clamp-2">${escapeHTML(d.description || '')}</p>
        </div>`;
    }).join('');
    lucide.createIcons();
}

// =====================================================================
// 2. EVENTS
// =====================================================================
async function loadEventsDataEn() {
    const container = document.getElementById('eventsContainerEn');
    if (!container) return;
    container.innerHTML = emptyMsg('Loading...');

    const events = await getStorageData(StorageKeysEn.EVENTS, StorageKeysEn.EVENTS_AR);
    if (!events || !events.length) {
        container.innerHTML = emptyMsg('No events available');
        return;
    }

    container.innerHTML = events.map(ev => {
        const img = sanitizeImageSrc(ev.image || '');
        return `
        <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
            <div class="relative h-48 overflow-hidden bg-stone-100">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(ev.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                    : `<div class="w-full h-full flex items-center justify-center"><i data-lucide="calendar" class="w-12 h-12 text-stone-300"></i></div>`}
                <span class="absolute top-4 left-4 px-3 py-1 bg-amber-600/90 text-white text-xs font-bold rounded-full">${escapeHTML(ev.type || '')}</span>
            </div>
            <div class="p-6">
                <p class="text-amber-600 font-semibold text-sm mb-2 flex items-center gap-1">
                    <i data-lucide="calendar" class="w-4 h-4"></i> ${escapeHTML(ev.date || '')}
                    ${ev.location ? `&nbsp;·&nbsp;<i data-lucide="map-pin" class="w-4 h-4 inline"></i> ${escapeHTML(ev.location)}` : ''}
                </p>
                <h3 class="text-xl font-bold text-stone-800 mb-3">${escapeHTML(ev.title)}</h3>
                <p class="text-stone-600 leading-relaxed line-clamp-3">${escapeHTML(ev.description || '')}</p>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

// =====================================================================
// 3. COUNCIL MEMBERS
// =====================================================================
async function loadCouncilDataEn() {
    const container = document.getElementById('councilContainerEn');
    if (!container) return;
    container.innerHTML = emptyMsg('Loading...');

    const members = await getTranslatedList(StorageKeysEn.COUNCIL, 'iraq_dates_council', member => knownCouncilTranslations[member.name]);
    if (!members || !members.length) {
        container.innerHTML = emptyMsg('No council members available');
        return;
    }

    container.innerHTML = members.map((m, i) => {
        const img = sanitizeImageSrc(m.image || '');
        return `
        <div class="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:bg-white/20 transition-all group">
            <div class="relative overflow-hidden aspect-square">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(m.name)}" class="w-full h-full object-contain bg-stone-200 group-hover:scale-110 transition-transform duration-300">`
                    : `<div class="w-full h-full flex items-center justify-center bg-stone-200"><i data-lucide="user" class="w-12 h-12 text-stone-400"></i></div>`}
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 class="text-xl font-bold mb-1">${escapeHTML(m.name)}</h3>
                    <p class="text-amber-300 font-semibold text-sm">${escapeHTML(m.position || '')}</p>
                </div>
                <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                    ${escapeHTML(m.category || '')}
                </span>
            </div>
            <div class="p-4 bg-stone-900">
                <p class="text-stone-300 text-sm mb-3 line-clamp-2">${escapeHTML(m.bio || '')}</p>
                <div class="space-y-2 text-xs text-stone-400 border-t border-stone-700 pt-3 mb-3">
                    ${m.email ? `<p class="flex items-center gap-2 hover:text-amber-400 transition-colors"><i data-lucide="mail" class="w-3 h-3"></i><span>${escapeHTML(m.email)}</span></p>` : ''}
                    ${m.phone ? `<p class="flex items-center gap-2"><i data-lucide="phone" class="w-3 h-3"></i><span>${escapeHTML(m.phone)}</span></p>` : ''}
                </div>
                <button onclick="openMemberModalEn(${i})" class="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="info" class="w-4 h-4"></i>Details
                </button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();

    // store for modal
    window._councilMembersEn = members;
}

function openMemberModalEn(index) {
    const members = window._councilMembersEn || [];
    const m = members[index];
    if (!m) return;
    const img = sanitizeImageSrc(m.image || '');
    let modal = document.getElementById('memberModalEn');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'memberModalEn';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeMemberModalEn()"></div>
        <div class="relative bg-stone-900 text-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-stone-700">
            <button onclick="closeMemberModalEn()" class="absolute top-4 left-4 w-9 h-9 bg-stone-700 hover:bg-stone-600 rounded-full flex items-center justify-center transition-colors z-20">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="w-full h-56 overflow-hidden relative">
                ${img ? `<img src="${img}" alt="${escapeHTML(m.name)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center bg-stone-800"><i data-lucide="user" class="w-16 h-16 text-stone-400"></i></div>`}
                <div class="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent"></div>
                <div class="absolute bottom-0 right-0 p-5"><span class="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">${escapeHTML(m.category || '')}</span></div>
            </div>
            <div class="p-6">
                <h3 class="text-2xl font-bold mb-1 text-white">${escapeHTML(m.name)}</h3>
                <p class="text-amber-400 font-semibold mb-4 text-sm">${escapeHTML(m.position || '')}</p>
                <p class="text-stone-300 text-sm leading-relaxed mb-5">${escapeHTML(m.bio || '')}</p>
                <div class="space-y-2 text-sm text-stone-400 border-t border-stone-700 pt-4">
                    ${m.email ? `<p class="flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-amber-400"></i>${escapeHTML(m.email)}</p>` : ''}
                    ${m.phone ? `<p class="flex items-center gap-2"><i data-lucide="phone" class="w-4 h-4 text-amber-400"></i>${escapeHTML(m.phone)}</p>` : ''}
                </div>
            </div>
        </div>`;
    modal.classList.remove('hidden');
    modal.onclick = e => { if (e.target === modal) closeMemberModalEn(); };
    lucide.createIcons();
}
function closeMemberModalEn() {
    const modal = document.getElementById('memberModalEn');
    if (modal) modal.classList.add('hidden');
}

// =====================================================================
// 4. STUDIES
// =====================================================================
async function loadStudiesDataEn() {
    const container = document.getElementById('studiesContainerEn');
    if (!container) return;
    container.innerHTML = emptyMsg('Loading...');

    const studies = await getStorageData(StorageKeysEn.STUDIES, StorageKeysEn.STUDIES_AR);
    if (!studies || !studies.length) {
        container.innerHTML = emptyMsg('No studies available yet');
        return;
    }

    container.innerHTML = studies.map((s, i) => `
        <div class="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all group">
            <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-600 transition-colors">
                    <i data-lucide="file-text" class="w-6 h-6 text-amber-600 group-hover:text-white transition-colors"></i>
                </div>
                <div class="flex-1">
                    <p class="text-xs text-amber-600 font-semibold uppercase tracking-wider">Study ${i + 1}</p>
                    <h3 class="text-xl font-bold text-stone-800 mt-1">${escapeHTML(s.title)}</h3>
                    ${s.date ? `<p class="text-stone-400 text-sm mt-1">${escapeHTML(s.date)}</p>` : ''}
                </div>
            </div>
            ${s.description ? `<p class="text-stone-600 leading-relaxed mb-6">${escapeHTML(s.description)}</p>` : ''}
            ${s.fileData
                ? `<button onclick="downloadStudyEn(${s.id})"
                      class="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-semibold">
                      <i data-lucide="download" class="w-5 h-5"></i>Download PDF
                   </button>`
                : `<p class="text-stone-400 italic text-sm">File not available</p>`}
        </div>`).join('');
    lucide.createIcons();

    // Store for download
    window._studiesDataEn = studies;
}

function downloadStudyEn(id) {
    const studies = window._studiesDataEn || [];
    const s = studies.find(x => x.id === id);
    if (!s || !s.fileData) { alert('File not available for download.'); return; }
    const a = document.createElement('a');
    a.href = s.fileData;
    a.download = s.fileName || s.file || 'study.pdf';
    document.body.appendChild(a); a.click(); a.remove();
}

// =====================================================================
// 5. ADS  —  with working "Read More / Show Less" toggle
// =====================================================================
async function loadAdsDataEn() {
    const container = document.getElementById('adsContainerEn');
    if (!container) return;
    container.innerHTML = emptyMsg('Loading...');

    const ads = await getStorageData(StorageKeysEn.ADS, StorageKeysEn.ADS_AR);
    if (!ads || !ads.length) {
        container.innerHTML = emptyMsg('No advertisements available yet');
        return;
    }

    container.innerHTML = ads.map(ad => {
        const img   = sanitizeImageSrc(ad.image || '');
        const link  = sanitizeHttpUrl(ad.link || '');
        const hasLong = (ad.description || '').length > 100;
        return `
        <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
            <div class="relative h-48 overflow-hidden bg-stone-100">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(ad.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                    : `<div class="w-full h-full flex items-center justify-center"><i data-lucide="image-off" class="w-12 h-12 text-stone-300"></i></div>`}
                ${ad.type ? `<span class="absolute top-4 left-4 px-3 py-1 bg-amber-600/90 text-white text-xs font-bold rounded-full">${escapeHTML(ad.type)}</span>` : ''}
            </div>
            <div class="p-6">
                ${ad.date ? `<p class="text-stone-400 text-xs mb-2">${escapeHTML(ad.date)}</p>` : ''}
                <h3 class="text-xl font-bold text-stone-800 mb-3">${escapeHTML(ad.title)}</h3>
                ${ad.description ? `
                <div class="mb-4">
                    <p id="en-ad-short-${ad.id}" class="text-stone-600 leading-relaxed line-clamp-2">${escapeHTML(ad.description)}</p>
                    <p id="en-ad-full-${ad.id}"  class="text-stone-600 leading-relaxed hidden">${escapeHTML(ad.description)}</p>
                </div>` : ''}
                <div class="flex flex-wrap items-center gap-3">
                    ${hasLong ? `
                    <button id="en-ad-btn-${ad.id}" onclick="toggleEnAdDesc(${ad.id})"
                        class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors">
                        <i data-lucide="chevron-down" class="w-4 h-4" id="en-ad-icon-${ad.id}"></i>
                        <span id="en-ad-btn-text-${ad.id}">Read More</span>
                    </button>` : ''}
                    ${link ? `
                    <a href="${link}" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm">
                        <i data-lucide="external-link" class="w-4 h-4"></i>Visit Link
                    </a>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

function toggleEnAdDesc(id) {
    const shortEl   = document.getElementById(`en-ad-short-${id}`);
    const fullEl    = document.getElementById(`en-ad-full-${id}`);
    const btnText   = document.getElementById(`en-ad-btn-text-${id}`);
    const btnIcon   = document.getElementById(`en-ad-icon-${id}`);
    if (!shortEl || !fullEl) return;
    const expanded = !fullEl.classList.contains('hidden');
    if (expanded) {
        fullEl.classList.add('hidden');
        shortEl.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Read More';
        if (btnIcon) { btnIcon.setAttribute('data-lucide','chevron-down'); lucide.createIcons(); }
    } else {
        shortEl.classList.add('hidden');
        fullEl.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Show Less';
        if (btnIcon) { btnIcon.setAttribute('data-lucide','chevron-up'); lucide.createIcons(); }
    }
}

// =====================================================================
// 6. SETTINGS  —  populate contact section
// =====================================================================
async function loadSettingsEn() {
    const st = window.unifiedStorage;
    if (!st) return;
    const raw = await st.getItem(StorageKeysEn.SETTINGS);
    if (!raw) return;
    let s;
    try { s = JSON.parse(raw); } catch { return; }
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    set('contactAddressEn', s.address);
    set('contactPhoneEn',   s.phone);
    set('contactEmailEn',   s.email);
}

// =====================================================================
// 7. CONTACT FORM  —  saves to iraq_dates_messages_en
// =====================================================================
function initContactFormEn() {
    const form = document.getElementById('contactFormEn');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn    = document.getElementById('submitBtnEn');
        const status = document.getElementById('formStatusEn');
        const name   = document.getElementById('senderNameEn')?.value.trim();
        const email  = document.getElementById('senderEmailEn')?.value.trim();
        const subj   = document.getElementById('senderSubjectEn')?.value.trim();
        const msg    = document.getElementById('senderMessageEn')?.value.trim();
        if (!name || !email || !msg) {
            showStatusEn(status, 'Please fill in all required fields.', false);
            return;
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
        try {
            const st = window.unifiedStorage;
            let messages = [];
            if (st) {
                const raw = await st.getItem(StorageKeysEn.MESSAGES);
                if (raw && raw !== 'null') try { messages = JSON.parse(raw); } catch {}
            }
            messages.push({
                id: Date.now(),
                name, email,
                subject: subj || 'General Inquiry',
                message: msg,
                time: new Date().toLocaleString('en-US')
            });
            if (st) await st.setItem(StorageKeysEn.MESSAGES, JSON.stringify(messages));
            showStatusEn(status, '✅ Your message has been sent successfully! We will contact you soon.', true);
            form.reset();
        } catch (err) {
            console.error(err);
            showStatusEn(status, '❌ An error occurred. Please try again.', false);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; }
        }
    });
}

function showStatusEn(el, msg, success) {
    if (!el) return;
    el.textContent = msg;
    el.className = `mt-4 p-4 rounded-xl text-center font-semibold text-sm ${success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 6000);
}

// =====================================================================
// 8. NOTIFICATION
// =====================================================================
function showNotificationEn(message, type = 'success') {
    const n = document.createElement('div');
    n.className = `fixed top-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl shadow-2xl z-50 transition-all duration-500 flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    n.innerHTML = `<i data-lucide="${type==='success'?'check-circle':'alert-circle'}" class="w-5 h-5"></i><span class="font-semibold">${message}</span>`;
    document.body.appendChild(n);
    lucide.createIcons();
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 500); }, 3500);
}

// =====================================================================
// 9. UI INTERACTIONS
// =====================================================================
function initScrollAnimations() {
    const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('revealed'); o.unobserve(en.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    setTimeout(() => {
        const h = document.querySelector('.hero-content');
        if (h) h.style.opacity = '1';
    }, 100);
}

function initNavbar() {
    window.addEventListener('scroll', () => {
        const nb = document.getElementById('navbar');
        if (nb) nb.classList.toggle('shadow-md', window.scrollY > 50);
    });
}

function initMobileMenu() {
    const btn  = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
        btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initCounterAnimation() {
    document.querySelectorAll('[data-count]').forEach(counter => {
        const target = +counter.getAttribute('data-count');
        const inc = target / 200;
        const tick = () => {
            const cur = +counter.innerText;
            if (cur < target) { counter.innerText = Math.ceil(cur + inc); setTimeout(tick, 1); }
            else counter.innerText = target;
        };
        tick();
    });
}

function switchLanguage(lang) {
    if (lang === 'ar') location.href = 'index.html';
    else if (lang === 'en') location.href = 'index-en.html';
}

// =====================================================================
// 10. BOOT
// =====================================================================
function loadAllEn() {
    loadDatesDataEn();
    loadEventsDataEn();
    loadCouncilDataEn();
    loadStudiesDataEn();
    loadAdsDataEn();
    loadSettingsEn();
}

document.addEventListener('DOMContentLoaded', function () {
    lucide.createIcons();
    initScrollAnimations();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initCounterAnimation();
    initContactFormEn();

    if (typeof window.firebaseReadyPromise !== 'undefined') {
        window.firebaseReadyPromise.then(loadAllEn);
    } else {
        setTimeout(loadAllEn, 800);
    }
});

window.addEventListener('firebaseReady', loadAllEn);
window.addEventListener('load', () => lucide.createIcons());
