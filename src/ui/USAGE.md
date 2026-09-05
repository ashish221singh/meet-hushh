# Design System Usage

Use `src/ui/designSystem.js` in every new screen.

## Required pattern for each screen
- Import `DS` and `getSideGutter`.
- Use `paddingHorizontal: getSideGutter(screenWidth)` for the root content wrapper.
- Keep content width capped with `maxWidth: DS.layout.contentMaxWidth`.
- Use breathable top spacing (`paddingTop: DS.layout.topPaddingBreathable`) for top-level content.
- Use `minHeight: DS.touch.min` for all tappable controls.
- Use `DS.type`, `DS.space`, `DS.radius`, and `DS.color` values, not ad-hoc values.
- Keep primary text on `DS.color.textPrimary` and body text on `DS.color.textBody`.
- Primary CTA defaults to `DS.gradient.primaryCta` (when using `LinearGradient`).
- Preserve copy exactly as provided by product/content requirements.
- For any form screen: use `KeyboardAvoidingView` + `ScrollView` and auto-scroll focused inputs into view.

## Example
```js
import { Dimensions, StyleSheet } from 'react-native';
import { DS, getSideGutter } from './src/ui/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  screenInner: {
    paddingTop: DS.layout.topPaddingBreathable,
    paddingHorizontal: getSideGutter(SCREEN_WIDTH),
  },
  content: {
    width: '100%',
    maxWidth: DS.layout.contentMaxWidth,
    backgroundColor: DS.color.surface,
  },
  primaryButton: {
    minHeight: DS.touch.min,
    borderRadius: DS.radius.full,
  },
});
```
