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

document.getElementById('yt-add-btn')?.addEventListener('click', () => {
    const input = document.getElementById('yt-channel-input');
    const val = input?.value?.trim();
    if (!val) return;
    let channelId = val;
    const m = val.match(/(?:channel\/|@)([\w-]+)/);
    if (m) channelId = m[1];
    if (STATE.youtube.channels.includes(channelId)) { toast('Channel already added.', 'error'); return; }
    STATE.youtube.channels.push(channelId);
    logActivity('YouTube', `Channel added: ${channelId}`);
    if (input) input.value = '';
    renderChannelPills();
    toast('Channel added!', 'success');
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
