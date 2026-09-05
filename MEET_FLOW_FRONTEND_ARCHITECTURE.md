# Meet Flow Frontend Architecture

## Scope
Frontend-only implementation for demo of:
- finding
- match found
- secure spot
- meet details
- past meet
- feedback + block actions

File of implementation: `App.js`

## State Model
### Screen state
`homeFlowScreen`:
- `main`
- `preferences`
- `finding`
- `matchFound`
- `meetDetails`
- `pastMeet`

### Modal state
- `locationPromptVisible`
- `stopFindingConfirmVisible`
- `secureSpotModalVisible`
- `feedbackModalVisible`
- `blockModalVisible`
- `logoutConfirmVisible`

### Flow data state
- `isUpcomingMeetConfirmed`
- `isConfirmingPayment`
- `feedbackRating`
- `feedbackNote`
- `blockedPeople`
- `blockedPersonName`

### Async refs
- `paymentTimerRef` (demo payment completion simulation)

## Screen Contracts (Backend-ready)
### Finding
Inputs expected later:
- active request id
- estimated wait
- search status

Actions to wire:
- `Stop finding` -> `POST /api/v1/preferences/requests/:id/stop`

### Match Found
Inputs expected later:
- meetId
- time label
- participants[]
- venue visibility status

Actions to wire:
- `Look for another meet` -> `POST /api/v1/meets/:id/reject`
- `Secure your spot` -> payment intent creation

### Secure Spot Modal
Inputs expected later:
- amount
- currency
- fee reason

Actions to wire:
- `Pay & Confirm` -> create payment intent + verify callback

### Meet Details
Inputs expected later:
- meet status
- final venue details
- participants list
- host review/note
- payment receipt reference

Actions to wire:
- `Get Directions` deep link
- optional share action

### Past Meet
Inputs expected later:
- completed meet metadata
- participants list
- payment total

Actions to wire:
- feedback submit endpoint
- block user endpoint

## Event Handlers (Current)
- `openMatchFoundPreview`
- `openSecureSpotModal`
- `confirmSecureSpot`
- `openMeetDetails`
- `openPastMeet`
- `openFeedbackModal`
- `submitFeedback`
- `requestBlockPerson`
- `confirmBlockPerson`

## Edge-case Policies Implemented
- Payment confirm tap is idempotent while `isConfirmingPayment=true`.
- Secure spot modal cannot be closed during payment confirmation.
- Transitioning away from match/finding clears modal + payment timer.
- Feedback submit disabled until user sets a rating.
- Block action is idempotent by user name in local state.
- Logout clears all meet-flow states/timers/modals.

## Backend Integration Plan
1. Replace static constants (`MATCHED_PEOPLE`, labels, amounts) with API response mapping layer.
2. Replace payment timeout simulation with real payment status transition.
3. Persist feedback and block actions through API.
4. Hydrate `isUpcomingMeetConfirmed` from `GET /api/v1/meets/active`.
5. Keep UI state machine unchanged; only replace data providers and side effects.

## Backend Wiring Status (Implemented)
- `GET /api/v1/meets/active` wired in `App.js` via `refreshActiveMeet()`.
- `GET /api/v1/meets/found` wired in `openMatchFoundPreview()` via `fetchFoundMeet()`.
- `POST /api/v1/meets/:meet_id/confirm` wired in `confirmSecureSpot()` (removed timeout-only simulation).
- `POST /api/v1/meets/:meet_id/share-venue` wired in `markVenueShared()`.
- `POST /api/v1/meets/:meet_id/feedback` wired in `submitFeedback()`.
- `POST /api/v1/users/block` wired in `confirmBlockPerson()`.

Notes:
- UI fallbacks still exist if backend meet payload is absent, so demo remains usable offline.
- Payment loader/overlay UX is retained; now driven by real async API completion.

## Recommended API DTO Shapes
```ts
interface MatchedPerson {
  id: string;
  name: string;
  age: number;
  subtitle: string;
  voiceSnippetUrl?: string;
  isBlocked?: boolean;
}

interface ActiveMeet {
  id: string;
  status: 'matching' | 'found' | 'confirmed' | 'completed';
  scheduledAt: string;
  venue: {
    isHidden: boolean;
    title: string;
    addressLine: string;
  };
  participants: MatchedPerson[];
  fee: {
    amount: number;
    currency: 'INR';
    paid: boolean;
  };
}
```

## Testing Checklist (Frontend)
- Preferences -> finding -> match -> secure spot -> home confirmed card
- Match screen cancel/back + secure modal open/close behavior
- Payment in progress then back attempts
- Meet details open from home card
- Past meet open from recent card
- Feedback modal rating gate
- Block modal confirm/cancel
- Logout cleanup from each screen/modal state

## Componentized Structure (Refactor)
- `src/components/home/MatchFoundScreen.js`
  - match list, hidden venue section, secure CTA, payment-confirming overlay
- `src/components/home/MeetDetailsScreen.js`
  - confirmed meet details, map hero, directions CTA, participants, payment summary
- `src/components/home/PastMeetScreen.js`
  - past meet details, people list, block trigger, feedback CTA
- `src/components/home/MeetFlowModals.js`
  - `SecureSpotModal`
  - `FeedbackModal`
  - `BlockUserModal`

`App.js` now handles orchestration/state and passes data/handlers into these components.
