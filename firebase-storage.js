// Firebase Storage Unified Module
// استخدام موحد للتخزين - Firebase مع fallback إلى localStorage

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyD2Y9jQF7XWmo0uegj3uWrQfTKbCAcH97o',
    authDomain: 'id-council-c1b1d.firebaseapp.com',
    projectId: 'id-council-c1b1d',
    storageBucket: 'id-council-c1b1d.firebasestorage.app',
    messagingSenderId: '2987746191',
    appId: '1:2987746191:web:e8f267db34eb0a903b21fa'
};

const FIRESTORE_COLLECTION = 'siteData';

let firebaseCache = new Map();
let firebaseDocApi = null;
let firebaseEnabled = false;
let firebaseInitError = null;

// الـ Storage Keys
const StorageKeys = {
    EVENTS: 'iraq_dates_events',
    DATES: 'iraq_dates_types',
    SETTINGS: 'iraq_dates_settings',
    COUNCIL: 'iraq_dates_council',
    STUDIES: 'iraq_dates_studies',
    ADS: 'iraq_dates_ads',
    MESSAGES: 'iraq_dates_messages',
    // English versions
    EVENTS_EN: 'iraq_dates_events_en',
    DATES_EN: 'iraq_dates_types_en',
    COUNCIL_EN: 'iraq_dates_council_en',
    STUDIES_EN: 'iraq_dates_studies_en',
    ADS_EN: 'iraq_dates_ads_en',
    MESSAGES_EN: 'iraq_dates_messages_en'
};

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

// Unified Storage API
const unifiedStorage = {
    async getItem(key) {
        // Attempt cache first
        if (firebaseCache.has(key)) {
            const cachedValue = firebaseCache.get(key);
            if (cachedValue === null || cachedValue === 'null' || cachedValue === '') {
                firebaseCache.delete(key);
                const localValue = window.localStorage.getItem(key);
                return localValue !== null && localValue !== 'null' && localValue !== '' ? localValue : null;
            }
            return cachedValue;
        }

        // Attempt Firebase if enabled
        if (firebaseEnabled && firebaseDocApi) {
            try {
                const firebaseValue = await firebaseDocApi.get(key);
                if (firebaseValue !== null && firebaseValue !== 'null' && firebaseValue !== '') {
                    firebaseCache.set(key, firebaseValue);
                    window.localStorage.setItem(key, firebaseValue);
                    return firebaseValue;
                }

                // Fallback to localStorage when Firebase has no valid value
                const localValue = window.localStorage.getItem(key);
                if (localValue !== null && localValue !== 'null' && localValue !== '') {
                    firebaseCache.set(key, localValue);
                    return localValue;
                }
                return null;
            } catch (error) {
                console.warn(`فشل الحصول على ${key} من Firebase، جاري محاولة localStorage:`, error);
            }
        }

        // Fallback to localStorage
        const localValue = window.localStorage.getItem(key);
        if (localValue !== null && localValue !== 'null' && localValue !== '') {
            firebaseCache.set(key, localValue);
            return localValue;
        }
        
        return null;
    },

    async setItem(key, value) {
        const normalized = String(value);
        firebaseCache.set(key, normalized);
        try {
            window.localStorage.setItem(key, normalized);
        } catch (err) {
            console.warn(`localStorage.setItem failed for ${key}`, err);
        }

        // حفظ في Firebase إذا كان مفعلاً
        if (firebaseEnabled && firebaseDocApi) {
            try {
                await firebaseDocApi.set(key, normalized);
                console.log(`تم حفظ ${key} في Firebase بنجاح`);
            } catch (error) {
                console.error(`فشل حفظ ${key} في Firebase:`, error);
            }
        }
    },

    async removeItem(key) {
        // حذف من الـ cache أولاً
        firebaseCache.delete(key);
        
        // حذف من localStorage
        window.localStorage.removeItem(key);

        // حذف من Firebase إذا كان مفعلاً
        if (firebaseEnabled && firebaseDocApi) {
            try {
                await firebaseDocApi.remove(key);
                console.log(`✅ تم حذف ${key} من Firebase بنجاح`);
            } catch (error) {
                console.error(`❌ فشل حذف ${key} من Firebase:`, error);
                // إعادة محاولة الحذف من localStorage للتأكد
                window.localStorage.removeItem(key);
            }
        }
        
        return true;
    },

    // دالة مساعدة للحصول على JSON
    async getJSON(key, defaultValue = []) {
        const value = await this.getItem(key);
        
        // إذا كانت القيمة null أو فارغة، أعد القيمة الافتراضية
        if (!value) {
            return defaultValue;
        }
        
        try {
            const parsed = JSON.parse(value);
            // تأكد من أن النتيجة ليست فارغة
            return (parsed && Array.isArray(parsed)) ? parsed : defaultValue;
        } catch (error) {
            console.error(`خطأ في تحليل JSON للمفتاح ${key}:`, error);
            // في حالة الخطأ، احذف القيمة الخاطئة
            await this.removeItem(key);
            return defaultValue;
        }
    },

    // دالة مساعدة لحفظ JSON
    async setJSON(key, value) {
        await this.setItem(key, JSON.stringify(value));
    }
};

