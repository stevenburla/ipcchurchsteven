/* ==========================================================================
   ADMIN CONTENT — Events, Lyrics, Testimonials, Ministries, Kids, Prayer
   ========================================================================== */

// ─── HELPERS ─────────────────────────────────────────────────────────────

/**
 * Creates a reusable image uploader component with crop/rotate preview
 * @param {string} currentUrl - existing image URL
 * @param {Function} onChange - called with new base64/blob URL
 */
/**
 * Creates a reusable image uploader component with Storage integration
 * @param {string} currentUrl - existing image URL
 * @param {Function} onChange - called with {url, thumbnail}
 * @param {string} folder - Storage folder name
 */
function createImageUploader(currentUrl, onChange, folder = 'general') {
    const container = document.createElement('div');
    container.className = 'image-upload-wrapper';
    container.innerHTML = `
        <div class="image-upload-preview" id="_upl-preview">
            ${currentUrl ? `<img src="${currentUrl}" id="_upl-img" style="max-width:100%; max-height:100%">` : '<span class="upload-icon-lg">📸</span>'}
            <div class="image-upload-overlay">
                <span>Click to Upload / Change</span>
            </div>
        </div>
        <input type="file" id="_upl-file" hidden accept="image/*">
        <div class="image-upload-controls" style="display:flex; gap:0.5rem; margin-top:0.5rem">
            <button type="button" class="btn btn-outline btn-sm" id="_upl-edit" ${!currentUrl ? 'hidden' : ''}>✂ Edit/Crop</button>
            <button type="button" class="btn btn-outline btn-sm" id="_upl-library">📚 From Library</button>
            <button type="button" class="btn btn-outline btn-sm" id="_upl-clear" ${!currentUrl ? 'hidden' : ''}>🗑 Clear</button>
        </div>
        <div id="_upl-info" class="muted-note" style="margin-top:0.3rem; font-size:10px"></div>
    `;

    const fileInput = container.querySelector('#_upl-file');
    const preview = container.querySelector('#_upl-preview');
    const editBtn = container.querySelector('#_upl-edit');
    const clearBtn = container.querySelector('#_upl-clear');
    const infoEl = container.querySelector('#_upl-info');

    preview.onclick = () => fileInput.click();
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Task 6: Preview before upload
        const result = await optimizeImage(file);
        
        openModal('Confirm Upload', `
            <div style="text-align:center">
                <p>Optimization Complete:</p>
                <div style="background:#f8f9fa; padding:1rem; border-radius:8px; margin:1rem 0">
                    <img src="${result.previewUrl}" style="max-width:100%; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    <div style="margin-top:0.5rem; font-size:12px">
                        Dimensions: ${result.w} x ${result.h} <br>
                        Original: ${(file.size/1024).toFixed(1)}KB → Optimized: ${(result.fullBlob.size/1024).toFixed(1)}KB
                    </div>
                </div>
                <p class="muted-note">This image will be stored permanently in Firebase Storage.</p>
            </div>
        `, async () => {
            toast('Uploading to Storage...', 'info');
            try {
                const [url, thumb] = await Promise.all([
                    uploadToStorage(result.fullBlob, result.name, folder),
                    uploadToStorage(result.thumbBlob, 'thumb_' + result.name, folder)
                ]);
                updatePreview(url);
                onChange({ url, thumbnail: thumb });
                toast('Image Uploaded Successfully!', 'success');
                closeModal();
            } catch (err) {
                toast('Upload Failed!', 'error');
            }
        }, { confirmText: '🚀 Upload Now' });
    };

    function updatePreview(url) {
        const previewEl = container.querySelector('#_upl-preview');
        if (url) {
            previewEl.innerHTML = `<img src="${url}" id="_upl-img" style="max-width:100%; max-height:100%"><div class="image-upload-overlay"><span>Change Photo</span></div>`;
            editBtn.hidden = false;
            clearBtn.hidden = false;
        } else {
            previewEl.innerHTML = `<span class="upload-icon-lg">📸</span><div class="image-upload-overlay"><span>Upload</span></div>`;
            editBtn.hidden = true;
            clearBtn.hidden = true;
            infoEl.textContent = '';
        }
    }

    clearBtn.onclick = (e) => { e.stopPropagation(); if(confirm('Remove photo?')) { updatePreview(''); onChange({url: '', thumbnail: ''}); } };
    
    // Task 5: Enhance Crop/Edit
    editBtn.onclick = (e) => {
        e.stopPropagation();
        const img = container.querySelector('#_upl-img');
        if (img) {
            openImageEditor(img.src, async (blobs) => {
                toast('Updating storage...', 'info');
                const [url, thumb] = await Promise.all([
                    uploadToStorage(blobs.full, 'edited_' + Date.now() + '.jpg', folder),
                    uploadToStorage(blobs.thumb, 'thumb_edited_' + Date.now() + '.jpg', folder)
                ]);
                updatePreview(url);
                onChange({ url, thumbnail: thumb });
                toast('Image Updated!', 'success');
            });
        }
    };

    container.querySelector('#_upl-library').onclick = (e) => {
        e.stopPropagation();
        openMediaLibraryPicker(folder, (item) => {
            updatePreview(item.url);
            onChange({ url: item.url, thumbnail: item.thumbnail || item.url });
        });
    };

    return container;
}

/**
 * Opens a modal to select an existing image from the media library
 */
