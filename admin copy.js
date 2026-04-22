// Admin Panel JavaScript - CMS for Iraqi Dates Council

// Data Management
const StorageKeys = {
    EVENTS: 'iraq_dates_events',
    DATES: 'iraq_dates_types',
    MESSAGES: 'iraq_dates_messages',
    SETTINGS: 'iraq_dates_settings',
    COUNCIL: 'iraq_dates_council',
    STUDIES: 'iraq_dates_studies',
    ADS: 'iraq_dates_ads'
};

// Initialize default data if not exists
function initializeData() {
    if (!localStorage.getItem(StorageKeys.EVENTS)) {
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
        localStorage.setItem(StorageKeys.EVENTS, JSON.stringify(defaultEvents));
    }

    if (!localStorage.getItem(StorageKeys.DATES)) {
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
        localStorage.setItem(StorageKeys.DATES, JSON.stringify(defaultDates));
    }

    if (!localStorage.getItem(StorageKeys.SETTINGS)) {
        const defaultSettings = {
            siteTitle: 'مجلس التمور العراقي',
            email: 'idcouncil@gmail.com',
            phone: '+964 770 123 4567',
            address: 'بغداد، المنصور،',
            aboutText: 'يعتبر مجلس التمور العراقي هيئة متخصصة تأسست بهدف تطوير وتنظيم صناعة التمور في العراق.'
        };
        localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(defaultSettings));
    }

    if (!localStorage.getItem(StorageKeys.COUNCIL)) {
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
        localStorage.setItem(StorageKeys.COUNCIL, JSON.stringify(defaultCouncil));
    }

    if (!localStorage.getItem(StorageKeys.STUDIES)) {
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
        localStorage.setItem(StorageKeys.STUDIES, JSON.stringify(defaultStudies));
    }

    if (!localStorage.getItem(StorageKeys.ADS)) {
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
        localStorage.setItem(StorageKeys.ADS, JSON.stringify(defaultAds));
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

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    window.location.href = 'admin-login.html';
}

