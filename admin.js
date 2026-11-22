// Admin Panel JavaScript - CMS for Iraqi Dates Council

// ===== مفاتيح التخزين =====
const StorageKeys = {
    EVENTS:   'iraq_dates_events',
    DATES:    'iraq_dates_types',
    COUNCIL:  'iraq_dates_council',
    STUDIES:  'iraq_dates_studies',
    ADS:      'iraq_dates_ads',
    SETTINGS: 'iraq_dates_settings',
    MESSAGES: 'iraq_dates_messages'
};

const EnglishStorageKeys = {
    EVENTS: 'iraq_dates_events_en',
    DATES: 'iraq_dates_types_en',
    COUNCIL: 'iraq_dates_council_en',
    STUDIES: 'iraq_dates_studies_en',
    ADS: 'iraq_dates_ads_en',
    SETTINGS: 'iraq_dates_settings_en'
};

// Data Management
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyD2Y9jQF7XWmo0uegj3uWrQfTKbCAcH97o',
    authDomain: 'id-council-c1b1d.firebaseapp.com',
    projectId: 'id-council-c1b1d',
    storageBucket: 'id-council-c1b1d.firebasestorage.app',
    messagingSenderId: '2987746191',
    appId: '1:2987746191:web:e8f267db34eb0a903b21fa'
};

const FIRESTORE_COLLECTION = 'siteData';
const firebaseCache = new Map();
let firebaseDocApi = null;
let firebaseEnabled = false;
let firebaseInitError = null;

const getfirebase = {
    getItem(key) {
        if (firebaseCache.has(key)) {
            return firebaseCache.get(key);
        }

        return window.localStorage.getItem(key);
    },
    setItem(key, value) {
        const normalized = String(value);
        firebaseCache.set(key, normalized);
        window.localStorage.setItem(key, normalized);

        firebaseReady.then(() => {
            if (firebaseDocApi) {
                firebaseDocApi.set(key, normalized).catch((error) => {
                    console.error(`فشل حفظ ${key} في Firebase:`, error);
                });
            }
        });
    },
    removeItem(key) {
        firebaseCache.delete(key);
        window.localStorage.removeItem(key);

        firebaseReady.then(() => {
            if (firebaseDocApi) {
                firebaseDocApi.remove(key).catch((error) => {
                    console.error(`فشل حذف ${key} من Firebase:`, error);
                });
            }
        });
    }
};

async function initializeFirebaseStore() {
    try {
        const [{ initializeApp, getApps, getApp }, firestoreModule, { getAuth, onAuthStateChanged }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js')
        ]);

        const {
            getFirestore,
            doc,
            getDoc,
            setDoc,
            deleteDoc,
            serverTimestamp,
            onSnapshot
        } = firestoreModule;

        const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app);
        const auth = getAuth(app);

        // انتظر حتى يتحقق Firebase Auth من حالة المستخدم
        await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (!user) {
                    // المستخدم غير مسجّل — أعِده لصفحة الدخول
                    console.warn('المستخدم غير مسجّل في Firebase Auth، إعادة التوجيه...');
                    window.location.href = 'admin-login.html';
                }
                resolve(user);
            });
        });

        firebaseDocApi = {
            async set(key, value) {
                await setDoc(doc(db, FIRESTORE_COLLECTION, key), {
                    value,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            },
            async remove(key) {
                await deleteDoc(doc(db, FIRESTORE_COLLECTION, key));
            }
        };

        await Promise.all([...Object.values(StorageKeys), ...Object.values(EnglishStorageKeys)].map(async (key) => {
            const docRef = doc(db, FIRESTORE_COLLECTION, key);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                const remoteValue = String(snapshot.data().value ?? '');
                firebaseCache.set(key, remoteValue);
                window.localStorage.setItem(key, remoteValue);
            } else {
                const localValue = window.localStorage.getItem(key);
                if (localValue !== null) {
                    firebaseCache.set(key, localValue);
                    await firebaseDocApi.set(key, localValue);
                }
            }

            onSnapshot(docRef, (nextSnapshot) => {
                if (!nextSnapshot.exists()) {
                    firebaseCache.delete(key);
                    window.localStorage.removeItem(key);
                    return;
                }

                const remoteValue = String(nextSnapshot.data().value ?? '');
                firebaseCache.set(key, remoteValue);
                window.localStorage.setItem(key, remoteValue);
            });
        }));

        firebaseEnabled = true;
        return true;
    } catch (error) {
        firebaseInitError = error;
        console.error('تعذر تهيئة Firebase، سيتم استخدام التخزين المحلي مؤقتاً:', error);
        return false;
    }
}

const firebaseReady = initializeFirebaseStore();

const UploadConstraints = {
    studyMaxBytes: 5 * 1024 * 1024,
    adImageMaxBytes: 2 * 1024 * 1024,
    studyMimeTypes: ['application/pdf'],
    adImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
};

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

function getStoredList(key) {
    try {
        return JSON.parse(getfirebase.getItem(key) || '[]');
    } catch (_) {
        return [];
    }
}

function syncLocalizedRecord(arabicKey, englishKey, arabicRecord, englishRecord) {
    const arabicRecords = getStoredList(arabicKey);
    const englishRecords = getStoredList(englishKey);
    const arabicIndex = arabicRecords.findIndex(record => Number(record.id) === Number(arabicRecord.id));
    const englishIndex = englishRecords.findIndex(record => Number(record.id) === Number(arabicRecord.id));

    if (arabicIndex === -1) arabicRecords.push(arabicRecord);
    else arabicRecords[arabicIndex] = { ...arabicRecords[arabicIndex], ...arabicRecord };

    if (englishIndex === -1) englishRecords.push(englishRecord);
    else englishRecords[englishIndex] = { ...englishRecords[englishIndex], ...englishRecord };

    getfirebase.setItem(arabicKey, JSON.stringify(arabicRecords));
    getfirebase.setItem(englishKey, JSON.stringify(englishRecords));
}

function removeLocalizedRecord(arabicKey, englishKey, id) {
    getfirebase.setItem(arabicKey, JSON.stringify(getStoredList(arabicKey).filter(record => Number(record.id) !== Number(id))));
    getfirebase.setItem(englishKey, JSON.stringify(getStoredList(englishKey).filter(record => Number(record.id) !== Number(id))));
}

