# IPC Church Steven

Bilingual (English/Telugu) church website with admin CMS.

**Live site:** https://ipcchurchsteven.com
**Stack:** Vanilla HTML/CSS/JS + Supabase (Postgres + Storage + Realtime) + Cloudflare Pages

## Pages
- `index.html` — home
- `lyrics.html` — worship + sunday school lyrics
- `testimonials.html` — youth + member testimonials
- `kids-programs.html` — sunday school programs
- `admin/login.html` — CMS dashboard login

## Local development
```bash
npx serve -p 5500
```
Then open http://localhost:5500

## Admin CMS
All content (pastors, testimonials, lyrics, site info, etc.) is editable
from the admin dashboard. Changes save to Supabase and propagate to the
public site in real time.