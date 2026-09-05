# Onboarding Pending Items (For Pilot Phase)

These are intentionally deferred and will be implemented before/for pilot user rollout.

Canonical pending list has moved to:
- `MASTER_PENDING_WORK.md`

1. Real SIM verification (production flow)
- Remove `mock-verify` from app flow.
- Open SMS composer using backend `sms_destination` + `sms_body`.
- Poll `/api/v1/auth/sim/status` until `VERIFIED`.

2. Session lifecycle polish
- Handle expired/invalid token with clean UX (auto logout + relogin prompt).
- Finalize session duration/TTL policy.

3. Backend hardening
- Add rate limiting for verification and token endpoints.
- Improve validation + abuse protection.
- Expand structured audit/error logging.

4. Storage upgrade
- Move from JSON file store to PostgreSQL.
- Add schema/migrations for users, sessions, verification requests, profiles, logs.

5. Reliability UX for onboarding
- Better retry states for API/network failures.
- Add "Can't receive SMS?" fallback path.
- Map backend error codes to user-friendly messages.

6. Real SMS verification compliance details
- Country-specific SMS format and delivery testing.
- SMS timeout and resend policy UX.

7. Security operations basics
- Admin key rotation strategy (remove default key usage).
- Secrets/environment management for production deployments.

8. QA readiness for pilot
- End-to-end test checklist: fresh user vs returning user.
- Device/network matrix testing (iOS, Android, weak network scenarios).

9. Legal/consent checkpoint
- Add Terms/Privacy consent checkpoint if required for pilot.
