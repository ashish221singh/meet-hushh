# Audio-Driven Matching Logic (Brainstorm + Technical Spec)

## 1) Goal

Use a short voice intro (15s+) to create better, more human matches than form fields alone, while keeping safety, privacy, and consent first.

Primary outcomes:
- Higher conversation quality
- Lower awkward first-meet mismatch
- Faster "this feels right" decisions

---

## 2) Product Principles

1. Audio should improve matching quality, not become a hard gate.
2. Match on compatibility and context, not popularity.
3. Respect user privacy: no "creepy" inference, no hidden profiling.
4. Keep users in control with clear feedback and fallback paths.

---

## 3) What We Can Analyze From Voice Notes

## 3.1 Safe + useful signals
- Transcript-level intent:
  - interests, activities, social intent
  - preferred social energy (calm/chill/energetic)
  - conversation themes (books, startups, travel, fitness, etc.)
- Prosody/communication style:
  - speaking pace (slow/medium/fast)
  - pause density
  - expressiveness (low/medium/high variance)
  - confidence markers (hedging vs directness)
- Audio quality confidence:
  - signal-to-noise estimate
  - intelligibility confidence

## 3.2 Signals to avoid or constrain
- No inference of protected traits (religion/caste/politics/health).
- No biometric identity matching as a ranking factor.
- No attractiveness/popularity scoring.
- No accent-based discrimination logic.

---

## 4) Matching Inputs (Multi-Modal)

Final matching should combine:
- Structured preferences:
  - availability
  - vibe
  - age range
  - location proximity
- Audio-derived features:
  - semantic embedding from transcript
  - communication style embedding
  - confidence score for extraction quality
- Operational constraints:
  - active request freshness
  - group capacity
  - safety/risk flags

---

## 5) Audio Feature Pipeline

## Step A: Preprocess
- Validate duration >= 15s
- Denoise/light normalization
- VAD (voice activity detection)

## Step B: Speech-to-text
- ASR model output:
  - transcript
  - word timestamps
  - confidence

## Step C: Semantic extraction
- Generate text embedding for transcript.
- Extract entities/topics:
  - interests
  - social setting preference
  - meet intent tone

## Step D: Prosody extraction
- Features:
  - avg words per minute
  - pause ratio
  - pitch/energy variance bands (coarse bins)

## Step E: Confidence + quality
- Build `audio_quality_score` and `analysis_confidence`.
- If confidence low, reduce audio weight in ranking.

---

## 6) Candidate Generation

Filter candidate pool first (hard constraints):
1. Same city/zone
2. Availability overlap
3. Age-window compatibility
4. Vibe compatibility
5. Safety constraints

Then rank with soft signals.

---

## 7) Ranking Score (Detailed)

Use weighted score:

`final_score = w1*preference_fit + w2*semantic_fit + w3*style_fit + w4*distance_fit + w5*freshness + w6*diversity_boost - penalties`

Recommended initial weights:
- `w1 preference_fit`: 0.30
- `w2 semantic_fit`: 0.28
- `w3 style_fit`: 0.14
- `w4 distance_fit`: 0.14
- `w5 freshness`: 0.08
- `w6 diversity_boost`: 0.06

Penalties:
- low confidence transcript
- repeated recent pairings
- stale/near-expiry request

## 7.1 Preference fit
- Exact vibe match gets highest boost.
- Availability overlap score:
  - exact same slot > adjacent slot.
- Age compatibility:
  - hard fail if outside requested band.

## 7.2 Semantic fit
- Cosine similarity over transcript embeddings.
- Topic overlap bonus (shared interests).
- "Intent contradiction" penalty (e.g., one wants deep talk, one explicitly casual only).

## 7.3 Style fit
- Pace compatibility bands.
- Expressiveness compatibility bands.
- Not same-only: complement can score too (configurable matrix).

## 7.4 Distance fit
- Bucketed proximity scoring (e.g., 1-2km, 2-5km, 5-10km).
- Keep exact coordinates hidden from users.

## 7.5 Freshness + response likelihood
- Newer active requests rank higher for responsiveness.

