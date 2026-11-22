// =====================================================================
// admin-en.js  —  English Admin Panel  (Iraqi Dates Council)
// Writes to same storage keys that script-en.js reads
// =====================================================================

// ── Storage keys (MUST match script-en.js) ──────────────────────────
const StorageKeys = {
    EVENTS:   'iraq_dates_events_en',
    DATES:    'iraq_dates_types_en',
    COUNCIL:  'iraq_dates_council_en',   // English council members storage
    STUDIES:  'iraq_dates_studies_en',
    ADS:      'iraq_dates_ads_en',
    SETTINGS: 'iraq_dates_settings',      // shared settings
    MESSAGES: 'iraq_dates_messages_en',
};

// ── Firebase config ──────────────────────────────────────────────────
const FIREBASE_CFG = {
    apiKey:            'AIzaSyD2Y9jQF7XWmo0uegj3uWrQfTKbCAcH97o',
    authDomain:        'id-council-c1b1d.firebaseapp.com',
    projectId:         'id-council-c1b1d',
    storageBucket:     'id-council-c1b1d.firebasestorage.app',
    messagingSenderId: '2987746191',
    appId:             '1:2987746191:web:e8f267db34eb0a903b21fa',
};
const FS_COL = 'siteData';

// ── In-memory cache + local/Firebase unified store ──────────────────
const cache = new Map();
let fsDocApi   = null;
let fbEnabled  = false;

function isEmptyJsonContainer(value) {
    if (value === null || value === undefined || value === 'null' || value === '') return true;
    try {
        const parsed = JSON.parse(String(value));
        return (Array.isArray(parsed) && parsed.length === 0)
            || (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0);
    } catch {
        return false;
    }
}

const store = {
    get(key) {
        if (cache.has(key)) return cache.get(key);
        return localStorage.getItem(key);
    },
    set(key, value) {
        const v = String(value);
        cache.set(key, v);
        try {
            localStorage.setItem(key, v);
        } catch (err) {
            console.error('localStorage.setItem failed for', key, err);
            addUpdate('Failed to save local data: ' + key);
        }
        if (fsDocApi) fsDocApi.set(key, v).catch(e => console.error('FB write', key, e));
    },
    remove(key) {
        cache.delete(key);
        localStorage.removeItem(key);
        if (fsDocApi) fsDocApi.remove(key).catch(() => {});
    },
    getJSON(key, fallback = []) {
        try {
            return JSON.parse(this.get(key) || 'null') ?? fallback;
        } catch (err) {
            console.warn(`Invalid JSON detected for ${key}, clearing corrupt storage`, err);
            this.remove(key);
            return fallback;
        }
    },
    setJSON(key, val) { this.set(key, JSON.stringify(val)); },
};

// ── Firebase init ────────────────────────────────────────────────────
const fbReady = (async () => {
    try {
        const [{ initializeApp, getApps, getApp },
               { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot },
               { getAuth, onAuthStateChanged }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
        ]);

        const app = getApps().length ? getApp() : initializeApp(FIREBASE_CFG);
        const db  = getFirestore(app);
        const auth = getAuth(app);

        // Auth guard
        await new Promise(res => {
            const unsub = onAuthStateChanged(auth, user => {
                unsub();
                if (!user) {
                    location.href = 'admin-login.html';
                    return;
                } else {
                    if (window.__revealAdmin) window.__revealAdmin();
                    res(user);
                }
            });
        });

        fsDocApi = {
            async set(key, val) {
                await setDoc(doc(db, FS_COL, key), { value: val, updatedAt: serverTimestamp() }, { merge: true });
            },
            async remove(key) { await deleteDoc(doc(db, FS_COL, key)); },
        };

        // Sync all keys
        await Promise.all(Object.values(StorageKeys).map(async key => {
            const snap = await getDoc(doc(db, FS_COL, key));
            const local = localStorage.getItem(key);
            if (snap.exists()) {
                const value = snap.data().value;
                const remoteValue = value === null || value === undefined ? null : String(value);

                if (remoteValue !== null && !isEmptyJsonContainer(remoteValue)) {
                    cache.set(key, remoteValue);
                    localStorage.setItem(key, remoteValue);
                } else if (local !== null && !isEmptyJsonContainer(local)) {
                    cache.set(key, local);
                    await fsDocApi.set(key, local);
                } else if (remoteValue !== null) {
                    cache.set(key, remoteValue);
                    localStorage.setItem(key, remoteValue);
                }
            } else {
                if (local !== null) {
                    cache.set(key, local);
                    await fsDocApi.set(key, local);
                }
            }
            onSnapshot(doc(db, FS_COL, key), next => {
                if (!next.exists()) return;
                const value = next.data().value;
                const remoteValue = value === null || value === undefined ? null : String(value);
                if (remoteValue === null) return;
                if (isEmptyJsonContainer(remoteValue) && local !== null && !isEmptyJsonContainer(local)) return;
                cache.set(key, remoteValue);
                localStorage.setItem(key, remoteValue);
            });
        }));

        fbEnabled = true;
        console.log('Firebase connected');
    } catch (err) {
        console.warn('Firebase unavailable, local-only mode:', err);
    }
})();

