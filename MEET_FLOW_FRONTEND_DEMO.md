# Meet Flow Frontend Demo (No Backend)

## Purpose
This document captures the new frontend-only demo flow after onboarding:
- finding -> found meet -> secure spot payment -> home visibility -> meet details
- past meet -> feedback modal -> block user modal

## Screen State Model
Home tab (`homeFlowScreen`) now supports:
- `main`
- `preferences`
- `finding`
- `matchFound`
- `meetDetails`
- `pastMeet`

## Demo Navigation
1. `Ready to meet?` -> `Meet Preferences`
2. Continue + Allow location -> `Finding your meet`
3. `Preview matched group` -> `Found a meet`
4. `Secure your spot` -> secure spot modal
5. `Pay & Confirm` -> confirming overlay -> back to `main` with confirmed card on Home
6. Tap confirmed card -> `Meet Details`
7. From Home `Recent Meets` card -> `Past Meet`
8. `Give Feedback` -> feedback modal
9. Tap block icon on person row -> block confirmation modal

## UI/UX Rules Applied
- Existing design system tokens (`DS`) used for spacing, typography, radius, colors.
- Breathable vertical rhythm preserved in all new screens.
- Modal language and hierarchy match existing app tone.
- Touch targets kept >= 48px for actions.
- Bottom nav remains hidden in flow screens and visible in `main` only.

## Modal Behaviors
### Secure Spot
- Close button disabled while payment is confirming.
- `Pay & Confirm` starts loading state and completes after timeout (demo simulation).

### Feedback
- Star rating required for Submit.
- Optional free-text note.

### Block User
- Confirms block before action.
- Blocked users are retained in local state and reflected in row icon styling.

## Frontend Edge Cases Covered
- Prevent duplicate payment confirmation tap while in progress.
- Prevent closing secure-spot modal while payment is in progress.
- Feedback submit disabled until rating selected.
- Block action idempotent for already blocked user names.
- Logout clears all meet-flow UI states/modals and timers.

## Future Backend Wiring Points
- Replace payment timeout with backend payment status polling/webhook state.
- Replace static matched people with API response.
- Persist feedback and block actions to backend endpoints.
- Replace local upcoming-meet flag with backend meet status.
