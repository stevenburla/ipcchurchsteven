/**
 * cms-bridge.js
 * Reads CMS data from Firebase Cloud (Realtime Database) with localStorage fallback.
 */

(function () {
    'use strict';

    const CMS_KEY = 'churchCMS_v2';
    const PUBLIC_KEY = 'churchCMS_public';

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
    let db = null;
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }

    // ── Load CMS data ──────────────────────────────────────────────────────────
    function getCMS() {
        try {
            const pub = localStorage.getItem(PUBLIC_KEY);
            if (pub) return JSON.parse(pub);
            const full = localStorage.getItem(CMS_KEY);
            if (full) return JSON.parse(full);
        } catch (e) { }
        return null;
    }

    function getFullCMS() {
        try {
            const raw = localStorage.getItem(CMS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    // ── Escape HTML to prevent XSS ─────────────────────────────────────────────
    function esc(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }

    // ── Shared Helper to show/hide sections based on content ───────────────────
    function setVisibility(id, hasContent) {
        const el = document.getElementById(id);
        if (!el) return;
        if (hasContent) {
            el.style.display = '';
            el.classList.remove('hidden-cms');
            // Ensure .fade-in works correctly
            if (el.classList.contains('fade-in')) {
                el.classList.add('visible'); // Force visible if observer fails
            }
        } else {
            el.style.display = 'none';
            el.classList.add('hidden-cms');
            el.classList.remove('visible');
        }
    }

    // ── Main entry ─────────────────────────────────────────────────────────────
    window.refreshCMSContent = () => applyAllCMSData();
    function applyAllCMSData(remoteData = null) {
        const localCms = getCMS();
        const localFull = getFullCMS();
        
        const data = remoteData || localFull || localCms;
        if (!data) return;

        // Apply shared sections visibility first
        if (data.sections) {
            Object.entries(data.sections).forEach(([id, cfg]) => {
                setVisibility(id, cfg.visible !== false);
            });
        }

        applyHeroSection(data);
        applyGallerySection(data);
        applySupportSection(data);
        applyTestimonials(data);
        applyYouTubeConfig(data);
        applySiteInfo(data);
        applyTextContent(data);
        applyEventsSection(data);
        applyPastorsSection(data);
        applySectionOrder(data);
        
        // Extended sections
        applyLyrics(data);
        applyKidsPrograms(data);
        applyKidsGallery(data);

        // Sidebar Cleanup: Hide sidebar if truly empty (Premium finish)
        const sidebar = document.querySelector('aside.sidebar');
        if (sidebar) {
            const widgets = sidebar.querySelectorAll('.sidebar-widget');
            let hasVisible = false;
            widgets.forEach(w => {
                if (getComputedStyle(w).display !== 'none' && !w.hasAttribute('hidden')) {
                    hasVisible = true;
                }
            });
            if (!hasVisible) {
                sidebar.style.display = 'none';
                const main = document.querySelector('.main-content');
                if (main) main.style.flex = '0 0 100%';
            }
        }

        // Notify main.js that data is loaded
        document.dispatchEvent(new CustomEvent('cms-data-applied', { detail: data }));
        window._CMS_DATA = data;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 0. LYRICS SECTION
    // ════════════════════════════════════════════════════════════════════════════
    function applyLyrics(data) {
        if (!data.lyrics) return;
        const grids = {
            'song': document.getElementById('worship-grid'),
            'sunday': document.getElementById('sunday-grid')
        };

        Object.entries(grids).forEach(([cat, grid]) => {
            if (!grid || !data.lyrics[cat]) return;
            const items = data.lyrics[cat].filter(l => l.status !== 'draft');
            if (!items.length) return;

            grid.innerHTML = '';
            items.forEach(lyric => {
                const card = document.createElement('article');
                card.className = 'lyric-card';
                card.dataset.title = lyric.title_en || lyric.title_te;
                card.innerHTML = `
                    <div class="lyric-card-header">
                        <div>
                            <h3 class="lyric-title">${esc(lyric.title_en)}${lyric.title_te ? ` <span class="te-title">${esc(lyric.title_te)}</span>` : ''}</h3>
                            <span class="lyric-category">${esc(lyric.artist_en || lyric.artist_te || (cat === 'sunday' ? 'Sunday School' : 'Worship'))}</span>
                        </div>
                        <button class="lyric-expand-btn" aria-expanded="false">▼</button>
                    </div>
                    <div class="lyric-body">
                        ${lyric.audioUrl ? `
                        <div class="lyric-audio-wrapper">
                            <div class="yt-embed-wrapper">
                                <iframe width="100%" height="200" src="${lyric.audioUrl.replace('watch?v=', 'embed/').split('&')[0]}" 
                                    frameborder="0" allowfullscreen loading="lazy"></iframe>
                            </div>
                        </div>` : ''}
                        <div class="lyric-text">
                            ${lyric.text_en ? `<p class="lyric-en" style="white-space: pre-line;">${esc(lyric.text_en)}</p>` : ''}
                            ${lyric.text_te ? `<p class="lyric-te" style="white-space: pre-line; margin-top:1.5rem; font-family:'Gautami', sans-serif;">${esc(lyric.text_te)}</p>` : ''}
                        </div>
                    </div>`;
                grid.appendChild(card);
            });

        });
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 10. KIDS PROGRAMS & GALLERY
    // ════════════════════════════════════════════════════════════════════════════
    function applyKidsPrograms(data) {
        const grid = document.querySelector('.kids-programs-grid');
        const programs = data.kids?.programs || data.kids || [];
        if (!grid || !programs.length) return;

        grid.innerHTML = '';
        programs.forEach(k => {
            if (!k.name) return;
            const card = document.createElement('div');
            card.className = 'kids-program-card fade-in';
            card.innerHTML = `
                <div class="program-icon">${esc(k.icon || '🌟')}</div>
                <h3>${esc(k.name)}</h3>
                ${k.age ? `<p class="program-age" style="font-size:0.8rem; color:var(--accent)">Age: ${esc(k.age)}</p>` : ''}
                <p>${esc(k.desc)}</p>`;
            grid.appendChild(card);
        });
    }

    function applyKidsGallery(data) {
        const grid = document.getElementById('kids-gallery-grid');
        const kg = data.kids?.gallery || data.kidsGallery || [];
        
        setVisibility('kids-gallery', kg.length > 0);
        if (!grid || !kg.length) return;

        grid.innerHTML = '';
        kg.forEach(img => {
            const wrap = document.createElement('div');
            wrap.className = 'kids-gallery-img';
            wrap.innerHTML = `<img src="${esc(img.url)}" alt="${esc(img.name)}" 
                style="width:100%;height:100%;object-fit:cover" loading="lazy">`;
            grid.appendChild(wrap);
        });
    }

    function applyPastorsSection(data) {
        const grid = document.querySelector('.pastors-grid');
        const pastors = (data.pastors || []).filter(p => p.status === 'published');
        if (!grid) return;

        setVisibility('pastors', pastors.length > 0);
        if (!pastors.length) return;

        grid.innerHTML = '';
        pastors.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pastor-card fade-in';
            // Use thumbnail if available for faster loading
            const displayUrl = p.thumbnail || p.photo || '';
            card.innerHTML = `
                <div class="pastor-img-wrapper" style="height:250px; border-radius:12px; margin-bottom:1rem; border:3px solid var(--accent); overflow:hidden">
                    ${displayUrl ? `<img src="${esc(displayUrl)}" alt="${esc(p.name)}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover">` : '<div class="img-placeholder" style="height:100%"></div>'}
                </div>
                <h3>${esc(p.name)}</h3>
                <p class="pastor-role">${esc(p.role)}</p>
            `;
            grid.appendChild(card);
        });
    }



    // ════════════════════════════════════════════════════════════════════════════
    // 2. HERO SECTION — replaces static slides with CMS images + text
    // ════════════════════════════════════════════════════════════════════════════
    function applyHeroSection(data) {
        const slider = document.getElementById('heroSlider');
        if (!slider) return;

        const slides = (data.hero || []).filter(h => h.url);
        
        // Show Hero section anyway, but use a fallback if absolutely no slides
        setVisibility('home', true); 

        // Apply hero text from CMS textContent
        const tc = data.textContent || {};
        const h1 = document.querySelector('#home .hero-content h1, #home .title');
        const sub = document.querySelector('#home .hero-content p, #home .subtitle');
        const btn = document.querySelector('#home .hero-content button, #home .primary-btn');
        if (h1 && tc.hero_title) h1.textContent = tc.hero_title;
        if (sub && tc.hero_subtitle) sub.textContent = tc.hero_subtitle;
        if (btn && tc.hero_btn) btn.textContent = tc.hero_btn;

        slider.innerHTML = '';
        
        if (!slides.length) {
            // Fallback slide
            const slide = document.createElement('div');
            slide.className = 'slide active';
            slide.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg, var(--color-gold), var(--color-slate));"></div>`;
            slider.appendChild(slide);
        } else {
            slides.forEach((img, i) => {
                const slide = document.createElement('div');
                slide.className = 'slide' + (i === 0 ? ' active' : ' next');
                slide.innerHTML = `<img src="${esc(img.url)}" alt="${esc(img.name)}" 
                    style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;"
                    loading="${i === 0 ? 'eager' : 'lazy'}">`;
                if (img.title || img.subtitle) {
                    slide.innerHTML += `<div class="slide-caption">
                        ${img.title ? `<h2>${esc(img.title)}</h2>` : ''}
                        ${img.subtitle ? `<p>${esc(img.subtitle)}</p>` : ''}
                    </div>`;
                }
                slider.appendChild(slide);
            });
            // After slides injected, (re)start auto-cycle
            if (typeof window.startHeroSlideshow === 'function') {
                window.startHeroSlideshow();
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 3. GALLERY SECTION — replaces bento grid items with CMS albums & collages
    // ════════════════════════════════════════════════════════════════════════════
    function applyGallerySection(data) {
        const gallerySection = document.getElementById('gallery');
        if (!gallerySection) return;

        const container = gallerySection.querySelector('.section-container') || gallerySection;
        const heroCollage = document.getElementById('gallery-hero-collage');
        const albums = (data.galleryAlbums || []).filter(a => a.photos && a.photos.length > 0);
        setVisibility('gallery', albums.length > 0);

        // Clear previous renders to prevent duplicates
        container.querySelectorAll('.gallery-album').forEach(el => el.remove());
        if (heroCollage) heroCollage.innerHTML = '';

        if (!albums.length) return;

        // ----- HERO COLLAGE: 6 tiles in a clean bento, auto-rotate photos -----
        if (heroCollage) {
            const allPhotos = [];
            albums.forEach(a => (a.photos || []).forEach(p => allPhotos.push(p)));
            const TILE_COUNT = 6;
            if (allPhotos.length >= 3) {
                // Initial render: 6 tiles (use what we have, repeat if fewer)
                const initial = [];
                for (let i = 0; i < TILE_COUNT; i++) {
                    initial.push(allPhotos[i % allPhotos.length]);
                }
                heroCollage.innerHTML = initial.map((p, i) =>
                    '<div class="hero-collage-item hero-collage-item-' + i + '" data-tile="' + i + '" onclick="openLightbox(\'' + esc(p.url) + '\')">' +
                        '<img src="' + esc(p.thumbnail || p.url) + '" alt="' + esc(p.name || '') + '" loading="lazy">' +
                    '</div>'
                ).join('');

                // Clear any previous rotator
                if (window._heroCollageRotator) clearInterval(window._heroCollageRotator);

                // Auto-rotate: every 3 seconds, swap one tile's photo
                if (allPhotos.length > TILE_COUNT) {
                    let nextPoolIdx = TILE_COUNT;
                    let nextTileIdx = 0;
                    window._heroCollageRotator = setInterval(() => {
                        const tiles = heroCollage.querySelectorAll('.hero-collage-item');
                        if (!tiles.length) return;
                        const tile = tiles[nextTileIdx % tiles.length];
                        const img = tile.querySelector('img');
                        const newPhoto = allPhotos[nextPoolIdx % allPhotos.length];
                        if (!img || !newPhoto) return;
                        // Fade out, swap src, fade in
                        img.classList.add('fade-out');
                        setTimeout(() => {
                            img.src = newPhoto.thumbnail || newPhoto.url;
                            tile.setAttribute('onclick', "openLightbox('" + esc(newPhoto.url) + "')");
                            img.classList.remove('fade-out');
                        }, 500);
                        nextTileIdx++;
                        nextPoolIdx++;
                    }, 3000);
                }
            }
        }

        // ----- ALBUM CARDS BELOW -----
        albums.forEach(album => {
            const albumEl = document.createElement('div');
            const style = album.collageStyle || 'grid';
            albumEl.className = 'gallery-album fade-in';

            let eventText = '';
            if (album.eventId && data.events) {
                const ev = data.events.find(e => e.id == album.eventId);
                if (ev) eventText = ' • Event: ' + ev.title;
            }

            albumEl.innerHTML = `
                <div class="album-header">
                    <h3 class="album-title">${esc(album.title)}</h3>
                    <div class="album-meta">${album.photos.length} Photos${esc(eventText)}</div>
                </div>
                <div class="collage collage-${style}">
                    ${album.photos.map((photo, idx) => `
                        <div class="collage-item collage-item-${idx}" onclick="openLightbox('${esc(photo.url)}')">
                            <img src="${esc(photo.thumbnail || photo.url)}" alt="${esc(photo.name || '')}" loading="lazy" decoding="async">
                            <div class="collage-overlay">
                                <span>🔍 View Larger</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(albumEl);
        });
    }


    // ════════════════════════════════════════════════════════════════════════════
    // SUPPORT / DONATIONS — renders from STATE.support
    // ════════════════════════════════════════════════════════════════════════════
    function applySupportSection(data) {
        const section = document.getElementById('support');
        if (!section) return;
        const sup = data.support || {};
        const lang = document.documentElement.lang || 'en';
        const pick = (k) => (lang === 'te' && sup[k + '_te']) ? sup[k + '_te'] : sup[k];

        // Section is visible IF support toggle is on AND there's at least basic content
        const hasContent = pick('title') || sup.upi_id || sup.bank_name || sup.image_url || sup.external_donate_url;
        const sectionVisible = data.sections?.support?.visible !== false;
        if (!sectionVisible || !hasContent) {
            section.style.display = 'none';
            return;
        }
        section.style.display = '';

        // Title + Description
        const titleEl = section.querySelector('.support-title');
        if (titleEl) titleEl.textContent = pick('title') || 'Support Our Ministry';
        const descEl = section.querySelector('.support-description');
        if (descEl) descEl.textContent = pick('description') || '';

        // Image
        const img = section.querySelector('.support-image');
        if (img) {
            if (sup.image_url) {
                img.src = sup.image_url;
                img.style.display = '';
            } else {
                img.style.display = 'none';
            }
        }

        // Donate button
        const donateBtn = section.querySelector('.support-donate-btn');
        if (donateBtn) {
            if (sup.external_donate_url) {
                donateBtn.href = sup.external_donate_url;
                donateBtn.textContent = pick('donate_button_text') || 'Donate Now';
                donateBtn.style.display = '';
            } else {
                donateBtn.style.display = 'none';
            }
        }

        // UPI block
        const upiBlock = section.querySelector('.support-method-upi');
        if (upiBlock) {
            if (sup.upi_id || sup.upi_qr_url) {
                upiBlock.style.display = '';
                const upiText = upiBlock.querySelector('.support-upi-id');
                if (upiText) upiText.textContent = sup.upi_id ? ('UPI ID: ' + sup.upi_id) : '';
                const upiImg = upiBlock.querySelector('.support-upi-qr');
                if (upiImg) {
                    if (sup.upi_qr_url) { upiImg.src = sup.upi_qr_url; upiImg.style.display = ''; }
                    else upiImg.style.display = 'none';
                }
            } else upiBlock.style.display = 'none';
        }

        // Bank block
        const bankBlock = section.querySelector('.support-method-bank');
        if (bankBlock) {
            if (sup.bank_name || sup.bank_account || sup.bank_ifsc) {
                bankBlock.style.display = '';
                const nameEl = bankBlock.querySelector('.support-bank-name');
                const acctEl = bankBlock.querySelector('.support-bank-account');
                const ifscEl = bankBlock.querySelector('.support-bank-ifsc');
                if (nameEl) nameEl.textContent = sup.bank_name || '';
                if (acctEl) acctEl.textContent = sup.bank_account || '';
                if (ifscEl) ifscEl.textContent = sup.bank_ifsc || '';
            } else bankBlock.style.display = 'none';
        }
    }

        // Quick Lightbox helper
    window.openLightbox = function(url) {
        const overlay = document.createElement('div');
        overlay.style = "position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;";
        overlay.innerHTML = `<img src="${url}" style="max-width:95%;max-height:95%;object-fit:contain;border-radius:8px;box-shadow:0 0 50px rgba(0,0,0,0.5)">`;
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    };

    // ════════════════════════════════════════════════════════════════════════════
    // 4. TESTIMONIALS — inject CMS entries into carousels
    // ════════════════════════════════════════════════════════════════════════════
    function applyTestimonials(data) {
        const youthCarousel = document.getElementById('youth-carousel');
        const memberCarousel = document.getElementById('member-carousel');
        const youthGrid = document.querySelector('#youth .testimonials-grid');
        const memberGrid = document.querySelector('#member .testimonials-grid');

        const youthData = ((data.testimonials && data.testimonials.youth) || []).filter(t => t.visible !== false);
        const memberData = ((data.testimonials && data.testimonials.member) || []).filter(t => t.visible !== false);
        
        setVisibility('youth', true); // Keep sections visible to show placeholders/titles
        setVisibility('testimonials', true); 

        // Limit results for home page carousels (e.g. max 5)
        const HOME_LIMIT = 5;

        if (youthCarousel && youthData.length) {
            renderCarousel(youthCarousel, youthData, 'YT', HOME_LIMIT);
            if (window.setupNativeCarousel) window.setupNativeCarousel('youth-carousel');
            
            // Show/hide See More based on data existence
            const btn = document.getElementById('see-more-youth');
            if (btn) btn.style.display = youthData.length > 0 ? 'inline-block' : 'none';
        }
        if (memberCarousel && memberData.length) {
            renderCarousel(memberCarousel, memberData, 'MT', HOME_LIMIT);
            if (window.setupNativeCarousel) window.setupNativeCarousel('member-carousel');

            // Show/hide See More based on data existence
            const btn = document.getElementById('see-more-member');
            if (btn) btn.style.display = memberData.length > 0 ? 'inline-block' : 'none';
        } else if (memberCarousel) {
            // Show a friendly placeholder if no member testimonials yet
            memberCarousel.innerHTML = `<p style="text-align:center; padding: 3rem; color: #7a7a7a;">Thank you church family! We are currently collecting our latest member testimonies.</p>`;
        }

        // Support for testimonials.html grid
        if (youthGrid && data.testimonials.youth?.length) {
            renderStaticGrid(youthGrid, data.testimonials.youth, 'YT');
        }
        if (memberGrid && data.testimonials.member?.length) {
            renderStaticGrid(memberGrid, data.testimonials.member, 'MT');
        }
    }

    function renderStaticGrid(container, items, prefix) {
        const visible = items.filter(t => t.visible !== false);
        if (!visible.length) return;
        container.innerHTML = '';
        visible.forEach((t, i) => {
            const card = document.createElement('div');
            card.className = 'static-card fade-in';
            card.dataset.num = `${prefix}${i + 1}`;
            card.dataset.name = t.name;
            card.dataset.role = t.role;
            card.dataset.text = t.text;
            const displayUrl = t.thumbnail || t.photo || '';
            card.innerHTML = `
                <div class="testimonial-photo-wrapper">
                    ${displayUrl ? `<img src="${esc(displayUrl)}" class="testimonial-photo" alt="${esc(t.name)}" loading="lazy" decoding="async">` : `<div class="img-placeholder testimonial-photo"><span>${prefix}${i + 1}</span></div>`}
                </div>
                <h4 class="testimonial-name">${esc(t.name)}</h4>
                <div class="testimonial-role">${esc(t.role)}</div>
                <p class="testimonial-text">"${esc(truncate(t.text, 100))}"</p>
                <span class="click-hint">Tap to read more</span>
            `;
            card.onclick = () => window.openTestimonialModal(card);
            container.appendChild(card);
        });
    }

    function truncate(str, len) {
        if (!str || str.length <= len) return str;
        return str.substring(0, len) + '...';
    }

    function renderCarousel(container, items, prefix, limit = null) {
        const visible = items.filter(t => t.visible !== false);
        if (!visible.length) return;

        // Detect current language from HTML tag or global state
        const lang = document.documentElement.lang || 'en';
        
        container.innerHTML = '';
        
        // Apply limit if specified
        const itemsToRender = limit ? visible.slice(0, limit) : visible;

        itemsToRender.forEach((t, i) => {
            const name = (lang === 'te' && t.name_te) ? t.name_te : t.name;
            const text = (lang === 'te' && t.text_te) ? t.text_te : t.text;
            
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.dataset.num = `${prefix}${i + 1}`;
            card.dataset.name = name;
            card.dataset.role = t.role;
            card.dataset.text = text;
            const displayUrl = t.thumbnail || t.photo || '';
            card.innerHTML = `
                <div class="testimonial-photo-wrapper">
                    ${displayUrl ? `<img src="${esc(displayUrl)}" class="testimonial-photo" alt="${esc(name)}" loading="lazy" decoding="async">` : `<div class="img-placeholder testimonial-photo"><span>YT${i + 1}</span></div>`}
                </div>
                <h4 class="testimonial-name">${esc(name)}</h4>
                <div class="testimonial-role">${esc(t.role)}</div>
                <div class="testimonial-text-wrapper">
                    <p class="testimonial-text">${esc(text)}</p>
                </div>`;
            container.appendChild(card);
        });
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 5. YOUTUBE CONFIG — video count, layout, channel link
    // ════════════════════════════════════════════════════════════════════════════
    function applyYouTubeConfig(cms) {
        // Store config where main.js fetchYouTubeVideos() can read it
        if (!cms) return;

        const yt = cms.youtube || {};

        // Section visibility
        const ytSection = document.getElementById('youtube-feed');
        if (ytSection && yt.visible === false) {
            ytSection.style.display = 'none';
            return;
        }
        if (ytSection) ytSection.style.display = '';

        // Channel link button
        if (yt.channels && yt.channels.length > 0) {
            const link = document.getElementById('yt-channel-link');
            if (link) {
                const ch = yt.channels[0];
                const href = ch.startsWith('UC')
                    ? `https://www.youtube.com/channel/${ch}`
                    : `https://www.youtube.com/@${ch}`;
                link.href = href;
            }
        }

        // Apply layout class
        const grid = document.getElementById('yt-video-grid');
        if (grid && yt.layout) {
            grid.className = `yt-video-grid ${yt.layout}`;
        }

        // Section title text
        const tc = cms.textContent || {};
        const ytTitle = document.querySelector('#youtube-feed .section-title');
        if (ytTitle && tc.yt_section_title) ytTitle.textContent = tc.yt_section_title;

        // Force main.js to re-fetch if it's already loaded
        if (typeof window.fetchYouTubeVideos === 'function') {
            window.fetchYouTubeVideos();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 6. SITE INFO — footer, address, social links
    // ════════════════════════════════════════════════════════════════════════════
    function applySiteInfo(cms) {
        if (!cms || !cms.siteInfo) return;
        const si = cms.siteInfo;

        // Church name in navbar
        const logoText = document.querySelector('.logo-text, .logo span:last-child');
        if (logoText && si.name) logoText.textContent = si.name;

        // Browser Tab Title
        if (si.name) document.title = si.name;

        // Footer
        // Address/Phone/Email mappings (Bilingual-aware)
        const mappings = {
            contact_address: si.address,
            contact_phone: si.phone,
            contact_email: si.email,
            footer_service: si.service
        };

        Object.entries(mappings).forEach(([key, val]) => {
            if (!val) return;
            // Target elements by ID or data-i18n
            const els = document.querySelectorAll(`[data-i18n="${key}"], #${key}`);
            els.forEach(el => el.textContent = val);
        });

        // Social links
        const ytLink = document.querySelector('.social-link[aria-label="YouTube"], a[data-social="youtube"]');
        const fbLink = document.querySelector('.social-link[aria-label="Facebook"], a[data-social="facebook"]');
        const igLink = document.querySelector('.social-link[aria-label="Instagram"], a[data-social="instagram"]');
        const waLink = document.querySelector('.social-link[aria-label="WhatsApp"], a[data-social="whatsapp"]');
        if (ytLink && si.youtube) ytLink.href = si.youtube;
        if (fbLink && si.facebook) fbLink.href = si.facebook;
        if (igLink && si.instagram) igLink.href = si.instagram;
        if (waLink && si.whatsapp) waLink.href = si.whatsapp;

        // Google Map iframe
        if (si.map) {
            const mapFrame = document.querySelector('.footer-map iframe, #footer-map iframe, iframe.church-map');
            if (mapFrame) mapFrame.src = si.map;
        }

        // Page title
        if (si.name) document.title = si.name;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 7. TEXT CONTENT — section headings, descriptions, button labels
    // ════════════════════════════════════════════════════════════════════════════
    function applyTextContent(data) {
        const tc = data.textContent;
        if (!tc) return;

        const map = {
            hero_title: '[data-i18n="hero_title"], #home .title',
            hero_subtitle: '[data-i18n="hero_subtitle"], #home .subtitle',
            about_title: '#about .section-title',
            about_text1: '#about .about-text p:first-child',
            about_text2: '#about .about-text p:last-child',
            gallery_title: '#gallery .section-title',
            pastors_title: '#pastors .section-title',
            youth_test_title: '#youth .section-title',
            member_test_title: '#testimonials .section-title',
            watch_live_title: '#watch-live .section-title',
            watch_live_date: '#watch-live .broadcast-date',
            watch_live_desc: '#watch-live .broadcast-desc',
            timings_sunday: '[data-i18n="timings_sunday"]',
            timings_wednesday: '[data-i18n="timings_wednesday"]',
            timings_friday: '[data-i18n="timings_friday"]',
            sunday_school_title: '#sunday_school .section-title',
            kids_info_title: '[data-i18n="kids_info_title"]',
            kids_info_desc: '[data-i18n="kids_info_desc"]',
            contact_title: '#contact .section-title',
            anudhina_title: '#anudhina .section-title',
            anudhina_text: '#anudhina .anudhina-text',
            timings_title: '#timings .section-title',
            timings_c1_title: '#timings .timing-c1-title',
            timings_c1_text: '#timings .timing-c1-text',
            timings_c2_title: '#timings .timing-c2-title',
            timings_c2_text: '#timings .timing-c2-text',
            about_min_text1: '#about_ministry .about-min-text1',
            about_min_text2: '#about_ministry .about-min-text2',
            about_min_support: '#about_ministry .about-min-support',
            
            nav_sunday_school: '#sunday_school .section-title, [data-i18n="nav_sunday_school"]',
            hero_btn: '#hero .primary-btn, [data-i18n="hero_btn"]',
            yt_feed_title: '#youtube-feed .section-title, [data-i18n="yt_feed_title"]'
        };

        // Pick value based on current page language (en or te)
        const lang = document.documentElement.lang || 'en';
        Object.entries(map).forEach(([key, selector]) => {
            // Try Telugu variant first when in Telugu mode
            const value = (lang === 'te' && tc[key + '_te']) ? tc[key + '_te'] : tc[key];
            if (!value) return;
            document.querySelectorAll(selector).forEach(el => {
                el.textContent = value;
            });
        });

        // ALSO: any tc field whose key matches a data-i18n key gets applied automatically.
        // This lets the admin edit ANY translatable string from the Text Editor without
        // needing a hard-coded selector in the map above.
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            // Prefer Telugu variant when in te mode
            const v = (lang === 'te' && tc[key + '_te']) ? tc[key + '_te'] : tc[key];
            if (v) el.textContent = v;
        });

        // Handle Images - apply URL AND remove inline display:none / make container show
        function setSectionImage(selector, url) {
            const img = document.querySelector(selector);
            if (!img) return;
            if (img.tagName === 'IMG') {
                img.src = url;
                img.style.display = '';
                img.removeAttribute('hidden');
                if (img.parentElement) {
                    img.parentElement.classList.add('has-image');
                }
            } else {
                img.style.backgroundImage = "url('" + url + "')";
                img.style.backgroundSize = 'cover';
                img.style.backgroundPosition = 'center';
            }
        }
        if (tc.about_img) setSectionImage('.about-img, #about .about-img', tc.about_img);
        if (tc.ss_img)    setSectionImage('.ss-img, #sunday_school .ss-img', tc.ss_img);
        // Logo
        if (tc.logo_url) {
            document.querySelectorAll('.logo-icon, .footer-logo-icon').forEach(el => {
                el.innerHTML = '<img src="' + esc(tc.logo_url) + '" alt="logo" style="width:1.6em;height:1.6em;object-fit:contain;vertical-align:middle;">';
            });
        }
        if (tc.logo_text) {
            document.querySelectorAll('.logo-text, .footer-logo-text').forEach(el => {
                el.textContent = tc.logo_text;
            });
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 8. EVENTS — inject CMS events into the events section
    // ════════════════════════════════════════════════════════════════════════════
    function applyEventsSection(data) {
        const eventsContainer = document.querySelector('#events .timeline-container, #events .events-list, #events .events-grid, [data-cms-events]');
        if (!eventsContainer) return;

        const now = new Date();
        const visible = (data.events || []).filter(ev => {
            if (ev.status === 'archived' || ev.status === 'draft') return false;
            if (ev.status === 'scheduled' && new Date(ev.date) > now) return false;
            // Auto-hide past events unless explicitly published
            if (ev.date && new Date(ev.date) < now && ev.status !== 'published') return false;
            return true;
        });

        setVisibility('events', visible.length > 0);
        if (!visible.length) return;

        eventsContainer.innerHTML = '';
        visible.forEach(ev => {
            const d = ev.date ? new Date(ev.date) : null;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-date">
                    <span class="date-month">${d ? months[d.getMonth()] : '--'}</span>
                    <span class="date-day">${d ? d.getDate() : '--'}</span>
                </div>
                <div class="timeline-content">
                    ${ev.thumb ? `<div class="timeline-thumb" style="background-image:url('${esc(ev.thumb)}');background-size:cover;background-position:center"></div>` : '<div class="img-placeholder timeline-thumb"></div>'}
                    <div class="timeline-details">
                        <h4>${esc(ev.title)}</h4>
                        ${ev.desc ? `<p style="font-size:0.75rem;color:var(--color-gray);margin-bottom:0.4rem">${esc(truncate(ev.desc, 60))}</p>` : ''}
                        <button class="add-calendar-btn">Add to Calendar</button>
                    </div>
                </div>`;
            eventsContainer.appendChild(item);
        });
    }

    function truncate(str, len) {
        if (!str || str.length <= len) return str;
        return str.slice(0, len) + '...';
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 9. SECTION ORDER — reorder main sections based on CMS layout config
    // ════════════════════════════════════════════════════════════════════════════
    function applySectionOrder(cms) {
        if (!cms || !cms.layout || !cms.layout.length) return;
        const main = document.querySelector('.main-content, main');
        if (!main) return;

        const fullWidthContainer = document.querySelector('.full-width-section-container');
        const fullWidthIds = ['youth', 'testimonials', 'contact-map']; // Sections that should stay full-width

        const orderedMain = [];
        const orderedFull = [];

        cms.layout.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            if (fullWidthIds.includes(id)) {
                orderedFull.push(el);
            } else {
                orderedMain.push(el);
            }
        });

        // Reorder main content sections
        orderedMain.forEach(el => main.appendChild(el));
        
        // Reorder full-width sections if container exists
        if (fullWidthContainer) {
            orderedFull.forEach(el => fullWidthContainer.appendChild(el));
        }
    }

    // ── Run everything on DOM ready ────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyAllCMSData();
            initCloudListener();
        });
    } else {
        applyAllCMSData();
        initCloudListener();
    }

    function initCloudListener() {
        if (!db) return;
        const publicRef = db.ref('church_cms/public');
        publicRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log('CMS: Cloud Update Received');
                applyAllCMSData(data);
            }
        });
    }

    // ── Expose for manual re-apply ──────────────────
    window.reapplyCMS = applyAllCMSData;

    // Re-apply when language changes so admin-textContent stays correct
    new MutationObserver(muts => {
        for (const m of muts) {
            if (m.attributeName === 'lang') {
                if (window._CMS_DATA) applyTextContent(window._CMS_DATA);
                break;
            }
        }
    }).observe(document.documentElement, { attributes: true });

})();

