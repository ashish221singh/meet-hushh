# Pilot QA + Weak Network Verification Matrix

Last updated: 2026-02-20
Owner: Product + Engineering + QA

## Scope

This matrix defines the final pre-pilot verification pass across:
- iOS (Expo Go)
- Android (Expo Go)
- normal and weak network conditions
- fresh and returning users

It validates frontend UX flow + backend reliability contracts.

## Preconditions

1. Backend running and reachable on LAN:

```bash
cd /Users/ashishsingh/NativeTestApp/backend
ADMIN_KEY=dev-admin-key npm run start
```

2. Expo app running against LAN backend:

```bash
cd /Users/ashishsingh/NativeTestApp/hushh-app
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:3001 npm run start -- --clear
```

3. Backend automated checks (must pass before manual mobile QA):

```bash
cd /Users/ashishsingh/NativeTestApp/backend
BASE_URL=http://localhost:3001 ADMIN_KEY=dev-admin-key npm run pilot:qa
```

Pass gate:
- `smoke:test` passes
- `auth-hardening:test` passes
- `readiness:test` passes
- `openapi:check` passes

## Network Profiles

Test each device in these conditions:
- `N1` Good Wi-Fi
- `N2` Weak network (high latency + packet loss)
- `N3` Temporary offline and recovery

How to simulate weak network (recommended):
- iOS/macOS: Network Link Conditioner profile (Very Bad Network)
- Android: use OS developer network throttling or hotspot with constrained bandwidth

## Device Matrix

- `D1`: iOS primary test device
- `D2`: Android primary test device

Required combinations:
- `D1 x N1`
- `D1 x N2`
- `D1 x N3`
- `D2 x N1`
- `D2 x N2`
- `D2 x N3`

## Test Scenarios

### S1 Fresh user onboarding
Steps:
1. Install/open app as new user.
2. Enter mobile number.
3. Complete SIM verification flow.
4. Complete onboarding profile.

Expected:
- No route-not-found errors.
- Onboarding appears for true new users only.
- Returning users skip onboarding.

### S2 Preferences + voice
Steps:
1. Open Meet Preferences.
2. Record voice intro >= 15 sec.
3. Continue.

Expected:
- <15 sec does not save.
- >=15 sec saves and preview works.
- Backend receives voice intro metadata + preference payload.

### S3 Location mandatory
Steps:
1. Tap Continue from preferences with location prompt.
2. Deny permission.
3. Try again and allow.

Expected:
- Denied: user blocked with clear popup + settings action.
- Allowed: flow continues to Finding screen.
- No silent fallback with null location for production path.

### S4 Match search state consistency
Steps:
1. Start search and go back to Home.
2. Observe Ready-to-Meet card state.
3. Stop finding.

Expected:
- While searching: Home shows “We’re looking for people nearby” + “View search status”.
- When stopped/no active request: Home shows “Ready to meet?” + “Yes, start looking”.
- No stale state mismatch.

### S5 Found meet transition
Steps:
1. Keep user on Finding screen.
2. Trigger real/dev match.
3. Observe transition.

Expected:
- Found meet opens automatically when backend returns match.
- No extra/noise toast overlays.
- Screen opens from top correctly.

### S6 Payment commitment flow
Steps:
1. Open Found meet.
2. Secure spot / Pay & Confirm.
3. Observe loader -> home transition.

Expected:
- Loader overlay appears without UI freeze.
- Payment callback updates backend state.
- Home reflects confirmed meet card.

### S7 Multiple open meets
Steps:
1. Confirm first meet.
2. Start looking again and confirm another.

Expected:
- Home shows multiple upcoming meet cards.
- `/api/v1/meets/open` and UI are consistent.

### S8 Venue reveal + details
Steps:
1. Keep confirmed meet with hidden venue.
2. Trigger share-venue path.

Expected:
- Status changes to `VENUE_SHARED`.
- Venue name/address appears in meet details and cards.

### S9 Past meet feedback + block
Steps:
1. Open past meet.
2. Submit feedback.
3. Block participant.

Expected:
- Feedback submit works with keyboard-safe CTA.
- Block/unblock APIs work and UI updates reliably.

### S10 Session/auth hardening
Steps:
1. Login/logout/login.
2. Validate old token invalidation.
3. Trigger auth burst attempts.

Expected:
- Logout invalidates session token.
- Rate limits produce controlled `429` with retry guidance.

## Error Mapping Verification

For each screen action, verify user-friendly handling of:
- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `RETRY_COOLDOWN`
- `RESPONSE_WINDOW_EXPIRED`
- `NOT_FOUND`
- `INVALID_JSON`
- `PAYLOAD_TOO_LARGE`

Expected UX rule:
- No raw backend code shown to end users.
- CTA remains usable after recoverable errors.

## Evidence to Capture

For each device/network combination:
- Start/end timestamp
- Build/commit reference
- Pass/fail per scenario (S1-S10)
- Screenshot/video for failures
- Backend log excerpt (route + status + latency)

## Exit Criteria (Pilot Ready)

All must be true:
1. Backend `npm run pilot:qa` passes.
2. S1-S10 pass on both iOS + Android in `N1`.
3. S1-S8 pass on both iOS + Android in `N2`.
4. Offline recovery (`N3`) passes for S1, S4, S5, S6.
5. No blocker/critical UI regression remains.

## Daily Re-run (until pilot start)

Run daily:

```bash
cd /Users/ashishsingh/NativeTestApp/backend
BASE_URL=http://localhost:3001 ADMIN_KEY=dev-admin-key npm run pilot:qa
```

Then execute a short manual sanity sweep:
- S4 match search state
- S5 found transition
- S6 payment flow
- S7 multiple meet cards
