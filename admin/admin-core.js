/* ==========================================================================
   ADMIN CORE — State, Auth, Navigation, Utilities
   ========================================================================== */
'use strict';

// ─── DEFAULT STATE ───────────────────────────────────────────────────────────
const DEFAULT_STATE = {
    sections: {
        home: { label: 'Hero Slider', icon: '🖼️', visible: true, order: 0 },
        'watch-live': { label: 'Watch Live', icon: '📡', visible: true, order: 1 },
        about: { label: 'About Us', icon: '📖', visible: true, order: 2 },
        sunday_school: { label: 'Sunday School', icon: '📚', visible: true, order: 3 },
        'youtube-feed': { label: 'Latest Videos', icon: '📺', visible: true, order: 4 },
        gallery: { label: 'Church Gallery', icon: '📷', visible: true, order: 5 },
        pastors: { label: 'Pastors', icon: '👔', visible: true, order: 6 },
        youth: { label: 'Youth Testimonials', icon: '💬', visible: true, order: 7 },
        testimonials: { label: 'Testimonials', icon: '🗣️', visible: true, order: 8 },
        contact: { label: 'Contact & Map', icon: '📍', visible: true, order: 9 },
        events: { label: 'Upcoming Events', icon: '📅', visible: true, order: 10 },
        support: { label: 'Support / Donations', icon: '💝', visible: true, order: 11 },
        prayer: { label: 'Prayer Request', icon: '🙏', visible: true, order: 12 },
        timings: { label: 'Church Timings', icon: '⏰', visible: true, order: 13 },
        lyrics: { label: 'Song Lyrics Banner', icon: '🎵', visible: true, order: 14 },
        posts: { label: 'Posts / Updates', icon: '📰', visible: true, order: 15 },
    },
    hero: [],
    posts: [],
    pastors: [
        { id: 1, name: 'Pastor B Steven', role: 'Main Pastor', photo: '', status: 'published' }
    ],
    galleryAlbums: [
        { id: 1, title: 'Easter Service 2024', eventId: null, collageStyle: 'bento', photos: [] },
        { id: 2, title: 'Youth Retreat', eventId: null, collageStyle: 'grid', photos: [] }
    ],
    media: [],
    events: [],
    lyrics: { song: [], sunday: [] },
    testimonials: { 
        youth: [
            { id: 1, name: 'Enosh Burla', role: 'Youth Member', text: 'Praise the Lord, this is Enosh Burla. From the very first day of my life, I believe God’s hand has been upon me. Through it all, Jesus has been my protector.', photo: '', visible: true, status: 'published' },
            { id: 2, name: 'Monica Burla', role: 'Youth Member', text: 'Praise the Lord, my name is Mounica Burla. I accepted Jesus Christ as my personal Savior, took baptism, and am now joyfully serving in His ministry.', photo: '', visible: true, status: 'published' },
            { id: 3, name: 'Anusha Burla', role: 'Youth Member', text: 'Praise the Lord, my name is Anusha Burla, daughter of Pastor Steven Garu. Growing up in a pastor’s family, I have been blessed to serve Him through praise and worship.', photo: '', visible: true, status: 'published' }
        ], 
        member: [] 
    },
    ministries: [],
    kids: {
        programs: [
            { id: 1, name: 'Little Stars', age: '3-5', desc: 'Fun games and basic Bible stories.' },
            { id: 2, name: 'Bible Explorers', age: '6-9', desc: 'Interactive lessons and crafts.' }
        ],
        gallery: []
    },
    watchLive: {
        url: '',
        embedUrl: '',
        isLive: false,
        title: 'Watch Live',
        title_te: '',
        subtitle: '',
        subtitle_te: '',
        nextBroadcast: '',
        nextBroadcast_te: ''
    },
    support: {
        title: 'Support Our Ministry',
        title_te: 'మా ప్రీత్తి ధనసహాయం',
        description: 'Your generous giving helps us spread the gospel and serve the community.',
        description_te: 'మీ ఉదార దానం సువార్తను వ్యాపించడానికి సహాయం చేస్తుంది.',
        image_url: '',
        upi_id: '',
        upi_qr_url: '',
        bank_name: '',
        bank_account: '',
        bank_ifsc: '',
        donate_button_text: 'Donate Now',
        donate_button_text_te: 'ఇప్పుడే దానం ఇవ్వండి',
        external_donate_url: ''
    },
    prayerRequests: [],
    siteInfo: { 
        name: 'IPC Church - Pastor B Steven', 
        pastor: 'Pastor B Steven', 
        address: 'Suryanarayana Colony, Hyderabad', 
        phone: '+91 00000 00000', 
        email: 'info@ipcchurch.org', 
        service: 'Sunday 6:45 AM & 8:45 AM', 
        map: '', 
        youtube: 'https://youtube.com/@7_in_christ', 
        facebook: '', 
        instagram: '', 
        whatsapp: '' 
    },
    textContent: {
        hero_title: "Welcome to IPC Church",
        hero_subtitle: "A Place of Grace, Faith, and Community",
        hero_btn: "Join Us This Sunday",
        hero_btn_link: "#contact",
        
        about_title: "About Our Church",
        about_text1: "We are a community-driven church focused on spreading the love and teachings of Jesus Christ under the leadership of Pastor B Steven.",
        about_text2: "Through our diverse ministries, from Suryanarayana Colony to Subramanyam Colony, we strive to make a positive impact.",
        
        watch_live_title: "Watch Live",
        watch_live_date: "Next Broadcast: Sunday 9:00 AM",
        watch_live_desc: "Join our live service from anywhere in the world on our YouTube channel.",
        watch_btn: "Watch / Listen",
        watch_live_url: "https://youtube.com/@7_in_christ",
        
        gallery_title: "Church Gallery",
        yt_section_title: "Latest Sermons & Videos",
        pastors_title: "Our Pastors",
        contact_title: "Contact Us",
        youth_test_title: "Youth Testimonials",
        member_test_title: "Member Testimonials",
        
        anudhina_title: "Anudhina Kudikalu",
        anudhina_text: "In the early days of our ministry, many people showed great interest in listening to the Word of God. Pastor Garu started daily prayer sessions for two hours every day to guide and strengthen them in prayer. Slowly, many believers grew spiritually and became strong prayer warriors.",
        
        timings_title: "Church Timings",
        timings_c1_title: "Suryanarayana Colony",
        timings_c1_text: "Sunday Service: 6:45 AM – 9:00 AM\nSunday School & Youth Meeting: 7:00 AM – 8:15 AM\nAnudhina Kudika: 11:00 AM – 12:40 PM",
        timings_c2_title: "Subramanyam Colony",
        timings_c2_text: "Sunday Service: 8:45 AM – 11:30 AM\nSunday School & Youth Meeting: 9:00 AM – 10:15 AM\nWhole Night Prayer: 1st Saturday, 9:30 PM onwards",
        
        about_min_title: 'About Our Ministry',
        about_min_text1: 'Our ministry is dedicated to serving God and supporting people in their spiritual journey through worship, teaching, and fellowship.',
        about_min_text2: 'We believe in caring for others and spreading hope in our community through different programs and outreach efforts.',
        about_min_support: 'Support:\nYour support helps us continue our mission. Every contribution, big or small, makes a meaningful difference.',

        kids_info_title: 'Sunday School',
        kids_info_desc: 'Training children in the way they should go.',

        about_img: '',
        ss_img: ''
    },
    youtube: { channels: ['7_in_christ'], videoCount: 6, layout: 'grid-3', clickAction: 'modal', autoRefresh: true, visible: true },
    seo: { home: { title: 'IPC Church Pastor B Steven', description: 'Official website of IPC Church led by Pastor B Steven.', keywords: 'IPC, Church, Pastor B Steven, Suryanarayana Colony' } },
    users: [{ id: 1, name: 'Administrator', email: 'stevenburla4@gmail.com', role: 'super-admin', password: 'adminsteven@26', verified: true }],
    layout: ['home', 'watch-live', 'about', 'sunday_school', 'youtube-feed', 'gallery', 'pastors', 'youth', 'testimonials', 'anudhina', 'timings', 'about_ministry', 'posts', 'contact'],
    backups: [],
    notifications: [],
    activityLog: [],
};