function openMediaLibraryPicker(category, onSelect) {
    const items = STATE.media.filter(m => category === 'all' || m.category === category || !m.category);
    
    openModal('📚 Select from Media Library', `
        <div class="media-picker-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:0.5rem; max-height:400px; overflow:auto; padding:0.5rem">
            ${items.map((item, i) => `
                <div class="media-picker-item" data-idx="${i}" style="cursor:pointer; border-radius:4px; overflow:hidden; border:2px solid transparent; transition:all 0.2s">
                    <img src="${item.thumbnail || item.url}" style="width:100%; height:80px; object-fit:cover">
                    <div style="font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:2px; background:rgba(0,0,0,0.05)">${item.name}</div>
                </div>
            `).join('')}
            ${items.length === 0 ? '<p class="muted-note">No images in this category. Upload some first!</p>' : ''}
        </div>
    `, () => {
        const selected = document.querySelector('.media-picker-item.selected');
        if (selected) {
            const idx = parseInt(selected.dataset.idx);
            onSelect(items[idx]);
            closeModal();
        } else {
            toast('Please select an image', 'warning');
        }
    }, { confirmText: 'Select Image' });

    document.querySelectorAll('.media-picker-item').forEach(el => {
        el.onclick = () => {
            document.querySelectorAll('.media-picker-item').forEach(i => i.classList.remove('selected', 'active-border'));
            el.classList.add('selected');
            el.style.borderColor = 'var(--accent)';
        };
    });
}

/**
 * Image Editor Modal (Rotate/Base Op)
 */
/**
 * Enhanced Image Editor Modal with basic Cropping/Rotating
 */
function openImageEditor(url, onSave) {
    let rotation = 0;
    let crop = null; // {x, y, w, h}
    
    openModal('🖼 Edit & Optimize Image', `
        <div class="editor-toolbar" style="margin-bottom:1rem; display:flex; gap:0.5rem; flex-wrap:wrap">
            <button class="btn btn-sm" id="_edit-rot-l">↺ Rotate</button>
            <button class="btn btn-sm" id="_edit-center">🎯 Center Crop</button>
            <div style="flex:1"></div>
            <span class="muted-note" id="_edit-info">Optimizing for storage...</span>
        </div>
        <div style="display:flex; justify-content:center; background:#111; padding:1rem; border-radius:8px; overflow:auto; max-height:400px">
            <canvas id="image-editor-canvas"></canvas>
        </div>
        <p class="field-hint" style="margin-top:1rem;text-align:center">Final Resolution: <span id="_edit-size-info"></span></p>
    `, async () => {
        const canvas = document.getElementById('image-editor-canvas');
        if (canvas) {
            // Generate both full and thumb
            const full = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.8));
            
            // Create thumb canvas
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 300; thumbCanvas.height = Math.round(300 * canvas.height / canvas.width);
            thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const thumb = await new Promise(res => thumbCanvas.toBlob(res, 'image/jpeg', 0.6));
            
            onSave({ full, thumb });
            closeModal();
        }
    }, { confirmText: '✅ Save to Cloud' });

    const canvas = document.getElementById('image-editor-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => renderCanvas();

    function renderCanvas() {
        let w = img.width, h = img.height;
        if (rotation % 180 !== 0) { const t = w; w = h; h = t; }
        
        // Simple limit for editor preview
        const limit = 800;
        if (w > limit) { h = Math.round(h * limit / w); w = limit; }
        
        canvas.width = w; canvas.height = h;
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Draw image scaled to canvas
        const drawW = (rotation % 180 === 0) ? w : h;
        const drawH = (rotation % 180 === 0) ? h : w;
        ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
        ctx.restore();
        
        document.getElementById('_edit-size-info').textContent = `${canvas.width} x ${canvas.height}`;
    }

    document.getElementById('_edit-rot-l').onclick = () => { rotation = (rotation + 90) % 360; renderCanvas(); };
    document.getElementById('_edit-center').onclick = () => {
        // Simple square center crop simulation
        const size = Math.min(canvas.width, canvas.height);
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        const data = ctx.getImageData(x, y, size, size);
        canvas.width = size; canvas.height = size;
        ctx.putImageData(data, 0, 0);
        document.getElementById('_edit-size-info').textContent = `${size} x ${size} (Cropped)`;
    };
}

// ─── MEDIA LIBRARY ────────────────────────────────────────────────────────────
function renderMedia(filter = 'all') {
    const grid = document.getElementById('media-grid');
    if (!grid) return;
    const items = filter === 'all' ? STATE.media : STATE.media.filter(m => m.category === filter);
    if (!items.length) { grid.innerHTML = '<p class="muted-note" style="padding:1rem">No media uploaded yet.</p>'; return; }
    grid.innerHTML = '';
    items.forEach((item) => {
        const trueIdx = STATE.media.indexOf(item);
        const card = document.createElement('div');
        card.className = 'media-card'; card.dataset.idx = trueIdx;
        card.innerHTML = `
            <img src="${item.url}" alt="${item.name}" loading="lazy">
            <div class="media-card-actions">
                <button class="media-action" data-action="edit" title="Edit">✏</button>
                <button class="media-action" data-action="preview" title="Preview">🔍</button>
                <button class="media-action" data-action="delete" title="Delete">🗑</button>
            </div>
            <span class="media-category-badge">${item.category || 'general'}</span>
            <div class="media-card-body">
                <div class="media-card-name">${item.name}</div>
                <div class="media-card-meta">${(item.size / 1024).toFixed(0)}KB · ${item.w}×${item.h}</div>
            </div>`;
        card.querySelector('[data-action="preview"]').onclick = () => previewImage(item.url);
        card.querySelector('[data-action="edit"]').onclick = () => openImageEditor(item.url, async (blobs) => {
            toast('Updating media...', 'info');
            const [url, thumb] = await Promise.all([
                uploadToStorage(blobs.full, item.name, 'media'),
                uploadToStorage(blobs.thumb, 'thumb_' + item.name, 'media')
            ]);
            item.url = url;
            item.thumbnail = thumb;
            saveState();
            renderMedia(filter);
        });
        card.querySelector('[data-action="delete"]').onclick = () => {
            if (confirm(`Delete "${item.name}"?`)) {
                STATE.media.splice(trueIdx, 1);
                logActivity('Media', `Deleted "${item.name}"`);
                renderMedia(filter);
            }
        };
        grid.appendChild(card);
    });
}

