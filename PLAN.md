# PLAN — deferred / pre-production work

Running list of things intentionally deferred. See `PRD.md` for product scope,
`DESIGN.md` for the design system, `README.md` for the code map.

---

## 🔴 Email verification + SMTP — DEFERRED to production

**Current dev state:** Supabase **auto-confirm is ON** (`mailer_autoconfirm: true`
on project `fpezjuxcsyjbodgrddhk`). Sign-ups get an instant session with **no
email verification at all** — there is no proof the user owns the email. This is
a deliberate local-dev shortcut so the auth → scan flow is testable without
email. **It is NOT safe for production.**

Why it's deferred: real email verification needs an email sender, and OTP codes
need a customizable email template. Supabase's **free tier + default email
provider blocks all template edits**, and the built-in sender is rate-limited
(~a few emails/hour). So proper verification is gated on adding custom SMTP.

### Before production — checklist
1. **Add custom SMTP** (recommended: **Resend** — needs a verified domain;
   **Brevo** if no domain yet). Set in Supabase → Auth → SMTP
   (host / port / user / pass / sender). Unlocks reliable sending + template edits.
2. **Turn auto-confirm OFF** (`mailer_autoconfirm: false`). `signUp` then returns
   no session; the login code already branches on `data.session` and routes new
   sign-ups to `/verify` — **no app code change needed**.
3. **(For OTP code instead of just a link)** edit the "Confirm signup" email
   template to include `{{ .Token }}`. Only possible once custom SMTP (or Pro) is
   active. The `/verify` code-entry UI is already built and dormant until then.
4. **Align OTP length:** the project is set to **8 digits** (`mailer_otp_length: 8`),
   but the `/verify` input assumes 6 — set one to match (either
   `mailer_otp_length: 6` via Management API, or bump the input to 8).
5. **Same-device confirm link:** `/auth/confirm` uses the `token_hash` flow, so
   the email link must be `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   (custom template). Alternatively switch the route to `exchangeCodeForSession`
   for the default `ConfirmationURL`/PKCE link.
6. **Prod project + config:** swap the dev Supabase project/keys for prod; set
   Site URL + redirect allow list to the prod domain (currently
   `http://localhost:3000`).
7. **Rotate dev credentials** used during setup (Supabase publishable key,
   Management `sbp_` token, GitHub PAT).

---

## Future scope

- **Hair before/after comparison slider** — a draggable vertical divider on the
  hair preview to wipe between the original photo and the generated style. Was
  built then removed (2026-06-20) to keep the preview clean for now; re-add
  later as an optional toggle so it doesn't clutter the default view.

## Production readiness & hardening (pre-launch)

Flagged from a project review — none block dev, but all are needed before this
is a real, shippable product (and they materially raise its quality bar).

- **Deploy with a live URL** — host on Vercel against a *production* Supabase
  project (separate from the dev one). Ties into the SMTP/auth checklist above:
  prod must have email verification on and auto-confirm off.
- **Tests** — at minimum cover the auth redirect logic, the cache-key behaviour,
  and the analyze/preview routes (happy path + failure). None exist yet.
- **Robust error handling & states** — graceful failure UI for slow/failed image
  gen, network errors, and OpenAI/Supabase outages; retries where sensible.
- **Rate limiting & abuse protection** — the OpenAI routes (analyze / preview /
  haircare) are unthrottled; add per-user limits so generation can't be spammed
  (cost + abuse). Consider a captcha on signup once auto-confirm is off.
- **Observability** — basic logging/metrics on the AI routes (latency, failure
  rate, spend) so issues are visible.
- **Real usage signal** — get a handful of real users through the flow; capture
  a "looks like me" satisfaction signal and basic funnel metrics (PRD §9).

## Other known TODOs (not blocking dev)

- **Placeholder imagery:** category cards and the before/after proof frames are
  labeled placeholders — drop in real images.
- **Feature workflows:** the four PRD scan workflows (skin / hair / facial hair /
  wardrobe) and face-preserving AI image generation are not built yet.
- **Selfie persistence:** the scan selfie is stored client-side only
  (`sessionStorage`, not uploaded). Persist to Supabase storage when building the
  profile, with the PRD's privacy/DPDP constraints in mind.
- **Earlier commits (`472805d`, `c561ca8`)** carry the work email; later commits
  use the `shauraya-mohan` GitHub no-reply. Re-author only if desired.