// ─── FIREBASE CONFIGURATION ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCFO_WCeQEoKSK9AzfT2q2pf8CMwuQMER8",
  authDomain: "ipcchurchpastorbsteven.firebaseapp.com",
  databaseURL: "https://ipcchurchpastorbsteven-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ipcchurchpastorbsteven",
  storageBucket: "ipcchurchpastorbsteven.firebasestorage.app",
  messagingSenderId: "637419601191",
  appId: "1:637419601191:web:cdc7664a3c97f2541b3d02",
  measurementId: "G-CJY4G8RCV3"
};

// Initialize Firebase (Compat mode)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

// ─── STATE STORE ─────────────────────────────────────────────────────────────
const STORE_KEY = 'churchCMS_v2';
const PUBLIC_KEY = 'churchCMS_public';
const AUTH_KEY = 'cms_auth_user';   // matches login.html
let STATE = loadState();
let currentUser = null;
let cloudSynced = false;
let db = typeof firebase !== 'undefined' ? firebase.database() : null;
let storage = typeof firebase !== 'undefined' ? firebase.storage() : null;
let currentCMSLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cms-lang-toggle .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cms-lang-toggle .lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCMSLang = btn.dataset.lang;
            
            // Re-render relevant parts
            if (typeof renderTextEditor === 'function') renderTextEditor();
            if (typeof renderTestimonials === 'function') renderTestimonials();
            if (typeof renderLyrics === 'function') renderLyrics();
            
            toast(`Switched CMS to ${currentCMSLang.toUpperCase()}`, 'info');
        });
    });
});

