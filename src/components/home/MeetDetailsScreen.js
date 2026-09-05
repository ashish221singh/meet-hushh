import { Linking, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import StaticCityMapVisual from './StaticCityMapVisual';

const MIN_COMMITTED_TO_CONFIRM = 3;

export default function MeetDetailsScreen({
  styles,
  matchedPeople,
  meetData,
  onActionFeedback,
}) {
  const totalMembers = Number(meetData?.commitment?.total_members || (matchedPeople.length + 1));
  const committedMembers = Number(meetData?.commitment?.committed_members || 0);
  const pendingMembers = Number(meetData?.commitment?.pending_members || 0);
  const cancelledMembers = Number(meetData?.commitment?.cancelled_members || 0);
  const meetStatus = String(meetData?.status || '').toUpperCase();
  const isFullyCommitted =
    totalMembers > 0 && committedMembers === totalMembers && pendingMembers === 0 && cancelledMembers === 0;
  const isVenueShared =
    meetStatus === 'VENUE_SHARED' || meetData?.venue?.is_hidden === false;
  const isConfirmed = committedMembers >= MIN_COMMITTED_TO_CONFIRM || isFullyCommitted || isVenueShared;
  const isCancelled = meetStatus === 'CANCELLED';
  const visiblePeople = matchedPeople;
  const matchMeta = meetData?.match_time_label || 'Tomorrow, 6:00 PM';
  const venueName = isCancelled
    ? 'Match cancelled'
    : isVenueShared
      ? meetData?.venue?.name || 'Hidden Venue'
      : 'Hidden Venue';
  const venueAddress = isCancelled
    ? meetData?.fee?.payment_status === 'REFUNDED'
      ? 'Insufficient confirmed members. Your amount has been refunded.'
      : 'Insufficient confirmed members to run this meet.'
    : isVenueShared
      ? meetData?.venue?.address || 'Will be shared soon'
      : `Venue will be shared after confirmation (${committedMembers}/${totalMembers})`;
  const venueManager = meetData?.venue?.manager_name || 'Manager';
  const venuePhone = meetData?.venue?.phone || null;
  const venueLat = meetData?.venue?.lat;
  const venueLng = meetData?.venue?.lng;
  const hostReview =
    meetData?.host_review ||
    "Look for the reserved table under 'Hushh' near the window. Ask the manager if you need help.";
  const paymentAmount = meetData?.fee?.amount ? `₹${meetData.fee.amount}` : '₹399.00';

  const notifyActionFeedback = (message) => {
    if (!message) return;
    onActionFeedback?.(message);
  };

  const openDirections = async () => {
    if (!isVenueShared) {
      notifyActionFeedback('Directions available after venue is shared.');
      return;
    }

    const hasCoords = Number.isFinite(venueLat) && Number.isFinite(venueLng);
    const query = hasCoords
      ? `${venueLat},${venueLng}`
      : `${venueName || ''} ${venueAddress || ''}`.trim();
    if (!query) {
      notifyActionFeedback('Venue details are not available yet.');
      return;
    }

    const urls = [];
    if (hasCoords && Platform.OS === 'android') {
      urls.push(`geo:${venueLat},${venueLng}?q=${encodeURIComponent(query)}`);
    }
    if (hasCoords && Platform.OS === 'ios') {
      urls.push(`http://maps.apple.com/?ll=${venueLat},${venueLng}&q=${encodeURIComponent(query)}`);
    }
    urls.push(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);

    for (const url of urls) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (!supported) continue;
        await Linking.openURL(url);
        return;
      } catch {
        // Try next fallback URL.
      }
    }

    notifyActionFeedback('Unable to open maps on this device.');
  };

  const callVenue = async () => {
    if (!isVenueShared) {
      notifyActionFeedback('Call is available after venue is shared.');
      return;
    }
    const normalizedPhone = String(venuePhone || '').replace(/[^\d+]/g, '');
    if (!normalizedPhone) {
      notifyActionFeedback('Venue phone is not available yet.');
      return;
    }
    const telUrl = `tel:${normalizedPhone}`;
    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (!supported) {
        notifyActionFeedback('Calling is not supported on this device.');
        return;
      }
      await Linking.openURL(telUrl);
    } catch {
      notifyActionFeedback('Unable to open dialer right now.');
    }
  };

  return (
    <View style={[styles.homeFlowSection, styles.flowScreenRoot]}>
      <View style={styles.meetMapHero}>
        <StaticCityMapVisual />
        <View style={styles.meetMapPinWrap}>
          <Svg width={28} height={28} viewBox="0 0 24 24">
            <Path
              d="M12 21s7-5.8 7-11a7 7 0 10-14 0c0 5.2 7 11 7 11z"
              fill="#171717"
            />
            <Circle cx="12" cy="10" r="2.5" fill="#ffffff" />
          </Svg>
        </View>
      </View>

      <View style={styles.meetStatusRow}>
        <Text style={styles.meetStatusBadge}>{isCancelled ? 'CANCELLED' : isVenueShared ? 'VENUE SHARED' : isConfirmed ? 'CONFIRMED' : 'PENDING'}</Text>
        <Text style={styles.meetStatusMeta}>{matchMeta}</Text>
      </View>
      {!isCancelled ? <Text style={styles.meetStatusMeta}>{`${committedMembers} of ${totalMembers} committed`}</Text> : null}
      {cancelledMembers > 0 ? (
        <Text style={styles.meetStatusMeta}>{`${cancelledMembers} member${cancelledMembers > 1 ? 's' : ''} cancelled`}</Text>
      ) : null}
      <Text style={styles.meetVenueTitle}>{venueName}</Text>
      <Text style={styles.meetVenueMeta}>{venueAddress}</Text>
      {isCancelled ? (
        <Text style={styles.meetStatusMeta}>
          {String(meetData?.fee?.payment_status || '').toUpperCase() === 'REFUNDED'
            ? 'Refund initiated for committed members.'
            : 'Refund will be initiated for committed members.'}
        </Text>
      ) : null}

      {isVenueShared ? (
        <View style={styles.meetActionRow}>
          <Pressable
            onPress={openDirections}
            style={({ pressed }) => [styles.meetDirectionButton, pressed ? styles.buttonPressed : null]}
          >
            <View style={styles.meetDirectionInner}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path
                  d="M21 3L3 10.5l6.8 2.2L12 21 21 3z"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.meetDirectionButtonText}>Get Directions</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={callVenue}
            disabled={!venuePhone}
            style={({ pressed }) => [styles.meetCallButton, pressed ? styles.secondaryPressed : null, !venuePhone ? { opacity: 0.45 } : null]}
          >
            <Text style={styles.meetCallButtonText}>{venuePhone ? '☎' : '-'}</Text>
          </Pressable>
        </View>
      ) : null}

      {isVenueShared ? (
        <View style={styles.hostReviewCard}>
          <Text style={styles.hostReviewTitle}>Review from Host</Text>
          <Text style={styles.hostReviewBody}>{`"${hostReview}"`}</Text>
          <Text style={styles.hostReviewBody}>{`${venueManager}${venuePhone ? ` • ${venuePhone}` : ''}`}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, styles.meetWhoHeading]}>Who you're meeting</Text>
      {visiblePeople.map((person) => (
        <View
          key={`detail-${person.id}`}
          style={[
            styles.meetPersonRow,
            String(person.status || '').toUpperCase() === 'CANCELLED' ? { opacity: 0.45 } : null,
          ]}
        >
          <View style={styles.meetPersonLeft}>
            <View style={styles.meetPersonAvatar}>
              <Text style={styles.meetPersonAvatarText}>{person.initial}</Text>
            </View>
            <View>
              <Text style={styles.meetPersonName}>{person.name}</Text>
              <Text style={styles.meetPersonRole}>{person.subtitle.split('&')[0].trim()}</Text>
            </View>
          </View>
          <View style={styles.meetPersonStatusWrap}>
            <Text style={styles.meetPersonStatusText}>
              {String(person.status || 'PENDING').charAt(0).toUpperCase() +
                String(person.status || 'PENDING').slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      ))}
      {!isCancelled && !isVenueShared && visiblePeople.length === 0 ? (
        <Text style={styles.meetStatusMeta}>No active attendees yet.</Text>
      ) : null}

      {!isCancelled ? (
        <>
          <Text style={[styles.sectionTitle, styles.meetPaymentHeading]}>Payment</Text>
          <View style={styles.meetPaymentCard}>
            <View>
              <Text style={styles.meetPaymentLabel}>Booking Fee</Text>
              <Text style={styles.meetPaymentMeta}>Paid via UPI</Text>
            </View>
            <Text style={styles.meetPaymentAmount}>{paymentAmount}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
