# Iraqi Dates Council website

Static site (HTML/CSS/JS) backed by Firebase (Firestore + Auth) and EmailJS.

- `index.html` / `index-en.html` — public site (Arabic / English)
- `admin-login.html` → `admin.html` / `admin-en.html` — content management (requires Firebase login)
- `firestore.rules`, `storage.rules` — deploy with `firebase deploy --only firestore:rules,storage`
- `vendor/` — pinned third-party libraries; `tailwind.css` is a prebuilt stylesheet

Before deploying: replace `REPLACE_WITH_ADMIN_UID` in `firestore.rules`.