/**
 * Syncs the local state with Firebase Realtime Database
 */
async function syncWithCloud() {
    if (!db) { cloudSynced = false; updateSyncStatus('Local Only'); return; }
    try {
        updateSyncStatus('Connecting...');
        const snapshot = await db.ref('church_cms/state').once('value');
        const cloudData = snapshot.val();
        if (cloudData) {
            STATE = deepMerge(deepClone(DEFAULT_STATE), cloudData);
            localStorage.setItem(STORE_KEY, JSON.stringify(STATE));
            toast('Cloud sync complete', 'success');
        }
        cloudSynced = true;
        updateSyncStatus('Synced');
    } catch (err) {
        console.error('Cloud sync error:', err);
        cloudSynced = false;
        updateSyncStatus('Error');
        toast('Cloud sync failed: ' + err.message + ' (working locally)', 'warning');
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return deepClone(DEFAULT_STATE);
        const saved = JSON.parse(raw);
        // Merge to pick up any new default keys
        const merged = deepMerge(deepClone(DEFAULT_STATE), saved);
        
        return merged;
    } catch { return deepClone(DEFAULT_STATE); }
}

function saveState(pushToCloud = true) {
    // Don't bail out if cloudSynced is false - that was silently losing
    // toggle changes when the sync flag wasn't set yet.
    // Just warn and continue with local save + cloud attempt.
    if (pushToCloud && !cloudSynced) {
        console.log('[saveState] cloudSynced=false, attempting save anyway');
    }
    if (pushToCloud && (!STATE.sections || Object.keys(STATE.sections).length < 3)) {
        console.warn('saveState aborted: STATE.sections empty');
        toast('Save blocked: cloud data not loaded. Refresh and try again.', 'error');
        return;
    }
    // 1. Prepare public snapshot for the website to read
    const publicData = {
        sections: STATE.sections,
        youtube: STATE.youtube,
        siteInfo: STATE.siteInfo,
        layout: STATE.layout,
        seo: STATE.seo,
        textContent: STATE.textContent,
        hero: STATE.hero,
        pastors: STATE.pastors || [],
        galleryAlbums: STATE.galleryAlbums || [],
        testimonials: STATE.testimonials,
        events: STATE.events,
        lyrics: STATE.lyrics,
        kids: STATE.kids,
        ministries: STATE.ministries,
        support: STATE.support || {},
        watchLive: STATE.watchLive || {},
        posts: STATE.posts || [],
        prayerRequests: STATE.prayerRequests || []
    };

    // 2. Try to save locally (Local Storage)
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(STATE));
        localStorage.setItem(PUBLIC_KEY, JSON.stringify(publicData));
    } catch (e) {
        console.warn('Local Storage Full - Trying to save settings only...', e);
        try {
            // SAFE LITE SAVE: Do NOT clear the main STATE object (to preserve Firebase push)
            // Just clear what goes into LocalStorage to prevent the crash
            const liteState = deepClone(STATE);
            liteState.media = []; 
            // Keep the rest of the text data
            localStorage.setItem(STORE_KEY, JSON.stringify(liteState));
            toast('Local storage full. Photos saved to cloud but not cached locally.', 'warning');
        } catch (e2) {
            console.error('Local Storage Critical Failure:', e2);
        }
    }

    // 3. PUSH TO CLOUD (Firebase)
    if (pushToCloud && db) {
        const publishBtn = document.getElementById('publish-btn');
        if (publishBtn) publishBtn.classList.add('loading');

        // Task 2: Use update() to prevent wiping entire nodes if one section is missing in local STATE
        // We'll update the main state and the public node
        const updates = {};
        updates['church_cms/state'] = STATE;
        updates['church_cms/public'] = publicData;

        if (typeof _selfWriteCount !== 'undefined') _selfWriteCount += 2;

        db.ref().update(updates).then(() => {
            if (publishBtn) publishBtn.classList.remove('loading');
            toast('Successfully Published to Cloud!', 'success');
            updateSyncStatus('Synced');
        }).catch(err => {
            console.error('Firebase save error:', err);
            logError('Firebase Save', err.message);
            if (publishBtn) publishBtn.classList.remove('loading');
            toast('Failed to save to cloud: ' + err.message, 'error');
            updateSyncStatus('Error');
        });
    } else {
        updateSyncStatus('Local Only');
    }
}

function updateSyncStatus(status) {
    const el = document.getElementById('sync-status-indicator');
    if (!el) return;
    el.textContent = status;
    el.className = 'status-badge ' + status.toLowerCase().replace(' ', '-');
}

/**
 * Task 11: Error Logging
 */
