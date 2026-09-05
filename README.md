# Meet Hushh

A quick-meet platform — match with someone nearby and meet in person, fast. Mobile app built with **Expo / React Native**, backed by Firebase auth.

## Stack
- **Expo / React Native** (`expo-router`, Reanimated)
- **Firebase** — phone/OTP auth (`@react-native-firebase`)
- Custom design system in [`src/ui/designSystem.js`](src/ui/designSystem.js)

## Structure
- `App.js` / `index.js` — entry
- `src/components/home/` — meet flow (match, ready-to-meet, meet details, past meets)
- `src/ui/` — design system + usage
- `*.md` — product & flow docs (meet flow architecture, onboarding, QA matrices)

## Setup
```bash
npm install
cp .env.example .env                 # fill in Firebase + API values
# add your own Firebase config (gitignored):
#   google-services.json      (Android, also at android/app/)
#   GoogleService-Info.plist  (iOS)
npx expo start
```

> Firebase config files and `.env` are gitignored. Download your own from the Firebase Console — see the `.example` stubs.

## Status
Frontend meet-flow built; see [`MASTER_PENDING_WORK.md`](MASTER_PENDING_WORK.md) for what's next.
