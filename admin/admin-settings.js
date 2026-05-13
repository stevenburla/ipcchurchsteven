/* ==========================================================================
   ADMIN SETTINGS — YouTube, SEO, Users/Roles, Analytics, Backups, Site Info
   ========================================================================== */

// ─── YOUTUBE ──────────────────────────────────────────────────────────────────
function renderYouTube() {
    const yt = STATE.youtube;
    // Restore form values
    const videoCount = document.getElementById('yt-video-count');
    const layoutSel = document.getElementById('yt-layout');
    const clickAction = document.getElementById('yt-click-action');
    const autoRefresh = document.getElementById('yt-auto-refresh');
    const ytVisible = document.getElementById('yt-visible');
    if (videoCount) videoCount.value = yt.videoCount || 6;
    if (layoutSel) layoutSel.value = yt.layout || 'grid-3';
    if (clickAction) clickAction.value = yt.clickAction || 'modal';
    if (autoRefresh) autoRefresh.checked = yt.autoRefresh !== false;
    if (ytVisible) ytVisible.checked = yt.visible !== false;
    renderChannelPills();
}

function renderChannelPills() {
    const ul = document.getElementById('yt-channels-list');
    if (!ul) return;
    if (!STATE.youtube.channels.length) {
        ul.innerHTML = '<li class="muted-note" style="padding:.5rem .75rem">No channels added yet.</li>';
        return;
    }
    ul.innerHTML = STATE.youtube.channels.map((ch, i) => `
        <li class="channel-pill">
            <span>▶ ${ch}</span>
            <button data-idx="${i}" title="Remove">✕</button>
        </li>`).join('');
    ul.querySelectorAll('[data-idx]').forEach(btn => {
        btn.onclick = () => {
            STATE.youtube.channels.splice(Number(btn.dataset.idx), 1);
            logActivity('YouTube', `Channel removed`);
            renderChannelPills();
        };
    });
}

// Resolve any YouTube input (URL, @handle, channel name) to a UC... channel ID.
// Uses public CORS proxies so the resolution happens entirely inside the browser,
// no external admin tools needed.
async function resolveYouTubeChannelId(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;

    // Case 1: already a UC channel ID
    if (/^UC[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;

    // Case 2: extract channel/UC... from a URL
    const ucInUrl = raw.match(/channel\/(UC[A-Za-z0-9_-]{20,})/);
    if (ucInUrl) return ucInUrl[1];

    // Case 3: handle (@something) or URL form -- need to fetch the channel page
    let handle = raw;
    handle = handle.replace(/^https?:\/\/(www\.)?youtube\.com\//, '');
    handle = handle.replace(/^@/, '').replace(/\/.*$/, '');

    const channelUrl = 'https://www.youtube.com/@' + encodeURIComponent(handle);

    // Try multiple CORS proxies in order
    const proxies = [
        url => 'https://corsproxy.io/?' + encodeURIComponent(url),
        url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
        url => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url)
    ];

    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy(channelUrl), { signal: AbortSignal.timeout(8000) });
            if (!res.ok) continue;
            const html = await res.text();
            // Extract UC ID from any of several places in the page
            const candidates = [
                html.match(/"externalId":"(UC[A-Za-z0-9_-]{20,})"/),
                html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})"/),
                html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})"/),
                html.match(/\/channel\/(UC[A-Za-z0-9_-]{20,})/)
            ];
            for (const m of candidates) {
                if (m && m[1]) return m[1];
            }
        } catch (e) { /* try next proxy */ }
    }
    return null;
}

document.getElementById('yt-add-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('yt-channel-input');
    const addBtn = document.getElementById('yt-add-btn');
    const val = input?.value?.trim();
    if (!val) return;

    const originalBtnText = addBtn ? addBtn.textContent : '';
    if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Resolving...'; }
    toast('Resolving channel ID from YouTube...', 'info');

    const channelId = await resolveYouTubeChannelId(val);

    if (addBtn) { addBtn.disabled = false; addBtn.textContent = originalBtnText; }

    if (!channelId) {
        toast('Could not resolve channel. Check the handle/URL or try again.', 'error');
        return;
    }
    if (STATE.youtube.channels.includes(channelId)) {
        toast('Channel already added.', 'error');
        return;
    }
    STATE.youtube.channels.push(channelId);
    logActivity('YouTube', 'Channel added: ' + channelId);
    if (input) input.value = '';
    renderChannelPills();
    saveState();
    toast('Channel resolved and added! (' + channelId + ')', 'success');
});

document.getElementById('yt-save-btn')?.addEventListener('click', () => {
    STATE.youtube.videoCount = Number(document.getElementById('yt-video-count')?.value) || 6;
    STATE.youtube.layout = document.getElementById('yt-layout')?.value || 'grid-3';
    STATE.youtube.clickAction = document.getElementById('yt-click-action')?.value || 'modal';
    STATE.youtube.autoRefresh = document.getElementById('yt-auto-refresh')?.checked !== false;
    STATE.youtube.visible = document.getElementById('yt-visible')?.checked !== false;
    saveState();
    logActivity('YouTube', 'Feed configuration saved');
    toast('YouTube settings saved!', 'success');
});