document.getElementById('media-category-filter')?.addEventListener('change', function () {
    renderMedia(this.value);
});

document.getElementById('media-file-input')?.addEventListener('change', async function () {
    await processFileUploads(this.files, STATE.media, 'general');
    renderMedia(document.getElementById('media-category-filter')?.value || 'all');
});

// ─── HERO ─────────────────────────────────────────────────────────────────────
function renderHero() {
    // 1. Text settings are also editable in text editor tab, but we sync them here too
    const h = STATE.textContent;
    const textInputs = ['hero_title', 'hero_subtitle', 'hero_btn', 'hero_btn_link'];
    textInputs.forEach(id => {
        const el = document.getElementById('tc-' + id);
        if (el) el.value = h[id] || '';
    });

    // 2. Render image slider grid
    const grid = document.getElementById('hero-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!STATE.hero.length) { 
        grid.innerHTML = '<p class="muted-note" style="padding:1rem">No hero images uploaded yet.</p>'; 
        return; 
    }
    
    STATE.hero.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.innerHTML = `
            <span class="media-card-badge">H${i+1}</span>
            <img src="${item.url}" alt="${item.name}">
            <div class="media-card-actions">
                <button class="media-action" data-preview>🔍</button>
                <button class="media-action" data-del>🗑</button>
            </div>
            <div class="media-card-body">
                <div class="media-card-name">${truncate(item.name, 20)}</div>
            </div>`;
        card.querySelector('[data-preview]').onclick = () => previewImage(item.url);
        card.querySelector('[data-del]').onclick = () => {
            if(confirm('Remove this hero image?')) {
                STATE.hero.splice(i, 1);
                logActivity('Hero', `Removed image "${item.name}"`);
                saveState();
                renderHero();
            }
        };
        grid.appendChild(card);
    });
}

document.getElementById('hero-file-input')?.addEventListener('change', async function () {
    await processFileUploads(this.files, STATE.hero, 'hero');
    renderHero();
});

// ─── PASTORS ──────────────────────────────────────────────────────────────────
function renderPastors() {
    const ul = document.getElementById('pastors-list');
    if (!ul) return;
    ul.innerHTML = '';
    const items = STATE.pastors || [];
    if (!items.length) { ul.innerHTML = '<li class="muted-note" style="padding:.75rem">No pastors added yet.</li>'; return; }
    
    items.forEach(p => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            ${p.photo ? `<img class="item-thumb" src="${p.photo}" alt="">` : `<div class="item-thumb-placeholder">👔</div>`}
            <div class="item-info">
                <strong>${p.name}</strong>
                <span>${p.role}</span>
            </div>
            <div class="item-meta">
                <button class="action-btn action-edit" data-edit="${p.id}">✏ Edit</button>
                <button class="action-btn action-del" data-del="${p.id}">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openPastorModal(p.id);
        li.querySelector('.action-del').onclick = () => {
            if (confirm(`Delete pastor "${p.name}"?`)) {
                STATE.pastors = STATE.pastors.filter(item => item.id !== p.id);
                saveState(); renderPastors();
            }
        };
        ul.appendChild(li);
    });
}

// Missing handler - wire up "Add Event" button (was not wired before)
document.getElementById('add-event-btn')?.addEventListener('click', () => openEventModal());

// Event filter / search re-render
document.getElementById('event-status-filter')?.addEventListener('change', renderEvents);
document.getElementById('event-search')?.addEventListener('input', renderEvents);

document.getElementById('add-pastor-btn')?.addEventListener('click', () => {
    openPastorModal();
});

function openPastorModal(id = null) {
    const p = id ? STATE.pastors.find(item => item.id === id) : null;
    let photoUrl = p?.photo || '';
    openModal(id ? '✏ Edit Pastor' : '+ Add Pastor', `
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="_p-name" value="${p?.name || ''}"></div>
        <div class="form-group"><label class="form-label">Role / Title</label><input class="form-control" id="_p-role" value="${p?.role || ''}"></div>
        <div class="form-group span-2"><label class="form-label">Pastor Photo</label><div id="_p-photo-container"></div></div>
    `, () => {
        const data = {
            name: document.getElementById('_p-name').value.trim(),
            role: document.getElementById('_p-role').value.trim(),
            photo: photoUrl,
            status: 'published'
        };
        if (!data.name) return;
        if (id) { Object.assign(STATE.pastors.find(item => item.id === id), data); }
        else { STATE.pastors.push({ id: genId(), ...data }); }
        saveState(); closeModal(); renderPastors();
    });
    document.getElementById('_p-photo-container').appendChild(createImageUploader(photoUrl, (res) => { 
        photoUrl = res.url;
        // Optionally store res.thumbnail
    }, 'pastors'));
}

