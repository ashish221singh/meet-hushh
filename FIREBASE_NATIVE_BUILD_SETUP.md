# Firebase Native OTP Build Setup

This app now uses native Firebase phone auth (`@react-native-firebase/auth`) for OTP.

## 1) Required files in app root

Place both files directly inside `hushh-app/`:

- `hushh-app/google-services.json` (Android Firebase app config)
- `hushh-app/GoogleService-Info.plist` (iOS Firebase app config)

These paths are already wired in `app.json`.

## 2) Firebase console checks

- Authentication -> Sign-in method -> **Phone** enabled
- Add Android app package that matches your EAS build package id
- Add iOS app bundle id that matches your iOS build bundle id
- For Android phone auth, add SHA keys for your app signing setup

## 3) Install deps locally (updates lockfile)

```bash
cd /Users/ashishsingh/NativeTestApp/hushh-app
npm install
```

## 4) Build

```bash
eas build -p android --profile preview --clear-cache
eas build -p ios --profile production
```

## Notes

- Expo Go does not include RN Firebase native modules. Use EAS build/dev client.
- Backend token exchange remains unchanged: app still calls `/api/v1/auth/firebase/token` after Firebase OTP success.