// ── Helpers ──────────────────────────────────────────────────────────
const esc        = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const trim       = v => String(v ?? '').trim();
const safeUrl    = v => { const r = trim(v); if (!r) return ''; try { const u = new URL(r, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const safeImg    = v => { const r = trim(v); if (!r) return ''; if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(r)) return r; try { const u = new URL(r, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const fmtSize    = b => { if (!b) return '0 B'; const k=1024, s=['B','KB','MB','GB']; const i=Math.floor(Math.log(b)/Math.log(k)); return (b/Math.pow(k,i)).toFixed(2)+' '+s[i]; };
const MAX_IMAGE_BYTES = 180 * 1024;
const MAX_IMAGE_WIDTH = 1200;
function validateImageFile(file, label) {
    if (!file) return true;
    if (file.size > MAX_IMAGE_BYTES) {
        alert(`${label} image is too large. Please choose an image smaller than ${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`);
        return false;
    }
    return true;
}
async function readFile(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}
function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });
}
async function compressImageDataUrl(dataUrl, maxWidth = MAX_IMAGE_WIDTH, quality = 0.75) {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxWidth / img.width);
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
}
async function prepareImageFile(file) {
    if (!file) return '';
    const dataUrl = await readFile(file);
    if (file.size <= MAX_IMAGE_BYTES) return dataUrl;
    try {
        const compressed = await compressImageDataUrl(dataUrl);
        return compressed;
    } catch (err) {
        console.warn('Image compression failed, using original image', err);
        return dataUrl;
    }
}
const nextId     = arr => Math.max(0, ...arr.map(x => x.id || 0)) + 1;
function addUpdate(text) {
    const list = JSON.parse(localStorage.getItem('iraq_admin_en_updates') || '[]');
    list.unshift({ text, time: new Date().toLocaleString('en-US') });
    if (list.length > 10) list.pop();
    localStorage.setItem('iraq_admin_en_updates', JSON.stringify(list));
    renderUpdates();
}

function renderUpdates() {
    const el = document.getElementById('recentUpdates');
    if (!el) return;
    const list = JSON.parse(localStorage.getItem('iraq_admin_en_updates') || '[]');
    el.innerHTML = list.length
        ? list.map(u=>`<div class="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
            <div class="w-2 h-2 mt-2 bg-amber-500 rounded-full shrink-0"></div>
            <div><p class="text-stone-700 text-sm font-medium">${esc(u.text)}</p>
            <p class="text-stone-400 text-xs mt-1">${esc(u.time)}</p></div></div>`).join('')
        : '<p class="text-stone-400 text-center py-4">No recent updates</p>';
}

// ── Section navigation ───────────────────────────────────────────────
const TITLES = {
    dashboard:'Dashboard', events:'Manage Events', dates:'Date Types',
    council:'Council Members', studies:'Studies & Statistics',
    ads:'Advertisements', messages:'Visitor Messages', settings:'Site Settings',
};

function showSection(name) {
    document.querySelectorAll('section[id$="-section"]').forEach(s => s.classList.add('hidden-section'));
    document.getElementById(`${name}-section`)?.classList.remove('hidden-section');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
    // Support both base and English-suffixed section keys (eventsEn -> events)
    const baseName = name.replace(/En$/, '');
    document.getElementById('pageTitle').textContent = TITLES[baseName] || TITLES[name] || '';
    const loaders = { events:loadEvents, dates:loadDates, council:loadCouncil,
                      studies:loadStudies, ads:loadAds, messages:loadMessages, settings:loadSettings };
    loaders[baseName]?.();
}

function toggleSidebar() { document.querySelector('aside').classList.toggle('hidden'); }

async function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    try {
        const [{ getAuth, signOut },{ getApps, getApp }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
        ]);
        if (getApps().length) await signOut(getAuth(getApp()));
    } catch {}
    location.href = 'admin-login.html';
}

// ── Dashboard stats ──────────────────────────────────────────────────
function updateStats() {
    const counts = {
        events:   store.getJSON(StorageKeys.EVENTS,[]).length,
        dates:    store.getJSON(StorageKeys.DATES,[]).length,
        council:  store.getJSON(StorageKeys.COUNCIL,[]).length,
        studies:  store.getJSON(StorageKeys.STUDIES,[]).length,
        ads:      store.getJSON(StorageKeys.ADS,[]).length,
        messages: store.getJSON(StorageKeys.MESSAGES,[]).length,
    };
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('totalEvents',counts.events);   set('eventsCount',counts.events);
    set('totalDates',counts.dates);     set('datesCount',counts.dates);
    set('totalCouncil',counts.council); set('councilCount',counts.council);
    set('totalStudies',counts.studies); set('studiesCount',counts.studies);
    set('totalAds',counts.ads);         set('adsCount',counts.ads);
    set('totalMessages',counts.messages); set('messagesCount',counts.messages);
}