// Dashboard Functions
function updateDashboardStats() {
    const events = JSON.parse(localStorage.getItem(StorageKeys.EVENTS) || '[]');
    const dates = JSON.parse(localStorage.getItem(StorageKeys.DATES) || '[]');
    const messages = JSON.parse(localStorage.getItem(StorageKeys.MESSAGES) || '[]');
    const council = JSON.parse(localStorage.getItem(StorageKeys.COUNCIL) || '[]');
    const studies = JSON.parse(localStorage.getItem(StorageKeys.STUDIES) || '[]');
    const ads = JSON.parse(localStorage.getItem(StorageKeys.ADS) || '[]');
    
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
    const events = JSON.parse(localStorage.getItem(StorageKeys.EVENTS) || '[]');
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
        const events = JSON.parse(localStorage.getItem(StorageKeys.EVENTS) || '[]');
        const event = events.find(e => e.id === eventId);
        
        if (event) {
            title.textContent = 'تعديل الفعالية';
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventType').value = event.type;
            document.getElementById('eventDesc').value = event.description;
            
            if (event.image) {
                document.getElementById('eventPreview').src = event.image;
                document.getElementById('eventPreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة فعالية جديدة';
        document.getElementById('eventId').value = '';
    }
    
    modal.style.display = 'block';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function editEvent(id) {
    openEventModal(id);
}

function deleteEvent(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    
    let events = JSON.parse(localStorage.getItem(StorageKeys.EVENTS) || '[]');
    events = events.filter(e => e.id !== id);
    localStorage.setItem(StorageKeys.EVENTS, JSON.stringify(events));
    
    loadEvents();
    updateDashboardStats();
    addRecentUpdate('تم حذف فعالية');
}

// Dates Management
function loadDates() {
    const dates = JSON.parse(localStorage.getItem(StorageKeys.DATES) || '[]');
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
        const dates = JSON.parse(localStorage.getItem(StorageKeys.DATES) || '[]');
        const date = dates.find(d => d.id === dateId);
        
        if (date) {
            title.textContent = 'تعديل نوع التمر';
            document.getElementById('dateId').value = date.id;
            document.getElementById('dateName').value = date.name;
            document.getElementById('dateSize').value = date.size;
            document.getElementById('dateClass').value = date.classification;
            document.getElementById('dateDesc').value = date.description;
            
            if (date.image) {
                document.getElementById('datePreview').src = date.image;
                document.getElementById('datePreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة نوع تمر جديد';
        document.getElementById('dateId').value = '';
    }
    
    modal.style.display = 'block';
}

function closeDateModal() {
    document.getElementById('dateModal').style.display = 'none';
}

function editDate(id) {
    openDateModal(id);
}

function deleteDate(id) {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    
    let dates = JSON.parse(localStorage.getItem(StorageKeys.DATES) || '[]');
    dates = dates.filter(d => d.id !== id);
    localStorage.setItem(StorageKeys.DATES, JSON.stringify(dates));
    
    loadDates();
    updateDashboardStats();
    addRecentUpdate('تم حذف نوع تمر');
}

// Messages Management
function loadMessages() {
    const messages = JSON.parse(localStorage.getItem(StorageKeys.MESSAGES) || '[]');
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
    
    let messages = JSON.parse(localStorage.getItem(StorageKeys.MESSAGES) || '[]');
    messages.splice(index, 1);
    localStorage.setItem(StorageKeys.MESSAGES, JSON.stringify(messages));
    
    loadMessages();
    updateDashboardStats();
}

function clearAllMessages() {
    if (!confirm('هل أنت متأكد من حذف جميع الرسائل؟')) return;
    
    localStorage.removeItem(StorageKeys.MESSAGES);
    loadMessages();
    updateDashboardStats();
}

// Settings Management
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem(StorageKeys.SETTINGS) || '{}');
    
    document.getElementById('siteTitle').value = settings.siteTitle || '';
    document.getElementById('siteEmail').value = settings.email || '';
    document.getElementById('sitePhone').value = settings.phone || '';
    document.getElementById('siteAddress').value = settings.address || '';
    document.getElementById('aboutText').value = settings.aboutText || '';
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
    
    let dates = JSON.parse(localStorage.getItem(StorageKeys.DATES) || '[]');
    
    if (dateId) {
        const index = dates.findIndex(d => d.id === parseInt(dateId));
        if (index !== -1) dates[index] = dateData;
        addRecentUpdate('تم تحديث نوع تمر: ' + dateData.name);
    } else {
        dates.push(dateData);
        addRecentUpdate('تم إضافة نوع تمر جديد: ' + dateData.name);
    }
    
    localStorage.setItem(StorageKeys.DATES, JSON.stringify(dates));
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

    let events = JSON.parse(localStorage.getItem(StorageKeys.EVENTS) || '[]');

    if (eventId) {
        const index = events.findIndex(ev => ev.id === parseInt(eventId));
        if (index !== -1) events[index] = eventData;
        addRecentUpdate('تم تحديث الفعالية: ' + eventData.title);
    } else {
        events.push(eventData);
        addRecentUpdate('تم إضافة فعالية جديدة: ' + eventData.title);
    }

    localStorage.setItem(StorageKeys.EVENTS, JSON.stringify(events));
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
    
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
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
    const file = input.files[0];
    const previewDiv = document.getElementById('councilImagePreview');
    const previewImg = document.getElementById('councilPreview');
    const fileName = document.getElementById('councilFileName');
    const fileSize = document.getElementById('councilFileSize');
    const fileType = document.getElementById('councilFileType');
    const fileDimensions = document.getElementById('councilFileDimensions');
    
    if (file) {
        // عرض الصورة
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewDiv.classList.remove('hidden');
            
            // عرض معلومات الملف الأساسية
            fileName.textContent = file.name;
            fileSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
            fileType.textContent = file.type || 'صورة';
            
            // حساب أبعاد الصورة تلقائياً
            const img = new Image();
            img.onload = function() {
                fileDimensions.textContent = img.width + ' × ' + img.height + ' بكسل';
            };
            img.onerror = function() {
                fileDimensions.textContent = 'غير متاح';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.classList.add('hidden');
    }
}

// Council Management
function loadCouncil() {
    const council = JSON.parse(localStorage.getItem(StorageKeys.COUNCIL) || '[]');
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
            modal.style.display = 'none';
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
        const council = JSON.parse(localStorage.getItem(StorageKeys.COUNCIL) || '[]');
        const member = council.find(m => m.id === memberId);
        
        if (member) {
            title.textContent = 'تعديل بيانات العضو';
            document.getElementById('councilId').value = member.id;
            document.getElementById('councilName').value = member.name;
            document.getElementById('councilPosition').value = member.position;
            document.getElementById('councilCategory').value = member.category;
            document.getElementById('councilBio').value = member.bio;
            document.getElementById('councilEmail').value = member.email;
            document.getElementById('councilPhone').value = member.phone;
            
            if (member.image) {
                document.getElementById('councilPreview').src = member.image;
                document.getElementById('councilPreview').classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'إضافة عضو مجلس جديد';
        document.getElementById('councilId').value = '';
    }
    
    modal.style.display = 'block';
}

function closeCouncilModal() {
    document.getElementById('councilModal').style.display = 'none';
}

function saveCouncil(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('councilId').value);
    const council = JSON.parse(localStorage.getItem(StorageKeys.COUNCIL) || '[]');
    
    const memberData = {
        name: document.getElementById('councilName').value,
        position: document.getElementById('councilPosition').value,
        category: document.getElementById('councilCategory').value,
        bio: document.getElementById('councilBio').value,
        email: document.getElementById('councilEmail').value,
        phone: document.getElementById('councilPhone').value,
        image: document.getElementById('councilPreview').classList.contains('hidden') 
            ? (council.find(m => m.id === id)?.image || 'http://static.photos/people/default') 
            : document.getElementById('councilPreview').src
    };
    
    if (id) {
        const index = council.findIndex(m => m.id === id);
        if (index !== -1) {
            council[index] = { id, ...memberData };
        }
    } else {
        const newId = council.length > 0 ? Math.max(...council.map(m => m.id)) + 1 : 1;
        council.push({ id: newId, ...memberData });
    }
    
    localStorage.setItem(StorageKeys.COUNCIL, JSON.stringify(council));
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
    
    let council = JSON.parse(localStorage.getItem(StorageKeys.COUNCIL) || '[]');
    council = council.filter(m => m.id !== id);
    localStorage.setItem(StorageKeys.COUNCIL, JSON.stringify(council));
    
    loadCouncil();
    updateDashboardStats();
    addRecentUpdate('تم حذف عضو من المجلس');
}

// Attach save handlers
document.addEventListener('DOMContentLoaded', function() {
    const councilForm = document.getElementById('councilForm');
    if (councilForm) {
        councilForm.addEventListener('submit', saveCouncil);
    }
});

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
    const studies = JSON.parse(localStorage.getItem(StorageKeys.STUDIES) || '[]');
    const tbody = document.getElementById('studiesTableBody');
    
    if (studies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-stone-500">لا توجد دراسات مضافة بعد</td></tr>';
        return;
    }
    
    tbody.innerHTML = studies.map(study => `
        <tr class="hover:bg-stone-50 transition-colors">
            <td class="px-6 py-4 text-stone-800 font-medium">${study.title}</td>
            <td class="px-6 py-4 text-stone-600">${study.date || 'غير محدد'}</td>
            <td class="px-6 py-4">
                <a href="#" onclick="downloadStudy('${study.file}')" class="text-amber-600 hover:text-amber-700 font-medium">
                    <i data-lucide="download" class="w-4 h-4 inline ml-1"></i>
                    ${study.file}
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
}

function openStudiesModal(studyId = null) {
    closeAllModals();
    const modal = document.getElementById('studiesModal');
    const form = document.getElementById('studiesForm');
    const title = document.getElementById('studiesModalTitle');
    
    form.reset();
    document.getElementById('studiesFileInfo').classList.add('hidden');
    
    if (studyId) {
        const studies = JSON.parse(localStorage.getItem(StorageKeys.STUDIES) || '[]');
        const study = studies.find(s => s.id === studyId);
        
        if (study) {
            title.textContent = 'تعديل الدراسة';
            document.getElementById('studiesId').value = study.id;
            document.getElementById('studiesTitle').value = study.title;
            document.getElementById('studiesDescription').value = study.description;
            document.getElementById('studiesDate').value = study.date;
            
            // Note: File input cannot be pre-filled for security reasons
            document.getElementById('studiesFile').required = false;
        }
    } else {
        title.textContent = 'إضافة دراسة جديدة';
        document.getElementById('studiesId').value = '';
        document.getElementById('studiesFile').required = true;
    }
    
    modal.style.display = 'block';
}

function closeStudiesModal() {
    document.getElementById('studiesModal').style.display = 'none';
}

function saveStudies(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('studiesId').value);
    const title = document.getElementById('studiesTitle').value;
    const description = document.getElementById('studiesDescription').value;
    const date = document.getElementById('studiesDate').value;
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
    
    let studies = JSON.parse(localStorage.getItem(StorageKeys.STUDIES) || '[]');
    
    if (id) {
        // Update existing study
        const index = studies.findIndex(s => s.id === id);
        if (index !== -1) {
            studies[index].title = title;
            studies[index].description = description;
            studies[index].date = date;
            
            if (fileInput.files.length > 0) {
                studies[index].file = fileInput.files[0].name;
            }
        }
    } else {
        // Add new study
        const newId = Math.max(0, ...studies.map(s => s.id)) + 1;
        studies.push({
            id: newId,
            title: title,
            description: description,
            file: fileInput.files[0].name,
            date: date
        });
    }
    
    localStorage.setItem(StorageKeys.STUDIES, JSON.stringify(studies));
    loadStudies();
    updateDashboardStats();
    closeStudiesModal();
    addRecentUpdate(`تم ${id ? 'تحديث' : 'إضافة'} دراسة: ${title}`);
}

function editStudy(id) {
    openStudiesModal(id);
}

function deleteStudy(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدراسة؟')) {
        let studies = JSON.parse(localStorage.getItem(StorageKeys.STUDIES) || '[]');
        studies = studies.filter(s => s.id !== id);
        localStorage.setItem(StorageKeys.STUDIES, JSON.stringify(studies));
        loadStudies();
        updateDashboardStats();
        addRecentUpdate('تم حذف دراسة');
    }
}

function downloadStudy(fileName) {
    // In a real application, this would download the actual file
    alert(`تحميل الملف: ${fileName}`);
}

// Ads Management
function loadAds() {
    const ads = JSON.parse(localStorage.getItem(StorageKeys.ADS) || '[]');
    const grid = document.getElementById('adsGrid');
    
    if (ads.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-8 text-stone-500">لا توجد إعلانات مضافة بعد</div>';
        return;
    }
    
    grid.innerHTML = ads.map(ad => `
        <div class="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden hover:shadow-xl transition-shadow">
            <img src="${ad.image}" alt="${ad.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="px-3 py-1 bg-amber-100 text-amber-600 text-xs font-semibold rounded-full">${ad.type}</span>
                    <span class="text-stone-400 text-sm">${ad.date || 'غير محدد'}</span>
                </div>
                <h3 class="text-lg font-bold text-stone-800 mb-2">${ad.title}</h3>
                <p class="text-stone-600 text-sm mb-4 line-clamp-2">${ad.description}</p>
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
    `).join('');
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
        const ads = JSON.parse(localStorage.getItem(StorageKeys.ADS) || '[]');
        const ad = ads.find(a => a.id === adId);
        
        if (ad) {
            title.textContent = 'تعديل الإعلان';
            document.getElementById('adsId').value = ad.id;
            document.getElementById('adsTitle').value = ad.title;
            document.getElementById('adsDescription').value = ad.description;
            document.getElementById('adsType').value = ad.type;
            document.getElementById('adsDate').value = ad.date;
            document.getElementById('adsLink').value = ad.link || '';
            
            if (ad.image) {
                document.getElementById('adsPreview').src = ad.image;
                document.getElementById('adsPreview').classList.remove('hidden');
            }
            
            document.getElementById('adsImage').required = false;
        }
    } else {
        title.textContent = 'إضافة إعلان جديد';
        document.getElementById('adsId').value = '';
        document.getElementById('adsImage').required = true;
    }
    
    modal.style.display = 'block';
}

function closeAdsModal() {
    document.getElementById('adsModal').style.display = 'none';
}

function saveAds(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('adsId').value);
    const title = document.getElementById('adsTitle').value;
    const description = document.getElementById('adsDescription').value;
    const type = document.getElementById('adsType').value;
    const date = document.getElementById('adsDate').value;
    const link = document.getElementById('adsLink').value;
    const imageInput = document.getElementById('adsImage');
    
    let ads = JSON.parse(localStorage.getItem(StorageKeys.ADS) || '[]');
    
    if (id) {
        // Update existing ad
        const index = ads.findIndex(a => a.id === id);
        if (index !== -1) {
            ads[index].title = title;
            ads[index].description = description;
            ads[index].type = type;
            ads[index].date = date;
            ads[index].link = link;
            
            if (imageInput.files.length > 0) {
                ads[index].image = URL.createObjectURL(imageInput.files[0]);
            }
        }
    } else {
        // Add new ad
        const newId = Math.max(0, ...ads.map(a => a.id)) + 1;
        ads.push({
            id: newId,
            title: title,
            description: description,
            image: URL.createObjectURL(imageInput.files[0]),
            type: type,
            date: date,
            link: link
        });
    }
    
    localStorage.setItem(StorageKeys.ADS, JSON.stringify(ads));
    loadAds();
    updateDashboardStats();
    closeAdsModal();
    addRecentUpdate(`تم ${id ? 'تحديث' : 'إضافة'} إعلان: ${title}`);
}

function editAd(id) {
    openAdsModal(id);
}

function deleteAd(id) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        let ads = JSON.parse(localStorage.getItem(StorageKeys.ADS) || '[]');
        ads = ads.filter(a => a.id !== id);
        localStorage.setItem(StorageKeys.ADS, JSON.stringify(ads));
        loadAds();
        updateDashboardStats();
        addRecentUpdate('تم حذف إعلان');
    }
}

// File Preview Functions
function previewStudiesFile(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('studiesFileName').textContent = file.name;
        document.getElementById('studiesFileSize').textContent = formatFileSize(file.size);
        document.getElementById('studiesFileInfo').classList.remove('hidden');
    }
}

function previewAdsImage(event) {
    const file = event.target.files[0];
    if (file) {
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
document.addEventListener('DOMContentLoaded', function() {
    closeAllModals();
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
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target.classList.contains('fixed')) {
            closeAllModals();
        }
    };
});