function sanitizeHttpUrl(value) {
    const raw = normalizeText(value);
    if (!raw) return '';

    try {
        const url = new URL(raw, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
        return '';
    }
}

function sanitizeImageSource(value) {
    const raw = normalizeText(value);
    if (!raw) return '';
    if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(raw)) return raw;

    try {
        const url = new URL(raw, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
        return '';
    }
}

function validateFile(file, allowedMimeTypes, maxBytes, label) {
    if (!file) {
        return `${label} غير موجود.`;
    }

    if (!allowedMimeTypes.includes(file.type)) {
        return `${label} يجب أن يكون من نوع ${allowedMimeTypes.join(' أو ')}.`;
    }

    if (file.size > maxBytes) {
        return `${label} يتجاوز الحجم المسموح (${formatFileSize(maxBytes)}).`;
    }

    return '';
}

// Initialize default data if not exists
function initializeData() {
    if (!getfirebase.getItem(StorageKeys.EVENTS)) {
        const defaultEvents = [
            {
                id: 1,
                title: 'مهرجان التمور العراقية',
                date: 'أكتوبر 2024',
                location: 'بغداد',
                type: 'سنوي',
                description: 'مهرجان سنوي كبير يعرض فيه مختلف أنواع التمور العراقية ويشارك فيه مزارعون من كل المحافظات',
                image: 'http://static.photos/event/640x360/111'
            },
            {
                id: 2,
                title: 'ورش تدريبية للمزارعين',
                date: 'طوال العام',
                location: 'جميع المحافظات',
                type: 'مستمر',
                description: 'برامج تدريبية متخصصة في مجال زراعة النخيل، العناية بالتمور، وتقنيات التخزين الحديثة',
                image: 'http://static.photos/education/640x360/222'
            },
            {
                id: 3,
                title: 'ملتقى المصدرين',
                date: 'يونيو وديسمبر',
                location: 'البصرة',
                type: 'نصف سنوي',
                description: 'لقاءات دورية تجمع بين المنتجين المحليين والمستوردين الدوليين لتعزيز التجارة الخارجية',
                image: 'http://static.photos/office/640x360/333'
            }
        ];
        getfirebase.setItem(StorageKeys.EVENTS, JSON.stringify(defaultEvents));
    }

    if (!getfirebase.getItem(StorageKeys.DATES)) {
        const defaultDates = [
            {
                id: 1,
                name: 'البرحي',
                size: 'متوسط',
                classification: 'فاخر',
                description: 'تمور فاخرة ذات لون ذهبي ومذاق حلو متوسط',
                image: 'http://static.photos/food/640x360/1'
            },
            {
                id: 2,
                name: 'الزهدي',
                size: 'كبير',
                classification: 'شعبي',
                description: 'من أشهر الأنواع، ذات لون أصفر ذهبي ومذاق لذيذ',
                image: 'http://static.photos/food/640x360/2'
            },
            {
                id: 3,
                name: 'الخستاوي',
                size: 'صغير',
                classification: 'نادر',
                description: 'تمور نادرة ذات ملمس ناعم ومذاق فريد',
                image: 'http://static.photos/food/640x360/3'
            },
            {
                id: 4,
                name: 'الديري',
                size: 'كبير',
                classification: 'فاخر',
                description: 'من أفخر الأنواع، حمراء اللون وغنية بالفوائد',
                image: 'http://static.photos/food/640x360/4'
            }
        ];
        getfirebase.setItem(StorageKeys.DATES, JSON.stringify(defaultDates));
    }

    if (!getfirebase.getItem(StorageKeys.SETTINGS)) {
        const defaultSettings = {
            siteTitle: 'مجلس التمور العراقي',
            email: 'idcouncil25@gmail.com',
            phone: '+964 07816142711',
            address: ' بغداد - ابونواس',
            aboutText: 'يعتبر مجلس التمور العراقي هيئة متخصصة تأسست بهدف تطوير وتنظيم صناعة التمور في العراق.'
        };
        getfirebase.setItem(StorageKeys.SETTINGS, JSON.stringify(defaultSettings));
    }

    if (!getfirebase.getItem(StorageKeys.COUNCIL)) {
        const defaultCouncil = [
            {
                id: 1,
                name: 'أ.د محمد عبدالله الخيال',
                position: 'رئيس المجلس',
                category: 'إدارة',
                bio: 'متخصص في الاقتصاد الزراعي وتطوير صناعة التمور العراقية، يتمتع بخبرة أكثر من 20 سنة في المجال',
                email: 'mkhayyal@iraqdates.org',
                phone: '+964 770 123 4567',
                image: 'http://static.photos/people/640x360/1'
            },
            {
                id: 2,
                name: 'أ.د فاطمة محمود',
                position: 'نائب الرئيس',
                category: 'إدارة',
                bio: 'خبيرة في التسويق الزراعي والتجارة الدولية، قادت عدة مشاريع ناجحة للتصدير',
                email: 'fmahmoud@iraqdates.org',
                phone: '+964 770 234 5678',
                image: 'http://static.photos/people/640x360/2'
            },
            {
                id: 3,
                name: 'د. علي حسن الشمري',
                position: 'نائب مدير عام',
                category: 'إدارة',
                bio: 'متخصص في البحث العلمي وتطوير أصناف التمور، له منشورات عالمية معروفة',
                email: 'ashammari@iraqdates.org',
                phone: '+964 770 345 6789',
                image: 'http://static.photos/people/640x360/3'
            },
            {
                id: 4,
                name: 'أ. سامح عبدالرحمن',
                position: 'رئيس قسم الجودة والمعايير',
                category: 'متخصص',
                bio: 'خبير في معايير الجودة الدولية، يشرف على جميع عمليات التدقيق والاعتماد',
                email: 'sameh@iraqdates.org',
                phone: '+964 770 456 7890',
                image: 'http://static.photos/people/640x360/4'
            },
            {
                id: 5,
                name: 'م. زيد الحسين',
                position: 'رئيس الجانب الفني',
                category: 'فني',
                bio: 'متخصص في التقنيات الحديثة لمعالجة وتعبئة التمور، يقدم الاستشارات للمزارعين',
                email: 'zaid@iraqdates.org',
                phone: '+964 770 567 8901',
                image: 'http://static.photos/people/640x360/5'
            },
            {
                id: 6,
                name: 'أ. هيفاء سالم',
                position: 'ممثلة محافظة البصرة',
                category: 'محافظات',
                bio: 'مسؤولة عن تمثيل محافظة البصرة وتنسيق الأنشطة في المحافظة',
                email: 'haffa.salem@iraqdates.org',
                phone: '+964 770 678 9012',
                image: 'http://static.photos/people/640x360/6'
            }
        ];
        getfirebase.setItem(StorageKeys.COUNCIL, JSON.stringify(defaultCouncil));
    }

    if (!getfirebase.getItem(StorageKeys.STUDIES)) {
        const defaultStudies = [
            {
                id: 1,
                title: 'دراسة إنتاجية التمور في العراق 2023',
                description: 'دراسة شاملة عن إنتاجية التمور في مختلف المحافظات العراقية لعام 2023',
                file: 'study1.pdf',
                date: '2024-01-15'
            },
            {
                id: 2,
                title: 'تقرير الجودة والمعايير للتمور المصدرة',
                description: 'تقرير مفصل عن معايير الجودة المطبقة على التمور المصدرة من العراق',
                file: 'study2.pdf',
                date: '2024-02-20'
            }
        ];
        getfirebase.setItem(StorageKeys.STUDIES, JSON.stringify(defaultStudies));
    }

    if (!getfirebase.getItem(StorageKeys.ADS)) {
        const defaultAds = [
            {
                id: 1,
                title: 'معرض التمور الدولي 2024',
                description: 'انضم إلينا في معرض التمور الدولي الأكبر في الشرق الأوسط',
                image: 'http://static.photos/exhibition/640x360/111',
                type: 'معرض',
                date: '2024-11-15',
                link: 'https://iraqdates.org/exhibition'
            },
            {
                id: 2,
                title: 'منتدى المزارعين العراقيين',
                description: 'منتدى سنوي يجمع المزارعين والخبراء لمناقشة أحدث التقنيات',
                image: 'http://static.photos/forum/640x360/222',
                type: 'منتدى',
                date: '2024-09-10',
                link: 'https://iraqdates.org/forum'
            }
        ];
        getfirebase.setItem(StorageKeys.ADS, JSON.stringify(defaultAds));
    }
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('section[id$="-section"]').forEach(section => {
        section.classList.add('hidden-section');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'الرئيسية',
        'events': 'إدارة الفعاليات',
        'dates': 'إدارة أنواع التمور',
        'council': 'إدارة أعضاء المجلس',
        'studies': 'إدارة الدراسات والإحصائيات',
        'ads': 'إدارة الإعلانات',
        'messages': 'رسائل الزوار',
        'settings': 'إعدادات الموقع'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'لوحة التحكم';
    
    // Refresh data if needed
    if (sectionName === 'events') loadEvents();
    if (sectionName === 'dates') loadDates();
    if (sectionName === 'council') loadCouncil();
    if (sectionName === 'studies') loadStudies();
    if (sectionName === 'ads') loadAds();
    if (sectionName === 'messages') loadMessages();
    if (sectionName === 'settings') loadSettings();
}

function toggleSidebar() {
    const sidebar = document.querySelector('aside');
    sidebar.classList.toggle('hidden');
}

async function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    try {
        const [{ getAuth, signOut }, { getApps, getApp }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js')
        ]);
        const apps = getApps();
        if (apps.length > 0) {
            const auth = getAuth(getApp());
            await signOut(auth);
        }
    } catch (e) {
        console.warn('تعذر تسجيل الخروج من Firebase:', e);
    }
    window.location.href = 'admin-login.html';
}

// Dashboard Functions
function updateDashboardStats() {
    const events = JSON.parse(getfirebase.getItem(StorageKeys.EVENTS) || '[]');
    const dates = JSON.parse(getfirebase.getItem(StorageKeys.DATES) || '[]');
    const messages = JSON.parse(getfirebase.getItem(StorageKeys.MESSAGES) || '[]');
    const council = JSON.parse(getfirebase.getItem(StorageKeys.COUNCIL) || '[]');
    const studies = JSON.parse(getfirebase.getItem(StorageKeys.STUDIES) || '[]');
    const ads = JSON.parse(getfirebase.getItem(StorageKeys.ADS) || '[]');
    
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('totalDates').textContent = dates.length;
    document.getElementById('totalMessages').textContent = messages.length;
    document.getElementById('totalCouncil').textContent = council.length;
    document.getElementById('totalStudies').textContent = studies.length;
    document.getElementById('totalAds').textContent = ads.length;
    
    document.getElementById('eventsCount').textContent = events.length;
    document.getElementById('datesCount').textContent = dates.length;
    document.getElementById('councilCount').textContent = council.length;
    document.getElementById('messagesCount').textContent = messages.length;
    document.getElementById('studiesCount').textContent = studies.length;
    document.getElementById('adsCount').textContent = ads.length;
}

// Events Management
function loadEvents() {
    const events = JSON.parse(getfirebase.getItem(StorageKeys.EVENTS) || '[]');
    const tbody = document.getElementById('eventsTableBody');
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-stone-500">لا توجد فعاليات مضافة بعد</td></tr>';
        return;
    }
    
    tbody.innerHTML = events.map(event => `
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4">
                <img src="${event.image}" alt="${event.title}" class="w-16 h-16 rounded-lg object-cover">
            </td>
            <td class="px-6 py-4 font-medium text-stone-800">${event.title}</td>
            <td class="px-6 py-4 text-stone-600">${event.date}</td>
            <td class="px-6 py-4 text-stone-600">${event.location}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(event.type)}">
                    ${event.type}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="editEvent(${event.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteEvent(${event.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function getTypeColor(type) {
    const colors = {
        'سنوي': 'bg-amber-100 text-amber-600',
        'نصف سنوي': 'bg-blue-100 text-blue-600',
        'مستمر': 'bg-green-100 text-green-600',
        'مرة واحدة': 'bg-purple-100 text-purple-600'
    };
    return colors[type] || 'bg-stone-100 text-stone-600';
}

function openEventModal(eventId = null) {
    closeAllModals();
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const title = document.getElementById('eventModalTitle');
    
    form.reset();
    document.getElementById('eventPreview').classList.add('hidden');
    
    if (eventId) {
        const events = JSON.parse(getfirebase.getItem(StorageKeys.EVENTS) || '[]');
        const event = events.find(e => Number(e.id) === Number(eventId));
        
        if (event) {
            title.textContent = 'تعديل الفعالية';
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventType').value = event.type;
            document.getElementById('eventDesc').value = event.description;
            const englishEvent = getStoredList(EnglishStorageKeys.EVENTS).find(item => Number(item.id) === Number(event.id)) || {};
            document.getElementById('eventTitleEn').value = englishEvent.title || '';
            document.getElementById('eventDateEn').value = englishEvent.date || '';
            document.getElementById('eventLocationEn').value = englishEvent.location || '';
            document.getElementById('eventTypeEn').value = englishEvent.type || '';
            document.getElementById('eventDescEn').value = englishEvent.description || '';
            
            if (event.image) {
                document.getElementById('eventPreview').src = event.image;
                document.getElementById('eventPreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة فعالية جديدة';
        document.getElementById('eventId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function editEvent(id) {
    openEventModal(id);
}

function deleteEvent(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    
    removeLocalizedRecord(StorageKeys.EVENTS, EnglishStorageKeys.EVENTS, id);
    
    loadEvents();
    updateDashboardStats();
    addRecentUpdate('تم حذف فعالية');
}

// Dates Management
function loadDates() {
    const dates = JSON.parse(getfirebase.getItem(StorageKeys.DATES) || '[]');
    const tbody = document.getElementById('datesTableBody');
    
    if (dates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-stone-500">لا توجد أنواع تمور مضافة بعد</td></tr>';
        return;
    }
    
    tbody.innerHTML = dates.map(date => `
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4">
                <img src="${date.image}" alt="${date.name}" class="w-16 h-16 rounded-lg object-cover">
            </td>
            <td class="px-6 py-4 font-medium text-stone-800">${date.name}</td>
            <td class="px-6 py-4 text-stone-600 text-sm max-w-xs truncate">${date.description}</td>
            <td class="px-6 py-4 text-stone-600">${date.size}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${getClassColor(date.classification)}">
                    ${date.classification}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="editDate(${date.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteDate(${date.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function getClassColor(classification) {
    const colors = {
        'فاخر': 'bg-amber-100 text-amber-600',
        'شعبي': 'bg-green-100 text-green-600',
        'نادر': 'bg-purple-100 text-purple-600',
        'تصدير': 'bg-blue-100 text-blue-600'
    };
    return colors[classification] || 'bg-stone-100 text-stone-600';
}

function openDateModal(dateId = null) {
    closeAllModals();
    const modal = document.getElementById('dateModal');
    const form = document.getElementById('dateForm');
    const title = document.getElementById('dateModalTitle');
    
    form.reset();
    document.getElementById('datePreview').classList.add('hidden');
    
    if (dateId) {
        const dates = JSON.parse(getfirebase.getItem(StorageKeys.DATES) || '[]');
        const date = dates.find(d => Number(d.id) === Number(dateId));
        
        if (date) {
            title.textContent = 'تعديل نوع التمر';
            document.getElementById('dateId').value = date.id;
            document.getElementById('dateName').value = date.name;
            document.getElementById('dateSize').value = date.size;
            document.getElementById('dateClass').value = date.classification;
            document.getElementById('dateDesc').value = date.description;
            const englishDate = getStoredList(EnglishStorageKeys.DATES).find(item => Number(item.id) === Number(date.id)) || {};
            document.getElementById('dateNameEn').value = englishDate.name || '';
            document.getElementById('dateSizeEn').value = englishDate.size || '';
            document.getElementById('dateClassEn').value = englishDate.classification || '';
            document.getElementById('dateDescEn').value = englishDate.description || '';
            
            if (date.image) {
                document.getElementById('datePreview').src = date.image;
                document.getElementById('datePreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة نوع تمر جديد';
        document.getElementById('dateId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeDateModal() {
    document.getElementById('dateModal').classList.add('hidden');
}

function editDate(id) {
    openDateModal(id);
}

function deleteDate(id) {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    
    removeLocalizedRecord(StorageKeys.DATES, EnglishStorageKeys.DATES, id);
    
    loadDates();
    updateDashboardStats();
    addRecentUpdate('تم حذف نوع تمر');
}

// Messages Management
function loadMessages() {
    const messages = JSON.parse(getfirebase.getItem(StorageKeys.MESSAGES) || '[]');
    const container = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-stone-500 bg-white rounded-2xl">لا توجد رسائل بعد</div>';
        return;
    }
    
    container.innerHTML = messages.map((msg, index) => `
        <div class="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <i data-lucide="user" class="w-6 h-6 text-amber-600"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-stone-800">${msg.name}</h4>
                        <p class="text-sm text-stone-500">${msg.email}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-stone-400">${msg.date}</span>
                    <button onclick="deleteMessage(${index})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="bg-stone-50 rounded-xl p-4 mb-3">
                <p class="text-stone-600 text-sm mb-2"><span class="font-semibold">الموضوع:</span> ${msg.subject}</p>
                <p class="text-stone-700">${msg.message}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-stone-500">
                <i data-lucide="clock" class="w-4 h-4"></i>
                <span>تاريخ الإرسال: ${msg.timestamp}</span>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function deleteMessage(index) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    let messages = JSON.parse(getfirebase.getItem(StorageKeys.MESSAGES) || '[]');
    messages.splice(index, 1);
    getfirebase.setItem(StorageKeys.MESSAGES, JSON.stringify(messages));
    
    loadMessages();
    updateDashboardStats();
}

function clearAllMessages() {
    if (!confirm('هل أنت متأكد من حذف جميع الرسائل؟')) return;
    
    getfirebase.removeItem(StorageKeys.MESSAGES);
    loadMessages();
    updateDashboardStats();
}

// Settings Management
function loadSettings() {
    const settings = JSON.parse(getfirebase.getItem(StorageKeys.SETTINGS) || '{}');
    const englishSettings = JSON.parse(getfirebase.getItem(EnglishStorageKeys.SETTINGS) || '{}');
    
    document.getElementById('siteTitle').value = settings.siteTitle || '';
    document.getElementById('siteEmail').value = settings.email || '';
    document.getElementById('sitePhone').value = settings.phone || '';
    document.getElementById('siteAddress').value = settings.address || '';
    document.getElementById('aboutText').value = settings.aboutText || '';
    document.getElementById('siteTitleEn').value = englishSettings.siteTitle || '';
    document.getElementById('siteAddressEn').value = englishSettings.address || '';
    document.getElementById('aboutTextEn').value = englishSettings.aboutText || '';
}

// Form Submissions


document.getElementById('dateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const dateId = document.getElementById('dateId').value;
    const imagePreview = document.getElementById('datePreview');
    
    const dateData = {
        id: dateId ? parseInt(dateId) : Date.now(),
        name: document.getElementById('dateName').value,
        size: document.getElementById('dateSize').value,
        classification: document.getElementById('dateClass').value,
        description: document.getElementById('dateDesc').value,
        image: imagePreview.src && !imagePreview.classList.contains('hidden') ? imagePreview.src : 'http://static.photos/food/640x360/1'
    };

    const existingEnglish = getStoredList(EnglishStorageKeys.DATES).find(d => Number(d.id) === dateData.id) || {};
    syncLocalizedRecord(StorageKeys.DATES, EnglishStorageKeys.DATES, dateData, {
        id: dateData.id,
        name: normalizeText(document.getElementById('dateNameEn')?.value) || existingEnglish.name || dateData.name,
        size: normalizeText(document.getElementById('dateSizeEn')?.value) || existingEnglish.size || dateData.size,
        classification: normalizeText(document.getElementById('dateClassEn')?.value) || existingEnglish.classification || dateData.classification,
        description: normalizeText(document.getElementById('dateDescEn')?.value) || existingEnglish.description || dateData.description,
        image: dateData.image
    });
    addRecentUpdate((dateId ? 'تم تحديث نوع تمر: ' : 'تم إضافة نوع تمر جديد: ') + dateData.name);
    closeDateModal();
    loadDates();
    updateDashboardStats();
});

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const eventId = document.getElementById('eventId').value;
    const imagePreview = document.getElementById('eventPreview');

    const eventData = {
        id: eventId ? parseInt(eventId) : Date.now(),
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        type: document.getElementById('eventType').value,
        description: document.getElementById('eventDesc').value,
        image: imagePreview.src && !imagePreview.classList.contains('hidden') ? imagePreview.src : 'http://static.photos/event/640x360/111'
    };

    const existingEnglish = getStoredList(EnglishStorageKeys.EVENTS).find(ev => Number(ev.id) === eventData.id) || {};
    syncLocalizedRecord(StorageKeys.EVENTS, EnglishStorageKeys.EVENTS, eventData, {
        id: eventData.id,
        title: normalizeText(document.getElementById('eventTitleEn')?.value) || existingEnglish.title || eventData.title,
        date: normalizeText(document.getElementById('eventDateEn')?.value) || existingEnglish.date || eventData.date,
        location: normalizeText(document.getElementById('eventLocationEn')?.value) || existingEnglish.location || eventData.location,
        type: normalizeText(document.getElementById('eventTypeEn')?.value) || existingEnglish.type || eventData.type,
        description: normalizeText(document.getElementById('eventDescEn')?.value) || existingEnglish.description || eventData.description,
        image: eventData.image
    });
    addRecentUpdate((eventId ? 'تم تحديث الفعالية: ' : 'تم إضافة فعالية جديدة: ') + eventData.title);
    closeEventModal();
    loadEvents();
    updateDashboardStats();
});

document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const settings = {
        siteTitle: document.getElementById('siteTitle').value,
        email: document.getElementById('siteEmail').value,
        phone: document.getElementById('sitePhone').value,
        address: document.getElementById('siteAddress').value,
        aboutText: document.getElementById('aboutText').value
    };
    
    const englishSettings = {
        siteTitle: normalizeText(document.getElementById('siteTitleEn')?.value) || settings.siteTitle,
        email: settings.email,
        phone: settings.phone,
        address: normalizeText(document.getElementById('siteAddressEn')?.value) || settings.address,
        aboutText: normalizeText(document.getElementById('aboutTextEn')?.value) || settings.aboutText
    };
    getfirebase.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
    getfirebase.setItem(EnglishStorageKeys.SETTINGS, JSON.stringify(englishSettings));
    alert('تم حفظ الإعدادات بنجاح!');
    addRecentUpdate('تم تحديث إعدادات الموقع');
});

// Image Preview Handler
function previewImage(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// Advanced Council Image Preview Handler
function previewCouncilImage(input) {
    previewImage(input, 'councilPreview');
}

// Council Management
function loadCouncil() {
    const council = JSON.parse(getfirebase.getItem(StorageKeys.COUNCIL) || '[]');
    const grid = document.getElementById('councilGrid');
    
    if (council.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-stone-500 bg-white rounded-2xl">لا توجد أعضاء مضافين بعد</div>';
        return;
    }
    
    grid.innerHTML = council.map(member => `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div class="relative overflow-hidden h-48 bg-stone-100">
                <img src="${member.image}" alt="${member.name}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onclick="editCouncil(${member.id})" class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteCouncil(${member.id})" class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-stone-800 mb-1">${member.name}</h3>
                <p class="text-sm text-amber-600 font-semibold mb-2">${member.position}</p>
                <div class="mb-3">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(member.category)}">
                        ${member.category}
                    </span>
                </div>
                <p class="text-stone-600 text-sm mb-3 line-clamp-2">${member.bio}</p>
                <div class="space-y-1 text-xs text-stone-500">
                    <p class="flex items-center gap-2"><i data-lucide="mail" class="w-3 h-3"></i> ${member.email}</p>
                    <p class="flex items-center gap-2"><i data-lucide="phone" class="w-3 h-3"></i> ${member.phone}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function getCategoryColor(category) {
    const colors = {
        'إدارة': 'bg-red-100 text-red-600',
        'محافظات': 'bg-blue-100 text-blue-600',
        'متخصص': 'bg-green-100 text-green-600',
        'فني': 'bg-purple-100 text-purple-600'
    };
    return colors[category] || 'bg-stone-100 text-stone-600';
}

// Modal Management
function closeAllModals() {
    const modals = ['councilModal', 'studiesModal', 'adsModal', 'eventModal', 'dateModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    });
}

function openCouncilModal(memberId = null) {
    closeAllModals();
    const modal = document.getElementById('councilModal');
    const form = document.getElementById('councilForm');
    const title = document.getElementById('councilModalTitle');
    
    form.reset();
    document.getElementById('councilPreview').classList.add('hidden');
    
    if (memberId) {
        const council = JSON.parse(getfirebase.getItem(StorageKeys.COUNCIL) || '[]');
        const member = council.find(m => Number(m.id) === Number(memberId));
        
        if (member) {
            title.textContent = 'تعديل بيانات العضو';
            document.getElementById('councilId').value = member.id;
            document.getElementById('councilName').value = member.name;
            document.getElementById('councilPosition').value = member.position;
            document.getElementById('councilCategory').value = member.category;
            document.getElementById('councilBio').value = member.bio;
            document.getElementById('councilEmail').value = member.email;
            document.getElementById('councilPhone').value = member.phone;
            const englishMember = getStoredList(EnglishStorageKeys.COUNCIL).find(item => Number(item.id) === Number(member.id)) || {};
            document.getElementById('councilNameEn').value = englishMember.name || '';
            document.getElementById('councilPositionEn').value = englishMember.position || '';
            document.getElementById('councilCategoryEn').value = englishMember.category || '';
            document.getElementById('councilBioEn').value = englishMember.bio || '';
            
            if (member.image) {
                document.getElementById('councilPreview').src = member.image;
                document.getElementById('councilPreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة عضو مجلس جديد';
        document.getElementById('councilId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeCouncilModal() {
    document.getElementById('councilModal').classList.add('hidden');
}

function saveCouncil(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('councilId').value);
    const council = JSON.parse(getfirebase.getItem(StorageKeys.COUNCIL) || '[]');
    
    const memberData = {
        name: document.getElementById('councilName').value,
        position: document.getElementById('councilPosition').value,
        category: document.getElementById('councilCategory').value,
        bio: document.getElementById('councilBio').value,
        email: document.getElementById('councilEmail').value,
        phone: document.getElementById('councilPhone').value,
        image: document.getElementById('councilPreview').classList.contains('hidden') 
            ? (council.find(m => Number(m.id) === Number(id))?.image || 'http://static.photos/people/default') 
            : document.getElementById('councilPreview').src
    };
    
    const memberId = id || (council.length > 0 ? Math.max(...council.map(m => m.id)) + 1 : 1);
    const existingEnglish = getStoredList(EnglishStorageKeys.COUNCIL).find(m => Number(m.id) === memberId) || {};
    syncLocalizedRecord(StorageKeys.COUNCIL, EnglishStorageKeys.COUNCIL, { id: memberId, ...memberData }, {
        id: memberId,
        name: normalizeText(document.getElementById('councilNameEn')?.value) || existingEnglish.name || memberData.name,
        position: normalizeText(document.getElementById('councilPositionEn')?.value) || existingEnglish.position || memberData.position,
        category: normalizeText(document.getElementById('councilCategoryEn')?.value) || existingEnglish.category || memberData.category,
        bio: normalizeText(document.getElementById('councilBioEn')?.value) || existingEnglish.bio || memberData.bio,
        email: memberData.email,
        phone: memberData.phone,
        image: memberData.image
    });
    closeCouncilModal();
    loadCouncil();
    updateDashboardStats();
    addRecentUpdate(id ? 'تم تحديث بيانات عضو المجلس' : 'تم إضافة عضو جديد في المجلس');
}

function editCouncil(id) {
    openCouncilModal(id);
}

function deleteCouncil(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    
    removeLocalizedRecord(StorageKeys.COUNCIL, EnglishStorageKeys.COUNCIL, id);
    
    loadCouncil();
    updateDashboardStats();
    addRecentUpdate('تم حذف عضو من المجلس');
}

// Note: councilForm submit listener is registered in the main DOMContentLoaded below

// Recent Updates Tracker
function addRecentUpdate(text) {
    const updates = JSON.parse(sessionStorage.getItem('recentUpdates') || '[]');
    const update = {
        text: text,
        time: new Date().toLocaleTimeString('ar-IQ')
    };
    updates.unshift(update);
    if (updates.length > 5) updates.pop();
    sessionStorage.setItem('recentUpdates', JSON.stringify(updates));
    loadRecentUpdates();
}

function loadRecentUpdates() {
    const updates = JSON.parse(sessionStorage.getItem('recentUpdates') || '[]');
    const container = document.getElementById('recentUpdates');
    
    if (updates.length === 0) {
        container.innerHTML = '<p class="text-stone-500 text-center py-4">لا توجد تحديثات حديثة</p>';
        return;
    }
    
    container.innerHTML = updates.map(u => `
        <div class="flex items-center gap-3 text-sm border-b border-stone-100 pb-2 last:border-0">
            <i data-lucide="check-circle" class="w-4 h-4 text-green-500"></i>
            <span class="flex-1 text-stone-700">${u.text}</span>
            <span class="text-stone-400 text-xs">${u.time}</span>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// Studies Management
function loadStudies() {
    try {
        const studies = JSON.parse(getfirebase.getItem(StorageKeys.STUDIES) || '[]');
        const tbody = document.getElementById('studiesTableBody');
        
        if (studies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-stone-500">لا توجد دراسات مضافة بعد</td></tr>';
            return;
        }
        
        tbody.innerHTML = studies.map(study => `
            <tr class="hover:bg-stone-50 transition-colors">
                <td class="px-6 py-4 text-stone-800 font-medium">${escapeHTML(study.title)}</td>
                <td class="px-6 py-4 text-stone-600">${escapeHTML(study.date || 'غير محدد')}</td>
                <td class="px-6 py-4">
                    <a href="#" onclick="downloadStudy(${Number(study.id)})" class="text-amber-600 hover:text-amber-700 font-medium">
                        <i data-lucide="download" class="w-4 h-4 inline ml-1"></i>
                        ${escapeHTML(study.fileName || study.file || 'study.pdf')}
                    </a>
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editStudy(${study.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteStudy(${study.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('خطأ في تحميل الدراسات:', error);
        alert('حدث خطأ أثناء تحميل الدراسات: ' + error.message);
    }
}

function openStudiesModal(studyId = null) {
    closeAllModals();
    const modal = document.getElementById('studiesModal');
    const form = document.getElementById('studiesForm');
    const title = document.getElementById('studiesModalTitle');
    
    form.reset();
    document.getElementById('studiesFileInfo').classList.add('hidden');
    
    if (studyId) {
        const studies = JSON.parse(getfirebase.getItem(StorageKeys.STUDIES) || '[]');
        const study = studies.find(s => Number(s.id) === Number(studyId));
        
        if (study) {
            title.textContent = 'تعديل الدراسة';
            document.getElementById('studiesId').value = study.id;
            document.getElementById('studiesTitle').value = study.title;
            document.getElementById('studiesDescription').value = study.description;
            document.getElementById('studiesDate').value = study.date;
            const englishStudy = getStoredList(EnglishStorageKeys.STUDIES).find(s => Number(s.id) === Number(study.id)) || {};
            document.getElementById('studiesTitleEn').value = englishStudy.title || '';
            document.getElementById('studiesDescriptionEn').value = englishStudy.description || '';
            
            // Note: File input cannot be pre-filled for security reasons
            document.getElementById('studiesFile').required = false;
        }
    } else {
        title.textContent = 'إضافة دراسة جديدة';
        document.getElementById('studiesId').value = '';
        document.getElementById('studiesFile').required = true;
    }
    
    modal.classList.remove('hidden');
}

function closeStudiesModal() {
    document.getElementById('studiesModal').classList.add('hidden');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function saveStudies(event) {
    try {
        event.preventDefault();
        
        const id = parseInt(document.getElementById('studiesId').value);
        const title = normalizeText(document.getElementById('studiesTitle').value);
        const description = normalizeText(document.getElementById('studiesDescription').value);
        const date = normalizeText(document.getElementById('studiesDate').value);
        const fileInput = document.getElementById('studiesFile');
        
        // Validation
        if (!title.trim()) {
            alert('يرجى إدخال عنوان الدراسة');
            return;
        }
        
        if (!id && (!fileInput.files || fileInput.files.length === 0)) {
            alert('يرجى اختيار ملف PDF للدراسة الجديدة');
            return;
        }

        if (fileInput.files.length > 0) {
            const studyFileError = validateFile(
                fileInput.files[0],
                UploadConstraints.studyMimeTypes,
                UploadConstraints.studyMaxBytes,
                'ملف الدراسة'
            );

            if (studyFileError) {
                alert(studyFileError);
                return;
            }
        }
        
        let studies = JSON.parse(getfirebase.getItem(StorageKeys.STUDIES) || '[]');
        const persistStudy = async () => {
            if (id) {
                const index = studies.findIndex(s => Number(s.id) === Number(id));
                if (index === -1) {
                    alert('تعذر العثور على الدراسة المحددة. أعد تحميل الصفحة وحاول مجدداً.');
                    return;
                }
                studies[index].title = title;
                studies[index].description = description;
                studies[index].date = date;

                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    studies[index].file = file.name;
                    studies[index].fileName = file.name;
                    studies[index].fileType = file.type || 'application/pdf';
                    studies[index].fileData = await readFileAsDataURL(file);
                }
            } else {
                const file = fileInput.files[0];
                const newId = Math.max(0, ...studies.map(s => Number(s.id) || 0)) + 1;
                studies.push({
                    id: newId,
                    title,
                    description,
                    file: file.name,
                    fileName: file.name,
                    fileType: file.type || 'application/pdf',
                    fileData: await readFileAsDataURL(file),
                    date
                });
            }
            
            const currentStudyId = id || studies[studies.length - 1]?.id;
            const currentStudy = studies.find(study => Number(study.id) === Number(currentStudyId));
            if (!currentStudy) {
                throw new Error('تعذر تجهيز بيانات الدراسة للحفظ.');
            }
            const englishStudies = getStoredList(EnglishStorageKeys.STUDIES);
            const existingEnglishStudy = englishStudies.find(study => Number(study.id) === Number(currentStudy.id)) || {};
            const englishStudy = {
                ...existingEnglishStudy,
                id: currentStudy.id,
                title: normalizeText(document.getElementById('studiesTitleEn')?.value) || title,
                description: normalizeText(document.getElementById('studiesDescriptionEn')?.value) || description,
                date: date || existingEnglishStudy.date || '',
                file: currentStudy.file || existingEnglishStudy.file || '',
                fileName: currentStudy.fileName || existingEnglishStudy.fileName || '',
                fileType: currentStudy.fileType || existingEnglishStudy.fileType || '',
                fileData: currentStudy.fileData || existingEnglishStudy.fileData || ''
            };
            const englishIndex = englishStudies.findIndex(s => Number(s.id) === Number(englishStudy.id));
            if (englishIndex === -1) englishStudies.push(englishStudy);
            else englishStudies[englishIndex] = { ...englishStudies[englishIndex], ...englishStudy };
            getfirebase.setItem(StorageKeys.STUDIES, JSON.stringify(studies));
            getfirebase.setItem(EnglishStorageKeys.STUDIES, JSON.stringify(englishStudies));
            loadStudies();
            updateDashboardStats();
            closeStudiesModal();
            addRecentUpdate(`تم ${id ? 'تحديث' : 'إضافة'} دراسة: ${title}`);
        };

        persistStudy().catch(error => {
            console.error('خطأ في معالجة ملف الدراسة:', error);
            alert('حدث خطأ أثناء قراءة ملف الدراسة: ' + error.message);
        });
    } catch (error) {
        console.error('خطأ في حفظ الدراسة:', error);
        alert('حدث خطأ أثناء حفظ الدراسة: ' + error.message);
    }
}

function editStudy(id) {
    openStudiesModal(id);
}

function deleteStudy(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدراسة؟')) {
        removeLocalizedRecord(StorageKeys.STUDIES, EnglishStorageKeys.STUDIES, id);
        loadStudies();
        updateDashboardStats();
        addRecentUpdate('تم حذف دراسة');
    }
}

function downloadStudy(fileName) {
    const studies = JSON.parse(getfirebase.getItem(StorageKeys.STUDIES) || '[]');
    const study = studies.find(s => Number(s.id) === Number(fileName));
    
    if (!study || !study.fileData) {
        alert('ملف الدراسة غير متوفر للتحميل.');
        return;
    }
    
    const link = document.createElement('a');
    link.href = study.fileData;
    link.download = study.fileName || study.file || 'study.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Ads Management
function loadAds() {
    try {
        const ads = JSON.parse(getfirebase.getItem(StorageKeys.ADS) || '[]');
        const grid = document.getElementById('adsGrid');
        
        if (ads.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-stone-500">لا توجد إعلانات مضافة بعد</div>';
            return;
        }
        
        grid.innerHTML = ads.map(ad => {
            const safeImage = sanitizeImageSource(ad.image) || 'https://placehold.co/640x360?text=Ad';
            return `
            <div class="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden hover:shadow-xl transition-shadow">
                <img src="${safeImage}" alt="${escapeHTML(ad.title)}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-semibold rounded-full">${escapeHTML(ad.type)}</span>
                        <span class="text-stone-400 text-sm">${escapeHTML(ad.date || 'غير محدد')}</span>
                    </div>
                    <h3 class="text-lg font-bold text-stone-800 mb-2">${escapeHTML(ad.title)}</h3>
                    <p class="text-stone-600 text-sm mb-4 line-clamp-2">${escapeHTML(ad.description)}</p>
                    <div class="flex gap-2">
                        <button onclick="editAd(${ad.id})" class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                            تعديل
                        </button>
                        <button onclick="deleteAd(${ad.id})" class="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('خطأ في تحميل الإعلانات:', error);
        alert('حدث خطأ أثناء تحميل الإعلانات: ' + error.message);
    }
}

function openAdsModal(adId = null) {
    closeAllModals();
    const modal = document.getElementById('adsModal');
    const form = document.getElementById('adsForm');
    const title = document.getElementById('adsModalTitle');
    
    form.reset();
    document.getElementById('adsImageInfo').classList.add('hidden');
    document.getElementById('adsPreview').classList.add('hidden');
    
    if (adId) {
        const ads = JSON.parse(getfirebase.getItem(StorageKeys.ADS) || '[]');
        const ad = ads.find(a => Number(a.id) === Number(adId));
        
        if (ad) {
            title.textContent = 'تعديل الإعلان';
            document.getElementById('adsId').value = ad.id;
            document.getElementById('adsTitle').value = ad.title;
            document.getElementById('adsDescription').value = ad.description;
            document.getElementById('adsType').value = ad.type;
            document.getElementById('adsDate').value = ad.date;
            document.getElementById('adsLink').value = ad.link || '';
            const englishAd = getStoredList(EnglishStorageKeys.ADS).find(a => Number(a.id) === Number(ad.id)) || {};
            document.getElementById('adsTitleEn').value = englishAd.title || '';
            document.getElementById('adsDescriptionEn').value = englishAd.description || '';
            document.getElementById('adsTypeEn').value = englishAd.type || '';
            
            if (ad.image) {
                document.getElementById('adsPreview').src = sanitizeImageSource(ad.image);
                document.getElementById('adsPreview').classList.remove('hidden');
            }
            
            document.getElementById('adsImage').required = false;
        }
    } else {
        title.textContent = 'إضافة إعلان جديد';
        document.getElementById('adsId').value = '';
        document.getElementById('adsImage').required = true;
    }
    
    modal.classList.remove('hidden');
}

function closeAdsModal() {
    document.getElementById('adsModal').classList.add('hidden');
}

function saveAds(event) {
    try {
        event.preventDefault();
        
        const id = parseInt(document.getElementById('adsId').value);
        const title = normalizeText(document.getElementById('adsTitle').value);
        const description = normalizeText(document.getElementById('adsDescription').value);
        const type = normalizeText(document.getElementById('adsType').value);
        const date = normalizeText(document.getElementById('adsDate').value);
        const link = sanitizeHttpUrl(document.getElementById('adsLink').value);
        const imageInput = document.getElementById('adsImage');

        if (!title) {
            alert('يرجى إدخال عنوان الإعلان');
            return;
        }

        if (!id && (!imageInput.files || imageInput.files.length === 0)) {
            alert('يرجى اختيار صورة للإعلان الجديد');
            return;
        }

        if (imageInput.files.length > 0) {
            const adImageError = validateFile(
                imageInput.files[0],
                UploadConstraints.adImageMimeTypes,
                UploadConstraints.adImageMaxBytes,
                'صورة الإعلان'
            );

            if (adImageError) {
                alert(adImageError);
                return;
            }
        }
        
        let ads = JSON.parse(getfirebase.getItem(StorageKeys.ADS) || '[]');
        const persistAd = async () => {
            if (id) {
                const index = ads.findIndex(a => Number(a.id) === Number(id));
                if (index === -1) {
                    alert('تعذر العثور على الإعلان المحدد. أعد تحميل الصفحة وحاول مجدداً.');
                    return;
                }
                ads[index].title = title;
                ads[index].description = description;
                ads[index].type = type;
                ads[index].date = date;
                ads[index].link = link;

                if (imageInput.files.length > 0) {
                    ads[index].image = await readFileAsDataURL(imageInput.files[0]);
                }
            } else {
                const newId = Math.max(0, ...ads.map(a => Number(a.id) || 0)) + 1;
                ads.push({
                    id: newId,
                    title,
                    description,
                    image: await readFileAsDataURL(imageInput.files[0]),
                    type,
                    date,
                    link
                });
            }
            
            const currentAdId = id || ads[ads.length - 1]?.id;
            const currentAd = ads.find(adItem => Number(adItem.id) === Number(currentAdId));
            if (!currentAd) {
                throw new Error('تعذر تجهيز بيانات الإعلان للحفظ.');
            }
            const englishAds = getStoredList(EnglishStorageKeys.ADS);
            const existingEnglishAd = englishAds.find(adItem => Number(adItem.id) === Number(currentAd.id)) || {};
            const englishAd = {
                ...existingEnglishAd,
                id: currentAd.id,
                title: normalizeText(document.getElementById('adsTitleEn')?.value) || title,
                description: normalizeText(document.getElementById('adsDescriptionEn')?.value) || description,
                image: currentAd.image || existingEnglishAd.image || '',
                type: normalizeText(document.getElementById('adsTypeEn')?.value) || type,
                date: date || existingEnglishAd.date || '',
                link: link || existingEnglishAd.link || ''
            };
            const englishIndex = englishAds.findIndex(adItem => Number(adItem.id) === Number(englishAd.id));
            if (englishIndex === -1) englishAds.push(englishAd);
            else englishAds[englishIndex] = { ...englishAds[englishIndex], ...englishAd };
            getfirebase.setItem(StorageKeys.ADS, JSON.stringify(ads));
            getfirebase.setItem(EnglishStorageKeys.ADS, JSON.stringify(englishAds));
            loadAds();
            updateDashboardStats();
            closeAdsModal();
            addRecentUpdate(`تم ${id ? 'تحديث' : 'إضافة'} إعلان: ${title}`);
        };

        persistAd().catch(error => {
            console.error('خطأ في معالجة صورة الإعلان:', error);
            alert('حدث خطأ أثناء قراءة صورة الإعلان: ' + error.message);
        });
    } catch (error) {
        console.error('خطأ في حفظ الإعلان:', error);
        alert('حدث خطأ أثناء حفظ الإعلان: ' + error.message);
    }
}

function editAd(id) {
    openAdsModal(id);
}

function deleteAd(id) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        removeLocalizedRecord(StorageKeys.ADS, EnglishStorageKeys.ADS, id);
        loadAds();
        updateDashboardStats();
        addRecentUpdate('تم حذف إعلان');
    }
}

// File Preview Functions
function previewStudiesFile(event) {
    const file = event.target.files[0];
    if (file) {
        const studyFileError = validateFile(
            file,
            UploadConstraints.studyMimeTypes,
            UploadConstraints.studyMaxBytes,
            'ملف الدراسة'
        );
        if (studyFileError) {
            event.target.value = '';
            document.getElementById('studiesFileInfo').classList.add('hidden');
            alert(studyFileError);
            return;
        }
        document.getElementById('studiesFileName').textContent = file.name;
        document.getElementById('studiesFileSize').textContent = formatFileSize(file.size);
        document.getElementById('studiesFileInfo').classList.remove('hidden');
    }
}

function previewAdsImage(event) {
    const file = event.target.files[0];
    if (file) {
        const adImageError = validateFile(
            file,
            UploadConstraints.adImageMimeTypes,
            UploadConstraints.adImageMaxBytes,
            'صورة الإعلان'
        );
        if (adImageError) {
            event.target.value = '';
            document.getElementById('adsImageInfo').classList.add('hidden');
            document.getElementById('adsPreview').classList.add('hidden');
            alert(adImageError);
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('adsPreview').src = e.target.result;
            document.getElementById('adsPreview').classList.remove('hidden');
            
            // Get image dimensions
            const img = new Image();
            img.onload = function() {
                document.getElementById('adsImageName').textContent = file.name;
                document.getElementById('adsImageSize').textContent = formatFileSize(file.size);
                document.getElementById('adsImageType').textContent = file.type;
                document.getElementById('adsImageDimensions').textContent = `${img.width} × ${img.height}`;
                document.getElementById('adsImageInfo').classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await firebaseReady;

    // تحديث مؤشر حالة Firebase
    const statusEl = document.getElementById('firebaseStatus');
    if (statusEl) {
        if (firebaseEnabled) {
            statusEl.innerHTML = '<span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span> متصل بـ Firebase';
            statusEl.className = 'flex items-center gap-1 text-xs text-green-600';
        } else {
            statusEl.innerHTML = '<span class="w-2 h-2 bg-red-500 rounded-full inline-block"></span> تخزين محلي';
            statusEl.className = 'flex items-center gap-1 text-xs text-red-500';
        }
    }

    if (!firebaseEnabled && firebaseInitError) {
        alert('تعذر الاتصال بـ Firebase. البيانات تُحفَظ محليًا فقط في هذا المتصفح.');
    }

    initializeData();
    updateDashboardStats();
    loadRecentUpdates();
    
    // File input event listeners
    const studiesFileInput = document.getElementById('studiesFile');
    if (studiesFileInput) {
        studiesFileInput.addEventListener('change', previewStudiesFile);
    }
    
    const adsImageInput = document.getElementById('adsImage');
    if (adsImageInput) {
        adsImageInput.addEventListener('change', previewAdsImage);
    }
    
    // Form event listeners
    const studiesForm = document.getElementById('studiesForm');
    if (studiesForm) {
        studiesForm.addEventListener('submit', saveStudies);
    }
    
    const adsForm = document.getElementById('adsForm');
    if (adsForm) {
        adsForm.addEventListener('submit', saveAds);
    }

    const councilForm = document.getElementById('councilForm');
    if (councilForm) {
        councilForm.addEventListener('submit', saveCouncil);
    }
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('fixed')) {
            closeAllModals();
        }
    };
});