// ─── SITE INFO ────────────────────────────────────────────────────────────────
function renderSiteInfo() {
    const si = STATE.siteInfo || {};
    const fields = ['name', 'pastor', 'address', 'phone', 'email', 'service', 'map', 'youtube', 'facebook', 'instagram', 'whatsapp'];
    fields.forEach(f => {
        const el = document.getElementById(`si-${f}`);
        if (el) el.value = si[f] || '';
    });
    
    // Prayer Settings
    const ps = STATE.prayerSettings || { recipients: [], emailNotifications: true };
    const recipientsList = document.getElementById('prayer-recipients-list');
    if (recipientsList) {
        recipientsList.innerHTML = ps.recipients.map((email, i) => `
            <div class="resource-pill">
                <span>📧 ${email}</span>
                <span class="resource-delete" onclick="removePrayerRecipient(${i})">✕</span>
            </div>
        `).join('') || '<p class="muted-note">No recipient emails added.</p>';
    }
    const notifyToggle = document.getElementById('prayer-notify-toggle');
    if (notifyToggle) notifyToggle.checked = ps.emailNotifications;
}

function addPrayerRecipient() {
    const input = document.getElementById('prayer-recipient-input');
    const email = input.value.trim();
    if (!email || !email.includes('@')) { toast('Enter a valid email.', 'error'); return; }
    if (!STATE.prayerSettings) STATE.prayerSettings = { recipients: [], emailNotifications: true };
    STATE.prayerSettings.recipients.push(email);
    input.value = '';
    renderSiteInfo();
}

function removePrayerRecipient(idx) {
    STATE.prayerSettings.recipients.splice(idx, 1);
    renderSiteInfo();
}

document.getElementById('si-save-btn')?.addEventListener('click', () => {
    const fields = ['name', 'pastor', 'address', 'phone', 'email', 'service', 'map', 'youtube', 'facebook', 'instagram', 'whatsapp'];
    fields.forEach(f => {
        const el = document.getElementById(`si-${f}`);
        if (el) STATE.siteInfo[f] = el.value;
    });
    if (STATE.prayerSettings) {
        STATE.prayerSettings.emailNotifications = document.getElementById('prayer-notify-toggle')?.checked;
    }
    saveState();
    logActivity('Site Info', 'Church information updated');
    toast('Site settings saved!', 'success');
});

document.getElementById('clear-cache-btn')?.addEventListener('click', () => {
    if (confirm('Clear local browser cache? This can fix "Local cache full" errors. Your changes in the cloud will not be deleted.')) {
        const auth = localStorage.getItem('churchCMS_auth');
        localStorage.clear();
        if (auth) localStorage.setItem('churchCMS_auth', auth); // Preserve login
        toast('Local cache cleared! Refreshing...', 'success');
        setTimeout(() => window.location.reload(), 1500);
    }
});

// ─── SEO CONTROLS ─────────────────────────────────────────────────────────────
function renderSEO() {
    const page = document.getElementById('seo-page-select')?.value || 'home';
    loadSEOPage(page);
}

function loadSEOPage(page) {
    const seo = STATE.seo?.[page] || {};
    const titleEl = document.getElementById('seo-title');
    const descEl = document.getElementById('seo-description');
    const keyEl = document.getElementById('seo-keywords');
    if (titleEl) titleEl.value = seo.title || '';
    if (descEl) descEl.value = seo.description || '';
    if (keyEl) keyEl.value = seo.keywords || '';
    updateSEOPreview();
}

function updateSEOPreview() {
    const title = document.getElementById('seo-title')?.value || 'Page Title';
    const desc = document.getElementById('seo-description')?.value || 'Meta description...';
    const prevTitle = document.getElementById('seo-prev-title');
    const prevDesc = document.getElementById('seo-prev-desc');
    if (prevTitle) prevTitle.textContent = title;
    if (prevDesc) prevDesc.textContent = desc;
}

document.getElementById('seo-save-btn')?.addEventListener('click', () => {
    const page = document.getElementById('seo-page-select')?.value || 'home';
    if (!STATE.seo) STATE.seo = {};
    STATE.seo[page] = {
        title: document.getElementById('seo-title').value,
        description: document.getElementById('seo-description').value,
        keywords: document.getElementById('seo-keywords').value
    };
    saveState();
    logActivity('SEO', `Updated SEO for ${page}`);
    toast('SEO saved!', 'success');
});

