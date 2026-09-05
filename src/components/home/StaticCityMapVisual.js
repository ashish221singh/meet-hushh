import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function StaticCityMapVisual() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <Rect x="0" y="0" width="400" height="240" fill="#f3f4f6" />
        <Path
          d="M-20 44 C 50 60, 112 50, 182 64 S 320 84, 420 74"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M-26 108 C 58 88, 124 112, 198 102 S 328 96, 430 112"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M-24 182 C 52 164, 122 190, 194 178 S 334 170, 428 188"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M44 -16 C 58 46, 38 102, 52 160 S 66 232, 56 270"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M134 -20 C 116 54, 154 118, 132 180 S 124 242, 136 274"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M244 -20 C 264 56, 226 120, 248 186 S 272 244, 256 276"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M334 -24 C 316 62, 350 124, 332 188 S 326 248, 340 278"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M-34 122 C 42 100, 130 96, 198 112 C 276 130, 338 166, 432 150"
          stroke="#bfdbfe"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M192 -20 C 204 44, 184 98, 198 142 C 214 190, 234 222, 224 268"
          stroke="#bfdbfe"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M32 30 C 96 52, 154 94, 214 132 S 324 198, 390 228"
          stroke="#dbeafe"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M8 220 C 84 186, 158 142, 238 92 S 336 52, 408 22"
          stroke="#dbeafe"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="198" cy="112" r="4" fill="#93c5fd" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