// ─── GALLERY ALBUMS ───────────────────────────────────────────────────────────
let currentEditingAlbumId = null;

function renderGallery() {
    const albumList = document.getElementById('album-list');
    if (!albumList) return;
    
    // Hide detail view when entering gallery tab
    document.getElementById('album-detail-view').style.display = 'none';
    albumList.parentElement.style.display = 'block';

    albumList.innerHTML = '';
    const albums = STATE.galleryAlbums || [];
    
    if (albums.length === 0) {
        albumList.innerHTML = '<p class="muted-note" style="padding:1rem; grid-column: 1/-1;">No albums created yet.</p>';
        return;
    }

    albums.forEach(album => {
        const card = document.createElement('div');
        card.className = 'album-card';
        const coverImg = album.photos && album.photos.length > 0 ? album.photos[0].url : '';
        
        card.innerHTML = `
            <div class="album-card-preview">
                ${coverImg ? `<img src="${coverImg}" alt="${album.title}">` : '<span class="placeholder-icon">📁</span>'}
                <span class="album-card-badge">${album.photos ? album.photos.length : 0} Photos</span>
            </div>
            <div class="album-card-info">
                <div class="album-card-title">${album.title}</div>
                <div class="album-card-meta">
                    <span>${album.collageStyle || 'Grid'} Layout</span>
                    ${album.eventId ? '<span style="color:var(--accent)">• Linked to Event</span>' : ''}
                </div>
            </div>
        `;
        card.onclick = () => openAlbumDetail(album.id);
        albumList.appendChild(card);
    });
}

function openAlbumDetail(id) {
    const albums = STATE.galleryAlbums || [];
    currentEditingAlbumId = id;
    const album = albums.find(a => a.id === id);
    if (!album) return;
    if (!album.photos) album.photos = [];

    // UI Toggle
    document.getElementById('album-list').parentElement.style.display = 'none';
    document.getElementById('album-detail-view').style.display = 'block';

    // Populate Fields
    document.getElementById('current-album-title').textContent = album.title;
    document.getElementById('album-title-edit').value = album.title;
    document.getElementById('album-style-edit').value = album.collageStyle || 'grid';
    
    // Populate Event Dropdown
    const eventSelect = document.getElementById('album-event-link');
    eventSelect.innerHTML = '<option value="">None</option>';
    STATE.events.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.title;
        if (album.eventId == ev.id) opt.selected = true;
        eventSelect.appendChild(opt);
    });

    renderAlbumPhotos(album);
}

