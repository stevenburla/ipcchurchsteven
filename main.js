document.addEventListener('DOMContentLoaded', () => {
    console.log("%c IPC Church Website - Version 1.1 Loaded ", "background: #d4af37; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");

    // =========================================================
    // CMS BRIDGE — reads config saved by admin/dashboard.html
    // =========================================================

    const CMS_PUBLIC_KEY = 'churchCMS_public';

    function loadCMSConfig() {
        // Preference: Global window data (from cloud) > Local storage
        if (window._CMS_DATA) return window._CMS_DATA;
        try {
            const raw = localStorage.getItem(CMS_PUBLIC_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    // Refresh config at runtime
    function getCMS() {
        return window._CMS_DATA || loadCMSConfig();
    }

    const cms = getCMS();

    // 1. Section Visibility
    function applySectionVisibility() {
        const currentCms = getCMS();
        if (!currentCms || !currentCms.sections) return;
        Object.entries(currentCms.sections).forEach(([id, cfg]) => {
            const el = document.getElementById(id);
            if (el) el.style.display = (cfg.visible === false) ? 'none' : '';
        });
    }

    // Call initial logic
    applySectionVisibility();
    window.fetchYouTubeVideos = fetchYouTubeVideos; // Expose for bridge
    fetchYouTubeVideos();
    applySiteInfo();
    
    // Refresh YouTube every 5 minutes
    setInterval(fetchYouTubeVideos, 300000);

    // 2. Fetch YouTube videos from ALL channels stored by admin
    // Cache resolved channel IDs in memory so we don't re-fetch on every refresh
    const _ytChannelCache = {};

    async function resolveChannelIdFront(input) {
        const raw = String(input || '').trim();
        if (!raw) return null;
        if (/^UC[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;
        if (_ytChannelCache[raw]) return _ytChannelCache[raw];

        const ucMatch = raw.match(/channel\/(UC[A-Za-z0-9_-]{20,})/);
        if (ucMatch) { _ytChannelCache[raw] = ucMatch[1]; return ucMatch[1]; }

        let handle = raw;
        handle = handle.replace(/^https?:\/\/(www\.)?youtube\.com\//, '');
        handle = handle.replace(/^@/, '').replace(/\/.*$/, '');

        const channelUrl = 'https://www.youtube.com/@' + encodeURIComponent(handle);
        const proxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        // Use Promise.race for timeout (mobile Safari compatibility)
        const fetchT = (url, ms) => Promise.race([
            fetch(url),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
        ]);
        for (const p of proxies) {
            try {
                const res = await fetchT(p + encodeURIComponent(channelUrl), 8000);
                if (!res.ok) continue;
                const html = await res.text();
                const m = html.match(/"externalId":"(UC[A-Za-z0-9_-]{20,})"/) ||
                          html.match(/\/channel\/(UC[A-Za-z0-9_-]{20,})/);
                if (m && m[1]) { _ytChannelCache[raw] = m[1]; return m[1]; }
            } catch (e) {}
        }
        return null;
    }

    async function fetchYouTubeVideos() {
        const grid = document.getElementById('yt-video-grid');
        if (!grid) return;

        const currentCms = getCMS();
        const channels = (currentCms && currentCms.youtube && currentCms.youtube.channels && currentCms.youtube.channels.length)
            ? currentCms.youtube.channels : [];

        if (currentCms && currentCms.youtube && currentCms.youtube.visible === false) {
            const section = document.getElementById('youtube-feed');
            if (section) section.style.display = 'none';
            return;
        }

        if (!channels.length) {
            // Cloud data may not have arrived yet (esp. on slow mobile networks).
            // Keep loading indicator and retry until CMS hydrates.
            grid.innerHTML = '<div class="yt-loading" style="grid-column:1/-1;text-align:center;padding:2.5rem;color:#7a7a7a;">' +
                '<span class="loader"></span><p style="margin-top:.75rem">Loading videos...</p></div>';
            // Schedule retries: 1s, 3s, 6s, 10s
            if (!window._ytRetryCount) window._ytRetryCount = 0;
            if (window._ytRetryCount < 4) {
                window._ytRetryCount++;
                const delays = [1000, 2000, 3000, 4000];
                setTimeout(() => fetchYouTubeVideos(), delays[window._ytRetryCount - 1]);
            } else {
                // After 4 retries (~10s), give up gracefully
                grid.innerHTML = '<p style="text-align:center;color:#7a7a7a;grid-column:1/-1;padding:3rem;">No channel configured yet.</p>';
            }
            return;
        }
        // Reset retry counter when channels are present
        window._ytRetryCount = 0;

        try {
            const allVideos = [];
            const seenIds = new Set();
            let firstFeedLink = null;

            await Promise.all(channels.map(async (chRaw) => {
                const ucId = await resolveChannelIdFront(chRaw);
                if (!ucId) return;

                // Build channel URL - prefer handle if user gave one, else use UC ID
                let channelPageUrl;
                const rawStr = String(chRaw).trim();
                if (rawStr.startsWith('@') || rawStr.includes('/@')) {
                    const handle = rawStr.replace(/^.*@/, '').replace(/\/.*$/, '');
                    channelPageUrl = 'https://www.youtube.com/@' + handle + '/videos';
                } else {
                    channelPageUrl = 'https://www.youtube.com/channel/' + ucId + '/videos';
                }
                if (!firstFeedLink) firstFeedLink = channelPageUrl.replace(/\/videos$/, '');

                // Use r.jina.ai to scrape the channel's /videos page (YouTube RSS is broken)
                // Multi-strategy: manual timeout (mobile Safari < 17.4 lacks AbortSignal.timeout)
                const fetchWithTimeout = (url, ms) => Promise.race([
                    fetch(url),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
                ]);
                const sources = [
                    'https://r.jina.ai/' + channelPageUrl,
                    'https://r.jina.ai/https://www.youtube.com/channel/' + ucId + '/videos',
                    'https://api.allorigins.win/raw?url=' + encodeURIComponent(channelPageUrl),
                ];
                let pageText = null;
                for (const url of sources) {
                    try {
                        const r = await fetchWithTimeout(url, 12000);
                        if (!r.ok) continue;
                        const txt = await r.text();
                        if (txt && txt.match(/watch\?v=[A-Za-z0-9_-]{11}/)) {
                            pageText = txt;
                            break;
                        }
                    } catch (e) { console.warn('YT fetch source failed:', url.slice(0, 40), e.message); }
                }

                if (!pageText) return;

                // Extract unique video IDs from watch?v= patterns
                const idMatches = pageText.match(/watch\?v=([A-Za-z0-9_-]{11})/g) || [];
                const videoIds = [...new Set(idMatches.map(m => m.slice(8)))];

                // Try to extract titles next to each video ID in the markdown
                // Jina markdown format often has: [Video Title](https://...watch?v=ID...)
                const titleMap = {};
                const titleRegex = /\[([^\]\n]+)\]\([^)]*watch\?v=([A-Za-z0-9_-]{11})/g;
                let m;
                while ((m = titleRegex.exec(pageText)) !== null) {
                    const title = m[1].replace(/^Image \d+:\s*/, '').trim();
                    if (title && title.length > 3 && !titleMap[m[2]]) {
                        titleMap[m[2]] = title;
                    }
                }

                videoIds.forEach((vid, idx) => {
                    if (seenIds.has(vid)) return;
                    seenIds.add(vid);
                    const title = titleMap[vid] || ('Video #' + (idx + 1));
                    allVideos.push({
                        guid: vid,
                        title: title,
                        link: 'https://www.youtube.com/watch?v=' + vid,
                        pubDate: '',
                        thumbnail: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg',
                        channelTitle: 'Church TV',
                        channelLink: channelPageUrl.replace(/\/videos$/, ''),
                        // Preserve original order from page (newest first)
                        _orderIdx: idx
                    });
                });
            }));

            const visitBtn = document.getElementById('yt-channel-link');
            if (visitBtn && firstFeedLink) visitBtn.href = firstFeedLink;

            const manualOrder = (currentCms && currentCms.youtube && currentCms.youtube.videoOrder) || [];
            if (manualOrder.length) {
                allVideos.sort((a, b) => {
                    const ai = manualOrder.indexOf(a.guid);
                    const bi = manualOrder.indexOf(b.guid);
                    if (ai === -1 && bi === -1) return (a._orderIdx || 0) - (b._orderIdx || 0);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                });
            } else {
                // Channel /videos page shows newest first by default - preserve that order
                allVideos.sort((a, b) => (a._orderIdx || 0) - (b._orderIdx || 0));
            }

            if (!allVideos.length) {
                grid.innerHTML = '<div class="yt-empty-state" style="grid-column:1/-1;padding:2rem;text-align:center;color:#7a7a7a;">' +
                    '<p style="margin:0 0 .5rem">Unable to load videos right now. Please try again shortly.</p>' +
                    '</div>';
                return;
            }

            grid.innerHTML = '';
            const limit = (currentCms && currentCms.youtube && currentCms.youtube.videoCount) || 6;
            const layout = (currentCms && currentCms.youtube && currentCms.youtube.layout) || 'grid-3';
            const clickAction = (currentCms && currentCms.youtube && currentCms.youtube.clickAction) || 'modal';
            grid.className = 'yt-video-grid ' + layout;

            allVideos.slice(0, limit).forEach(video => {
                const date = new Date(video.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const card = document.createElement('div');
                card.className = 'yt-card';
                card.innerHTML =
                    '<div class="yt-thumb-wrapper">' +
                        '<img src="' + video.thumbnail + '" alt="' + (video.title || '').replace(/"/g, '&quot;') + '" loading="lazy">' +
                        '<div class="yt-play-overlay"><div class="play-icon-circ">▶</div></div>' +
                    '</div>' +
                    '<div class="yt-info">' +
                        '<h4 class="yt-title">' + (video.title || '') + '</h4>' +
                        '<div class="yt-meta">' +
                            '<span class="yt-date">' + date + '</span>' +
                            '<span class="yt-channel">' + (video.channelTitle || 'Church TV') + '</span>' +
                        '</div>' +
                    '</div>';
                card.addEventListener('click', () => {
                    if (clickAction === 'modal') openVideoModal(video.link);
                    else window.open(video.link, '_blank');
                });
                grid.appendChild(card);
            });
        } catch (err) {
            console.error('YouTube feed error:', err);
            grid.innerHTML = '<p style="text-align:center;color:#7a7a7a;grid-column:1/-1;padding:3rem;">Unable to load videos right now. Please try again shortly.</p>';
        }
    }

        // 3. Video Modal Player
    function openVideoModal(videoUrl) {
        let videoId = '';
        try {
            const u = new URL(videoUrl);
            videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
        } catch {
            videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
        }
        if (!videoId) { window.open(videoUrl, '_blank'); return; }

        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        const modal = document.createElement('div');
        modal.className = 'yt-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="yt-modal-content">
                <button class="yt-modal-close" aria-label="Close video">&times;</button>
                <div class="yt-video-container">
                    <iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        modal.querySelector('.yt-modal-close').onclick = () => closeVideoModal(modal);
        modal.onclick = (e) => { if (e.target === modal) closeVideoModal(modal); };
        document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closeVideoModal(modal); document.removeEventListener('keydown', esc); } });
    }

    function closeVideoModal(modal) {
        modal.remove();
        document.body.style.overflow = '';
    }

    // 4. Apply site info from CMS to footer elements
    function applySiteInfo() {
        if (!cms?.siteInfo) return;
        const si = cms.siteInfo;
        const ytLink = document.querySelector('.social-link[aria-label="YouTube"]');
        const fbLink = document.querySelector('.social-link[aria-label="Facebook"]');
        const igLink = document.querySelector('.social-link[aria-label="Instagram"]');
        if (ytLink && si.youtube) ytLink.href = si.youtube;
        if (fbLink && si.facebook) fbLink.href = si.facebook;
        if (igLink && si.instagram) igLink.href = si.instagram;
    }

    // Initialize
    applySectionVisibility();
    fetchYouTubeVideos();
    applySiteInfo();



    // =========================================================
    // HAMBURGER MENU LOGIC
    // =========================================================
    const hamburger = document.getElementById('hamburger-menu');
    const navLinksList = document.getElementById('nav-links');

    if (hamburger && navLinksList) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('toggle');
            navLinksList.classList.toggle('nav-active');
        });

        // Close when a link is clicked
        navLinksList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('toggle');
                navLinksList.classList.remove('nav-active');
            });
        });

        // Close when clicking outside the menu
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinksList.contains(e.target)) {
                hamburger.classList.remove('toggle');
                navLinksList.classList.remove('nav-active');
            }
        });
    }

    // =========================================================
    // TESTIMONIALS LOGIC (Arc Shaped Animation)
    // =========================================================
    function setupNativeCarousel(id) {
        const viewport = document.getElementById(id);
        if (!viewport) return;

        if (viewport._cleanup) viewport._cleanup();
        
        const cards = viewport.querySelectorAll('.carousel-card');
        if (cards.length === 0) return;

        function updateCenterCard() {
            const viewportRect = viewport.getBoundingClientRect();
            const viewportCenter = viewportRect.left + viewportRect.width / 2;

            let closestCard = null;
            let minDistance = Infinity;

            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.left + rect.width / 2;
                const distance = cardCenter - viewportCenter;
                const absDist = Math.abs(distance);

                if (absDist < minDistance) {
                    minDistance = absDist;
                    closestCard = card;
                }

                // ADVANCED ARC SHAPED: Deep curve + perspective
                // Increase Y as we move away from center (creates a bowl shape)
                const ty = (absDist / 12); 
                // Rotate cards towards the center
                const rotY = (distance / 20); 
                // Slight tilt
                const rotZ = (distance / 60);
                // Scale cards down as they move away
                let scale = 1.1 - (absDist / 2000);
                scale = Math.max(0.85, scale);

                card.style.transform = `perspective(1000px) translateY(${ty}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`;
                card.style.opacity = Math.max(0.4, 1 - absDist / 800);
                card.style.zIndex = Math.round(100 - absDist / 10);
                card.classList.remove('center-card');
            });

            if (closestCard) {
                closestCard.classList.add('center-card');
                closestCard.style.opacity = '1';
            }
        }

        const onScroll = () => requestAnimationFrame(updateCenterCard);
        viewport.addEventListener('scroll', onScroll, { passive: true });

        // Task 3: Click-to-Center Behavior
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const viewportWidth = viewport.offsetWidth;
                const cardWidth = card.offsetWidth;
                const cardOffset = card.offsetLeft;
                
                // The exact scroll position to put the card's middle at the viewport's middle
                const scrollTo = cardOffset - (viewportWidth / 2) + (cardWidth / 2);
                
                if (card.classList.contains('center-card')) {
                    openTestimonialModal(card);
                } else {
                    viewport.scrollTo({ left: scrollTo, behavior: 'smooth' });
                }
            });
        });

        viewport._cleanup = () => {
            viewport.removeEventListener('scroll', onScroll);
        };

        // Initial setup
        requestAnimationFrame(() => {
            // Start centered on the MIDDLE card so user sees peek on BOTH sides
            const middleIdx = Math.floor(cards.length / 2);
            const startCard = cards[middleIdx] || cards[0];
            if (startCard) {
               const scrollTo = startCard.offsetLeft - (viewport.offsetWidth / 2) + (startCard.offsetWidth / 2);
               viewport.scrollLeft = scrollTo;
            }
            updateCenterCard();
        });

        window.addEventListener('resize', onScroll);
    }

    // Expose globally
    window.setupNativeCarousel = setupNativeCarousel;

    // Initial call
    setupNativeCarousel('youth-carousel');
    setupNativeCarousel('member-carousel');

    // =========================================================
    // TESTIMONIAL MODAL LOGIC
    // =========================================================
    const tModal = document.getElementById('testimonial-modal');
    const tModalClose = document.getElementById('t-modal-close');
    const tModalName = document.getElementById('t-modal-name');
    const tModalRole = document.getElementById('t-modal-role');
    const tModalText = document.getElementById('t-modal-text');
    const tModalPhoto = document.getElementById('t-modal-photo');
    const tModalNum = document.getElementById('t-modal-num');

    function openTestimonialModal(card) {
        if (!tModal) return;
        const name = card.dataset.name || card.querySelector('.testimonial-name')?.textContent || '';
        const role = card.dataset.role || card.querySelector('.testimonial-role')?.textContent || '';
        const text = card.dataset.text || card.querySelector('.testimonial-text')?.textContent || '';
        const num = card.dataset.num || '';

        if (tModalName) tModalName.textContent = name;
        if (tModalRole) tModalRole.textContent = role;
        if (tModalText) tModalText.textContent = text;
        if (tModalNum) tModalNum.textContent = num;
        if (tModalPhoto) tModalPhoto.setAttribute('data-num', num);

        tModal.removeAttribute('hidden');
        // Force reflow so transition fires
        void tModal.offsetWidth;
        tModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Expose globally so static-card pages (testimonials.html) can also use it
    window.openTestimonialModal = openTestimonialModal;

    function closeTestimonialModal() {
        if (!tModal) return;
        tModal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => tModal.setAttribute('hidden', ''), 380);
    }

    if (tModalClose) {
        tModalClose.addEventListener('click', closeTestimonialModal);
    }

    if (tModal) {
        tModal.addEventListener('click', (e) => {
            if (e.target === tModal) closeTestimonialModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTestimonialModal();
    });

    // =========================================================
    // BILINGUAL TOGGLE (INSTANT TRANSLATION)
    // =========================================================
    const langToggleBtn = document.getElementById('lang-toggle');
    const langOptions = langToggleBtn.querySelectorAll('.lang-option');
    let currentLang = 'en';

    function applyTranslation(lang) {
        const transTable = window.translations[lang];
        if (!transTable) return;

        // Translate text elements
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (transTable[key]) {
                el.textContent = transTable[key];
            }
        });

        // Translate placeholders (like in forms)
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (transTable[key]) {
                el.placeholder = transTable[key];
            }
        });

        // Wait a frame and re-center carousels if font shifts happen
        requestAnimationFrame(() => {
            const youth = document.getElementById('youth-carousel');
            const member = document.getElementById('member-carousel');
            if (youth && youth._forceUpdateCenter) youth._forceUpdateCenter();
            if (member && member._forceUpdateCenter) member._forceUpdateCenter();
        });
    }

    langToggleBtn.addEventListener('click', () => {
        // Swap language
        currentLang = currentLang === 'en' ? 'te' : 'en';

        // Update active class on toggle toggle UI
        langOptions.forEach(opt => {
            const optLang = opt.getAttribute('data-lang');
            if (optLang === currentLang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // Apply new text
        document.documentElement.lang = currentLang;
        applyTranslation(currentLang);

        // Notify CMS Bridge to re-render dynamic content
        if (window.refreshCMSContent) {
            window.refreshCMSContent();
        }
    });

    // =========================================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // =========================================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    function refreshObserver() {
        const fadeElements = document.querySelectorAll('.fade-in:not(.visible)');
        fadeElements.forEach(el => observer.observe(el));
    }

    // Expose for bridge to call when injecting dynamic content
    window.refreshAnimations = refreshObserver;
    
    // Initial call
    refreshObserver();

    // Also observe the whole body for additions of .fade-in elements
    const mutationObserver = new MutationObserver(() => refreshObserver());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // =========================================================
    // STICKY NAV ACTIVE STATE UPDATES ON SCROLL
    // =========================================================
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // 200px offset for early triggering before it hits exact top
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) {
                a.classList.add('active');
            }
        });
    });

    // Run initial translation just to stamp correct defaults (optional)
    applyTranslation('en');

    // =========================================================
    // DYNAMIC LANGUAGE TOGGLE OPACITY ON SCROLL
    // =========================================================
    // langToggleBtn is already defined globally above
    if (langToggleBtn) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            langToggleBtn.classList.add('scrolled'); // Fade out and shrink slightly

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                langToggleBtn.classList.remove('scrolled'); // Fade back in when stopped
            }, 800);
        }, { passive: true });
    }

    // =========================================================
    // HERO SLIDESHOW (restartable - called by cms-bridge after slides inject)
    // =========================================================
    let _heroInterval = null;
    window.startHeroSlideshow = function() {
        const slider = document.getElementById('heroSlider');
        if (!slider) return;
        const slides = slider.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        if (_heroInterval) { clearInterval(_heroInterval); _heroInterval = null; }

        let currentSlide = 0;
        let isAnimating = false;
        _heroInterval = setInterval(() => {
            const live = slider.querySelectorAll('.slide');
            if (live.length <= 1) return;
            if (isAnimating) return;
            isAnimating = true;
            const previousSlide = currentSlide;
            currentSlide = (currentSlide + 1) % live.length;
            live[currentSlide].classList.remove('active', 'last-active');
            live[currentSlide].classList.add('next');
            void live[currentSlide].offsetWidth;
            live[currentSlide].classList.remove('next');
            live[currentSlide].classList.add('active');
            if (live[previousSlide]) {
                live[previousSlide].classList.remove('active');
                live[previousSlide].classList.add('last-active');
            }
            setTimeout(() => { isAnimating = false; }, 1200);
        }, 5000);
    };
    window.startHeroSlideshow();


    // ════════════════════════════════════════════════════════════════════════════
    // PRAYER REQUEST FORM — submit handler
    // ════════════════════════════════════════════════════════════════════════════
    document.addEventListener('submit', async (e) => {
        if (!e.target.matches('.prayer-form')) return;
        e.preventDefault();
        const form = e.target;
        const nameInput = form.querySelector('input[type="text"]');
        const msgInput = form.querySelector('textarea');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!nameInput || !msgInput) return;
        const name = nameInput.value.trim();
        const message = msgInput.value.trim();
        if (!name || !message) {
            alert('Please fill in both your name and prayer request.');
            return;
        }
        
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            // Get Supabase client
            const SUPABASE_URL = 'https://fsxnckdckfcargnvxzlf.supabase.co';
            const SUPABASE_KEY = 'sb_publishable_n4HVXI_QZoibz3DUjjuDSw_7MwD2Ivl';
            const sb = window._sbClient || (window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);
            if (!sb) throw new Error('Supabase not loaded');
            window._sbClient = sb;
            
            // Read current state from cms_data
            const { data: stateData } = await sb.from('cms_data').select('value').eq('key', 'state').single();
            const state = stateData?.value || {};
            state.prayerRequests = state.prayerRequests || [];
            
            // Append new request
            const newRequest = {
                id: Date.now(),
                name: name,
                message: message,
                date: new Date().toISOString(),
                status: 'new'  // admin filter looks for this status
            };
            state.prayerRequests.unshift(newRequest);
            
            // Save back
            const { error } = await sb.from('cms_data').update({ value: state }).eq('key', 'state');
            if (error) throw error;
            
            // Also send email notification via Formsubmit (free, no signup, one-time verify)
            // After deploy, the first submission emails stevenburla4@gmail.com - click the verify link
            // in that email once; future submissions arrive automatically.
            try {
                fetch('https://formsubmit.co/ajax/stevenburla4@gmail.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: 'New Prayer Request from ' + name,
                        _template: 'box',
                        _captcha: 'false',
                        Name: name,
                        'Prayer Request': message,
                        Submitted: new Date().toLocaleString(),
                        Source: 'ipcchurchsteven.com'
                    })
                }).catch(() => {});
            } catch (e) { /* don't block success on email failure */ }

            // Success: clear form, show confirmation
            nameInput.value = '';
            msgInput.value = '';
            submitBtn.textContent = '✓ Sent!';
            submitBtn.style.background = '#16a34a';
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
        } catch (err) {
            console.error('Prayer submit error:', err);
            submitBtn.textContent = '✗ Error - try again';
            submitBtn.disabled = false;
            setTimeout(() => { submitBtn.textContent = originalText; }, 3000);
        }
    });


});