// ── Modal helpers ────────────────────────────────────────────────────
const MODALS = ['eventModal','dateModal','councilModal','studiesModal','adsModal'];
function closeAllModals() { MODALS.forEach(id => document.getElementById(id)?.classList.add('hidden')); }
function openModal(id) { closeAllModals(); document.getElementById(id)?.classList.remove('hidden'); }

function previewImage(input, previewId) {
    const f = input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => { const img=document.getElementById(previewId); if(img){img.src=e.target.result;img.classList.remove('hidden');} };
    r.readAsDataURL(f);
}

function resetForm(formId, previewId) {
    document.getElementById(formId)?.reset();
    const p = document.getElementById(previewId);
    if (p) { p.src=''; p.classList.add('hidden'); }
}

function populateImage(previewId, imgSrc) {
    const p = document.getElementById(previewId);
    if (!p) return;
    const s = safeImg(imgSrc);
    if (s) { p.src=s; p.classList.remove('hidden'); }
    else { p.src=''; p.classList.add('hidden'); }
}

// ── Type/class badge colours ─────────────────────────────────────────
const TYPE_COLORS = { Annual:'bg-blue-100 text-blue-600','Semi-Annual':'bg-purple-100 text-purple-600',Ongoing:'bg-green-100 text-green-600','One-time':'bg-amber-100 text-amber-600' };
const CLASS_COLORS = { Premium:'bg-amber-100 text-amber-600',Popular:'bg-green-100 text-green-600',Rare:'bg-purple-100 text-purple-600',Export:'bg-blue-100 text-blue-600' };
const CAT_COLORS  = { Management:'bg-red-100 text-red-600',Governorates:'bg-blue-100 text-blue-600',Specialist:'bg-green-100 text-green-600',Technical:'bg-purple-100 text-purple-600' };
const badge = (map, val) => `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[val]||'bg-stone-100 text-stone-600'}">${esc(val)}</span>`;

// =====================================================================
// EVENTS
// =====================================================================
function loadEvents() {
    const rows = store.getJSON(StorageKeys.EVENTS, []);
    const tbody = document.getElementById('eventsEnTableBody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML='<tr><td colspan="6" class="px-6 py-8 text-center text-stone-400">No events added yet</td></tr>'; return; }
    tbody.innerHTML = rows.map(ev=>`
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4"><img src="${safeImg(ev.image)||'https://placehold.co/64x64?text=Event'}" class="w-16 h-16 rounded-lg object-cover" alt=""></td>
            <td class="px-6 py-4 font-semibold text-stone-800">${esc(ev.title)}</td>
            <td class="px-6 py-4 text-stone-600">${esc(ev.date)}</td>
            <td class="px-6 py-4 text-stone-600">${esc(ev.location)}</td>
            <td class="px-6 py-4">${badge(TYPE_COLORS,ev.type)}</td>
            <td class="px-6 py-4"><div class="flex gap-2">
                <button onclick="editEvent(${Number(ev.id)||0})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteEvent(${Number(ev.id)||0})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div></td>
        </tr>`).join('');
    lucide.createIcons();
}

function openEventModal(id=null) {
    resetForm('eventForm','eventPreview');
    document.getElementById('eventModalTitle').textContent = id ? 'Edit Event' : 'Add New Event';
    document.getElementById('eventId').value = '';
    if (id) {
        const ev = store.getJSON(StorageKeys.EVENTS,[]).find(e=>e.id===id);
        if (ev) {
            document.getElementById('eventId').value = ev.id;
            document.getElementById('eventTitle').value    = ev.title;
            document.getElementById('eventDate').value     = ev.date;
            document.getElementById('eventLocation').value = ev.location;
            document.getElementById('eventType').value     = ev.type;
            document.getElementById('eventDesc').value     = ev.description;
            populateImage('eventPreview', ev.image);
        }
    }
    openModal('eventModal');
}
function closeEventModal() { document.getElementById('eventModal').classList.add('hidden'); }
function editEvent(id) { openEventModal(id); }
function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    const arr = store.getJSON(StorageKeys.EVENTS,[]).filter(e=>e.id!==id);
    store.setJSON(StorageKeys.EVENTS, arr);
    loadEvents(); updateStats(); addUpdate('Event deleted');
}

