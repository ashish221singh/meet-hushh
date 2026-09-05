import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import StaticCityMapVisual from './StaticCityMapVisual';

export default function PastMeetScreen({
  styles,
  pastMeet,
  blockedUserIds,
  onRequestBlock,
  onOpenFeedback,
}) {
  const participants = Array.isArray(pastMeet?.participants) ? pastMeet.participants : [];
  const title = pastMeet?.topic_label || 'Past meet';
  const time = (() => {
    const source = pastMeet?.updated_at || pastMeet?.created_at || null;
    if (!source) return pastMeet?.match_time_label || '-';
    const dt = new Date(source);
    if (Number.isNaN(dt.getTime())) return pastMeet?.match_time_label || '-';
    return dt.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  })();
  const venueName = pastMeet?.venue?.name || 'Venue';
  const venueAddress = pastMeet?.venue?.address || '-';
  const paymentAmount = pastMeet?.fee?.amount ? `₹${pastMeet.fee.amount}` : '₹0.00';
  return (
    <View style={[styles.homeFlowSection, styles.flowScreenRoot]}>
      <View style={styles.meetMapHeroPast}>
        <StaticCityMapVisual />
      </View>
      <View style={styles.meetStatusRow}>
        <Text style={styles.pastStatusBadge}>COMPLETED</Text>
        <Text style={styles.meetStatusMeta}>{time}</Text>
      </View>
      <Text style={styles.meetVenueTitle}>{title}</Text>
      <Text style={styles.meetVenueMeta}>{`${venueName}${venueAddress ? `, ${venueAddress}` : ''}`}</Text>

      <Text style={[styles.sectionTitle, styles.pastWhoTitle]}>Who you met</Text>
      {participants.map((person) => {
        const isBlocked = blockedUserIds.includes(person.user_id);
        return (
          <View key={`past-${person.participant_id || person.id}`} style={styles.pastPersonRow}>
            <View style={styles.meetPersonLeft}>
              <View style={styles.meetPersonAvatar}>
                <Text style={styles.meetPersonAvatarText}>{person.initial || 'U'}</Text>
              </View>
              <View>
                <Text style={styles.meetPersonName}>{person.name}</Text>
                <Text style={styles.meetPersonRole}>{person.subtitle}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onRequestBlock(person, isBlocked)}
              style={({ pressed }) => [styles.blockIconButton, pressed ? styles.secondaryPressed : null]}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="8" stroke={isBlocked ? '#ef4444' : '#d1d5db'} strokeWidth="1.6" fill="none" />
                <Path d="M7 7l10 10" stroke={isBlocked ? '#ef4444' : '#d1d5db'} strokeWidth="1.6" strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>
        );
      })}

      <Text style={[styles.sectionTitle, styles.meetPaymentHeading]}>Payment</Text>
      <View style={styles.meetPaymentCard}>
        <View>
          <Text style={styles.meetPaymentLabel}>Total Paid</Text>
        </View>
        <Text style={styles.meetPaymentAmount}>{paymentAmount}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onOpenFeedback}
        style={({ pressed }) => [styles.pastFeedbackButton, pressed ? styles.buttonPressed : null]}
      >
        <View style={styles.pastFeedbackInner}>
          <Svg width={15} height={15} viewBox="0 0 24 24">
            <Path
              d="M5 6h14a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 3V7a1 1 0 011-1z"
              stroke="#ffffff"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.pastFeedbackButtonText}>Give Feedback</Text>
        </View>
      </Pressable>
    </View>
  );
}