function logError(context, message) {
    if (!STATE.logs) STATE.logs = [];
    STATE.logs.unshift({
        id: genId(),
        time: new Date().toISOString(),
        context,
        message,
        type: 'error'
    });
    if (STATE.logs.length > 50) STATE.logs.pop(); // Keep last 50
    saveState(false); // Local only
}

/**
 * Task 12: Backup and Restore
 */
function exportDataAsJSON() {
    const data = JSON.stringify(STATE, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cms_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast('Backup file generated!', 'success');
    logActivity('System', 'Exported CMS backup');
}

// Counter incremented each time we push to cloud; the listener uses it
// to skip echoes of writes that originated in this same tab.
let _selfWriteCount = 0;
function initCloudListener() {
    if (!db) return;
    const stateRef = db.ref('church_cms/state');
    stateRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        if (_selfWriteCount > 0) { _selfWriteCount--; return; }
        const merged = deepMerge(deepClone(DEFAULT_STATE), data);
        if (JSON.stringify(merged) === JSON.stringify(STATE)) return;
        STATE = merged;
        localStorage.setItem(STORE_KEY, JSON.stringify(STATE));
        const activeTab = document.querySelector('.nav-link.active')?.dataset.tab;
        if (activeTab) switchTab(activeTab);
    }, (err) => {
        logError('Sync Listener', err.message);
        updateSyncStatus('Error');
    });
}

function importDataFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.sections || !data.siteInfo) {
                throw new Error('Invalid CMS backup file format');
            }
            if (confirm('WARNING: This will overwrite your current CMS data. Continue?')) {
                STATE = data;
                saveState();
                location.reload(); // Refresh to apply changes
            }
        } catch (err) {
            toast('Import failed: ' + err.message, 'error');
            logError('Import', err.message);
        }
    };
    reader.readAsText(file);
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value.trim();
        const pass = e.target.querySelector('input[type="password"]').value;
        
        const user = STATE.users.find(u => u.email === email && u.password === pass);
        
        if (user) {
            if (!user.verified) {
                toast('Please verify your email before logging in.', 'warning');
                return;
            }
            const sessionUser = { name: user.name, role: user.role, email: user.email };
            localStorage.setItem(AUTH_KEY, JSON.stringify(sessionUser));
            window.location.href = 'dashboard.html';
        } else {
            toast('Invalid email or password', 'error');
        }
    });
}


function getSessionUser() {
    try {
        const c = localStorage.getItem(AUTH_KEY);
        if (c) return JSON.parse(c);
    } catch { }
    return null;
}

currentUser = getSessionUser();
if (!currentUser && !document.getElementById('login-form')) {
    window.location.href = 'login.html';
}

