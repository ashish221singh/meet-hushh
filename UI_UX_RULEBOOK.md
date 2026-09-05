# Hushh UI/UX Rulebook

## Purpose
Define baseline usability and visual standards for all mobile screens so design stays consistent, accessible, and production-ready with Hushh's obsidian brand language.

## Layout
- Use the design-system spacing scale: `4, 8, 16, 24, 32, 48, 64`.
- Mobile side gutter: `16px` minimum, `24px` comfortable, `28px` on large phones.
- Constrain readable content width to `420px` max (`DS.layout.contentMaxWidth`).
- Respect Safe Area on iOS and Android cutout devices.
- Use breathable top padding (`DS.layout.topPaddingBreathable`, currently `32px`) for first-visible content.
- Keep one clear primary action per section.

## Typography
- Use system typography (`system-ui` behavior) and keep weights `400/500/600`.
- Minimum body text size: `16px`.
- Secondary text minimum: `14px`.
- Inputs must be `16px` minimum to avoid iOS zoom.
- Maintain line-height around `1.5` for body and `1.2-1.3` for headings.

## Controls and Inputs
- Minimum touch target: `48x48` points.
- Preferred touch targets: `56px` for default CTAs, `64px` for prominent CTAs.
- Input radius: `16px`, card radius: `20px`, modal radius: `24px`, primary button radius: full.
- Use visible enabled/disabled states with clear contrast.
- Primary button text must remain readable at all states.

## Color and Contrast
- Use obsidian palette from `src/ui/designSystem.js` (`neutral` scale + brand colors).
- Body text should target WCAG contrast of at least `4.5:1`.
- Secondary/helper text should remain legible and avoid low-contrast grays.
- Never rely on color alone for state; pair with opacity or structure.

## Motion
- Use motion tokens from design system: `150ms`, `250ms`, `350ms`.
- Keep transitions meaningful and short.
- Splash/intro motion should not block users for too long.
- Avoid continuous motion that competes with reading tasks.

## Accessibility
- Add `accessibilityLabel` to form fields and actionable controls.
- Set `accessibilityRole` and disabled state for buttons.
- Ensure clear focus/active feedback and keyboard accessibility where applicable.
- Preserve readable text scaling and avoid cramped line-height.

## Keyboard and Input Behavior
- Every form screen must be keyboard-safe (`KeyboardAvoidingView` + scrollable container).
- On input focus, auto-scroll the focused field into visible area so keyboard never hides active typing.
- Use extra focus scroll offset (`DS.keyboard.extraScrollOffset`) to keep field and label visible.
- Keep `keyboardShouldPersistTaps=\"handled\"` on scrollable forms.
- Use `keyboardDismissMode` drag/interactive to allow easy keyboard dismissal.

## Mobile Experience Enhancements
- Prefer `56px` touch targets for primary CTA on dense form screens.
- Provide clear loading, success, and failure states for async actions.
- Keep actions near thumb zone when possible and avoid critical actions near screen edges.
- Use a persistent bottom navigation component for primary app sections (`Home`, `Profile`) on post-onboarding screens.
- Preserve copy exactly as approved by product/content; behavior updates must not alter copy.
- Use progressive disclosure: only ask for what is needed at each step.
- Add subtle haptic feedback for success/error actions when native support is added.
- Respect reduced motion settings and avoid non-essential long-running animations.

## Top-Notch Experience Checklist
- Add latency states by timing: immediate feedback (<100ms), loading affordance (>300ms), timeout guidance (>8s).
- Add offline/poor-network banners with retry paths.
- Add inline validation messages near fields (not only after submit).
- Add autosave for multi-step forms when backend is integrated.
- Add analytics events for form drop-off and verification failures to guide UX improvements.
- Add empty states and recovery states for every async screen.
- Add `allowFontScaling` checks and verify layouts with larger text accessibility sizes.
- Add dark-mode token mapping when product scope includes dark screens.

## Implementation Defaults (Current App)
- Side gutter and content width constraints are enforced in `App.js`.
- Input and button meet `48px` minimum touch target.
- Primary onboarding copy and helper text follow accessible size rules.
- Continue action uses semantic `Pressable` with accessibility state.
- Keyboard-safe layout and focused-input auto-scroll are implemented in `App.js`.
- Shared tokens/helpers live in `src/ui/designSystem.js` and must be reused for all new screens.
- New screen setup pattern is documented in `src/ui/USAGE.md`.
- Canonical design system reference lives in `HUSHH_DESIGN_SYSTEM.md`.
