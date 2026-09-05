import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export function SecureSpotModal({
  visible,
  styles,
  isConfirmingPayment,
  feeAmountLabel = '₹0.00',
  responseWindowLabel = '',
  onClose,
  onConfirm,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.stopModalBackdrop}>
        <View style={styles.secureSpotCard}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.secureSpotCloseButton,
              pressed ? styles.secondaryPressed : null,
            ]}
          >
            <Text style={styles.secureSpotCloseText}>×</Text>
          </Pressable>
          <Text style={styles.secureSpotTitle}>Secure your spot</Text>
          <Text style={styles.secureSpotBody}>Avoid ghosting, keep it real.</Text>
          {responseWindowLabel ? (
            <Text style={styles.secureSpotDeadlineText}>{responseWindowLabel}</Text>
          ) : null}

          <View style={styles.secureSpotFeeCard}>
            <View style={styles.secureSpotFeeRow}>
              <Text style={styles.secureSpotFeeLabel}>Pilot Price</Text>
              <Text style={styles.secureSpotFeeAmount}>{feeAmountLabel}</Text>
            </View>
            <Text style={styles.secureSpotFeeBody}>
              For pilot users, securing your spot is free.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            disabled={isConfirmingPayment}
            style={({ pressed }) => [
              styles.secureSpotPayButton,
              pressed && !isConfirmingPayment ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.secureSpotPayText}>
              {isConfirmingPayment ? 'Confirming...' : 'Confirm Spot'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function FeedbackModal({
  visible,
  styles,
  feedbackRating,
  feedbackNote,
  onClose,
  onSetRating,
  onSetNote,
  onSubmit,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
      >
        <View style={styles.stopModalBackdrop}>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>How was the vibe?</Text>
            <Text style={styles.feedbackBody}>Rate your experience to help us improve.</Text>
            <View style={styles.feedbackStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={`star-${star}`}
                  accessibilityRole="button"
                  onPress={() => onSetRating(star)}
                  style={styles.feedbackStarHit}
                >
                  <Svg width={28} height={28} viewBox="0 0 24 24">
                    <Path
                      d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5L12 14.8 7.5 17.8l.9-5L4.8 8.3l5-.7L12 3z"
                      fill={feedbackRating >= star ? '#f59e0b' : 'none'}
                      stroke={feedbackRating >= star ? '#f59e0b' : '#d4d4d4'}
                      strokeWidth="1.6"
                    />
                  </Svg>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={feedbackNote}
              onChangeText={onSetNote}
              placeholder="Share more details (optional)..."
              placeholderTextColor="#d4d4d4"
              multiline
              style={styles.feedbackInput}
            />
            <View style={styles.feedbackActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.feedbackSecondaryButton,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <Text style={styles.feedbackSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onSubmit}
                disabled={!feedbackRating}
                style={({ pressed }) => [
                  styles.feedbackPrimaryButton,
                  !feedbackRating ? styles.buttonDisabled : null,
                  feedbackRating && pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.feedbackPrimaryText, !feedbackRating ? styles.buttonTextDisabled : null]}>
                  Submit
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function BlockUserModal({
  visible,
  styles,
  blockedPersonName,
  mode = 'block',
  onClose,
  onConfirm,
}) {
  const firstName = blockedPersonName.split(',')[0];
  const isUnblockMode = mode === 'unblock';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.stopModalBackdrop}>
        <View style={styles.blockCard}>
          <View style={styles.blockIconWrap}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Circle cx="12" cy="12" r="8" fill="#fee2e2" />
              <Path d="M12 8v5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
              <Circle cx="12" cy="16.8" r="1" fill="#ef4444" />
            </Svg>
          </View>
          <Text style={styles.blockTitle}>
            {isUnblockMode ? `Unblock ${firstName}?` : `Block ${firstName}?`}
          </Text>
          <Text style={styles.blockBody}>
            {isUnblockMode
              ? 'This person can appear in your meet suggestions again. Are you sure?'
              : 'This person will never come in your meet suggestions again. Are you sure?'}
          </Text>
          <View style={styles.blockActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.feedbackSecondaryButton,
                pressed ? styles.secondaryPressed : null,
              ]}
            >
              <Text style={styles.feedbackSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                isUnblockMode ? styles.feedbackPrimaryButton : styles.blockPrimaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={isUnblockMode ? styles.feedbackPrimaryText : styles.blockPrimaryText}>
                {isUnblockMode ? 'Unblock' : 'Block'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