function toast(msg, type = 'info') {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' };
    // Escape msg to prevent XSS (toasts may show user-provided content)
    const _toastEsc = String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span class="toast-msg">${_toastEsc}</span>`;
    stack.appendChild(el);
    setTimeout(() => { 
        el.style.opacity = '0'; 
        setTimeout(() => el.remove(), 300); 
    }, 3000);
}

function logActivity(action, detail = '') {
    const user = currentUser?.name || 'Admin';
    STATE.activityLog.unshift({
        id: Date.now(),
        user,
        action,
        detail,
        time: new Date().toISOString(),
    });
    if (STATE.activityLog.length > 200) STATE.activityLog.pop();
}

function pushNotification(msg, type = 'info') {
    STATE.notifications.unshift({ id: Date.now(), msg, type, read: false, time: new Date().toISOString() });
    updateNotifBadge();
}

function updateNotifBadge() {
    const unread = STATE.notifications.filter(n => !n.read).length;
    const cnt = document.getElementById('notif-count');
    if (cnt) {
        cnt.textContent = unread > 0 ? unread : '';
        cnt.classList.toggle('show', unread > 0);
    }
    const prayerBadge = document.getElementById('prayer-badge');
    const pendingPrayer = (STATE.prayerRequests || []).filter(p => p.status === 'pending').length;
    if (prayerBadge) {
        prayerBadge.textContent = pendingPrayer;
        prayerBadge.classList.toggle('show', pendingPrayer > 0);
    }
}

function genId() { return Date.now() + Math.floor(Math.random() * 1000); }

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, n = 60) { return str && str.length > n ? str.substring(0, n) + '…' : str; }

// ─── IMAGE OPTIMIZATION (client-side) ────────────────────────────────────────
// Aggressive optimization to keep Firebase Realtime Database snappy
// Upgraded for Firebase Storage & Thumbnails
function optimizeImage(file, { maxW = 1920, thumbW = 600, quality = 0.88 } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = e => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.onload = () => {
                const process = (width) => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > width) { h = Math.round(h * width / w); w = width; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    return new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
                };

                Promise.all([process(maxW), process(thumbW)]).then(([fullBlob, thumbBlob]) => {
                    resolve({
                        fullBlob,
                        thumbBlob,
                        name: file.name.replace(/\.[^/.]+$/, "") + '.jpg',
                        w: img.width,
                        h: img.height,
                        previewUrl: URL.createObjectURL(fullBlob)
                    });
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Uploads a Blob to Firebase Storage and returns the public URL
 */
async function uploadToStorage(blob, filename, folder = 'general') {
    if (!storage) {
        // Fallback to Base64 if storage is not available (for local testing/errors)
        return new Promise(res => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    const ref = storage.ref().child(`church_media/${folder}/${Date.now()}_${filename}`);
    const snapshot = await ref.put(blob);
    return await snapshot.ref.getDownloadURL();
}


/**
 * Image Preview Overlay
 */
function previewImage(url) {
    if (!url) return;
    const overlay = document.getElementById('preview-overlay');
    const img = document.getElementById('preview-img');
    if (!overlay || !img) return;
    img.src = url;
    overlay.removeAttribute('hidden');
    overlay.onclick = () => overlay.setAttribute('hidden', '');
}

/**
 * Bulk File Upload Processor
 */
async function processFileUploads(files, targetArray, category = 'general') {
    if (!files || !files.length) return;
    if (!Array.isArray(targetArray)) {
        console.error('Upload error: targetArray is not an array');
        toast('System Error: Cannot find target gallery.', 'error');
        return;
    }
    toast(`Processing ${files.length} images...`, 'info');
    
    let count = 0;
    for (const file of files) {
        try {
            count++;
            if (files.length > 1) {
                toast(`Processing image ${count} of ${files.length}...`, 'info');
            }
            const result = await optimizeImage(file);
            
            // Upload to storage
            const [url, thumbUrl] = await Promise.all([
                uploadToStorage(result.fullBlob, result.name, category),
                uploadToStorage(result.thumbBlob, 'thumb_' + result.name, category)
            ]);

            targetArray.push({
                id: genId(),
                url: url,
                thumbnail: thumbUrl,
                name: result.name,
                w: result.w,
                h: result.h,
                category: category,
                date: new Date().toISOString()
            });
        } catch (e) {
            console.error('Upload error:', e);
            toast('Failed to upload ' + file.name, 'error');
        }
    }
    // Single save at end so cloud writes are atomic for the whole batch.
    // Prevents earlier photos from being dropped by listener races.
    saveState();
    logActivity('Upload', 'Uploaded ' + files.length + ' images to ' + category);
    toast(files.length + ' images uploaded!', 'success');
}

// ─── DRAG & DROP SORT ─────────────────────────────────────────────────────────

function setupDragSort(containerSelector, onReorder) {
    const containers = document.querySelectorAll(containerSelector);
    containers.forEach(container => enableDragOnContainer(container, onReorder));
}

function enableDragOnContainer(container, onReorder) {
    let dragEl = null;
    container.querySelectorAll('[draggable="true"]').forEach(el => {
        el.addEventListener('dragstart', () => { dragEl = el; el.classList.add('dragging'); });
        el.addEventListener('dragend', () => { dragEl = null; el.classList.remove('dragging'); container.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(e => { e.classList.remove('drag-over-top', 'drag-over-bottom'); }); onReorder && onReorder(container); });
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!dragEl || dragEl === el) return;
            const rect = el.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            container.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(e => e.classList.remove('drag-over-top', 'drag-over-bottom'));
            if (e.clientY < mid) { el.classList.add('drag-over-top'); container.insertBefore(dragEl, el); }
            else { el.classList.add('drag-over-bottom'); el.after(dragEl); }
        });
    });
}

// ─── MODAL SYSTEM ─────────────────────────────────────────────────────────────
function openModal(title, bodyHTML, onSave, saveLabel = 'Save') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (saveBtn) { saveBtn.textContent = saveLabel; saveBtn.onclick = onSave; }
    if (cancelBtn) { cancelBtn.onclick = closeModal; }
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-overlay').removeAttribute('hidden');
    document.getElementById('modal-overlay').onclick = (e) => { if (e.target.id === 'modal-overlay') closeModal(); };
}

function closeModal() { document.getElementById('modal-overlay').setAttribute('hidden', ''); }

// ─── PUBLISH ──────────────────────────────────────────────────────────────────
document.getElementById('publish-btn')?.addEventListener('click', () => {
    saveState();
    logActivity('Published', 'All changes pushed to the website');
    const btn = document.getElementById('publish-btn');
    const oldText = btn.textContent;
    btn.textContent = '✓ Published!';
    btn.style.background = 'var(--success)';
    toast('All changes published to your website!', 'success');
    setTimeout(() => { btn.textContent = oldText; btn.style.background = ''; }, 2500);
});

// Task 11 & 12: System listeners
document.getElementById('create-backup-btn')?.addEventListener('click', exportDataAsJSON);
document.getElementById('restore-btn')?.addEventListener('click', () => {
    const file = document.getElementById('restore-file').files[0];
    if (file) importDataFromJSON(file);
    else toast('Please select a .json file first', 'warning');
});
document.getElementById('clear-log-btn')?.addEventListener('click', () => {
    if(confirm('Clear activity log?')) { 
        STATE.activityLog = []; 
        saveState(); 
        renderLogs(); 
    }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
});

// ─── MOBILE SIDEBAR ───────────────────────────────────────────────────────────
function openMobileSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
}
function closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
}
document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobileSidebar);
document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

// Secondary logout button in topbar
document.getElementById('logout-btn-top')?.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
});

// ════════════════════════════════════════════════════════════════════════════
// IDLE AUTO-LOGOUT — sign out after 5 min inactivity, warn at 4 min
// ════════════════════════════════════════════════════════════════════════════
(function setupIdleLogout() {
    if (!currentUser) return; // not logged in, nothing to do
    
    const IDLE_LIMIT_MS = 5 * 60 * 1000;    // 5 minutes
    const WARN_BEFORE_MS = 60 * 1000;       // show warning 60 sec before logout
    let idleTimer = null;
    let warnTimer = null;
    let warningEl = null;
    let countdownInterval = null;
    
    function doLogout() {
        if (warningEl) warningEl.remove();
        if (countdownInterval) clearInterval(countdownInterval);
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.setItem('idle_logout', '1'); window.location.replace('login.html');
    }
    
    function showWarning() {
        if (warningEl) return;
        warningEl = document.createElement('div');
        warningEl.id = 'idle-warning-modal';
        warningEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
        warningEl.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:420px;padding:1.75rem 2rem;box-shadow:0 24px 60px rgba(0,0,0,0.4);text-align:center">
                <div style="font-size:48px;line-height:1">⏱️</div>
                <h2 style="margin:0.5rem 0;font-size:1.3rem">Are you still there?</h2>
                <p style="color:#555;margin:0.5rem 0 1rem">You'll be signed out in <strong id="idle-countdown">60</strong> seconds for security.</p>
                <button id="idle-stay-btn" style="background:#C8521E;color:white;border:0;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;width:100%">Stay signed in</button>
                <button id="idle-logout-btn" style="background:transparent;color:#888;border:0;padding:0.75rem;margin-top:0.5rem;font-size:13px;cursor:pointer;width:100%">Sign out now</button>
            </div>
        `;
        document.body.appendChild(warningEl);
        
        document.getElementById('idle-stay-btn').onclick = () => {
            warningEl.remove();
            warningEl = null;
            if (countdownInterval) clearInterval(countdownInterval);
            resetIdleTimer();
        };
        document.getElementById('idle-logout-btn').onclick = doLogout;
        
        let seconds = 60;
        const countdownEl = document.getElementById('idle-countdown');
        countdownInterval = setInterval(() => {
            seconds--;
            if (countdownEl) countdownEl.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                doLogout();
            }
        }, 1000);
    }
    
    function resetIdleTimer() {
        if (idleTimer) clearTimeout(idleTimer);
        if (warnTimer) clearTimeout(warnTimer);
        warnTimer = setTimeout(showWarning, IDLE_LIMIT_MS - WARN_BEFORE_MS);
        idleTimer = setTimeout(doLogout, IDLE_LIMIT_MS);
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let lastReset = Date.now();
    events.forEach(evt => {
        document.addEventListener(evt, () => {
            const now = Date.now();
            if (now - lastReset < 5000) return;
            lastReset = now;
            if (warningEl) return;
            resetIdleTimer();
        }, { passive: true });
    });
    
    resetIdleTimer();
})();


