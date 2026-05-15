// AUTO-MAINTAINED — mirror of docs/PRIVACY.md without the H1 title line.
// Update both files together when revising.
export const PRIVACY_BODY = `**Last updated:** 2026-05-15
**Effective:** 2026-05-15

EVO TV ("EVO TV", "we", "our", "us") respects your privacy. This Privacy Policy explains what personal data we collect when you use the EVO TV mobile app, web app, partner dashboard, and any related services (collectively, the "Service"), how we use that data, who we share it with, and what choices you have.

By using the Service you agree to this Policy. If you do not agree, do not use the Service.

---

## 1. Who we are

EVO TV is operated by the EVO TV team based in Nigeria. Questions: **privacy@evotv.app**.

---

## 2. What we collect

### 2.1 Information you provide
- **Account details** — email, password (hashed), display name, handle, country.
- **Profile content** — avatar image, bio, follow lists.
- **Content you create** — clips, chat messages, comments, watch-party messages, reports you submit.
- **Payment information** — only payment-method tokens issued by our processor (Paystack). We never see or store your raw card / bank details.
- **Communication** — emails / support requests you send us.

### 2.2 Information collected automatically
- **Watch activity** — which streams / VODs / clips you watched, for how long, when (used for recommendations, viewer counts, watch-history).
- **Device info** — model, OS version, app version (crash reports + compatibility).
- **Approximate location** — derived from your IP address (city + country only, never precise GPS).
- **IP address** — hashed at rest with a salted SHA-256 so we can detect abuse + ban-evasion without storing raw IPs long-term.
- **Authentication events** — sign-in time, success/failure, hashed IP + device ID. 100-record per-user cap.
- **Sentry** — anonymized error / crash reports (when enabled).

### 2.3 Cookies + similar
- **Session cookie** — HttpOnly, sets you as signed in. Survives 30 days.
- **localStorage** (web only) — session token mirror, theme preference.
- **No third-party tracking pixels.** No Google Analytics. No Facebook Pixel.

---

## 3. Third-party processors

We use Vercel (hosting), Neon (Postgres), Vercel Blob (media storage), Paystack (payments), Better-Auth (auth framework), Sentry (crash reports), Google OAuth (optional sign-in), Resend (transactional email), and EAS Updates (app OTAs).

We do not sell your data to anyone. We do not share it with advertising networks.

---

## 4. How we use your data

- Authenticate you and keep you signed in.
- Deliver the Service: recommend streams, count viewers, render chat, place orders, process tips.
- Process payments and partner payouts via Paystack.
- Detect and stop abuse, harassment, spam, fraud, and ban evasion.
- Send service emails (verify, reset password, receipt). We don't send marketing emails without opt-in.
- Comply with legal obligations (court orders, regulator requests).
- Improve the Service via aggregated, anonymized analytics.

---

## 5. Your rights

You have the right to:

- **Access** your data — email privacy@evotv.app.
- **Correct** wrong data — edit your profile or ask us.
- **Delete** your account — Settings → Danger zone → Delete account. We mark you for deletion, revoke all sessions, and run a 30-day grace window. After 30 days, the GDPR purge job permanently removes your personal data (watch history, chats, clips, login events, API keys, party messages). The user row is anonymized so comments and tips you sent remain readable.
- **Object** to a specific use — email us.
- **Port** your data — request a machine-readable export.
- **Withdraw consent** — for anything that depends on consent.

GDPR + NDPR (Nigeria Data Protection Regulation) apply.

---

## 6. Data retention

- **Active account data** — while your account is active.
- **Watch events** — 90 days (rolled up into anonymous analytics after).
- **Login events (forensic)** — 180 days, then purged.
- **Chat messages** — while the parent stream/party exists.
- **Deleted-account residue** — 30 days then anonymized.
- **Audit log (admin actions)** — 7 years (legal/compliance).
- **Payment records** — 7 years (Nigerian tax law).
- **Sentry errors** — 90 days.

---

## 7. Security

- Passwords hashed with bcrypt.
- Sessions revocable via sign-out or admin sanction.
- IPs hashed with a private salt before storage.
- HTTPS everywhere (Vercel-managed TLS).
- Rate limits on auth endpoints.
- No raw payment card / bank data ever touches our servers — handled by Paystack.

Despite our efforts, no system is 100% secure. If your account is compromised, email security@evotv.app.

---

## 8. Children

EVO TV is **not intended for users under 13**. Users 13–17 should have parental consent.

---

## 9. International transfers

Your data may be processed outside Nigeria (Vercel + Neon are US-based). We rely on standard contractual clauses for transfers.

---

## 10. Changes

We may update this Policy. Material changes are announced in-app + via email. Continued use after a revision is acceptance.

---

## 11. Contact

**privacy@evotv.app**
EVO TV team
Lagos, Nigeria

For Nigerian regulatory questions: NDPR enquiries to the same address.`;
