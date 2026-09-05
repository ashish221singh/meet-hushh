import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { DS } from '../../ui/designSystem';

export default function HomeBottomNav({ homeTab, onSelectTab }) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        <Pressable onPress={() => onSelectTab('home')} style={styles.bottomTab}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="M3 10.8L12 4l9 6.8V20h-6.5v-5.2h-5V20H3v-9.2z"
              stroke={homeTab === 'home' ? DS.color.textPrimary : DS.color.textMuted}
              strokeWidth="1.7"
              fill="none"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={homeTab === 'home' ? styles.bottomTabTextActive : styles.bottomTabTextMuted}>
            Home
          </Text>
        </Pressable>

        <Pressable onPress={() => onSelectTab('profile')} style={styles.bottomTab}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Circle
              cx="12"
              cy="8"
              r="3.1"
              stroke={homeTab === 'profile' ? DS.color.textPrimary : DS.color.textMuted}
              strokeWidth="1.7"
              fill="none"
            />
            <Path
              d="M5.5 20c1.4-3.7 4-5 6.5-5s5.1 1.3 6.5 5"
              stroke={homeTab === 'profile' ? DS.color.textPrimary : DS.color.textMuted}
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={homeTab === 'profile' ? styles.bottomTabTextActive : styles.bottomTabTextMuted}>
            Profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: DS.color.borderLight,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 94,
    paddingHorizontal: DS.space.lg,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 12,
    ...DS.shadow.soft,
  },
  bottomTab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomTabTextActive: {
    fontSize: DS.type.sm,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  bottomTabTextMuted: {
    fontSize: DS.type.sm,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
  },
});
