# Master Pending Work (Single Source of Truth)

Last updated: 2026-02-21
Owner: Product + Engineering
Scope: Frontend + Backend + Ops

## Immediate Hardening (Completed 2026-02-21)

- pilot-safe flags locked to OFF by default (backend + app dev helper)
- deployment artifacts added:
  - `PILOT_RUNBOOK.md`
  - `backend/PILOT_DEPLOYMENT_CHECKLIST.md`
  - backend scripts:
    - `pilot:config-check`
    - `pilot:health-check`
- QA automation strengthened with deterministic matching-policy/smoke/readiness checks
- admin observability improved with filtered `/api/v1/admin/logs` query support + summary payload

## P0 - Must do before pilot

1. Real SIM verification integration
- Completed:
  - added OTP-first auth flow in app (`EXPO_PUBLIC_AUTH_MODE=firebase_otp` default)
  - backend OTP endpoints added:
    - `POST /api/v1/auth/otp/request`
    - `POST /api/v1/auth/otp/verify`
  - Firebase token exchange endpoint added: `POST /api/v1/auth/firebase/token`
  - frontend Firebase phone-auth wiring added (recaptcha + credential verification path)
  - session issuance re-used from existing auth/session pipeline
  - legacy SIM-verification path retained behind mode switch (`sim_verify`) for fallback
- Pending:
  - configure real Firebase project/env values and validate on physical iOS + Android
  - remove backend OTP fallback path after Firebase rollout confidence
  - finalize production abuse controls and monitoring for auth traffic

2. Payment gateway integration
- Completed:
  - moved app flow from direct `/meets/:id/confirm` to payment intent + callback flow
  - added payment intent API (`/meets/:id/payment-intent`)
  - added callback + webhook APIs (`/payments/callback`, `/payments/webhook`)
  - added full payment states (`PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED`, `REFUNDED`)
- Pending:
  - connect real provider API credentials/orders (non-mock adapter path)
  - wire production webhook source/signing secret with provider dashboard

3. Matching engine v1
- Completed:
  - real queue + candidate selection + group formation
  - strict gender ratio rule (2F:3M or 3F:2M)
  - strict found flow (`/meets/found` only after matched in strict mode)
  - admin seed endpoint for strict-mode testing
  - controlled fallback behavior (`STRICT -> RELAXED_MIXED -> RELAXED_ANY`)
  - explicit SLA states in request payload (`SEARCHING`, `NO_MATCH_RETRYING`, etc.)
  - anti-starvation fairness boosts in group prioritization
- Pending:
  - deeper matching quality tuning (repeat-pair diversity + audio-aware scoring) in Phase 2

4. Preferences + audio backend persistence
- Completed:
  - full meet preference payload persisted on match requests
  - voice intro metadata endpoint added (`POST /api/v1/voice-intros`)
  - voice metadata + storage URL persisted on match request
  - server-side validation enforces minimum `voice_duration_sec >= 15`
- Pending:
  - replace local placeholder storage URL with real object storage (S3/GCS/Cloudinary)
  - store and index voice intro records in Postgres model (currently persisted via match requests)

5. Auth/session hardening
- Completed:
  - added in-memory rate limits on sensitive routes (auth, matching create, payments callback/webhook, admin)
  - added server logout endpoint (`POST /api/v1/auth/logout`)
  - added max concurrent sessions per user (`MAX_SESSIONS_PER_USER`, oldest pruned on new login)
  - added automated hardening test script (`backend/scripts/auth-hardening-test.js`)
- Pending:
  - refresh token strategy (currently access-token only)
  - distributed/shared rate limiting for multi-instance deployments
  - IP/device reputation based abuse scoring for stronger brute-force defense

6. Pilot QA + reliability pass
- Completed:
  - published cross-platform weak-network QA matrix: `hushh-app/PILOT_QA_WEAK_NETWORK_MATRIX.md`
  - standardized backend reliability automation command: `backend npm run pilot:qa`
  - added matching policy regression script: `backend npm run matching-policy:test`
  - standardized error mapping checklist for pilot scenarios (S1-S10)
- Pending:
  - execute full matrix run and attach evidence logs/screenshots for iOS + Android devices

7. Backend integration readiness (pre-production)
- Completed:
  - SMS + payment provider adapter layer added (env-driven switch from mock to real path)
  - per-route rate limits added on auth/verification/payments/admin-sensitive routes
  - idempotency added for critical write routes:
    - `/api/v1/payments/callback`
    - `/api/v1/payments/webhook`
    - `/api/v1/meets/:meet_id/confirm`
    - `/api/v1/meets/:meet_id/share-venue`
  - strict JSON-object validation added on critical write routes (payments callback/webhook, meet confirm/share)
  - automated readiness test script added (`backend/scripts/readiness-idempotency-test.js`)
  - locked API contract published (`backend/openapi.yaml`) with local verifier (`npm run openapi:check`)
  - locked dev-only helper routes behind explicit flags:
    - `DEV_MATCH_HELPERS_ENABLED=false` by default
    - `ADMIN_MATCHER_SEED_ENABLED=false` by default
- Pending:
  - run and document final cross-platform weak-network verification matrix (iOS + Android)