// Initialize Firebase
async function initializeFirebaseStorage() {
    try {
        const [{ initializeApp, getApps, getApp }, firestoreModule] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js')
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

        firebaseDocApi = {
            async set(key, value) {
                await setDoc(doc(db, FIRESTORE_COLLECTION, key), {
                    value,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            },

            async get(key) {
                const docRef = doc(db, FIRESTORE_COLLECTION, key);
                const snapshot = await getDoc(docRef);
                if (!snapshot.exists()) return null;

                const value = snapshot.data().value;
                if (value === null || value === undefined || value === '') {
                    return null;
                }
                return String(value);
            },

            async remove(key) {
                await deleteDoc(doc(db, FIRESTORE_COLLECTION, key));
            },

            subscribe(key, callback) {
                const docRef = doc(db, FIRESTORE_COLLECTION, key);
                return onSnapshot(docRef, (snapshot) => {
                    if (!snapshot.exists()) return;
                    const value = snapshot.data().value;
                    if (value === null || value === undefined || value === '') return;
                    const remoteValue = String(value);
                    firebaseCache.set(key, remoteValue);
                    window.localStorage.setItem(key, remoteValue);
                    callback(remoteValue);
                });
            }
        };

        // تحميل جميع البيانات من Firebase أو محاكاتها من localStorage
        await Promise.all(Object.values(StorageKeys).map(async (key) => {
            try {
                const remoteValue = await firebaseDocApi.get(key);
                if (remoteValue !== null) {
                    firebaseCache.set(key, remoteValue);
                    window.localStorage.setItem(key, remoteValue);
                    return;
                }

                const localValue = window.localStorage.getItem(key);
                if (localValue !== null && localValue !== 'null' && localValue !== '') {
                    firebaseCache.set(key, localValue);
                    await firebaseDocApi.set(key, localValue);
                }
            } catch (error) {
                console.warn(`خطأ في المزامنة للمفتاح ${key}:`, error);
            }
        }));

        firebaseEnabled = true;
        console.log('✅ تم تهيئة Firebase بنجاح');
        
        // بث حدث للإشارة إلى أن Firebase جاهز
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
        return true;
    } catch (error) {
        firebaseInitError = error;
        console.warn('⚠️ تعذر تهيئة Firebase، سيتم استخدام التخزين المحلي:', error);
        
        // بث حدث للإشارة إلى أن Firebase فشل ولكن التطبيق سيستمر
        window.dispatchEvent(new CustomEvent('firebaseFailed', { detail: error }));
        
        return false;
    }
}

// بدء التهيئة عند تحميل الملف
const firebaseReadyPromise = initializeFirebaseStorage();

// تصدير للاستخدام في الملفات الأخرى
window.unifiedStorage = unifiedStorage;
window.StorageKeys = StorageKeys;
window.firebaseReadyPromise = firebaseReadyPromise;
