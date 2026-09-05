# Set Preference Flow: Product + Data + Technical Architecture

## 1. Purpose

This document defines the end-to-end "Set Preference" flow (after user taps `Yes, start looking`) and the recommended backend/database architecture to persist all related data for pilot and production.

---

## 2. User Flow (Frontend)

## 2.1 Entry
- User is on Home screen.
- User taps `Yes, start looking`.
- App navigates to `Define your preferences`.

## 2.2 Preferences Screen
- Availability selection:
  - `Today`
  - `Tomorrow`
  - `This Weekend`
- Vibe selection:
  - `Coffee`
  - `Meal`
  - `Party`
- Age preference:
  - `age_min`
  - `age_max`
- Voice intro:
  - Record real audio.
  - Minimum 15 seconds required.

### Continue CTA enabled only when:
- availability selected
- vibe selected
- valid age range
- voice recording exists
- voice duration >= 15 seconds

## 2.3 Location Permission Modal
- Triggered when user taps `Continue`.
- Options:
  - `Not now` -> stays on preference screen
  - `Allow` -> moves to finding flow

## 2.4 Finding Screen
- Shows "Finding your meet" state.
- Displays guidance cards (while-you-wait, privacy).
- `Stop finding` returns user to Home main.

---

## 3. Data Points to Persist

Each preference submission should persist:

- `user_id`
- `availability` (`Today | Tomorrow | This Weekend`)
- `vibe` (`Coffee | Meal | Party`)
- `age_min` (integer)
- `age_max` (integer)
- `voice_note_url` (storage URL)
- `voice_duration_seconds` (integer)
- `location_permission_status` (`granted | denied | blocked | not_now`)
- `lat_approx` (optional, rounded)
- `lng_approx` (optional, rounded)
- `search_status` (`searching | stopped | matched | expired`)
- `created_at`
- `updated_at`

Optional but recommended:
- `device_platform` (`ios|android`)
- `app_version`
- `timezone`

---

## 4. API Architecture

## 4.1 Upload voice note
`POST /api/v1/preferences/voice-upload-url`

Request:
```json
{
  "mime_type": "audio/m4a"
}
```

Response:
```json
{
  "upload_url": "https://...",
  "file_url": "https://cdn.../voice/abc.m4a"
}
```

Client uploads file to `upload_url`.

## 4.2 Save preference request
`POST /api/v1/preferences/requests`

Request:
```json
{
  "availability": "Today",
  "vibe": "Coffee",
  "age_min": 18,
  "age_max": 35,
  "voice_note_url": "https://cdn.../voice/abc.m4a",
  "voice_duration_seconds": 16,
  "location_permission_status": "granted",
  "lat_approx": 12.9716,
  "lng_approx": 77.5946
}
```

Response:
```json
{
  "request_id": "prefreq_...",
  "search_status": "searching",
  "estimated_wait_minutes": 360
}
```

## 4.3 Stop finding
`POST /api/v1/preferences/requests/:request_id/stop`

Response:
```json
{
  "request_id": "prefreq_...",
  "search_status": "stopped"
}
```

## 4.4 Get active request
`GET /api/v1/preferences/requests/active`

Used for app resume/reopen recovery.

---

## 5. Database Design (PostgreSQL Recommended)

## 5.1 `users`
- `id` (pk, uuid)
- `phone_e164` (unique)
- `country_code`
- `created_at`
- `updated_at`

## 5.2 `profiles`
- `id` (pk, uuid)
- `user_id` (fk -> users.id, unique)
- `full_name`
- `gender`
- `age`
- `profession`
- `onboarding_completed` (bool)
- `created_at`
- `updated_at`

## 5.3 `preference_requests`
- `id` (pk, uuid)
- `user_id` (fk -> users.id, indexed)
- `availability` (enum)
- `vibe` (enum)
- `age_min` (smallint)
- `age_max` (smallint)
- `voice_note_id` (fk -> voice_notes.id, nullable until upload complete)
- `location_permission_status` (enum)
- `lat_approx` (decimal(9,6), nullable)
- `lng_approx` (decimal(9,6), nullable)
- `search_status` (enum: searching/stopped/matched/expired)
- `matched_group_id` (nullable)
- `created_at`
- `updated_at`

## 5.4 `voice_notes`
- `id` (pk, uuid)
- `user_id` (fk -> users.id, indexed)
- `storage_url`
- `duration_seconds`
- `mime_type`
- `size_bytes`
- `created_at`

## 5.5 `request_events`
- `id` (pk, uuid)
- `request_id` (fk -> preference_requests.id, indexed)
- `event_type` (created/stopped/matched/expired/notification_sent)
- `event_payload` (jsonb)
- `created_at`

## 5.6 `api_logs` (optional if external observability is used)
- `id` (pk, bigserial)
- `path`
- `method`
- `status_code`
- `duration_ms`
- `user_id` (nullable)
- `request_id` (nullable)
- `error_code` (nullable)
- `created_at`

---

## 6. Validation Rules

- `age_min >= 18`
- `age_max <= 99`
- `age_min <= age_max`
- `voice_duration_seconds >= 15`
- `availability` in allowed enum
- `vibe` in allowed enum
- if `location_permission_status = granted`, lat/lng should exist (approx precision allowed)

---

## 7. Privacy & Security

- Store only approximate location for matching.
- Never expose exact coordinates to other users.
- Voice file access should be private (signed URL or private bucket + proxy).
- Encrypt tokens and enforce auth for all preference APIs.
- Add rate limiting on creation endpoints.

---

## 8. Suggested Backend Processing

After `preference_requests` insert:
1. Mark request as `searching`.
2. Push matching job to queue.
3. Matcher evaluates compatible users by vibe, availability, age window, and distance bucket.
4. On match:
   - update `search_status = matched`
   - create event `matched`
   - send push notification.

---

## 9. Frontend-to-Backend Mapping (Current vs Target)

Current frontend has:
- UI states for preference/finding flow
- real audio recording
- min 15s gating
- location permission modal UI

Target integration next:
- replace local-only preference state with API submission
- upload voice file first, then submit `voice_note_url`
- persist active request and recover with `/active` on app launch

---

## 10. Pilot Rollout Plan

1. Implement DB schema + migrations.
2. Add voice upload API + storage integration.
3. Add preference request APIs.
4. Connect current frontend flow to APIs.
5. Add admin dashboard section for active preference requests.
6. Run pilot with telemetry (conversion, error rates, match time).