## 7.6 Diversity boost
- Reduce repetitive "same type always" outcomes.
- Improve exploration while preserving compatibility floor.

---

## 8) Group Matching Logic (If Group >2)

For N-user group:
1. Build pairwise compatibility matrix.
2. Optimize for:
  - high average compatibility
  - low min-pair compatibility risk
3. Reject group if any pair is below safety/compatibility threshold.

## 8.1 Group Composition Ratio Rule

For standard 5-person meet groups:
- Allowed composition:
  - `2 female + 3 male`, or
  - `3 female + 2 male`

This rule should be enforced at candidate selection time before final group lock.

Implementation note:
- Treat ratio as a hard constraint in phase 1 rollout.
- If ratio cannot be satisfied within SLA:
  - keep request in queue longer, or
  - ask user for consent to flexible composition (future option), or
  - expire gracefully with retry suggestion.

Data requirement:
- profile gender value must be present and validated (`Male | Female | Other`).
- For users marked `Other`, define policy explicitly before production:
  - either separate composition policy, or
  - configurable inclusion logic by consent and local rules.

Good heuristic:
- Maximize `mean(pair_score) - lambda * variance(pair_score)`
- ensures no single bad edge ruins group quality.

---

## 9) Delightful UX Layer

Use matching explanations that feel human, not robotic:
- "Matched because you both prefer calm coffee conversations."
- "You both sounded interested in startup/product chats."

Avoid exposing raw model internals.
Provide small confidence framing:
- "Strong match on vibe + interests"
- "Good match nearby and available now"

Progressive experience:
1. "Finding your meet..."
2. "We found someone with a similar vibe"
3. "Meet suggestion ready"

---

## 10) Feedback Loop (Learning)

Collect post-meet feedback:
- "Good conversation?" (yes/no/neutral)
- "Would meet similar people again?"
- "Was vibe accurate?"

Use as labels to tune weights:
- short-term: rules + weight updates
- medium-term: pair outcome prediction model

Important:
- Keep opt-in and lightweight.

---

## 11) Safety + Fairness Guardrails

Hard requirements:
- No protected-attribute inference usage.
- Bias audits by language/accent quality bands.
- If ASR confidence low, degrade gracefully to preference-only matching.
- Human override/rule-based blocklist support.

Monitoring:
- match acceptance rate by cohort
- mismatch report rate
- "unsafe feel" feedback rate

---

## 12) Data Model Additions (Audio Matching)

Suggested tables:
- `voice_notes`
  - `id`, `user_id`, `storage_url`, `duration_seconds`, `mime_type`, `created_at`
- `voice_analysis`
  - `voice_note_id`
  - `transcript`
  - `asr_confidence`
  - `semantic_embedding` (vector)
  - `pace_band`, `expressiveness_band`, `pause_ratio_band`
  - `analysis_version`
  - `created_at`
- `match_decisions`
  - `request_id`, `candidate_user_id`
  - `preference_fit`, `semantic_fit`, `style_fit`, `distance_fit`, `final_score`
  - `decision` (selected/rejected)
  - `created_at`

---

## 13) Rollout Plan

Phase 1 (Pilot-safe):
- Preference + distance matching as core.
- Audio semantic similarity only (small weight).
- No style-fit in hard decisions yet.

Phase 2:
- Add style-fit as soft factor.
- Add explanation snippets.

Phase 3:
- Feedback-trained ranking with guardrails.
- Group-quality optimizer.

---

## 14) MVP Decision Rules (Practical)

If audio processing fails:
- fallback to structured preferences + location.

If transcript confidence < threshold:
- set `semantic_fit` weight low.

If voice duration < 15s:
- block request submission.

If no suitable match in SLA window:
- notify user with update and broaden radius/slot (with consent).

---

## 15) Success Metrics

Primary:
- Match acceptance rate
- Post-meet positive feedback
- Repeat request rate

Secondary:
- Time-to-first-match
- Drop-off at preference/recording step
- Audio analysis success/confidence distribution

Safety:
- Negative/safety feedback rate
- Block/report rate
