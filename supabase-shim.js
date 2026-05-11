/**
 * supabase-shim.js
 * Provides a Firebase-compatible API backed by Supabase Postgres + Storage.
 * Loaded BEFORE cms-bridge.js / admin-core.js — exposes window.firebase.
 */
(function () {
    'use strict';

    const SUPABASE_URL = 'https://fsxnckdckfcargnvxzlf.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_n4HVXI_QZoibz3DUjjuDSw_7MwD2Ivl';
    const BUCKET = 'church-media';

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.error('[supabase-shim] Supabase SDK not loaded. Add the SDK <script> before this file.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let cache = { church_cms: { state: null, public: null } };
    const listeners = {};

    function getAtPath(path) {
        const parts = (path || '').split('/').filter(Boolean);
        let cur = cache;
        for (const p of parts) {
            if (cur == null || typeof cur !== 'object') return null;
            cur = cur[p];
        }
        return cur === undefined ? null : cur;
    }

    let initPromise = null;
    function ensureLoaded() {
        if (initPromise) return initPromise;
        initPromise = (async () => {
            try {
                const { data, error } = await client.from('cms_data').select('key, value');
                if (error) { console.warn('[supabase-shim] Initial load failed:', error.message); return; }
                (data || []).forEach(row => { cache.church_cms[row.key] = row.value; });
            } catch (err) { console.error('[supabase-shim] Init error:', err); }
        })();
        return initPromise;
    }

    function makeSnapshot(value) {
        return {
            val: () => value,
            exists: () => value != null && (typeof value !== 'object' || Object.keys(value).length > 0),
            forEach: (fn) => {
                if (value && typeof value === 'object') {
                    Object.entries(value).forEach(([k, v]) => fn(makeSnapshot(v)));
                }
            },
            child: (subPath) => makeSnapshot(value && value[subPath])
        };
    }

    function makeRef(path = '') {
        return {
            _path: path,
            child(subPath) { return makeRef(path ? (path + '/' + subPath) : subPath); },

            async once(eventType) {
                await ensureLoaded();
                return makeSnapshot(getAtPath(path));
            },

            on(eventType, callback, errorCallback) {
                if (!listeners[path]) listeners[path] = [];
                listeners[path].push(callback);
                ensureLoaded().then(() => {
                    try { callback(makeSnapshot(getAtPath(path))); }
                    catch (e) { console.error('[supabase-shim] listener error:', e); }
                }).catch(err => { if (errorCallback) errorCallback(err); });
                return callback;
            },

            off(eventType, callback) {
                if (!listeners[path]) return;
                if (callback) listeners[path] = listeners[path].filter(c => c !== callback);
                else delete listeners[path];
            },

            async update(obj) {
                const groupedByKey = {};
                for (const [k, v] of Object.entries(obj || {})) {
                    const parts = k.split('/').filter(Boolean);
                    if (parts[0] !== 'church_cms') { console.warn('[supabase-shim] Skip path:', k); continue; }
                    const rootKey = parts[1];
                    if (parts.length === 2) { groupedByKey[rootKey] = v; }
                    else {
                        if (!groupedByKey[rootKey]) {
                            groupedByKey[rootKey] = JSON.parse(JSON.stringify(cache.church_cms[rootKey] || {}));
                        }
                        const subParts = parts.slice(2);
                        let cur = groupedByKey[rootKey];
                        for (let i = 0; i < subParts.length - 1; i++) {
                            if (!cur[subParts[i]] || typeof cur[subParts[i]] !== 'object') cur[subParts[i]] = {};
                            cur = cur[subParts[i]];
                        }
                        cur[subParts[subParts.length - 1]] = v;
                    }
                }
                const upserts = [];
                for (const [key, value] of Object.entries(groupedByKey)) {
                    cache.church_cms[key] = value;
                    upserts.push({ key, value });
                }
                if (!upserts.length) return;
                const { error } = await client.from('cms_data').upsert(upserts, { onConflict: 'key' });
                if (error) throw new Error(error.message);
            },

            async set(value) {
                const parts = (path || '').split('/').filter(Boolean);
                if (parts[0] !== 'church_cms' || parts.length < 2) {
                    throw new Error('[supabase-shim] set() needs a path under church_cms/...');
                }
                const rootKey = parts[1];
                let newValue;
                if (parts.length === 2) { newValue = value; }
                else {
                    newValue = JSON.parse(JSON.stringify(cache.church_cms[rootKey] || {}));
                    const subParts = parts.slice(2);
                    let cur = newValue;
                    for (let i = 0; i < subParts.length - 1; i++) {
                        if (!cur[subParts[i]] || typeof cur[subParts[i]] !== 'object') cur[subParts[i]] = {};
                        cur = cur[subParts[i]];
                    }
                    cur[subParts[subParts.length - 1]] = value;
                }
                cache.church_cms[rootKey] = newValue;
                const { error } = await client.from('cms_data')
                    .upsert({ key: rootKey, value: newValue }, { onConflict: 'key' });
                if (error) throw new Error(error.message);
            }
        };
    }

    function notifyListeners(rootKey, value) {
        const root = 'church_cms/' + rootKey;
        (listeners[root] || []).forEach(cb => {
            try { cb(makeSnapshot(value)); } catch (e) { console.error(e); }
        });
        Object.keys(listeners).forEach(p => {
            if (p === root || !p.startsWith(root + '/')) return;
            const subParts = p.substring(root.length + 1).split('/');
            let cur = value;
            for (const sp of subParts) { if (cur == null) break; cur = cur[sp]; }
            listeners[p].forEach(cb => {
                try { cb(makeSnapshot(cur === undefined ? null : cur)); } catch (e) { console.error(e); }
            });
        });
    }

    client.channel('cms_data_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_data' }, (payload) => {
            const row = payload.new || payload.old;
            if (!row || !row.key) return;
            const value = payload.new ? payload.new.value : null;
            cache.church_cms[row.key] = value;
            notifyListeners(row.key, value);
        })
        .subscribe();

    function makeStorageRef(fullPath = '') {
        return {
            child(subPath) {
                const newPath = fullPath ? (fullPath + '/' + subPath) : subPath;
                return makeStorageRef(newPath);
            },
            async put(blob) {
                const objectPath = fullPath.replace(/^\/+/, '');
                const { error } = await client.storage.from(BUCKET).upload(objectPath, blob, {
                    upsert: true, contentType: blob.type || 'application/octet-stream'
                });
                if (error) throw new Error(error.message);
                return {
                    ref: {
                        async getDownloadURL() {
                            const { data } = client.storage.from(BUCKET).getPublicUrl(objectPath);
                            return data.publicUrl;
                        }
                    }
                };
            },
            async getDownloadURL() {
                const objectPath = fullPath.replace(/^\/+/, '');
                const { data } = client.storage.from(BUCKET).getPublicUrl(objectPath);
                return data.publicUrl;
            }
        };
    }

    window.firebase = {
        initializeApp() { return { name: '[supabase-shim]' }; },
        database() { return { ref(path) { return makeRef(path || ''); } }; },
        storage() { return { ref(path) { return makeStorageRef(path || ''); } }; }
    };

    ensureLoaded();
    console.log('[supabase-shim] Initialized. Project:', SUPABASE_URL);
})();