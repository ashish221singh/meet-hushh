# Hushh Design System

## Overview
Hushh is a hyperlocal group meeting platform with a premium obsidian aesthetic. This system combines deep blacks, neutral layering, rounded UI, strict mobile-first spacing, and accessibility defaults.

## Brand Principles
- Anti-feed: real-world connection over infinite scroll.
- Hyperlocal: nearby meetups, not virtual chat.
- Premium minimal: clean, confident interface language.
- Privacy-first: no chats, no media, no public profiles.

## Color System
Primary tokens are implemented in `src/ui/designSystem.js`.

### Neutrals
- `neutral.n50` `#fafafa`
- `neutral.n100` `#f5f5f5`
- `neutral.n200` `#e5e5e5`
- `neutral.n300` `#d4d4d4`
- `neutral.n400` `#a3a3a3`
- `neutral.n500` `#737373`
- `neutral.n600` `#525252`
- `neutral.n700` `#404040`
- `neutral.n800` `#262626`
- `neutral.n900` `#171717`
- `neutral.n950` `#0a0a0a`

### Brand & semantic
- Black `#000000`, White `#ffffff`
- Accent `#2563eb` (+ dark `#1e40af`, light `#3b82f6`)
- Success `#059669`, Error `#dc2626`
- Surface `#fafafa`, elevated surface `#ffffff`

### Gradients
- Primary CTA gradient: `#4f46e5 -> #ec4899 -> #f59e0b`
- Dark overlay: `#000000 -> transparent -> transparent`

## Spacing
- Scale: `4, 8, 16, 24, 32, 48, 64`
- Container padding: `16` minimum, `24` comfortable
- Side gutters: `16` minimum, `24` default, `28` for large phones
- Breathable top padding for screens: `32`

## Typography
- System typography baseline (`system-ui` behavior)
- Weights: `400`, `500`, `600`
- Scale: `12, 14, 16, 18, 20, 24, 30`
- Inputs: minimum `16px`
- Body line-height: `~1.5`

## Radius
- `8, 12, 16, 20, 24, full`
- Input default: `16`
- Card default: `20`
- Modal default: `24`
- Primary CTA default: `full`

## Touch Targets
- Minimum: `48`
- Comfortable default: `56`
- Large primary actions: `64`

## Keyboard-Safe Forms
- All form screens must use keyboard-safe layout handling.
- Focused input must auto-scroll into visible area (input and label should stay visible).
- Use extra keyboard scroll offset `24`.

## Motion
- Durations: `150ms`, `250ms`, `350ms`
- Easing: `inOut`, `in`, `out`, `spring`
- Prefer animating `transform` and `opacity`
- Respect reduced motion preferences

## Shadows & Elevation
- Minimal, soft, elevated presets are provided in `DS.shadow`
- Use lower shadows by default for performance and visual restraint

## Accessibility Rules
- WCAG AA contrast targets
- 48px+ touch targets
- Explicit labels/roles/states for interactive elements
- Do not rely on color only for state communication

## Copy Rules
- Keep copy concise, direct, and action-oriented
- Do not alter approved product copy when implementing validation/features

## Implementation Reference
- Tokens: `src/ui/designSystem.js`
- Usage: `src/ui/USAGE.md`
- UI/UX rules: `UI_UX_RULEBOOK.md`
- Current app flow context: `CONTEXT_SUMMARY.md`
