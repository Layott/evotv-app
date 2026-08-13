// AUTO-MAINTAINED - mirror of docs/PRIVACY.md without the H1 title line.
// Update both files together when revising.
//
// This is the same document the website serves at evotv.co/privacy, in the
// markdown the in-app renderer understands. Two policies for one service is how
// a service ends up contradicting itself in writing, so the wording is the
// site's wording. The only additions are the things that are true of a phone
// and not of a browser: push tokens, and where the session is kept on the
// device. If you change one, change the other in the same commit.
export const PRIVACY_BODY = `**Last updated:** 2026-08-13

EVO TV is operated from Lagos, Nigeria. This explains what we collect, why, who we share it with, and how to make us delete it. It covers evotv.co and the EVO TV mobile apps.

---

## Who we are

EVO TV is a streaming service for esports, anime and lifestyle programming. For the purposes of the Nigeria Data Protection Act 2023, we are the data controller for the information described here.

Questions, requests or complaints: **privacy@evotv.co**

---

## What we collect

When you create an account:

- Your email address and name. Both are required to have an account.
- A handle, profile picture, short bio and country, if you choose to add them.
- A password, stored only as a hash. We cannot read it, and neither can anyone who obtains the database.

When you use the service:

- What you watch and roughly for how long, recorded as one row per minute of viewing. This is how live viewer counts work and how we know which programmes people actually watch.
- Messages you send in chat, and polls you vote in.
- Things you follow, like, add to a watchlist, or leave part-watched.
- Orders you place, including the delivery address you enter.
- Your IP address. It is stored as a one-way hash for anonymous viewer counting, and in full only on the session record, so that you can see and revoke your own sign-ins.

From the mobile app specifically:

- A push notification token, if you allow notifications. It identifies the installation, not you, and it is deleted when you sign out or turn notifications off.

We do not collect your location beyond the country you tell us, we do not buy data about you from anyone, and we do not run advertising or analytics trackers belonging to third parties.

---

## Why we are allowed to hold it

- **To provide the service.** An account, a viewing history and an order cannot exist without the data that describes them. This is contractual necessity.
- **To keep it working and safe.** Session records, moderation and abuse handling rest on our legitimate interest in a service that functions and is not hostile to use.
- **Because you asked.** Marketing email and push notifications are consent, given by opting in and withdrawn by turning them off. Nothing else depends on that consent.
- **Because the law requires it.** Payment and order records are kept for the period tax and consumer law demands, even after an account is closed.

---

## Who else touches it

We use a small number of processors. Each gets only what it needs to do its job, and none may use your data for their own purposes.

- **DigitalOcean** hosts the service, the database and uploaded files, in Frankfurt, Germany.
- **Paystack** processes payments. Card details go to Paystack directly and never reach our servers, so we never hold them.
- **Resend** and **Google** deliver transactional email such as sign-in codes and receipts.
- **Google** also receives your email address and name, but only if you choose to sign in with a Google account.
- **Cloudflare** may deliver video when a broadcast is served from its network.
- **Expo**, and through it **Apple** or **Google**, carry push notifications to your device if you have allowed them.

We do not sell your data. We will not share it with anyone else unless you ask us to, or unless a valid legal order requires it, in which case we will tell you where we are permitted to.

---

## Where it is stored

Our servers are in Frankfurt, Germany, so data about Nigerian users leaves Nigeria. Those transfers rest on the safeguards the Nigeria Data Protection Act 2023 provides for countries with adequate protection, and our processors are bound by contract to the standards we hold ourselves to.

---

## How long we keep it

- Your account and profile: until you delete the account.
- Viewing records: 24 months, after which they become counts that identify nobody.
- Chat messages: 12 months, or until the stream they belong to is deleted.
- Orders and payment records: 7 years, because tax law requires it.
- Sign-in sessions: in a browser, 3 hours from last use. In the app, 7 days from last use. Either way, immediately when you sign out.

---

## Your rights

Under the Nigeria Data Protection Act 2023 you may ask us for a copy of your data, correct anything wrong, delete your account and its data, object to a particular use, or withdraw consent you have given.

Most of it you can do yourself in Settings. For anything else, email **privacy@evotv.co** and we will respond within 30 days. If we get it wrong, you can complain to the Nigeria Data Protection Commission.

---

## What is kept on your device

The app stores your sign-in token in the device keystore (Keychain on iOS, Keystore on Android), and keeps small preferences such as your theme and what you follow in local storage. On the web it uses cookies to keep you signed in and to remember which interface your account should see. That is all they do. There are no advertising cookies and no third-party tracking, which is why you are not being asked to dismiss a consent banner.

Signing out clears all of it.

---

## Children

EVO TV is not intended for children under 13, and we do not knowingly collect their data. Some programming carries an age rating and is restricted accordingly. If you believe a child has given us their information, email us and we will remove it.

---

## Changes

If this policy changes in a way that affects you, we will email you before it takes effect, rather than quietly changing the date at the top.

---

## Contact

**privacy@evotv.co**
`;