8. Native mobile wiring (iOS + Android)
- Completed:
  - real location permission request added in app flow
  - real coordinate capture added before matching
  - match request now sends `lat` and `lng` when available
  - iOS/Android location permission config added in app config
  - push token registration endpoint added (`POST /api/v1/notifications/push-token`)
  - app-side push token registration + notification listeners wired (`expo-notifications`)
  - backend match-found push dispatch wired for Expo push tokens
- Pending:
  - APNs/FCM credential finalization and production delivery verification
  - payment provider SDK/deep-link completion for iOS + Android
  - deep link / universal link finalization for auth/payment callbacks
  - release signing + EAS profiles + production build verification on both stores

## P1 - Strongly recommended after pilot start

1. Notification pipeline
- Real push notifications for match found, payment status, venue reveal.
- Delivery tracking + retry policy.

2. Admin portal upgrades
- Search/filter by route, user, status, time window.
- Export logs and failure reports.
- Alerting hooks (Slack/email) for high failure rate.

3. DB hardening
- Formal migration workflow and rollback playbook.
- Index tuning and query audit.
- Backup/restore and retention policy.

4. Security operations
- Admin key rotation and secret management policy.
- Environment separation and access controls.

5. Legal/compliance checkpoints
- Terms/Privacy consent capture.
- Auditability for consent and critical actions.

## P2 - Scale and product quality upgrades

1. Automated CI pipeline
- Run backend smoke tests on every PR/push.
- Add integration and frontend E2E test jobs.

2. Observability expansion
- Structured metrics dashboard (latency, failures by route, auth conversion).
- Incident runbooks + SLO/SLA definitions.

3. Matching quality iteration
- Add feedback-loop learning from outcomes.
- Improve explainability and user-facing “why matched” quality.

4. Architecture cleanup
- Continue modularizing large `App.js` orchestration into screen/state modules.
- Add typed DTO contracts shared between app/backend.

## Validation commands currently available

Backend smoke:
```bash
cd /Users/ashishsingh/NativeTestApp/backend
npm run smoke:test
```

Local Postgres mode:
```bash
cd /Users/ashishsingh/NativeTestApp/backend
USE_POSTGRES=true DATABASE_URL=postgresql://hushh:hushh@localhost:5432/hushh?schema=public npm run start
```

## MVP Launch Checklist (Execution Order)

### Gate A - Core user journey (P0)

1. OTP login stability (`IN_PROGRESS`)
- Pass criteria:
  - OTP request/verify succeeds on real device (iOS + Android)
  - Existing user routes directly to Home
  - New user routes to profile onboarding
- Validation:
```bash
cd /Users/ashishsingh/NativeTestApp/backend
npm run smoke:test
```

2. Match lifecycle consistency (`IN_PROGRESS`)
- Pass criteria:
  - `Ready to meet` vs `We're looking...` state always correct
  - stop/continue/look-another flows consistent
  - no cooldown-blocking toast during user CTA path
- Validation:
  - manual app run through preferences -> finding -> found -> look another -> home state

3. Payment flow correctness (`IN_PROGRESS`)
- Pass criteria:
  - payment intent -> callback -> confirmed state works
  - home card reflects confirmed meet(s)
- Validation:
```bash
cd /Users/ashishsingh/NativeTestApp/backend
npm run smoke:test
```

4. Location mandatory behavior (`DONE`)
- Pass criteria:
  - permission denied => blocked modal + no finding flow
  - permission granted => fresh location captured and match request created
  - already-granted users do not see permission popup repeatedly

5. Push notifications (`IN_PROGRESS`)
- Pass criteria:
  - token registration API returns `200`
  - backend emits `PUSH_TOKEN_REGISTERED` and `PUSH_SENT`
  - no duplicate push for single found meet
  - background receive/tap-open verified on real build
- Validation:
```bash
curl -s "http://192.168.0.124:3001/api/v1/admin/logs?limit=300" -H "x-admin-key: dev-admin-key" | jq '.data.logs[] | select(.path=="/api/v1/notifications/push-token")'
curl -s "http://192.168.0.124:3001/api/v1/admin/match-queue?limit=400" -H "x-admin-key: dev-admin-key" | jq '.data.events[] | select(.type=="PUSH_TOKEN_REGISTERED" or .type=="PUSH_SENT" or .type=="PUSH_FAILED")'
```

### Gate B - Production readiness (P0/P1 boundary)

1. Secrets/config hardening (`PENDING`)
- move env values to managed secret workflow
- rotate exposed keys if needed

2. Provider finalization (`PENDING`)
- OTP provider strategy final signoff for pilot
- payment provider real webhook/signature path (if enabled in pilot)

3. Pilot QA evidence pack (`PENDING`)
- run full weak-network matrix on iOS + Android
- save evidence links/screenshots/logs

### Gate C - Launch support

1. Ops runbook (`PENDING`)
- backend restart/run commands
- health/admin quick checks
- smoke test command
 - status: `DONE` (`PILOT_RUNBOOK.md`)

2. Monitoring baseline (`PENDING`)
- confirm admin dashboard usage for:
  - failed APIs
  - match events
  - push events
 - status: `DONE` (admin overview/logs/match-queue flow verified; push events visible once token registration is successful)
