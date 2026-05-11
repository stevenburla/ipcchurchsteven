// =========================================================================
// LYRICS PAGE INTERACTIVITY
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------------------
    // TAB SWITCHING
    // -----------------------------------------------------------------------
    const tabs = document.querySelectorAll('.lyrics-tab');
    const panels = document.querySelectorAll('.lyrics-panel');
    const searchInput = document.getElementById('lyrics-search');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = 'panel-' + tab.dataset.tab;

            // Deactivate all
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => {
                p.classList.remove('active');
            });

            // Activate clicked
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Clear search on tab switch
            if (searchInput) {
                searchInput.value = '';
                filterSongs('');
                updateClearBtn('');
            }
        });
    });

    // -----------------------------------------------------------------------
    // LYRIC CARD EXPAND / COLLAPSE (Delegated)
    // -----------------------------------------------------------------------
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.lyric-card-header');
        if (!header) return;
        
        const card = header.closest('.lyric-card');
        const btn = header.querySelector('.lyric-expand-btn');
        if (!card) return;

        const isOpen = card.classList.contains('open');
        card.classList.toggle('open', !isOpen);
        if (btn) btn.setAttribute('aria-expanded', !isOpen);
    });

    // -----------------------------------------------------------------------
    // SEARCH / FILTER
    // -----------------------------------------------------------------------
    const clearBtn = document.getElementById('clear-search');

    function filterSongs(query) {
        const q = query.trim().toLowerCase();

        // Get the currently active panel
        const activePanel = document.querySelector('.lyrics-panel.active');
        if (!activePanel) return;

        const cards = activePanel.querySelectorAll('.lyric-card');
        const noResults = activePanel.querySelector('.no-results');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = (card.dataset.title || '').toLowerCase();
            const match = q === '' || title.includes(q);
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        if (noResults) {
            noResults.style.display = (visibleCount === 0 && q !== '') ? 'block' : 'none';
        }
    }

    function updateClearBtn(value) {
        if (clearBtn) {
            clearBtn.classList.toggle('visible', value.length > 0);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            filterSongs(val);
            updateClearBtn(val);
        });

        // Debounce-free for responsiveness – live filtering
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterSongs('');
                updateClearBtn('');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            filterSongs('');
            updateClearBtn('');
            searchInput.focus();
        });
    }

});