// ─── SIDEBAR COLLAPSE ─────────────────────────────────────────────────────────
document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('sidebar-collapsed');
});

// ─── NAV SEARCH ───────────────────────────────────────────────────────────────
document.getElementById('nav-search')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.nav-link').forEach(link => {
        const lbl = link.querySelector('.nav-text')?.textContent?.toLowerCase() || '';
        link.parentElement.style.display = (!q || lbl.includes(q)) ? '' : 'none';
    });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
document.getElementById('notif-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('notif-dropdown');
    dd.toggleAttribute('hidden');
    if (!dd.hasAttribute('hidden')) renderNotifDropdown();
});
document.addEventListener('click', () => document.getElementById('notif-dropdown')?.setAttribute('hidden', ''));

document.getElementById('clear-notifs')?.addEventListener('click', () => {
    STATE.notifications = [];
    updateNotifBadge();
    renderNotifDropdown();
});

function renderNotifDropdown() {
    const ul = document.getElementById('notif-list');
    if (!ul) return;
    STATE.notifications.forEach(n => n.read = true);
    updateNotifBadge();
    if (!STATE.notifications.length) {
        ul.innerHTML = '<li class="notif-empty">No notifications</li>';
        return;
    }
    ul.innerHTML = STATE.notifications.slice(0, 10).map(n =>
        `<li>${n.msg} <small style="color:var(--muted);display:block">${fmtDate(n.time)}</small></li>`
    ).join('');
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function renderOverview() {
    // Stats
    const statsRow = document.getElementById('stats-row');
    if (statsRow) {
        const totalGalleryPhotos = (STATE.galleryAlbums || []).reduce((sum, album) => sum + (album.photos?.length || 0), 0);
        const stats = [
            { label: 'Gallery Albums', value: (STATE.galleryAlbums?.length || 0), icon: '📁' },
            { label: 'Total Photos', value: totalGalleryPhotos + STATE.hero.length, icon: '📷' },
            { label: 'Upcoming Events', value: STATE.events.length, icon: '📅' },
            { label: 'Songs in Library', value: (STATE.lyrics.song?.length || 0) + (STATE.lyrics.sunday?.length || 0), icon: '🎶' },
            { label: 'Testimonials', value: (STATE.testimonials.youth?.length || 0) + (STATE.testimonials.member?.length || 0), icon: '💬' },
            { label: 'Prayer Requests', value: (STATE.prayerRequests || []).filter(p => p.status === 'pending').length, icon: '🙏' },
        ];
        statsRow.innerHTML = stats.map(s => `
            <div class="stat-card">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
                <div class="stat-card-icon">${s.icon}</div>
            </div>`).join('');
    }

    // Visibility Grid
    const grid = document.getElementById('visibility-grid');
    if (grid) {
        grid.innerHTML = Object.entries(STATE.sections).map(([id, cfg]) => `
            <div class="vis-item">
                <span>${cfg.icon} ${cfg.label}</span>
                <label class="toggle-switch">
                    <input type="checkbox" data-sec="${id}" ${cfg.visible ? 'checked' : ''}>
                    <span class="toggle-track"></span>
                </label>
            </div>`).join('');
        grid.querySelectorAll('input[data-sec]').forEach(inp => {
            inp.addEventListener('change', function () {
                STATE.sections[this.dataset.sec].visible = this.checked;
                logActivity('Visibility', `${STATE.sections[this.dataset.sec].label} → ${this.checked ? 'Shown' : 'Hidden'}`);
                saveState();
                toast(`${STATE.sections[this.dataset.sec].label} ${this.checked ? 'visible' : 'hidden'}`, 'info');
            });
        });
    }

    // Welcome name
    const wn = document.getElementById('welcome-name');
    if (wn) wn.textContent = currentUser?.name || 'Admin';

    // User avatar/name in sidebar
    const uav = document.getElementById('user-avatar-chip');
    const unm = document.getElementById('user-name-display');
    const url = document.getElementById('user-role-display');
    if (uav) uav.textContent = (currentUser?.name || 'A')[0].toUpperCase();
    if (unm) unm.textContent = currentUser?.name || 'Admin';
    if (url) url.textContent = (currentUser?.role || 'admin').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Notifications overview
    const ovN = document.getElementById('overview-notifs');
    if (ovN) {
        const recent = STATE.notifications.slice(0, 5);
        if (!recent.length) {
            ovN.innerHTML = '<li class="muted-note">No new notifications.</li>';
        } else {
            ovN.innerHTML = recent.map(n => `<li>${n.msg} <small style="color:var(--muted)">${fmtDate(n.time)}</small></li>`).join('');
        }
    }

    updateNotifBadge();
}

// ─── LAYOUT MANAGER ──────────────────────────────────────────────────────────
function renderLayout() {
    const ul = document.getElementById('layout-sort-list');
    if (!ul) return;
    ul.innerHTML = STATE.layout.map(id => {
        const sec = STATE.sections[id];
        if (!sec) return '';
        return `<li class="sort-item" draggable="true" data-id="${id}">
            <span class="drag-handle">⠿</span>
            <span class="sort-section-icon">${sec.icon}</span>
            <div class="sort-section-info">
                <strong>${sec.label}</strong>
                <span>${sec.visible ? '✓ Visible' : '✗ Hidden'}</span>
            </div>
        </li>`;
    }).join('');

    enableDragOnContainer(ul, (container) => {
        STATE.layout = [...container.querySelectorAll('[data-id]')].map(el => el.dataset.id);
        logActivity('Layout', 'Homepage section order updated');
    });

    document.getElementById('reset-layout-btn')?.addEventListener('click', () => {
        STATE.layout = Object.keys(DEFAULT_STATE.sections);
        renderLayout();
        toast('Layout reset to default', 'info');
    });
}

// ─── TABS ───────────────────────────────────────────────────────────────────────
function setupTabs() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-tab');
            if (!targetId) return;

            document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
            link.parentElement.classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                
                const title = link.querySelector('.nav-text')?.textContent || link.textContent;
                const breadcrumb = document.getElementById('breadcrumb-text');
                if (breadcrumb) breadcrumb.textContent = title;

                // trigger specific renders
                if (targetId === 'tab-overview' && typeof renderOverview === 'function') renderOverview();
                if (targetId === 'tab-layout' && typeof renderLayout === 'function') renderLayout();
                if (targetId === 'tab-media' && typeof renderMedia === 'function') renderMedia();
                if (targetId === 'tab-hero' && typeof renderHero === 'function') renderHero();
                if (targetId === 'tab-pastors' && typeof renderPastors === 'function') renderPastors();
                if (targetId === 'tab-gallery' && typeof renderGallery === 'function') renderGallery();
                if (targetId === 'tab-events' && typeof renderEvents === 'function') renderEvents();
                if (targetId === 'tab-youtube' && typeof renderYouTube === 'function') renderYouTube();
                if (targetId === 'tab-testimonials' && typeof renderTestimonials === 'function') renderTestimonials();
                if (targetId === 'tab-lyrics' && typeof renderLyrics === 'function') renderLyrics();
                if (targetId === 'tab-texteditor' && typeof renderTextEditor === 'function') renderTextEditor();
                if (targetId === 'tab-ministries' && typeof renderMinistries === 'function') renderMinistries();
                if (targetId === 'tab-kids') {
                    if (typeof renderKids === 'function') renderKids();
                    if (typeof renderKidsGallery === 'function') renderKidsGallery();
                }
                if (targetId === 'tab-support' && typeof renderSupport === 'function') renderSupport();
                if (targetId === 'tab-posts' && typeof renderPosts === 'function') renderPosts();
                if (targetId === 'tab-watch-live' && typeof renderWatchLive === 'function') renderWatchLive();
                if (targetId === 'tab-prayer' && typeof renderPrayer === 'function') renderPrayer();
                if (targetId === 'tab-siteinfo' && typeof renderSiteInfo === 'function') renderSiteInfo();
                if (targetId === 'tab-seo' && typeof renderSEO === 'function') renderSEO();
                if (targetId === 'tab-users' && typeof renderUsers === 'function') renderUsers();
                if (targetId === 'tab-analytics' && typeof renderAnalytics === 'function') renderAnalytics();
                if (targetId === 'tab-backups' && typeof renderBackups === 'function') renderBackups();
                if (targetId === 'tab-activitylog' && typeof renderActivityLog === 'function') renderActivityLog();
            }

            if (window.innerWidth <= 1024) {
                if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
            }
        });
    });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.body.classList.contains('dashboard-body')) return;
    currentUser = getSessionUser();
    if (!currentUser) { window.location.href = 'login.html'; return; }

    setupTabs();
    updateNotifBadge();

    if (typeof syncWithCloud === 'function') {
        await syncWithCloud();
    }

    renderOverview();

    if (typeof initCloudListener === 'function') initCloudListener();

    const pending = (STATE.prayerRequests || []).filter(p => p.status === 'pending').length;
    if (pending > 0 && !(STATE.notifications || []).length) {
        pushNotification(pending + ' pending prayer request(s) need review', 'info');
    }

    if (STATE.galleryAlbums) {
        let fixed = false;
        STATE.galleryAlbums.forEach(album => {
            if (!album.photos) { album.photos = []; fixed = true; }
        });
        if (fixed) saveState(false);
    }
});