function renderAlbumPhotos(album) {
    const grid = document.getElementById('album-photos-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (!album.photos || album.photos.length === 0) {
        grid.innerHTML = '<p class="muted-note" style="padding: 1rem;">No photos in this album yet.</p>';
        return;
    }

    album.photos.forEach((photo, i) => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.innerHTML = `
            <img src="${photo.url}" alt="${photo.name}">
            <div class="media-card-actions">
                <button class="media-action" onclick="previewImage('${photo.url}')">🔍</button>
                <button class="media-action" onclick="removePhotoFromAlbum(${i})">🗑</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function closeAlbumDetail() {
    renderGallery();
}

async function removePhotoFromAlbum(index) {
    const albums = STATE.galleryAlbums || [];
    const album = albums.find(a => a.id === currentEditingAlbumId);
    if (!album) return;
    
    if (confirm('Are you sure you want to delete this photo?')) {
        album.photos.splice(index, 1);
        saveState(); // Save the change!
        renderAlbumPhotos(album);
        toast('Photo removed', 'info');
    }
}

// Listeners for Album management
document.getElementById('add-album-btn')?.addEventListener('click', () => {
    const newAlbum = {
        id: genId(),
        title: 'New Album ' + ((STATE.galleryAlbums?.length || 0) + 1),
        eventId: null,
        collageStyle: 'grid',
        photos: []
    };
    if (!STATE.galleryAlbums) STATE.galleryAlbums = [];
    STATE.galleryAlbums.push(newAlbum);
    saveState();
    openAlbumDetail(newAlbum.id);
});

document.getElementById('save-album-btn')?.addEventListener('click', () => {
    const albums = STATE.galleryAlbums || [];
    const album = albums.find(a => a.id === currentEditingAlbumId);
    if (!album) return;

    album.title = document.getElementById('album-title-edit').value.trim() || 'Untitled Album';
    album.collageStyle = document.getElementById('album-style-edit').value;
    album.eventId = document.getElementById('album-event-link').value || null;

    saveState();
    toast('Album changes saved!', 'success');
    closeAlbumDetail();
});

document.getElementById('delete-album-btn')?.addEventListener('click', () => {
    if (confirm('Are you SURE you want to delete this entire album? This cannot be undone.')) {
        STATE.galleryAlbums = STATE.galleryAlbums.filter(a => a.id !== currentEditingAlbumId);
        saveState();
        closeAlbumDetail();
    }
});

document.getElementById('album-photo-input')?.addEventListener('change', async function() {
    const albums = STATE.galleryAlbums || [];
    const album = albums.find(a => a.id === currentEditingAlbumId);
    if (!album) return;
    
    await processFileUploads(this.files, album.photos, 'gallery');
    renderAlbumPhotos(album);
});



// ─── EVENTS ───────────────────────────────────────────────────────────────────
function renderEvents() {
    const ul = document.getElementById('events-list');
    if (!ul) return;
    const filter = document.getElementById('event-status-filter')?.value || 'all';
    const search = (document.getElementById('event-search')?.value || '').toLowerCase();
    let items = STATE.events.filter(e =>
        (filter === 'all' || e.status === filter) &&
        (!search || e.title.toLowerCase().includes(search) || e.desc?.toLowerCase().includes(search))
    );
    ul.innerHTML = '';
    if (!items.length) { ul.innerHTML = '<li class="muted-note" style="padding:.75rem">No events found.</li>'; return; }
    items.forEach(ev => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            ${ev.thumb ? `<img class="item-thumb" src="${ev.thumb}" alt="">` : `<div class="item-thumb-placeholder">📅</div>`}
            <div class="item-info">
                <strong>${ev.title}</strong>
                <span>${fmtDate(ev.date)}${ev.desc ? ' — ' + truncate(ev.desc, 50) : ''}</span>
            </div>
            <div class="item-meta">
                <span class="pill pill-${ev.status}">${ev.status}</span>
                <button class="action-btn action-edit" data-edit="${ev.id}">✏ Edit</button>
                <button class="action-btn action-del" data-del="${ev.id}">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openEventModal(ev.id);
        li.querySelector('.action-del').onclick = () => {
            if (confirm(`Delete "${ev.title}"?`)) {
                STATE.events = STATE.events.filter(e => e.id !== ev.id);
                logActivity('Events', `Deleted "${ev.title}"`);
                renderEvents();
            }
        };
        ul.appendChild(li);
    });
}

function openEventModal(id = null) {
    const ev = id ? STATE.events.find(e => e.id === id) : null;
    let thumbUrl = ev?.thumb || '';
    
    openModal(id ? '✏ Edit Event' : '+ Add Event', `
        <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="_ev-title" value="${ev?.title || ''}"></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" type="date" id="_ev-date" value="${ev?.date || ''}"></div>
        <div class="form-group span-2"><label class="form-label">Description</label><textarea class="form-control textarea" id="_ev-desc">${ev?.desc || ''}</textarea></div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="_ev-status">
                ${['published', 'draft', 'scheduled', 'archived'].map(s => `<option value="${s}" ${ev?.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group"><label class="form-label">Event Thumbnail</label>
            <div id="_ev-thumb-container"></div>
        </div>
    `, () => {
        const data = {
            title: document.getElementById('_ev-title').value.trim(),
            date: document.getElementById('_ev-date').value,
            desc: document.getElementById('_ev-desc').value.trim(),
            status: document.getElementById('_ev-status').value,
            thumb: thumbUrl
        };
        if (!data.title) { toast('Please enter a title.', 'error'); return; }
        if (id) { Object.assign(STATE.events.find(e => e.id === id), data); logActivity('Events', `Updated "${data.title}"`); }
        else { STATE.events.unshift({ id: genId(), ...data }); logActivity('Events', `Added "${data.title}"`); }
        closeModal(); renderEvents();
        toast(`Event "${data.title}" saved!`, 'success');
    });

    const thumbContainer = document.getElementById('_ev-thumb-container');
    thumbContainer.appendChild(createImageUploader(thumbUrl, (res) => { 
        thumbUrl = res.url; 
        // We can also store res.thumbnail if we add a thumb field to events
        toast('Thumbnail updated', 'info');
    }, 'events'));
}

// ─── LYRICS ───────────────────────────────────────────────────────────────────
function renderLyrics() {
    const ul = document.getElementById('lyrics-list');
    if (!ul) return;
    const cat = document.getElementById('lyrics-cat')?.value || 'song';
    const search = (document.getElementById('lyrics-search')?.value || '').toLowerCase();
    const items = (STATE.lyrics[cat] || []).filter(l => !search || l.title_en?.toLowerCase().includes(search) || l.title_te?.toLowerCase().includes(search));
    ul.innerHTML = '';
    if (!items.length) { ul.innerHTML = '<li class="muted-note" style="padding:.75rem">No songs found.</li>'; return; }
    items.forEach(lyric => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            <div class="item-thumb-placeholder">🎵</div>
            <div class="item-info">
                <strong>${lyric.title_en || lyric.title_te}</strong>
                <span>${lyric.artist_en || ''}</span>
            </div>
            <div class="item-meta">
                <span class="pill pill-${lyric.status || 'published'}">${lyric.status || 'published'}</span>
                <button class="action-btn action-edit" data-edit="${lyric.id}">✏ Edit</button>
                <button class="action-btn action-del" data-del="${lyric.id}">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openLyricModal(lyric.id, cat);
        li.querySelector('.action-del').onclick = () => {
            if (confirm(`Delete "${lyric.title_en}"?`)) {
                STATE.lyrics[cat] = STATE.lyrics[cat].filter(l => l.id !== lyric.id);
                logActivity('Lyrics', `Deleted "${lyric.title_en}"`);
                renderLyrics();
            }
        };
        ul.appendChild(li);
    });
}

document.getElementById('lyrics-cat')?.addEventListener('change', renderLyrics);
document.getElementById('lyrics-search')?.addEventListener('input', renderLyrics);

document.getElementById('add-lyric-btn')?.addEventListener('click', () => {
    const cat = document.getElementById('lyrics-cat')?.value || 'song';
    openLyricModal(null, cat);
});

function openLyricModal(id = null, cat) {
    const l = id && STATE.lyrics[cat] ? STATE.lyrics[cat].find(ly => ly.id === id) : null;
    openModal(id ? '✏ Edit Song' : '+ Add Song', `
        <div class="bilingual-group">
            <div>
                <label class="lang-label">English Title</label>
                <input class="form-control" id="_ly-title-en" value="${l?.title_en || ''}">
            </div>
            <div>
                <label class="lang-label">Telugu Title</label>
                <input class="form-control" id="_ly-title-te" value="${l?.title_te || ''}">
            </div>
        </div>
        <div class="bilingual-group">
            <div>
                <label class="lang-label">English Artist</label>
                <input class="form-control" id="_ly-artist-en" value="${l?.artist_en || ''}">
            </div>
            <div>
                <label class="lang-label">Telugu Artist</label>
                <input class="form-control" id="_ly-artist-te" value="${l?.artist_te || ''}">
            </div>
        </div>
        <div class="bilingual-group">
            <div>
                <label class="lang-label">English Lyrics</label>
                <textarea class="form-control" id="_ly-text-en" rows="8">${l?.text_en || ''}</textarea>
            </div>
            <div>
                <label class="lang-label">Telugu Lyrics</label>
                <textarea class="form-control" id="_ly-text-te" rows="8">${l?.text_te || ''}</textarea>
            </div>
        </div>
        <div class="form-group span-2">
            <label class="form-label">Audio URL (YouTube/MP3)</label>
            <input class="form-control" id="_ly-audio" value="${l?.audioUrl || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="_ly-status">
                <option value="published" ${l?.status === 'published' ? 'selected' : ''}>Published</option>
                <option value="draft" ${l?.status === 'draft' ? 'selected' : ''}>Draft</option>
            </select>
        </div>
    `, () => {
        const data = {
            title_en: document.getElementById('_ly-title-en').value.trim(),
            title_te: document.getElementById('_ly-title-te').value.trim(),
            artist_en: document.getElementById('_ly-artist-en').value.trim(),
            artist_te: document.getElementById('_ly-artist-te').value.trim(),
            text_en: document.getElementById('_ly-text-en').value.trim(),
            text_te: document.getElementById('_ly-text-te').value.trim(),
            audioUrl: document.getElementById('_ly-audio').value.trim(),
            status: document.getElementById('_ly-status').value
        };
        if (!data.title_en && !data.title_te) { toast('Please enter a title.', 'error'); return; }
        if (!STATE.lyrics[cat]) STATE.lyrics[cat] = [];
        if (id) { Object.assign(STATE.lyrics[cat].find(ly => ly.id === id), data); }
        else { STATE.lyrics[cat].unshift({ id: genId(), ...data }); }
        saveState(); closeModal(); renderLyrics();
    });
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function renderTestimonials() {
    const ul = document.getElementById('testimonials-list');
    if (!ul) return;
    const cat = document.getElementById('testimonial-cat')?.value || 'youth';
    const search = (document.getElementById('testimonial-search')?.value || '').toLowerCase();
    const items = (STATE.testimonials[cat] || []).filter(t => !search || t.name.toLowerCase().includes(search));
    ul.innerHTML = '';
    if (!items.length) { ul.innerHTML = '<li class="muted-note" style="padding:.75rem">No testimonials yet.</li>'; return; }
    items.forEach(t => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            ${t.photo ? `<img class="item-thumb" src="${t.photo}" alt="">` : `<div class="item-thumb-placeholder">👤</div>`}
            <div class="item-info">
                <strong>${t.name}</strong>
                <span>${truncate(t.text, 60)}</span>
            </div>
            <div class="item-meta">
                <button class="action-btn action-edit" data-edit="${t.id}">✏ Edit</button>
                <button class="action-btn action-del" data-del="${t.id}">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openTestimonialModal(t.id, cat);
        li.querySelector('.action-del').onclick = () => {
            if (confirm(`Delete testimonial from "${t.name}"?`)) {
                STATE.testimonials[cat] = STATE.testimonials[cat].filter(item => item.id !== t.id);
                renderTestimonials();
            }
        };
        ul.appendChild(li);
    });
}

document.getElementById('testimonial-cat')?.addEventListener('change', renderTestimonials);
document.getElementById('testimonial-search')?.addEventListener('input', renderTestimonials);

document.getElementById('add-testimonial-btn')?.addEventListener('click', () => {
    const cat = document.getElementById('testimonial-cat')?.value || 'youth';
    openTestimonialModal(null, cat);
});

function openTestimonialModal(id = null, cat) {
    const t = id ? STATE.testimonials[cat].find(item => item.id === id) : null;
    let photoUrl = t?.photo || '';
    openModal(id ? '✏ Edit Testimonial' : '+ Add Testimonial', `
        <div class="bilingual-group">
            <div>
                <label class="lang-label">Name (English)</label>
                <input class="form-control" id="_t-name" value="${t?.name || ''}">
            </div>
            <div>
                <label class="lang-label">పేరు (Telugu)</label>
                <input class="form-control" id="_t-name-te" value="${t?.name_te || ''}">
            </div>
        </div>
        <div class="bilingual-group" style="margin-top:1rem">
            <div>
                <label class="lang-label">Testimony (English)</label>
                <textarea class="form-control" id="_t-text" rows="5">${t?.text || ''}</textarea>
            </div>
            <div>
                <label class="lang-label">సాక్ష్యం (Telugu)</label>
                <textarea class="form-control" id="_t-text-te" rows="5">${t?.text_te || ''}</textarea>
            </div>
        </div>
        <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Photo</label>
            <div id="_t-photo-container"></div>
        </div>
    `, () => {
        const data = {
            name: document.getElementById('_t-name').value.trim(),
            name_te: document.getElementById('_t-name-te').value.trim(),
            text: document.getElementById('_t-text').value.trim(),
            text_te: document.getElementById('_t-text-te').value.trim(),
            photo: photoUrl
        };
        if (!data.name && !data.name_te) return;
        if (!STATE.testimonials[cat]) STATE.testimonials[cat] = [];
        if (id) { Object.assign(STATE.testimonials[cat].find(item => item.id === id), data); }
        else { STATE.testimonials[cat].unshift({ id: genId(), ...data }); }
        saveState(); closeModal(); renderTestimonials();
    });
    document.getElementById('_t-photo-container').appendChild(createImageUploader(photoUrl, (res) => { 
        photoUrl = res.url;
        // Optionally store res.thumbnail if needed
    }, 'testimonials'));
}

// ─── MINISTRIES ───────────────────────────────────────────────────────────────
function renderMinistries() {
    const ul = document.getElementById('ministries-list');
    if (!ul) return;
    ul.innerHTML = '';
    if (!STATE.ministries.length) { ul.innerHTML = '<li class="muted-note">No ministries added.</li>'; return; }
    STATE.ministries.forEach(m => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            ${m.img ? `<img class="item-thumb" src="${m.img}" alt="">` : `<div class="item-thumb-placeholder">⛪</div>`}
            <div class="item-info"><strong>${m.name}</strong><span>${truncate(m.desc, 50)}</span></div>
            <div class="item-meta">
                <button class="action-btn action-edit" data-edit="${m.id}">✏ Edit</button>
                <button class="action-btn action-del" data-del="${m.id}">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openMinistryModal(m.id);
        li.querySelector('.action-del').onclick = () => {
            if (confirm(`Delete ministry "${m.name}"?`)) {
                STATE.ministries = STATE.ministries.filter(item => item.id !== m.id);
                renderMinistries();
            }
        };
        ul.appendChild(li);
    });
}

