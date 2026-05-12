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
    async function fetchYouTubeVideos() {
        const grid = document.getElementById('yt-video-grid');
        if (!grid) return;

        const currentCms = getCMS();

        // Determine channel IDs: from CMS config, else from a fallback default
        const channels = (currentCms?.youtube?.channels?.length)
            ? currentCms.youtube.channels
            : []; 

        // If CMS says hide the section, hide it
        if (currentCms?.youtube?.visible === false) {
            const section = document.getElementById('youtube-feed');
            if (section) section.style.display = 'none';
            return;
        }

        try {
            const allVideos = [];
            const seenIds = new Set();

            // Build the right RSS feed URL for each channel.
            // Accepts: UC... channel ID, @handle, or bare handle/custom-url
            function buildFeedUrls(raw) {
                const v = String(raw || '').trim();
                if (!v) return [];
                // UC... = direct channel ID
                if (/^UC[A-Za-z0-9_-]{20,}$/.test(v)) {
                    return ['https://www.youtube.com/feeds/videos.xml?channel_id=' + v];
                }
                // @handle or bare handle/custom name -- try both user= and embedding URL form
                const handle = v.startsWith('@') ? v.slice(1) : v;
                return [
                    'https://www.youtube.com/feeds/videos.xml?user=' + handle,
                    'https://rsshub.app/youtube/user/@' + handle
                ];
            }

            await Promise.all(channels.map(async (channelId) => {
                const candidateFeeds = buildFeedUrls(channelId);
                for (const feedUrl of candidateFeeds) {
                    const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feedUrl);
                    try {
                        const res = await fetch(rssUrl, { signal: AbortSignal.timeout(7000) });
                        const data = await res.json();
                        if (data && data.status === 'ok' && data.items && data.items.length) {
                            data.items.forEach(v => {
                                if (!seenIds.has(v.guid)) {
                                    seenIds.add(v.guid);
                                    allVideos.push(Object.assign({}, v, {
                                        channelTitle: data.feed.title,
                                        channelLink: data.feed.link
                                    }));
                                }
                            });
                            const visitBtn = document.getElementById('yt-channel-link');
                            if (visitBtn && data.feed.link) visitBtn.href = data.feed.link;
                            break; // success -- stop trying further feed URLs
                        }
                    } catch (e) { /* try next candidate */ }
                }
            }));

            // Sort newest first
            allVideos.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            if (!allVideos.length) {
                grid.innerHTML = '<p style="text-align:center;color:#7a7a7a;grid-column:1/-1;padding:3rem;">Unable to load videos at this time. Visit our channel directly.</p>';
                return;
            }

            grid.innerHTML = '';
            const limit = currentCms?.youtube?.videoCount || 6;
            const layout = currentCms?.youtube?.layout || 'grid-3'; // grid-3, grid-2, list, collage
            const clickAction = currentCms?.youtube?.clickAction || 'modal';

            // Apply layout class
            grid.className = `yt-video-grid ${layout}`;

            allVideos.slice(0, limit).forEach(video => {
                const date = new Date(video.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const card = document.createElement('div');
                card.className = 'yt-card';
                card.innerHTML = `
                    <div class="yt-thumb-wrapper">
                        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                        <div class="yt-play-overlay">
                            <div class="play-icon-circ">&#9658;</div>
                        </div>
                    </div>
                    <div class="yt-info">
                        <h4 class="yt-title">${video.title}</h4>
                        <div class="yt-meta">
                            <span class="yt-date">📅 ${date}</span>
                            <span class="yt-channel">📺 ${video.channelTitle || 'Church TV'}</span>
                        </div>
                    </div>`;
                
                const play = () => {
                    const videoId = video.guid; // guid usually contains the ID or link
                    const finalUrl = video.link;
                    if (clickAction === 'modal') {
                        openVideoModal(finalUrl);
                    } else {
                        window.open(finalUrl, '_blank');
                    }
                };
                card.addEventListener('click', play);
                grid.appendChild(card);
            });


        } catch (err) {
            console.error('YouTube feed error:', err);
            grid.innerHTML = '<p style="text-align:center;color:#7a7a7a;grid-column:1/-1;padding:3rem;">Unable to load videos. Visit our channel for the latest content.</p>';
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
            updateCenterCard();
            // Center the first card initially
            if (cards[0]) {
               const scrollTo = cards[0].offsetLeft - (viewport.offsetWidth / 2) + (cards[0].offsetWidth / 2);
               viewport.scrollLeft = scrollTo;
            }
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
    // HERO SLIDESHOW (restartable; called by cms-bridge after slides inject)
    // =========================================================
    let _heroInterval = null;
    window.startHeroSlideshow = function() {
        const slider = document.getElementById('heroSlider');
        if (!slider) return;
        const slides = slider.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        // Restart cleanly
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
    // Best-effort initial start (no-op if 0/1 slides yet -- bridge will retry)
    window.startHeroSlideshow();
});
