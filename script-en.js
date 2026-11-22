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
function summarizeDateDescriptionEn(value, maxLength = 88) {
    const description = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (description.length <= maxLength) return description;

    const preview = description.slice(0, maxLength);
    const lastSpace = preview.lastIndexOf(' ');
    const end = lastSpace >= maxLength * 0.65 ? lastSpace : maxLength;
    return `${preview.slice(0, end).trimEnd()}…`;
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

const dateTranslationsEn = {
    'البرحي': {
        name: 'Barhi',
        description: 'One of Iraq\'s finest and most prized date varieties; Basra is considered its original home.\nCharacteristics: It can be eaten at every stage (khalal, rutab, and tamr). It is sweet and lacks the bitter tannins even at the yellow khalal stage.\nAppearance: Nearly round fruit, golden yellow at khalal and turning amber-brown when fully ripe.',
        size: 'Medium', classification: 'Premium'
    },
    'الزهدي': {
        name: 'Zahdi',
        description: 'Iraq\'s most widespread variety, accounting for about 40% of the country\'s date palms.\nCharacteristics: A semi-dry date with excellent storage life.\nAppearance: Oval, light yellowish-brown.\nUses: Eaten fresh or processed into date syrup, vinegar, and alcohol.',
        size: 'Large', classification: 'Popular'
    },
    'الخستاوي': {
        name: 'Khistawi',
        description: 'A very well-known soft date associated with Baghdadi culture and a popular local saying: “Baghdad is built on dates; peel one and eat Khistawi.”\nCharacteristics: Very soft, low in fiber, and pleasantly sweet.\nAppearance: Elongated oval, reddish-brown at the tamr stage.\nUses: Often pressed and stored for winter; also used in madqouqa sweets and pastries.',
        size: 'Small', classification: 'Rare'
    },
    'الحلاوي': {
        name: 'Halawi',
        description: 'An important commercial variety that ripens early and is widely grown in Basra.\nCharacteristics: Medium-sized fruit with a buttery flavor reminiscent of peanut butter.\nAppearance: Elongated oval with a dark amber color.',
        size: 'Large', classification: 'Premium'
    },
    'تمر الساير (الأسطه عمران)': {
        name: 'Sayer (Al-Ustah Imran)',
        description: 'A well-known Basra variety and an important commercial export date.\nCharacteristics: Mid-early ripening, high quality, and resistant to environmental conditions.\nAppearance and flavor: Light brown, darkening during storage, with a distinctive sweet taste.',
        size: 'Small', classification: 'Rare'
    },
    'الخضراوي': {
        name: 'Khadrawi',
        description: 'An old and distinctive variety grown in the Shatt al-Arab area and central Iraq.\nCharacteristics: A globally traded variety, very soft and juicy.\nAppearance: Medium-sized fruit, greenish in its early stages and dark brown when ripe.',
        size: 'Medium', classification: 'Rare'
    },
    'الديري': {
        name: 'Dayri',
        description: 'Appearance and ripening: The unripe bisr stage is purplish-red; the rutab stage turns pinkish-red, while the fully ripe tamr becomes dark reddish-brown with a pink waxy bloom.\nFlavor and texture: Pleasantly sweet with a distinctive flavor; low in fiber or nearly fiber-free, making it comfortable to eat.',
        size: 'Small', classification: 'Premium'
    },
    'البرين': {
        name: 'Bireen',
        description: 'Digestive health: Rich in fiber, which supports bowel movement and helps promote fullness.\nEnergy: Natural sugars provide a quick source of energy.\nHeart and bone support: Contains essential minerals including potassium, magnesium, calcium, and phosphorus.',
        size: 'Medium', classification: 'Popular'
    },
    'مكتوم': {
        name: 'Maktoum',
        description: 'A top-grade variety, noted for its large size and honey-like flavor, without an especially high sugar content.',
        size: 'Medium', classification: 'Premium'
    },
    'القرنفلي': {
        name: 'Qarnufali',
        description: 'Among Iraq\'s most expensive varieties; it is widely cultivated in Mandali, Diyala.',
        size: 'Medium', classification: 'Rare'
    },
    'الاشرسي': {
        name: 'Ashrasi',
        description: 'A premium variety grown in central Iraq, known for its distinctive flavor and firm texture.',
        size: 'Medium', classification: 'Popular'
    },
    'الساعي': {
        name: 'Al-Sa\'i',
        description: 'A distinctive soft date variety associated with Anbar Governorate, particularly the Kubeisa area.',
        size: 'Medium', classification: 'Rare'
    }
};

// ── Get data from unifiedStorage (with Arabic fallback) ─────────────
async function getStorageData(keyEn, keyAr) {
    const st = window.unifiedStorage;
    if (!st) return null;
    let raw = await st.getItem(keyEn);
    if (!raw || raw === 'null' || raw === '[]' || raw === '') {
        if (keyAr) raw = await st.getItem(keyAr);
    }
    if (!raw || raw === 'null' || raw === '[]' || raw === '') {
        raw = window.localStorage.getItem(keyEn) || raw;
        if ((!raw || raw === 'null' || raw === '[]' || raw === '') && keyAr) {
            raw = window.localStorage.getItem(keyAr) || raw;
        }
    }
    if (!raw || raw === 'null' || raw === '[]' || raw === '') return null;
    try { return JSON.parse(raw); }
    catch (err) {
        console.warn('Failed to parse stored JSON for', keyEn, err);
        const fallbackRaw = window.localStorage.getItem(keyEn);
        if (fallbackRaw && fallbackRaw !== raw) {
            try { return JSON.parse(fallbackRaw); } catch {}
        }
        if (keyAr) {
            const fallbackArRaw = window.localStorage.getItem(keyAr);
            if (fallbackArRaw) {
                try { return JSON.parse(fallbackArRaw); } catch {}
            }
        }
        return null;
    }
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

    const [englishDates, arabicDates] = await Promise.all([
        getStorageData(StorageKeysEn.DATES, null),
        getStorageData(StorageKeysEn.DATES_AR, null)
    ]);
    const translatedDates = (arabicDates || []).flatMap(date => {
        const translation = dateTranslationsEn[String(date.name ?? '').trim()];
        return translation ? [{ ...date, ...translation }] : [];
    });
    const translatedNames = new Set(translatedDates.map(date => String(date.name).trim().toLowerCase()));
    const additionalEnglishDates = (englishDates || []).filter(date =>
        !translatedNames.has(String(date.name ?? '').trim().toLowerCase())
    );
    const dates = [...translatedDates, ...additionalEnglishDates];

    if (!dates.length) {
        container.innerHTML = emptyMsg('No date varieties available yet');
        return;
    }

    container.innerHTML = dates.map(d => {
        const img = sanitizeImageSrc(d.image || '');
        return `
        <article data-date-card-en data-date-name="${escapeHTML(d.name)}" data-date-size="${escapeHTML(d.size || '')}" data-date-classification="${escapeHTML(d.classification || d.class || '')}" data-date-description="${escapeHTML(d.description || '')}" class="bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all overflow-hidden">
            <button type="button" data-date-toggle-en aria-haspopup="dialog" class="block w-full p-3 text-left group">
            <span class="relative block overflow-hidden rounded-xl h-32 mb-3">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(d.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">`
                    : `<span class="w-full h-full bg-white/10 flex items-center justify-center"><i data-lucide="image-off" class="w-8 h-8 text-stone-400"></i></span>`}
            </span>
            <span class="block text-left font-bold text-white text-sm">${escapeHTML(d.name)}</span>
            <span class="mt-2 flex items-center justify-between gap-2 text-xs">
                <span class="text-stone-400">Size: ${escapeHTML(d.size || 'Not specified')}</span>
                <span class="text-amber-300">${escapeHTML(d.classification || d.class || '')}</span>
            </span>
            <span class="block text-xs text-stone-400 mt-1 line-clamp-2">${escapeHTML(summarizeDateDescriptionEn(d.description))}</span>
            <span class="block text-xs text-amber-300 mt-3">View details</span>
            </button>
        </article>`;
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

    const members = await getStorageData(StorageKeysEn.COUNCIL, null);
    if (!members || !members.length) {
        container.innerHTML = emptyMsg('No council members available');
        return;
    }

    container.innerHTML = members.map((m, i) => {
        const img = sanitizeImageSrc(m.image || '');
        return `
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden hover:-translate-y-1 transform duration-300 group cursor-pointer"
             onclick="openMemberModalEn(${i})">
            <div class="relative h-40 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600">
                ${img
                    ? `<img src="${img}" alt="${escapeHTML(m.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">`
                    : `<div class="w-full h-full flex items-center justify-center"><i data-lucide="user" class="w-12 h-12 text-amber-200"></i></div>`}
            </div>
            <div class="p-4 text-center">
                <h3 class="font-bold text-stone-800">${escapeHTML(m.name)}</h3>
                <p class="text-amber-600 text-sm font-semibold mt-1">${escapeHTML(m.position || '')}</p>
                ${m.category ? `<span class="mt-2 inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">${escapeHTML(m.category)}</span>` : ''}
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
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div class="relative h-56 bg-gradient-to-br from-amber-400 to-amber-600">
                ${img ? `<img src="${img}" alt="${escapeHTML(m.name)}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center"><i data-lucide="user" class="w-16 h-16 text-amber-200"></i></div>`}
                <button onclick="closeMemberModalEn()" class="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="p-6">
                <h3 class="text-2xl font-bold text-stone-800">${escapeHTML(m.name)}</h3>
                <p class="text-amber-600 font-semibold mt-1">${escapeHTML(m.position || '')}</p>
                ${m.category ? `<span class="mt-2 inline-block px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full">${escapeHTML(m.category)}</span>` : ''}
                ${m.bio ? `<p class="text-stone-600 mt-4 leading-relaxed">${escapeHTML(m.bio)}</p>` : ''}
                <div class="mt-4 space-y-2">
                    ${m.email ? `<p class="flex items-center gap-2 text-stone-600"><i data-lucide="mail" class="w-4 h-4 text-amber-600"></i>${escapeHTML(m.email)}</p>` : ''}
                    ${m.phone ? `<p class="flex items-center gap-2 text-stone-600"><i data-lucide="phone" class="w-4 h-4 text-amber-600"></i>${escapeHTML(m.phone)}</p>` : ''}
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
                ? `<button onclick="downloadStudyEn(${Number(s.id)||0})"
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
                    <p id="en-ad-short-${Number(ad.id)||0}" class="text-stone-600 leading-relaxed line-clamp-2">${escapeHTML(ad.description)}</p>
                    <p id="en-ad-full-${Number(ad.id)||0}"  class="text-stone-600 leading-relaxed hidden">${escapeHTML(ad.description)}</p>
                </div>` : ''}
                <div class="flex flex-wrap items-center gap-3">
                    ${hasLong ? `
                    <button id="en-ad-btn-${Number(ad.id)||0}" onclick="toggleEnAdDesc(${Number(ad.id)||0})"
                        class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors">
                        <i data-lucide="chevron-down" class="w-4 h-4" id="en-ad-icon-${Number(ad.id)||0}"></i>
                        <span id="en-ad-btn-text-${Number(ad.id)||0}">Read More</span>
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

    // If EmailJS is loaded on the page, use the inline EmailJS handler instead of local/Firebase storage.
    if (window.emailjs && typeof emailjs.send === 'function') {
        console.log('English contact form will use EmailJS; skipping storage fallback.');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn    = document.getElementById('submitBtnEn');
        const status = document.getElementById('formStatusEn');
        const name   = document.getElementById('senderNameEn')?.value.trim();
        const email  = document.getElementById('senderEmailEn')?.value.trim();
        const phone  = document.getElementById('senderPhoneEn')?.value.trim();
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
                name, email, phone,
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
    n.innerHTML = `<i data-lucide="${type==='success'?'check-circle':'alert-circle'}" class="w-5 h-5"></i><span class="font-semibold">${escapeHTML(message)}</span>`;
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

    const datesContainer = document.getElementById('datesContainerEn');
    const dateDetailsDialog = document.getElementById('dateDetailsDialogEn');
    if (datesContainer && dateDetailsDialog) {
        datesContainer.addEventListener('click', function(event) {
            const toggle = event.target.closest('[data-date-toggle-en]');
            if (!toggle || !datesContainer.contains(toggle)) return;

            const card = toggle.closest('[data-date-card-en]');
            if (!card) return;

            const image = document.getElementById('dateDetailsImageEn');
            const cardImage = card.querySelector('img');
            image.src = cardImage ? cardImage.src : '';
            image.alt = card.dataset.dateName || '';
            image.hidden = !cardImage;
            document.getElementById('dateDetailsTitleEn').textContent = card.dataset.dateName || '';
            document.getElementById('dateDetailsMetadataEn').textContent =
                `Size: ${card.dataset.dateSize || 'Not specified'} · ${card.dataset.dateClassification || 'Unclassified'}`;
            document.getElementById('dateDetailsDescriptionEn').textContent = card.dataset.dateDescription || '';
            dateDetailsDialog.showModal();
        });

        document.getElementById('closeDateDetailsEn').addEventListener('click', function() {
            dateDetailsDialog.close();
        });
        dateDetailsDialog.addEventListener('click', function(event) {
            if (event.target === dateDetailsDialog) dateDetailsDialog.close();
        });
        dateDetailsDialog.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                dateDetailsDialog.close();
            }
        });
    }

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