document.getElementById('add-ministry-btn')?.addEventListener('click', () => {
    openMinistryModal();
});

function openMinistryModal(id = null) {
    const m = id ? STATE.ministries.find(item => item.id === id) : null;
    let imgUrl = m?.img || '';
    openModal(id ? '✏ Edit Ministry' : '+ Add Ministry', `
        <div class="form-group"><label class="form-label">Ministry Name</label><input class="form-control" id="_m-name" value="${m?.name || ''}"></div>
        <div class="form-group span-2"><label class="form-label">Description</label><textarea class="form-control" id="_m-desc" rows="4">${m?.desc || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Ministry Image</label><div id="_m-img-container"></div></div>
    `, () => {
        const data = {
            name: document.getElementById('_m-name').value.trim(),
            desc: document.getElementById('_m-desc').value.trim(),
            img: imgUrl
        };
        if (!data.name) return;
        if (id) { Object.assign(STATE.ministries.find(item => item.id === id), data); }
        else { STATE.ministries.push({ id: genId(), ...data }); }
        saveState(); closeModal(); renderMinistries();
    });
    document.getElementById('_m-img-container').appendChild(createImageUploader(imgUrl, (res) => { 
        imgUrl = res.url; 
    }, 'ministries'));
}

// ─── KIDS PROGRAMS ────────────────────────────────────────────────────────────
function renderKids() {
    const ul = document.getElementById('kids-list');
    if (!ul) return;
    ul.innerHTML = '';
    STATE.kids.programs.forEach(p => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <span class="drag-handle">⠿</span>
            <div class="item-info"><strong>${p.name}</strong><span>${truncate(p.desc, 50)}</span></div>
            <div class="item-meta">
                <button class="action-btn action-edit">✏ Edit</button>
                <button class="action-btn action-del">🗑</button>
            </div>
        </li>`;
        li.querySelector('.action-edit').onclick = () => openKidsModal(p.id);
        ul.appendChild(li);
    });
}

document.getElementById('add-kids-btn')?.addEventListener('click', () => {
    openKidsModal();
});

function openKidsModal(id = null) {
    const p = id ? STATE.kids.programs.find(item => item.id === id) : null;
    openModal(id ? '✏ Edit Program' : '+ Add Program', `
        <div class="form-group"><label class="form-label">Program Name</label><input class="form-control" id="_kp-name" value="${p?.name || ''}"></div>
        <div class="form-group span-2"><label class="form-label">Description</label><textarea class="form-control" id="_kp-desc" rows="4">${p?.desc || ''}</textarea></div>
    `, () => {
        const data = { name: document.getElementById('_kp-name').value.trim(), desc: document.getElementById('_kp-desc').value.trim() };
        if (id) { Object.assign(STATE.kids.programs.find(item => item.id === id), data); }
        else { STATE.kids.programs.push({ id: genId(), ...data }); }
        saveState(); closeModal(); renderKids();
    });
}

// ─── PRAYER REQUESTS ──────────────────────────────────────────────────────────
function renderPrayer() {
    const ul = document.getElementById('prayer-list');
    if (!ul) return;
    const filter = document.getElementById('prayer-status-filter').value;
    const items = STATE.prayerRequests.filter(r => r.status === filter);
    ul.innerHTML = '';
    if (!items.length) { ul.innerHTML = '<li class="muted-note">No prayer requests in this category.</li>'; return; }
    items.forEach(r => {
        const li = document.createElement('li');
        li.className = 'item-row';
        li.innerHTML = `
            <div class="item-info">
                <strong>${r.name} (${r.phone})</strong>
                <span>${r.text}</span>
                <small>${fmtDate(r.date)}</small>
            </div>
            <div class="item-meta">
                ${r.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="updatePrayerStatus('${r.id}', 'prayed')">Mark Prayed</button>` : ''}
                <button class="action-btn action-del" onclick="updatePrayerStatus('${r.id}', 'archived')">🗑</button>
            </div>
        </li>`;
        ul.appendChild(li);
    });
}