// =====================================================================
// DATES
// =====================================================================
function loadDates() {
    const rows = store.getJSON(StorageKeys.DATES, []);
    const tbody = document.getElementById('datesEnTableBody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML='<tr><td colspan="6" class="px-6 py-8 text-center text-stone-400">No date varieties added yet</td></tr>'; return; }
    tbody.innerHTML = rows.map(d=>`
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4"><img src="${safeImg(d.image)||'https://placehold.co/64x64?text=Date'}" class="w-16 h-16 rounded-lg object-cover" alt=""></td>
            <td class="px-6 py-4 font-semibold text-stone-800">${esc(d.name)}</td>
            <td class="px-6 py-4 text-stone-600 max-w-xs truncate text-sm">${esc(d.description)}</td>
            <td class="px-6 py-4 text-stone-600">${esc(d.size)}</td>
            <td class="px-6 py-4">${badge(CLASS_COLORS,d.classification)}</td>
            <td class="px-6 py-4"><div class="flex gap-2">
                <button onclick="editDate(${Number(d.id)||0})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteDate(${Number(d.id)||0})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div></td>
        </tr>`).join('');
    lucide.createIcons();
}

function openDateModal(id=null) {
    resetForm('dateForm','datePreview');
    document.getElementById('dateModalTitle').textContent = id ? 'Edit Variety' : 'Add New Variety';
    document.getElementById('dateId').value = '';
    if (id) {
        const d = store.getJSON(StorageKeys.DATES,[]).find(x=>x.id===id);
        if (d) {
            document.getElementById('dateId').value = d.id;
            document.getElementById('dateName').value  = d.name;
            document.getElementById('dateSize').value  = d.size;
            document.getElementById('dateClass').value = d.classification;
            document.getElementById('dateDesc').value  = d.description;
            populateImage('datePreview', d.image);
        }
    }
    openModal('dateModal');
}
function closeDateModal() { document.getElementById('dateModal').classList.add('hidden'); }
function editDate(id) { openDateModal(id); }
function deleteDate(id) {
    if (!confirm('Delete this variety?')) return;
    const arr = store.getJSON(StorageKeys.DATES,[]).filter(d=>d.id!==id);
    store.setJSON(StorageKeys.DATES, arr);
    loadDates(); updateStats(); addUpdate('Date variety deleted');
}

// =====================================================================
// COUNCIL
// =====================================================================
function loadCouncil() {
    const members = store.getJSON(StorageKeys.COUNCIL, []);
    const grid = document.getElementById('councilEnGrid');
    if (!grid) return;
    if (!members.length) { grid.innerHTML='<div class="col-span-full bg-white rounded-2xl p-12 text-center text-stone-400">No members added yet</div>'; return; }
    grid.innerHTML = members.map(m=>`
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative h-48 bg-stone-100 group">
                <img src="${safeImg(m.image)||'https://placehold.co/400x300?text=Member'}" class="w-full h-full object-cover" alt="">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onclick="editCouncil(${Number(m.id)||0})" class="p-2 bg-blue-600 text-white rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteCouncil(${Number(m.id)||0})" class="p-2 bg-red-600 text-white rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-stone-800">${esc(m.name)}</h3>
                <p class="text-amber-600 text-sm font-semibold mt-1">${esc(m.position)}</p>
                <div class="mt-2">${badge(CAT_COLORS,m.category)}</div>
                <p class="text-stone-500 text-sm mt-2 line-clamp-2">${esc(m.bio)}</p>
                ${m.email?`<p class="text-xs text-stone-400 mt-2 flex items-center gap-1"><i data-lucide="mail" class="w-3 h-3"></i>${esc(m.email)}</p>`:''}
                ${m.phone?`<p class="text-xs text-stone-400 mt-1 flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i>${esc(m.phone)}</p>`:''}
            </div>
        </div>`).join('');
    lucide.createIcons();
}

function openCouncilModal(id=null) {
    resetForm('councilForm','councilPreview');
    document.getElementById('councilModalTitle').textContent = id ? 'Edit Member' : 'Add New Member';
    document.getElementById('councilId').value = '';
    if (id) {
        const m = store.getJSON(StorageKeys.COUNCIL,[]).find(x=>x.id===id);
        if (m) {
            document.getElementById('councilId').value       = m.id;
            document.getElementById('councilName').value     = m.name;
            document.getElementById('councilPosition').value = m.position;
            document.getElementById('councilCategory').value = m.category;
            document.getElementById('councilBio').value      = m.bio;
            document.getElementById('councilEmail').value    = m.email||'';
            document.getElementById('councilPhone').value    = m.phone||'';
            populateImage('councilPreview', m.image);
        }
    }
    openModal('councilModal');
}
function closeCouncilModal() { document.getElementById('councilModal').classList.add('hidden'); }
function editCouncil(id) { openCouncilModal(id); }
function deleteCouncil(id) {
    if (!confirm('Delete this member?')) return;
    const arr = store.getJSON(StorageKeys.COUNCIL,[]).filter(m=>m.id!==id);
    store.setJSON(StorageKeys.COUNCIL, arr);
    loadCouncil(); updateStats(); addUpdate('Council member deleted');
}

// =====================================================================
// STUDIES
// =====================================================================
function loadStudies() {
    const rows = store.getJSON(StorageKeys.STUDIES, []);
    const tbody = document.getElementById('studiesTableBody');
    if (!tbody) return;
    if (!rows.length) { tbody.innerHTML='<tr><td colspan="4" class="px-6 py-8 text-center text-stone-400">No studies added yet</td></tr>'; return; }
    tbody.innerHTML = rows.map(s=>`
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4">
                <p class="font-semibold text-stone-800">${esc(s.title)}</p>
                ${s.description?`<p class="text-stone-400 text-sm mt-1 max-w-xs truncate">${esc(s.description)}</p>`:''}
            </td>
            <td class="px-6 py-4 text-stone-600 text-sm">${esc(s.date||'—')}</td>
            <td class="px-6 py-4">
                ${s.fileData
                    ? `<button onclick="downloadStudyAdmin(${Number(s.id)||0})" class="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-semibold">
                         <i data-lucide="download" class="w-4 h-4"></i>${esc(s.fileName||'Download')}
                       </button>`
                    : '<span class="text-stone-300 text-sm">No file</span>'}
            </td>
            <td class="px-6 py-4 text-center"><div class="flex gap-2 justify-center">
                <button onclick="editStudy(${Number(s.id)||0})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteStudy(${Number(s.id)||0})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div></td>
        </tr>`).join('');
    lucide.createIcons();
}

function downloadStudyAdmin(id) {
    const s = store.getJSON(StorageKeys.STUDIES,[]).find(x=>x.id===id);
    if (!s?.fileData) { alert('File not available.'); return; }
    const a=document.createElement('a'); a.href=s.fileData; a.download=s.fileName||'study.pdf';
    document.body.appendChild(a); a.click(); a.remove();
}

function openStudiesModal(id=null) {
    document.getElementById('studiesForm')?.reset();
    document.getElementById('studiesFileInfo')?.classList.add('hidden');
    document.getElementById('studiesModalTitle').textContent = id ? 'Edit Study' : 'Add New Study';
    document.getElementById('studiesId').value = '';
    const fileInput = document.getElementById('studiesFile');
    if (id) {
        const s = store.getJSON(StorageKeys.STUDIES,[]).find(x=>x.id===id);
        if (s) {
            document.getElementById('studiesId').value          = s.id;
            document.getElementById('studiesTitle').value       = s.title;
            document.getElementById('studiesDescription').value = s.description||'';
            document.getElementById('studiesDate').value        = s.date||'';
            if (fileInput) fileInput.required = false;
        }
    } else if (fileInput) { fileInput.required = true; }
    openModal('studiesModal');
}
function closeStudiesModal() { document.getElementById('studiesModal').classList.add('hidden'); }
function editStudy(id) { openStudiesModal(id); }
function deleteStudy(id) {
    if (!confirm('Delete this study?')) return;
    const arr = store.getJSON(StorageKeys.STUDIES,[]).filter(s=>s.id!==id);
    store.setJSON(StorageKeys.STUDIES, arr);
    loadStudies(); updateStats(); addUpdate('Study deleted');
}

// =====================================================================
// ADS
// =====================================================================
function loadAds() {
    const ads = store.getJSON(StorageKeys.ADS, []);
    const grid = document.getElementById('adsEnGrid');
    if (!grid) return;
    if (!ads.length) { grid.innerHTML='<div class="col-span-full text-center py-8 text-stone-400">No advertisements added yet</div>'; return; }
    grid.innerHTML = ads.map(ad=>`
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <img src="${safeImg(ad.image)||'https://placehold.co/640x360?text=Ad'}" class="w-full h-44 object-cover" alt="${esc(ad.title)}">
            <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-semibold rounded-full">${esc(ad.type)}</span>
                    <span class="text-stone-400 text-xs">${esc(ad.date||'')}</span>
                </div>
                <h3 class="font-bold text-stone-800 mb-1">${esc(ad.title)}</h3>
                <p class="text-stone-500 text-sm line-clamp-2 mb-3">${esc(ad.description||'')}</p>
                ${ad.link?`<a href="${safeUrl(ad.link)}" target="_blank" class="text-xs text-blue-500 hover:underline block mb-3 truncate">${esc(ad.link)}</a>`:''}
                <div class="flex gap-2">
                    <button onclick="editAd(${Number(ad.id)||0})" class="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Edit</button>
                    <button onclick="deleteAd(${Number(ad.id)||0})" class="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Delete</button>
                </div>
            </div>
        </div>`).join('');
    lucide.createIcons();
}

function openAdsModal(id=null) {
    resetForm('adsForm','adsPreview');
    document.getElementById('adsImageInfo')?.classList.add('hidden');
    document.getElementById('adsModalTitle').textContent = id ? 'Edit Advertisement' : 'Add New Advertisement';
    document.getElementById('adsId').value = '';
    const imgInput = document.getElementById('adsImage');
    if (id) {
        const ad = store.getJSON(StorageKeys.ADS,[]).find(a=>a.id===id);
        if (ad) {
            document.getElementById('adsId').value          = ad.id;
            document.getElementById('adsTitle').value       = ad.title;
            document.getElementById('adsDescription').value = ad.description||'';
            document.getElementById('adsType').value        = ad.type;
            document.getElementById('adsDate').value        = ad.date||'';
            document.getElementById('adsLink').value        = ad.link||'';
            populateImage('adsPreview', ad.image);
            if (imgInput) imgInput.required = false;
        }
    } else if (imgInput) { imgInput.required = true; }
    openModal('adsModal');
}
function closeAdsModal() { document.getElementById('adsModal').classList.add('hidden'); }
function editAd(id) { openAdsModal(id); }
function deleteAd(id) {
    if (!confirm('Delete this advertisement?')) return;
    const arr = store.getJSON(StorageKeys.ADS,[]).filter(a=>a.id!==id);
    store.setJSON(StorageKeys.ADS, arr);
    loadAds(); updateStats(); addUpdate('Advertisement deleted');
}

// =====================================================================
// MESSAGES
// =====================================================================
function loadMessages() {
    const msgs = store.getJSON(StorageKeys.MESSAGES, []);
    const list = document.getElementById('messagesList');
    if (!list) return;
    if (!msgs.length) { list.innerHTML='<div class="bg-white rounded-2xl p-12 text-center text-stone-400 shadow-sm">No messages yet</div>'; return; }
    list.innerHTML = msgs.map(m=>`
        <div class="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-5 h-5 text-amber-600"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-stone-800">${esc(m.name)}</h4>
                            <p class="text-stone-400 text-sm">${esc(m.email)}</p>
                        </div>
                        ${m.subject?`<span class="px-2 py-1 bg-stone-100 text-stone-500 text-xs rounded-full">${esc(m.subject)}</span>`:''}
                    </div>
                    <p class="text-stone-700 leading-relaxed">${esc(m.message)}</p>
                    ${m.time?`<p class="text-stone-400 text-xs mt-3">${esc(m.time)}</p>`:''}
                </div>
                <button onclick="deleteMessage(${Number(m.id)||0})" class="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`).join('');
    lucide.createIcons();
}

function deleteMessage(id) {
    const arr = store.getJSON(StorageKeys.MESSAGES,[]).filter(m=>m.id!==id);
    store.setJSON(StorageKeys.MESSAGES, arr);
    loadMessages(); updateStats();
}
function clearAllMessages() {
    if (!confirm('Delete all messages? This cannot be undone.')) return;
    store.setJSON(StorageKeys.MESSAGES, []);
    loadMessages(); updateStats();
}

// =====================================================================
// SETTINGS
// =====================================================================
function loadSettings() {
    const s = store.getJSON(StorageKeys.SETTINGS, {});
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
    set('siteTitle',   s.siteTitle);
    set('siteEmail',   s.email);
    set('sitePhone',   s.phone);
    set('siteAddress', s.address);
    set('aboutText',   s.aboutText);
}

// =====================================================================
// SEED DATA  (only if empty)
// =====================================================================
function seedDefaults() {
    if (!store.get(StorageKeys.EVENTS)) {
        store.setJSON(StorageKeys.EVENTS, [
            { id:1, title:'Iraqi Dates Festival', date:'October 2024', location:'Baghdad', type:'Annual',
              description:'A major annual festival showcasing various Iraqi date varieties with farmers from all provinces.', image:'' },
            { id:2, title:'Farmer Training Workshops', date:'Year-round', location:'All Governorates', type:'Ongoing',
              description:'Specialised training programmes in palm cultivation, date care, and modern storage techniques.', image:'' },
            { id:3, title:'Exporters Forum', date:'June & December', location:'Basra', type:'Semi-Annual',
              description:'Periodic meetings between local producers and international importers to boost foreign trade.', image:'' },
        ]);
    }
    if (!store.get(StorageKeys.DATES)) {
        store.setJSON(StorageKeys.DATES, [
            { id:1, name:'Barhi',    size:'Medium', classification:'Premium', description:'Premium dates with golden colour and a sweet balanced flavour.', image:'' },
            { id:2, name:'Zahdi',    size:'Large',  classification:'Popular', description:'One of the most popular varieties, yellow-gold with a delicious taste.', image:'' },
            { id:3, name:'Khadrawi', size:'Small',  classification:'Rare',    description:'Rare dates with a soft texture and unique flavour.', image:'' },
            { id:4, name:'Dayri',    size:'Large',  classification:'Premium', description:'Among the finest varieties, rich in nutrients.', image:'' },
        ]);
    }
    if (!store.get(StorageKeys.SETTINGS)) {
        store.setJSON(StorageKeys.SETTINGS, {
            siteTitle:'Iraqi Dates Council',
            email:'idcouncil25@gmail.com',
            phone:'+964 07816142711',
            address:'Baghdad – Abu Nuwas',
            aboutText:'The Iraqi Dates Council is a specialised body established to develop and regulate the dates industry in Iraq.',
        });
    }
}

// =====================================================================
// BOOT / DOMContentLoaded
// =====================================================================
document.addEventListener('DOMContentLoaded', async function () {
    await fbReady;

    // Firebase status badge
    const statusEl = document.getElementById('firebaseStatus');
    if (statusEl) {
        statusEl.innerHTML = fbEnabled
            ? '<span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Firebase connected'
            : '<span class="w-2 h-2 bg-red-400 rounded-full inline-block"></span> Local storage only';
        statusEl.className = `flex items-center gap-1 text-xs ${fbEnabled?'text-green-600':'text-red-500'}`;
    }

    seedDefaults();
    updateStats();
    renderUpdates();

    // ── Event form ─────────────────────────────────────────────────
    document.getElementById('eventForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('eventId').value);
        const preview = document.getElementById('eventPreview');
        const imgFile = document.getElementById('eventImage').files[0];
        if (imgFile && !validateImageFile(imgFile, 'Event')) return;
        let imgData = preview.src && !preview.classList.contains('hidden') ? preview.src : '';
        if (imgFile) imgData = await prepareImageFile(imgFile);
        const data = {
            id: id || Date.now(),
            title:       trim(document.getElementById('eventTitle').value),
            date:        trim(document.getElementById('eventDate').value),
            location:    trim(document.getElementById('eventLocation').value),
            type:        trim(document.getElementById('eventType').value),
            description: trim(document.getElementById('eventDesc').value),
            image: imgData,
        };
        const arr = store.getJSON(StorageKeys.EVENTS,[]);
        if (id) { const i=arr.findIndex(x=>x.id===id); if(i>-1) arr[i]=data; }
        else arr.push(data);
        store.setJSON(StorageKeys.EVENTS, arr);
        closeEventModal(); loadEvents(); updateStats();
        addUpdate(`Event ${id?'updated':'added'}: ${esc(data.title)}`);
    });

    // ── Date form ──────────────────────────────────────────────────
    document.getElementById('dateForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('dateId').value);
        const preview = document.getElementById('datePreview');
        const imgFile = document.getElementById('dateImage').files[0];
        if (imgFile && !validateImageFile(imgFile, 'Date variety')) return;
        let imgData = preview.src && !preview.classList.contains('hidden') ? preview.src : '';
        if (imgFile) imgData = await prepareImageFile(imgFile);
        const data = {
            id: id || Date.now(),
            name:           trim(document.getElementById('dateName').value),
            size:           trim(document.getElementById('dateSize').value),
            classification: trim(document.getElementById('dateClass').value),
            description:    trim(document.getElementById('dateDesc').value),
            image: imgData,
        };
        const arr = store.getJSON(StorageKeys.DATES,[]);
        if (id) { const i=arr.findIndex(x=>x.id===id); if(i>-1) arr[i]=data; }
        else arr.push(data);
        store.setJSON(StorageKeys.DATES, arr);
        closeDateModal(); loadDates(); updateStats();
        addUpdate(`Date variety ${id?'updated':'added'}: ${esc(data.name)}`);
    });

    // ── Council form ───────────────────────────────────────────────
    document.getElementById('councilForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('councilId').value);
        const preview = document.getElementById('councilPreview');
        const imgFile = document.getElementById('councilImage').files[0];
        if (imgFile && !validateImageFile(imgFile, 'Council member')) return;
        let imgData = preview.src && !preview.classList.contains('hidden') ? preview.src : '';
        if (imgFile) imgData = await prepareImageFile(imgFile);
        const data = {
            id: id || Date.now(),
            name:     trim(document.getElementById('councilName').value),
            position: trim(document.getElementById('councilPosition').value),
            category: trim(document.getElementById('councilCategory').value),
            bio:      trim(document.getElementById('councilBio').value),
            email:    trim(document.getElementById('councilEmail').value),
            phone:    trim(document.getElementById('councilPhone').value),
            image: imgData,
        };
        const arr = store.getJSON(StorageKeys.COUNCIL,[]);
        if (id) { const i=arr.findIndex(x=>x.id===id); if(i>-1) arr[i]=data; }
        else arr.push(data);
        store.setJSON(StorageKeys.COUNCIL, arr);
        closeCouncilModal(); loadCouncil(); updateStats();
        addUpdate(`Member ${id?'updated':'added'}: ${esc(data.name)}`);
    });

    // ── Studies form ───────────────────────────────────────────────
    document.getElementById('studiesForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id        = parseInt(document.getElementById('studiesId').value);
        const title     = trim(document.getElementById('studiesTitle').value);
        const desc      = trim(document.getElementById('studiesDescription').value);
        const date      = trim(document.getElementById('studiesDate').value);
        const fileInput = document.getElementById('studiesFile');
        const f         = fileInput?.files[0];
        const arr       = store.getJSON(StorageKeys.STUDIES,[]);
        if (id) {
            const i = arr.findIndex(s=>s.id===id);
            if (i>-1) {
                arr[i].title=title; arr[i].description=desc; arr[i].date=date;
                if (f) { arr[i].fileData=await readFile(f); arr[i].fileName=f.name; }
            }
        } else {
            if (!f) { alert('Please select a PDF file.'); return; }
            arr.push({ id:nextId(arr), title, description:desc, date, fileData:await readFile(f), fileName:f.name });
        }
        store.setJSON(StorageKeys.STUDIES, arr);
        closeStudiesModal(); loadStudies(); updateStats();
        addUpdate(`Study ${id?'updated':'added'}: ${title}`);
    });

    // Studies file preview
    document.getElementById('studiesFile')?.addEventListener('change', function() {
        const f = this.files[0]; if (!f) return;
        const info = document.getElementById('studiesFileInfo');
        if (info) {
            document.getElementById('studiesFileName').textContent = f.name;
            document.getElementById('studiesFileSize').textContent = fmtSize(f.size);
            info.classList.remove('hidden');
        }
    });

    // ── Ads form ───────────────────────────────────────────────────
    document.getElementById('adsForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id       = parseInt(document.getElementById('adsId').value);
        const title    = trim(document.getElementById('adsTitle').value);
        const desc     = trim(document.getElementById('adsDescription').value);
        const type     = trim(document.getElementById('adsType').value);
        const date     = trim(document.getElementById('adsDate').value);
        const link     = safeUrl(document.getElementById('adsLink').value);
        const imgInput = document.getElementById('adsImage');
        const preview  = document.getElementById('adsPreview');
        const imgFile  = imgInput?.files[0];
        if (imgFile && !validateImageFile(imgFile, 'Advertisement')) return;
        if (!id && !imgFile) { alert('Please select an image for the new ad.'); return; }
        let imgData = preview.src && !preview.classList.contains('hidden') ? preview.src : '';
        if (imgFile) imgData = await prepareImageFile(imgFile);
        const arr = store.getJSON(StorageKeys.ADS,[]);
        if (id) {
            const i=arr.findIndex(a=>a.id===id);
            if(i>-1){ arr[i].title=title;arr[i].description=desc;arr[i].type=type;arr[i].date=date;arr[i].link=link; if(imgData) arr[i].image=imgData; }
        } else {
            arr.push({ id:nextId(arr), title, description:desc, image:imgData, type, date, link });
        }
        store.setJSON(StorageKeys.ADS, arr);
        closeAdsModal(); loadAds(); updateStats();
        addUpdate(`Ad ${id?'updated':'added'}: ${title}`);
    });

    // Ads image preview
    document.getElementById('adsImage')?.addEventListener('change', function() {
        const f=this.files[0]; if(!f) return;
        previewImage(this,'adsPreview');
        const info=document.getElementById('adsImageInfo');
        if(info){
            document.getElementById('adsImageName').textContent=f.name;
            document.getElementById('adsImageSize').textContent=fmtSize(f.size);
            info.classList.remove('hidden');
        }
    });

    // ── Settings form ──────────────────────────────────────────────
    document.getElementById('settingsForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const s = {
            siteTitle: trim(document.getElementById('siteTitle').value),
            email:     trim(document.getElementById('siteEmail').value),
            phone:     trim(document.getElementById('sitePhone').value),
            address:   trim(document.getElementById('siteAddress').value),
            aboutText: trim(document.getElementById('aboutText').value),
        };
        store.setJSON(StorageKeys.SETTINGS, s);
        alert('Settings saved successfully!');
        addUpdate('Site settings updated');
    });

    // ── Search filters ─────────────────────────────────────────────
    document.getElementById('studiesSearch')?.addEventListener('input', function() {
        const q=this.value.toLowerCase();
        document.querySelectorAll('#studiesTableBody tr').forEach(r=>{ r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'; });
    });
    document.getElementById('adsSearch')?.addEventListener('input', function() {
        const q=this.value.toLowerCase();
        document.querySelectorAll('#adsEnGrid > div').forEach(c=>{ c.style.display=c.textContent.toLowerCase().includes(q)?'':'none'; });
    });

    // Close modal on backdrop click
    window.onclick = e => { if (e.target.classList.contains('fixed')) closeAllModals(); };

    // Current date in header
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US',{
        weekday:'long', year:'numeric', month:'long', day:'numeric'
    });
});
