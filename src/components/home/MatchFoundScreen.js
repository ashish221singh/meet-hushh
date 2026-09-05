import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function VoiceSnippet({ styles, seed = 1, isPlaying, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.voiceSnippet, pressed ? styles.secondaryPressed : null]}>
      <View style={[styles.voiceSnippetPlay, isPlaying ? styles.voiceSnippetPlayActive : null]}>
        <Svg width={13} height={13} viewBox="0 0 24 24">
          {isPlaying ? (
            <>
              <Path d="M8 7h3v10H8z" fill="#ffffff" />
              <Path d="M13 7h3v10h-3z" fill="#ffffff" />
            </>
          ) : (
            <Path d="M9 7l8 5-8 5V7z" fill="#ffffff" />
          )}
        </Svg>
      </View>
      <View style={styles.voiceWaveRow}>
        {[5, 8, 6, 11, 9, 7, 10, 6, 12, 8, 6, 9, 5, 10, 7, 8].map((h, index) => (
          <View
            key={`${seed}-${index}`}
            style={[
              styles.voiceWaveBar,
              { height: h },
              isPlaying ? styles.voiceWaveBarActive : null,
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

export default function MatchFoundScreen({
  styles,
  matchTimeLabel,
  responseWindowLabel,
  isVenueShared,
  matchedPeople,
  venueTitle,
  venueBody,
}) {
  const [playingId, setPlayingId] = useState(null);

  return (
    <View style={[styles.homeFlowSection, styles.flowScreenRoot]}>
      <Text style={styles.matchLabel}>FOUND A MEET</Text>
      <Text style={styles.matchHeading}>Sorted for</Text>
      <Text style={styles.matchHeadingStrong}>{matchTimeLabel}</Text>
      {responseWindowLabel ? (
        <Text style={styles.matchResponseWindow}>{responseWindowLabel}</Text>
      ) : null}

      <View style={styles.matchDivider} />

      <Text style={styles.matchSubLabel}>3 PEOPLE YOU'LL MEET</Text>
      {matchedPeople.map((person, index) => (
        <View key={person.id} style={styles.matchPersonCard}>
          <View style={styles.matchPersonRow}>
            <Text style={styles.matchPersonName}>{person.name}</Text>
          </View>
          <Text style={styles.matchPersonMeta}>{person.subtitle}</Text>
          <VoiceSnippet
            styles={styles}
            seed={index + 1}
            isPlaying={playingId === person.id}
            onToggle={() => setPlayingId((prev) => (prev === person.id ? null : person.id))}
          />
        </View>
      ))}

      <View style={styles.matchDivider} />

      <Text style={styles.matchSubLabel}>LOCATION</Text>
      <View style={styles.matchLocationRow}>
        <View style={styles.matchLocationDot} />
        <Text style={styles.matchLocationTitle}>{venueTitle}</Text>
      </View>
      <Text style={styles.matchLocationBody}>{venueBody}</Text>
    </View>
  );
}