document.getElementById('prayer-status-filter')?.addEventListener('change', renderPrayer);

function updatePrayerStatus(id, status) {
    const r = STATE.prayerRequests.find(item => item.id === id);
    if (r) { 
        r.status = status; 
        logActivity('Prayer', `Marked request from ${r.name} as ${status}`);
        saveState(); 
        renderPrayer(); 
    }
}

// ─── KIDS GALLERY ─────────────────────────────────────────────────────────────
function renderKidsGallery() {
    const grid = document.getElementById('kids-gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!STATE.kids.gallery.length) { grid.innerHTML = '<p class="muted-note">No kids photos yet.</p>'; return; }
    STATE.kids.gallery.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.innerHTML = `
            <img src="${item.url}" alt="${item.name}">
            <div class="media-card-actions">
                <button class="media-action" onclick="previewImage('${item.url}')">🔍</button>
                <button class="media-action" onclick="removeKidsGallery(${i})">🗑</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function removeKidsGallery(idx) {
    STATE.kids.gallery.splice(idx, 1);
    saveState(); renderKidsGallery();
}

document.getElementById('kids-gallery-input')?.addEventListener('change', async function () {
    await processFileUploads(this.files, STATE.kids.gallery, 'kids');
    renderKidsGallery();
});

// ─── TEXT EDITOR ──────────────────────────────────────────────────────────────
function renderTextEditor() {
    // Populate any input with id "tc-{key}" from STATE.textContent[key].
    // DOM-driven so newly-added fields work without code changes.
    document.querySelectorAll('input[id^="tc-"], textarea[id^="tc-"]').forEach(el => {
        const raw = el.id.replace(/^tc-/, '');
        const key = raw.replace(/-te$/, '_te');
        if (STATE.textContent[key] !== undefined) {
            el.value = STATE.textContent[key] || '';
        }
    });

    // Logo image uploader
    const logoImgContainer = document.getElementById('tc-logo-img-uploader');
    if (logoImgContainer) {
        logoImgContainer.innerHTML = '';
        logoImgContainer.appendChild(createImageUploader(STATE.textContent.logo_url, (res) => {
            STATE.textContent.logo_url = res.url;
            saveState();
        }, 'site'));
    }

    const aboutImgContainer = document.getElementById('tc-about-img-uploader');
    if (aboutImgContainer) {
        aboutImgContainer.innerHTML = '';
        aboutImgContainer.appendChild(createImageUploader(STATE.textContent.about_img, (res) => {
            STATE.textContent.about_img = res.url;
            saveState();
        }, 'site'));
    }

    const ssImgContainer = document.getElementById('tc-ss-img-uploader');
    if (ssImgContainer) {
        ssImgContainer.innerHTML = '';
        ssImgContainer.appendChild(createImageUploader(STATE.textContent.ss_img, (res) => {
            STATE.textContent.ss_img = res.url;
            saveState();
        }, 'site'));
    }
}

document.getElementById('tc-save-btn')?.addEventListener('click', () => {
    // Collect all inputs with tc- prefix
    const allInputs = document.querySelectorAll('[id^="tc-"]');
    allInputs.forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const key = el.id.replace('tc-', '');
            const val = el.value.trim();
            // Map key like hero_title-te to hero_title_te
            const finalKey = key.replace('-te', '_te');
            STATE.textContent[finalKey] = val;
        }
    });
    saveState();
    logActivity('Text Editor', 'Website text content updated');
    toast('All text changes saved!', 'success');
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────
function renderLogs() {
    const activityList = document.getElementById('activity-log-list');
    const errorList = document.getElementById('error-log-list');
    
    // Render Activity
    if (activityList) {
        const logs = STATE.activityLog || [];
        activityList.innerHTML = logs.length ? '' : '<li class="muted-note">No activity yet.</li>';
        logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML = `<span class="activity-time">${fmtTime(log.time)}</span> <span class="activity-tag ${log.type.toLowerCase()}">${log.type}</span> ${log.desc}`;
            activityList.appendChild(li);
        });
    }

    // Render Errors (Task 11)
    if (errorList) {
        const errors = STATE.logs || [];
        errorList.innerHTML = errors.length ? '' : '<li class="muted-note">No errors logged. All good!</li>';
        errors.forEach(err => {
            const li = document.createElement('li');
            li.className = 'activity-item error';
            li.innerHTML = `<span class="activity-time">${fmtTime(err.time)}</span> <strong>[${err.context}]</strong> ${err.message}`;
            errorList.appendChild(li);
        });
    }
}

function fmtTime(iso) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
