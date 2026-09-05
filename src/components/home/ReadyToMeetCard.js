import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DS } from '../../ui/designSystem';
import StaticCityMapVisual from './StaticCityMapVisual';

export default function ReadyToMeetCard({
  onStartLooking,
  title = 'Ready to meet?',
  ctaLabel = 'Yes, start looking',
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.mapCard}>
        <StaticCityMapVisual />

        <Pressable onPress={onStartLooking} style={({ pressed }) => [styles.mapActionChip, pressed ? styles.mapActionPressed : null]}>
          <Text style={styles.mapActionText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: DS.space.xl,
  },
  title: {
    fontSize: DS.type.x2l,
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightH2,
  },
  mapCard: {
    marginTop: DS.space.md,
    width: '100%',
    aspectRatio: 1,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapActionChip: {
    minHeight: DS.touch.comfortable,
    paddingHorizontal: DS.space.lg,
    borderRadius: DS.radius.full,
    backgroundColor: DS.color.surfaceElevated,
    borderWidth: 1,
    borderColor: DS.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
  mapActionPressed: {
    opacity: 0.9,
  },
  mapActionText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
});