// ─── USER ROLES ───────────────────────────────────────────────────────────────
function renderUsers() {
    const ul = document.getElementById('users-list');
    if (!ul) return;
    ul.innerHTML = '';
    STATE.users.forEach((u, i) => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <div class="user-chip" style="background:${u.role === 'admin' ? 'var(--accent)' : '#666'}">${u.name.charAt(0)}</div>
            <div class="item-info">
                <strong>${u.name} ${u.verified ? '✅' : '⏳'}</strong>
                <span>${u.email} · Role: ${u.role}</span>
            </div>
            <div class="item-meta">
                <button class="action-btn" onclick="editUser(${i})">✏ Edit</button>
                <button class="action-btn action-del" onclick="deleteUser(${i})">🗑</button>
            </div>
        `;
        ul.appendChild(li);
    });
}

function deleteUser(idx) {
    if (STATE.users.length <= 1) { toast('Cannot delete the last admin.', 'error'); return; }
    if (confirm(`Delete user ${STATE.users[idx].name}?`)) {
        STATE.users.splice(idx, 1);
        saveState();
        renderUsers();
    }
}


// ─── SUPPORT / DONATIONS ──────────────────────────────────────────────────────
function renderSupport() {
    const sup = STATE.support || {};
    // Populate all sup-* inputs from STATE.support
    const fields = ['title', 'description', 'donate_button_text', 'external_donate_url',
                    'upi_id', 'bank_name', 'bank_account', 'bank_ifsc'];
    fields.forEach(f => {
        const el = document.getElementById('sup-' + f);
        if (el) el.value = sup[f] || '';
        const teEl = document.getElementById('sup-' + f + '-te');
        if (teEl) teEl.value = sup[f + '_te'] || '';
    });

    // Image uploaders
    const supImageContainer = document.getElementById('sup-image-uploader');
    if (supImageContainer) {
        supImageContainer.innerHTML = '';
        supImageContainer.appendChild(createImageUploader(sup.image_url, (res) => {
            STATE.support = STATE.support || {};
            STATE.support.image_url = res.url;
            saveState();
            toast('Support image updated', 'success');
        }, 'site'));
    }
    const supQrContainer = document.getElementById('sup-upi-qr-uploader');
    if (supQrContainer) {
        supQrContainer.innerHTML = '';
        supQrContainer.appendChild(createImageUploader(sup.upi_qr_url, (res) => {
            STATE.support = STATE.support || {};
            STATE.support.upi_qr_url = res.url;
            saveState();
            toast('QR code updated', 'success');
        }, 'site'));
    }
}

document.getElementById('sup-save-btn')?.addEventListener('click', () => {
    STATE.support = STATE.support || {};
    const fields = ['title', 'description', 'donate_button_text', 'external_donate_url',
                    'upi_id', 'bank_name', 'bank_account', 'bank_ifsc'];
    fields.forEach(f => {
        const el = document.getElementById('sup-' + f);
        if (el) STATE.support[f] = el.value.trim();
        const teEl = document.getElementById('sup-' + f + '-te');
        if (teEl) STATE.support[f + '_te'] = teEl.value.trim();
    });
    saveState();
    logActivity('Support', 'Donation settings updated');
    toast('Support settings saved!', 'success');
});


// ─── WATCH LIVE ───────────────────────────────────────────────────────────────
function renderWatchLive() {
    STATE.watchLive = STATE.watchLive || {};
    const w = STATE.watchLive;
    const fields = ['url', 'title', 'subtitle', 'nextBroadcast'];
    fields.forEach(f => {
        const el = document.getElementById('wl-' + f);
        if (el) el.value = w[f] || '';
        const teEl = document.getElementById('wl-' + f + '-te');
        if (teEl) teEl.value = w[f + '_te'] || '';
    });
    const liveToggle = document.getElementById('wl-isLive');
    if (liveToggle) liveToggle.checked = !!w.isLive;
}

document.getElementById('wl-save-btn')?.addEventListener('click', () => {
    STATE.watchLive = STATE.watchLive || {};
    const w = STATE.watchLive;
    const fields = ['url', 'title', 'subtitle', 'nextBroadcast'];
    fields.forEach(f => {
        const el = document.getElementById('wl-' + f);
        if (el) w[f] = el.value.trim();
        const teEl = document.getElementById('wl-' + f + '-te');
        if (teEl) w[f + '_te'] = teEl.value.trim();
    });
    w.isLive = !!document.getElementById('wl-isLive')?.checked;
    
    // Convert URL to embed format
    w.embedUrl = extractYouTubeEmbedUrl(w.url);
    
    saveState();
    logActivity('Watch Live', 'Settings updated');
    toast('Watch Live settings saved!', 'success');
});

function extractYouTubeEmbedUrl(url) {
    if (!url) return '';
    // Handle various YouTube URL formats
    let videoId = '';
    // youtube.com/watch?v=ID
    let m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (m) videoId = m[1];
    // youtu.be/ID
    if (!videoId) { m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/); if (m) videoId = m[1]; }
    // youtube.com/live/ID
    if (!videoId) { m = url.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/); if (m) videoId = m[1]; }
    // youtube.com/embed/ID
    if (!videoId) { m = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/); if (m) videoId = m[1]; }
    if (videoId) return 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
    return '';
}