// ─── RECOVERY TOOL ──────────────────────────────────────────────────────────
function recoverFromTranslations() {
    if (!window.translations || !window.translations.en) {
        toast('Static translations not found. Cannot recover.', 'error');
        return;
    }
    
    const en = window.translations.en;
    let recoveredCount = 0;
    
    // Member Testimonials (1-7)
    if (!STATE.testimonials.member) STATE.testimonials.member = [];
    for (let i = 1; i <= 7; i++) {
        const name = en[`member_name_${i}`];
        const text = en[`member_test_${i}`];
        if (name && text && !name.includes('...')) {
            // Check if already exists
            const exists = STATE.testimonials.member.find(t => t.name === name);
            if (!exists) {
                STATE.testimonials.member.push({
                    id: 'rec-' + Date.now() + i,
                    name: name,
                    text: text,
                    role: 'Church Member',
                    visible: true,
                    status: 'published'
                });
                recoveredCount++;
            }
        }
    }
    
    if (recoveredCount > 0) {
        saveState();
        if (typeof renderTestimonials === 'function') renderTestimonials();
        toast(`Successfully recovered ${recoveredCount} member testimonials!`, 'success');
    } else {
        toast('No new testimonials found to recover.', 'info');
    }
}

window.recoverFromTranslations = recoverFromTranslations;

