import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  ActivityIndicator,
  AppState,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  NativeModules,
  Linking,
  LogBox,
  View,
  Vibration,
  findNodeHandle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DS, getSideGutter } from './src/ui/designSystem';
import ReadyToMeetCard from './src/components/home/ReadyToMeetCard';
import HomeBottomNav from './src/components/home/HomeBottomNav';
import StaticCityMapVisual from './src/components/home/StaticCityMapVisual';
import MatchFoundScreen from './src/components/home/MatchFoundScreen';
import MeetDetailsScreen from './src/components/home/MeetDetailsScreen';
import PastMeetScreen from './src/components/home/PastMeetScreen';
import {
  SecureSpotModal,
  FeedbackModal,
  BlockUserModal,
} from './src/components/home/MeetFlowModals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_GUTTER = getSideGutter(SCREEN_WIDTH);
const CONTENT_MAX_WIDTH = DS.layout.contentMaxWidth;
const BUNDLE_SCRIPT_URL = NativeModules?.SourceCode?.scriptURL || '';
const SCRIPT_HOST =
  BUNDLE_SCRIPT_URL.match(/https?:\/\/([^/:]+)/)?.[1] || null;
const normalizeApiHostForDevice = (host) => {
  if (!host) return null;
  const normalized = String(host).trim().toLowerCase();
  if (Platform.OS === 'android' && (normalized === 'localhost' || normalized === '127.0.0.1')) {
    // Android emulator cannot reach host machine backend via localhost.
    return '10.0.2.2';
  }
  return host;
};
const NORMALIZED_SCRIPT_HOST = normalizeApiHostForDevice(SCRIPT_HOST);
const AUTO_DETECTED_API_BASE_URL = NORMALIZED_SCRIPT_HOST
  ? `http://${NORMALIZED_SCRIPT_HOST}:3001`
  : null;
const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  AUTO_DETECTED_API_BASE_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');
const API_BASE_URL = String(RAW_API_BASE_URL).replace(/\/+$/, '');
const EXPO_EAS_PROJECT_ID = String(process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '').trim();
const AUTH_MODE = String(process.env.EXPO_PUBLIC_AUTH_MODE || 'firebase_otp').toLowerCase();
const USE_OTP_AUTH = AUTH_MODE !== 'sim_verify';
const OTP_LENGTH = Number(process.env.EXPO_PUBLIC_OTP_LENGTH || 6);
let FIREBASE_NATIVE_AUTH = null;
try {
  const firebaseAuthModule = require('@react-native-firebase/auth');
  FIREBASE_NATIVE_AUTH = firebaseAuthModule?.default || null;
} catch {
  FIREBASE_NATIVE_AUTH = null;
}
const FIREBASE_PHONE_AUTH_ENABLED = Boolean(FIREBASE_NATIVE_AUTH);
const ACTIVE_OTP_LENGTH = OTP_LENGTH;
const FIREBASE_OTP_STRICT = AUTH_MODE === 'firebase_otp';
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_RESEND_MAX_ATTEMPTS = 3;
const OTP_RESEND_BLOCK_MINUTES = 30;
const PUSH_CHANNEL_ID = 'hushh-default';
const FIREBASE_MISSING_KEYS_MESSAGE = FIREBASE_PHONE_AUTH_ENABLED
  ? ''
  : 'Install native Firebase setup (google-services files) and use a development/release build.';
const SESSION_TOKEN_KEY = 'hushh_access_token_v1';
const MIN_VOICE_SECONDS = 15;
const DEV_MATCH_HELPER_ENABLED =
  String(process.env.EXPO_PUBLIC_ENABLE_DEV_MATCH_HELPER || 'false').toLowerCase() === 'true';
const DEV_MATCH_REQUIRES_TAP =
  String(process.env.EXPO_PUBLIC_DEV_MATCH_REQUIRES_TAP || 'false').toLowerCase() === 'true';
const DEV_INSTANT_MATCH_DELAY_MS = 5000;
const MIN_COMMITTED_TO_CONFIRM = 3;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

const HUSHH_LOGO_SVG = `
<svg width="57" height="15" viewBox="0 0 57 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M-2.80142e-06 14.5455V9.53674e-07H2.63494V6.15767H9.375V9.53674e-07H12.017V14.5455H9.375V8.36648H2.63494V14.5455H-2.80142e-06ZM20.8731 9.95739V3.63636H23.4441V14.5455H20.9512V12.6065H20.8376C20.5914 13.2173 20.1865 13.7169 19.6231 14.1051C19.0644 14.4934 18.3754 14.6875 17.5563 14.6875C16.8414 14.6875 16.2093 14.5289 15.66 14.2116C15.1155 13.8897 14.6894 13.4233 14.3816 12.8125C14.0738 12.197 13.92 11.4536 13.92 10.5824V3.63636H16.491V10.1847C16.491 10.8759 16.6804 11.4252 17.0592 11.8324C17.4379 12.2396 17.9351 12.4432 18.5506 12.4432C18.9294 12.4432 19.2964 12.3509 19.6515 12.1662C20.0066 11.9815 20.2978 11.7069 20.5251 11.3423C20.7571 10.973 20.8731 10.5114 20.8731 9.95739ZM33.8609 6.51989L31.5171 6.77557C31.4508 6.53883 31.3348 6.31629 31.1691 6.10796C31.0081 5.89962 30.7903 5.73154 30.5157 5.60369C30.2411 5.47585 29.9049 5.41193 29.5072 5.41193C28.9721 5.41193 28.5223 5.52794 28.1577 5.75994C27.7979 5.99195 27.6203 6.29261 27.6251 6.66193C27.6203 6.97917 27.7363 7.23722 27.9731 7.43608C28.2146 7.63494 28.6123 7.7983 29.1663 7.92614L31.0271 8.32386C32.0593 8.5464 32.8263 8.89915 33.3282 9.3821C33.8348 9.86506 34.0905 10.4972 34.0952 11.2784C34.0905 11.965 33.8893 12.571 33.4915 13.0966C33.0986 13.6174 32.5517 14.0246 31.8509 14.3182C31.1502 14.6117 30.3452 14.7585 29.4361 14.7585C28.1009 14.7585 27.0261 14.4792 26.2117 13.9205C25.3973 13.357 24.912 12.5734 24.7558 11.5696L27.2629 11.3281C27.3765 11.8206 27.618 12.1922 27.9873 12.4432C28.3566 12.6941 28.8372 12.8196 29.429 12.8196C30.0398 12.8196 30.5299 12.6941 30.8992 12.4432C31.2733 12.1922 31.4603 11.8821 31.4603 11.5128C31.4603 11.2003 31.3396 10.9422 31.0981 10.7386C30.8613 10.535 30.492 10.3788 29.9901 10.2699L28.1293 9.87926C27.0829 9.66146 26.3088 9.29451 25.8069 8.77841C25.305 8.25758 25.0564 7.59943 25.0611 6.80398C25.0564 6.13163 25.2387 5.54924 25.608 5.05682C25.9821 4.55966 26.5005 4.17614 27.1634 3.90625C27.831 3.63163 28.6004 3.49432 29.4717 3.49432C30.7501 3.49432 31.7562 3.76657 32.4901 4.31108C33.2288 4.85559 33.6857 5.59186 33.8609 6.51989ZM37.9371 8.15341V14.5455H35.366V9.53674e-07H37.8803V5.49006H38.0081C38.2638 4.87453 38.6591 4.38921 39.1942 4.03409C39.7339 3.67424 40.4205 3.49432 41.2538 3.49432C42.0114 3.49432 42.6719 3.65294 43.2354 3.97017C43.7988 4.28741 44.2344 4.75142 44.5422 5.36222C44.8547 5.97301 45.0109 6.71875 45.0109 7.59943V14.5455H42.4399V7.99716C42.4399 7.26326 42.2505 6.69271 41.8717 6.28551C41.4977 5.87358 40.9721 5.66761 40.295 5.66761C39.8405 5.66761 39.4333 5.76705 39.0734 5.96591C38.7183 6.16004 38.439 6.44176 38.2354 6.81108C38.0365 7.1804 37.9371 7.62784 37.9371 8.15341ZM49.3535 8.15341V14.5455H46.7825V9.53674e-07H49.2967V5.49006H49.4245C49.6802 4.87453 50.0755 4.38921 50.6106 4.03409C51.1504 3.67424 51.8369 3.49432 52.6702 3.49432C53.4278 3.49432 54.0883 3.65294 54.6518 3.97017C55.2152 4.28741 55.6508 4.75142 55.9586 5.36222C56.2711 5.97301 56.4273 6.71875 56.4273 7.59943V14.5455H53.8563V7.99716C53.8563 7.26326 53.6669 6.69271 53.2881 6.28551C52.9141 5.87358 52.3885 5.66761 51.7114 5.66761C51.2569 5.66761 50.8497 5.76705 50.4898 5.96591C50.1347 6.16004 49.8554 6.44176 49.6518 6.81108C49.4529 7.1804 49.3535 7.62784 49.3535 8.15341Z" fill="#ffffff"/>
</svg>
`;

const VIBE_ICON_COFFEE = `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.6631 2.33264V4.66597" stroke="#171717" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.3281 2.33264V4.66597" stroke="#171717" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.6609 9.33032C18.9702 9.33032 19.2668 9.4532 19.4856 9.67192C19.7043 9.89065 19.8272 10.1873 19.8272 10.4966V19.827C19.8272 21.0643 19.3356 22.2509 18.4608 23.1258C17.5859 24.0006 16.3993 24.4922 15.162 24.4922H8.1642C6.92692 24.4922 5.74031 24.0006 4.86542 23.1258C3.99053 22.2509 3.49902 21.0643 3.49902 19.827V10.4966C3.49902 10.1873 3.6219 9.89065 3.84062 9.67192C4.05935 9.4532 4.356 9.33032 4.66532 9.33032H20.9934C22.2307 9.33032 23.4173 9.82183 24.2922 10.6967C25.1671 11.5716 25.6586 12.7582 25.6586 13.9955C25.6586 15.2328 25.1671 16.4194 24.2922 17.2943C23.4173 18.1692 22.2307 18.6607 20.9934 18.6607H19.8272" stroke="#171717" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.99756 2.33264V4.66597" stroke="#171717" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const VIBE_ICON_MEAL = `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.6607 2.33264L15.9782 5.01512C15.3371 5.66916 14.978 6.5485 14.978 7.46434C14.978 8.38018 15.3371 9.25952 15.9782 9.91356L18.0775 12.0129C18.7316 12.654 19.6109 13.0131 20.5268 13.0131C21.4426 13.0131 22.3219 12.654 22.976 12.0129L25.6585 9.33041" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17.4943 17.4944L3.84866 3.84875C3.38317 4.30484 3.01337 4.84922 2.76091 5.45002C2.50846 6.05082 2.37842 6.69595 2.37842 7.34764C2.37842 7.99933 2.50846 8.64446 2.76091 9.24526C3.01337 9.84606 3.38317 10.3904 3.84866 10.8465L12.3626 19.3605C13.179 20.1769 14.6952 20.1769 15.6282 19.3605L17.4943 17.4944ZM17.4943 17.4944L25.6584 25.6585" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2.44922 25.4253L9.91351 18.0776" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M22.1597 5.83154L13.9956 13.9956" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const VIBE_ICON_PARTY = `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.76444 13.1791L2.33252 25.6584L14.8119 21.2382" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.66504 3.4989H4.67671" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.6587 9.33032H25.6704" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17.4946 2.33264H17.5063" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.6587 23.3259H25.6704" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.6585 2.33264L23.046 3.20736C22.3023 3.45507 21.6678 3.95337 21.2509 4.61709C20.8339 5.28081 20.6604 6.06874 20.76 6.8462C20.8767 7.84922 20.0953 8.74726 19.0689 8.74726H18.6257C17.6227 8.74726 16.7597 9.44704 16.573 10.4267L16.3281 11.663" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.6586 15.1618L24.7023 14.777C23.6992 14.3804 22.5796 15.0102 22.393 16.0715C22.2647 16.8879 21.5533 17.4944 20.7252 17.4944H19.8271" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.8292 2.33264L13.214 3.289C13.6106 4.29202 12.9808 5.41166 11.9195 5.59827C11.1031 5.7149 10.4966 6.438 10.4966 7.26607V8.16412" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.8292 15.1618C15.0801 17.4128 16.1298 20.0253 15.1618 20.9933C14.1937 21.9613 11.5812 20.9117 9.3303 18.6607C7.07935 16.4098 6.02968 13.7973 6.99771 12.8293C7.96573 11.8612 10.5782 12.9109 12.8292 15.1618Z" stroke="#737373" stroke-width="1.74944" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const MATCH_TIME_LABEL = 'Tomorrow, 6 PM.';
const MATCHED_PEOPLE = [
  { id: 'mike', name: 'Mike, 26', subtitle: 'Tech & Hiking', initial: 'M' },
  { id: 'jessica', name: 'Jessica, 23', subtitle: 'Writer & Cafe', initial: 'J' },
  { id: 'sarah', name: 'Sarah, 24', subtitle: 'Designer', initial: 'S' },
];

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [phone, setPhone] = useState('');
  const [activeScreen, setActiveScreen] = useState('onboarding');
  const [verificationState, setVerificationState] = useState('idle');
  const [verificationRequestId, setVerificationRequestId] = useState(null);
  const [verificationSmsBody, setVerificationSmsBody] = useState('');
  const [verificationSmsDestination, setVerificationSmsDestination] = useState('');
  const [verificationExpiresAt, setVerificationExpiresAt] = useState(null);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState(null);
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [otpBlockedUntil, setOtpBlockedUntil] = useState(null);
  const [otpBlockedPhone, setOtpBlockedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [firebaseConfirmation, setFirebaseConfirmation] = useState(null);
  const [verificationErrorText, setVerificationErrorText] = useState('');
  const [isVerificationResending, setIsVerificationResending] = useState(false);
  const [verificationNowTs, setVerificationNowTs] = useState(Date.now());
  const [meetNowTs, setMeetNowTs] = useState(Date.now());
  const [splashDone, setSplashDone] = useState(false);
  const [isSessionBootstrapping, setIsSessionBootstrapping] = useState(true);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [homeTab, setHomeTab] = useState('home');
  const [homeFlowScreen, setHomeFlowScreen] = useState('main');
  const [availability, setAvailability] = useState('Today');
  const [vibe, setVibe] = useState('Coffee');
  const [agePrefMin, setAgePrefMin] = useState('18');
  const [agePrefMax, setAgePrefMax] = useState('35');
  const [voiceMode, setVoiceMode] = useState('idle');
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceFileUri, setVoiceFileUri] = useState(null);
  const [voiceIntroRef, setVoiceIntroRef] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    permission: 'unknown',
    capturedAt: null,
  });
  const [locationPromptVisible, setLocationPromptVisible] = useState(false);
  const [locationBlockedVisible, setLocationBlockedVisible] = useState(false);
  const [locationBlockedMessage, setLocationBlockedMessage] = useState(
    'Location access is required to continue.'
  );
  const [isEditingHomeProfile, setIsEditingHomeProfile] = useState(false);
  const [draftFullName, setDraftFullName] = useState('');
  const [draftGender, setDraftGender] = useState('');
  const [draftAge, setDraftAge] = useState('');
  const [draftProfession, setDraftProfession] = useState('');

  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [pushPermissionStatus, setPushPermissionStatus] = useState('unknown');
  const [pushSyncStatus, setPushSyncStatus] = useState('idle');
  const [pushLastError, setPushLastError] = useState('');
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [stopFindingConfirmVisible, setStopFindingConfirmVisible] = useState(false);
  const [secureSpotModalVisible, setSecureSpotModalVisible] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isUpcomingMeetConfirmed, setIsUpcomingMeetConfirmed] = useState(false);
  const [isVenueShared, setIsVenueShared] = useState(false);
  const [foundMeet, setFoundMeet] = useState(null);
  const [activeMeet, setActiveMeet] = useState(null);
  const [openMeets, setOpenMeets] = useState([]);
  const [pastMeets, setPastMeets] = useState([]);
  const [cancelledMeets, setCancelledMeets] = useState([]);
  const [selectedPastMeetId, setSelectedPastMeetId] = useState(null);
  const [selectedCancelledMeetId, setSelectedCancelledMeetId] = useState(null);
  const [activeMatchRequest, setActiveMatchRequest] = useState(null);
  const [isLoadingFoundMeet, setIsLoadingFoundMeet] = useState(false);
  const [isSeedingDevMatch, setIsSeedingDevMatch] = useState(false);
  const [foundMeetNotified, setFoundMeetNotified] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockedPersonName, setBlockedPersonName] = useState('');
  const [blockedPersonUserId, setBlockedPersonUserId] = useState('');
  const [blockActionMode, setBlockActionMode] = useState('block');
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [feedbackTargetMeetId, setFeedbackTargetMeetId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const toastTimerRef = useRef(null);
  const onboardingScrollRef = useRef(null);
  const profileScrollRef = useRef(null);
  const homeProfileScrollRef = useRef(null);
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const fullNameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const professionInputRef = useRef(null);
  const editFullNameInputRef = useRef(null);
  const editAgeInputRef = useRef(null);
  const editProfessionInputRef = useRef(null);
  const recordingRef = useRef(null);
  const playbackRef = useRef(null);
  const isStoppingRecordingRef = useRef(false);
  const paymentTimerRef = useRef(null);
  const verificationFlowIdRef = useRef(0);
  const pushRegisteringRef = useRef(false);
  const pushRegisterErrorShownRef = useRef(false);
  const notificationReceivedSubRef = useRef(null);
  const notificationResponseSubRef = useRef(null);
  const lastHandledNotificationIdRef = useRef(null);
  const matchPollingBusyRef = useRef(false);
  const findingEnsureRequestRef = useRef(false);
  const devAllowFindingAutoOpenRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const verificationInboundAutoTriggeredRef = useRef(false);
  const matchFoundVibratedMeetIdRef = useRef(null);

  const logoTranslate = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.45)).current;
  const overlayShift = useRef(new Animated.Value(0)).current;
  const splashBgShiftA = useRef(new Animated.Value(0)).current;
  const splashBgShiftB = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const onboardingOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const homePanelOpacity = useRef(new Animated.Value(1)).current;
  const homePanelTranslateY = useRef(new Animated.Value(0)).current;
  const recordPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoTranslate, {
        toValue: -120,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 0.88,
        duration: 1400,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(overlayShift, {
            toValue: -80,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(overlayShift, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(splashBgShiftA, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(splashBgShiftA, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(splashBgShiftB, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(splashBgShiftB, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(onboardingOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => setSplashDone(true));
    }, 2500);

    const failSafeTimeout = setTimeout(() => {
      splashOpacity.setValue(0);
      onboardingOpacity.setValue(1);
      setSplashDone(true);
    }, 4500);

    return () => {
      clearTimeout(timeout);
      clearTimeout(failSafeTimeout);
    };
  }, [logoScale, logoTranslate, onboardingOpacity, overlayShift, splashBgShiftA, splashBgShiftB, splashOpacity]);

  useEffect(() => {
    if (!splashDone) {
      return;
    }

    screenOpacity.setValue(0);
    screenTranslateY.setValue(14);
    screenScale.setValue(0.985);
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: DS.motion.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: 0,
        duration: DS.motion.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1,
        duration: DS.motion.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeScreen, screenOpacity, screenScale, screenTranslateY, splashDone]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (playbackRef.current) {
        playbackRef.current.unloadAsync().catch(() => {});
        playbackRef.current = null;
      }
      if (paymentTimerRef.current) {
        clearTimeout(paymentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeScreen !== 'verifying') return undefined;
    const id = setInterval(() => {
      setVerificationNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [activeScreen]);

  useEffect(() => {
    if (voiceMode !== 'recording') {
      recordPulse.stopAnimation();
      recordPulse.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(recordPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(recordPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
      recordPulse.setValue(0);
    };
  }, [recordPulse, voiceMode]);

  const releasePlaybackSound = async () => {
    if (!playbackRef.current) {
      return;
    }
    await playbackRef.current.unloadAsync().catch(() => {});
    playbackRef.current = null;
    setIsPlayingVoice(false);
  };

  const isPhoneValid = useMemo(() => phone.length === 10, [phone]);
  const verificationSecondsRemaining = useMemo(() => {
    if (!verificationExpiresAt) return 0;
    const ms = new Date(verificationExpiresAt).getTime() - verificationNowTs;
    return Math.max(0, Math.floor(ms / 1000));
  }, [verificationExpiresAt, verificationNowTs]);
  const otpResendSecondsRemaining = useMemo(() => {
    if (!otpResendAvailableAt) return 0;
    const ms = new Date(otpResendAvailableAt).getTime() - verificationNowTs;
    return Math.max(0, Math.floor(ms / 1000));
  }, [otpResendAvailableAt, verificationNowTs]);
  const otpBlockSecondsRemaining = useMemo(() => {
    if (!otpBlockedUntil) return 0;
    if (String(otpBlockedPhone || '') !== String(phone || '')) return 0;
    const ms = new Date(otpBlockedUntil).getTime() - verificationNowTs;
    return Math.max(0, Math.floor(ms / 1000));
  }, [otpBlockedPhone, otpBlockedUntil, phone, verificationNowTs]);

  const isProfileValid = useMemo(() => {
    return (
      fullName.trim().length > 1 &&
      gender.length > 0 &&
      age.trim().length > 0 &&
      profession.trim().length > 1
    );
  }, [age, fullName, gender, profession]);

  const isEditProfileValid = useMemo(() => {
    return (
      draftFullName.trim().length > 1 &&
      draftGender.length > 0 &&
      draftAge.trim().length > 0 &&
      draftProfession.trim().length > 1
    );
  }, [draftAge, draftFullName, draftGender, draftProfession]);

  const isAgePreferenceValid = useMemo(() => {
    const min = Number(agePrefMin);
    const max = Number(agePrefMax);
    if (!Number.isInteger(min) || !Number.isInteger(max)) return false;
    if (min < 18 || max > 99) return false;
    return min <= max;
  }, [agePrefMax, agePrefMin]);

  const canContinuePreferences = useMemo(() => {
    return (
      availability.length > 0 &&
      vibe.length > 0 &&
      isAgePreferenceValid &&
      voiceMode === 'recorded' &&
      !!voiceFileUri &&
      voiceSeconds >= MIN_VOICE_SECONDS
    );
  }, [availability, vibe, isAgePreferenceValid, voiceMode, voiceFileUri, voiceSeconds]);

  const effectiveFoundMeet = useMemo(() => {
    return foundMeet || null;
  }, [foundMeet]);

  const effectiveActiveMeet = useMemo(() => {
    return activeMeet || foundMeet || null;
  }, [activeMeet, foundMeet]);

  const effectivePastMeet = useMemo(() => {
    if (!Array.isArray(pastMeets) || pastMeets.length === 0) return null;
    if (!selectedPastMeetId) return pastMeets[0];
    return pastMeets.find((m) => m.meet_id === selectedPastMeetId) || pastMeets[0];
  }, [pastMeets, selectedPastMeetId]);

  const effectiveCancelledMeet = useMemo(() => {
    if (!Array.isArray(cancelledMeets) || cancelledMeets.length === 0) return null;
    if (!selectedCancelledMeetId) return cancelledMeets[0];
    return cancelledMeets.find((m) => m.meet_id === selectedCancelledMeetId) || cancelledMeets[0];
  }, [cancelledMeets, selectedCancelledMeetId]);

  const responseWindowLabel = useMemo(() => {
    const deadlineAt = effectiveFoundMeet?.commitment?.deadline_at || null;
    const windowMins = Number(effectiveFoundMeet?.commitment?.response_window_mins || 30);
    if (!deadlineAt) {
      return `Respond within ${windowMins} mins`;
    }
    const remainingMs = new Date(deadlineAt).getTime() - meetNowTs;
    if (remainingMs <= 0) {
      return 'Response window ended';
    }
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return `Respond within ${mins}:${String(secs).padStart(2, '0')}`;
  }, [effectiveFoundMeet?.commitment?.deadline_at, effectiveFoundMeet?.commitment?.response_window_mins, meetNowTs]);

  const getUpcomingMeetState = (meetItem) => {
    const total = Number(meetItem?.commitment?.total_members || 0);
    const committed = Number(meetItem?.commitment?.committed_members || 0);
    const pending = Number(meetItem?.commitment?.pending_members || 0);
    const cancelled = Number(meetItem?.commitment?.cancelled_members || 0);
    const isVenueShared = String(meetItem?.status || '').toUpperCase() === 'VENUE_SHARED';
    const isFullyCommitted = total > 0 && committed === total && pending === 0 && cancelled === 0;
    const isConfirmed = committed >= MIN_COMMITTED_TO_CONFIRM;
    return {
      total,
      committed,
      pending,
      cancelled,
      isVenueShared,
      isFullyCommitted,
      isConfirmed,
      statusLabel: isVenueShared ? 'VENUE SHARED' : isConfirmed ? 'CONFIRMED' : 'PENDING',
    };
  };

  const formatPastMeetDateLabel = (meetItem) => {
    const source = meetItem?.updated_at || meetItem?.created_at || null;
    if (!source) return meetItem?.match_time_label || '';
    const dt = new Date(source);
    if (Number.isNaN(dt.getTime())) return meetItem?.match_time_label || '';
    return dt.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handlePhoneChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleAgeChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 2);
    setAge(digitsOnly);
  };

  const handleDraftAgeChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 2);
    setDraftAge(digitsOnly);
  };

  const toNameCase = (value) =>
    String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

  const scrollFieldIntoView = (scrollRef, inputRef) => {
    const nodeHandle = inputRef?.current ? findNodeHandle(inputRef.current) : null;
    if (!nodeHandle || !scrollRef?.current?.scrollResponderScrollNativeHandleToKeyboard) {
      return;
    }

    scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(
      nodeHandle,
      DS.keyboard.extraScrollOffset,
      true
    );
  };

  const scrollToTop = (scrollRef) => {
    scrollRef?.current?.scrollTo?.({ y: 0, animated: false });
  };

  const apiRequest = async (path, options = {}) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const controller = new AbortController();
    const timeoutMs = Number(options.timeoutMs || 12000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });

      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        const message =
          payload?.error?.message || `Request failed (${response.status})`;
        const err = new Error(message);
        err.code = payload?.error?.code || null;
        err.status = response.status;
        throw err;
      }

      return payload?.data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (String(error?.message || '').toLowerCase().includes('network request failed')) {
        throw new Error(`Network request failed. Check backend at ${API_BASE_URL}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const syncPushToken = async (tokenValue, tokenOverride) => {
    const pushToken = String(tokenValue || '').trim();
    const sessionToken = tokenOverride || accessToken;
    if (!pushToken || !sessionToken) return;
    await apiRequest('/api/v1/notifications/push-token', {
      method: 'POST',
      token: sessionToken,
      body: {
        push_token: pushToken,
        platform: Platform.OS,
      },
    });
  };

  const registerPushTokenIfPossible = async (sessionTokenOverride) => {
    const sessionToken = sessionTokenOverride || accessToken;
    if (!sessionToken || pushRegisteringRef.current) return;
    const isPhysicalDevice =
      typeof Constants?.isDevice === 'boolean' ? Constants.isDevice : true;
    if (!isPhysicalDevice) {
      setPushSyncStatus('skipped_emulator');
      setPushLastError('');
      return;
    }

    pushRegisteringRef.current = true;
    setPushSyncStatus('requesting_permission');
    setPushLastError('');
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
          name: 'Hushh Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#171717',
          enableVibrate: true,
          showBadge: true,
        });
      }

      let permission = await Notifications.getPermissionsAsync();
      setPushPermissionStatus(String(permission?.status || 'unknown'));
      if (permission.status !== 'granted') {
        permission = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        setPushPermissionStatus(String(permission?.status || 'unknown'));
      }
      if (permission.status !== 'granted') {
        setPushSyncStatus('permission_denied');
        return;
      }

      setPushSyncStatus('generating_token');
      const projectId =
        EXPO_EAS_PROJECT_ID ||
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        undefined;
      if (!projectId) {
        setPushSyncStatus('failed');
        setPushLastError('Missing EAS project ID (EXPO_PUBLIC_EAS_PROJECT_ID).');
        return;
      }
      let tokenValue = '';
      let tokenError = null;
      try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        tokenValue = String(tokenResponse?.data || '').trim();
      } catch (error) {
        tokenError = error;
      }
      if (!tokenValue) {
        try {
          const fallbackTokenResponse = await Notifications.getExpoPushTokenAsync();
          tokenValue = String(fallbackTokenResponse?.data || '').trim();
        } catch (error) {
          tokenError = tokenError || error;
        }
      }
      if (!tokenValue) {
        const errMsg = String(tokenError?.message || 'could not generate expo push token');
        setPushSyncStatus('failed');
        setPushLastError(errMsg);
        return;
      }

      if (expoPushToken !== tokenValue) {
        setExpoPushToken(tokenValue);
      }
      setPushSyncStatus('syncing_backend');
      await syncPushToken(tokenValue, sessionToken);
      setPushSyncStatus('ready');
      pushRegisterErrorShownRef.current = false;
    } catch (error) {
      const errMsg = String(error?.message || 'push registration failed');
      setPushSyncStatus('failed');
      setPushLastError(errMsg);
      if (!pushRegisterErrorShownRef.current) {
        // Non-blocking for auth flow: avoid noisy toast right after OTP success.
        pushRegisterErrorShownRef.current = true;
        console.warn(
          '[push] registration failed',
          errMsg
        );
      }
    } finally {
      pushRegisteringRef.current = false;
    }
  };

  const parseNotificationIntent = (rawData) => {
    const data = rawData || {};
    const type = String(data?.type || '').toUpperCase();
    const route = String(data?.route || '').toLowerCase();
    if (type === 'MATCH_FOUND' || route === 'matchfound') return 'MATCH_FOUND';
    if (type === 'VENUE_SHARED' || route === 'venueshared') return 'VENUE_SHARED';
    if (type === 'MEET_CONFIRMED' || route === 'meetdetails') return 'MEET_CONFIRMED';
    if (type === 'MEET_CANCELLED' || route === 'cancelledmeets') return 'MEET_CANCELLED';
    return null;
  };

  const openFromNotificationIntent = async (rawData, notificationId = null) => {
    if (!accessToken) return;
    if (notificationId && lastHandledNotificationIdRef.current === notificationId) {
      return;
    }
    const intent = parseNotificationIntent(rawData);
    if (!intent) return;
    if (notificationId) {
      lastHandledNotificationIdRef.current = notificationId;
    }

    setActiveScreen('home');
    setHomeTab('home');
    setIsEditingHomeProfile(false);

    try {
      if (intent === 'MATCH_FOUND') {
        const meet = await fetchFoundMeet();
        await refreshOpenMeets();
        await refreshPastMeets();
        await refreshCancelledMeets();
        if (meet?.meet_id) {
          setFoundMeetNotified(true);
          setHomeFlowScreen('matchFound');
        } else {
          setHomeFlowScreen('main');
          showToast('No active match found.');
        }
        return;
      }

      if (intent === 'MEET_CANCELLED') {
        const cancelled = await refreshCancelledMeets();
        const meetId = String(rawData?.meet_id || '');
        const targetMeet =
          (Array.isArray(cancelled) ? cancelled.find((m) => m?.meet_id === meetId) : null) ||
          (Array.isArray(cancelled) ? cancelled[0] : null);
        if (targetMeet?.meet_id) {
          setSelectedCancelledMeetId(targetMeet.meet_id);
          setActiveMeet(targetMeet);
          setIsUpcomingMeetConfirmed(false);
          setHomeFlowScreen('meetDetails');
        } else {
          setHomeFlowScreen('main');
        }
        return;
      }

      const meets = await refreshOpenMeets();
      await refreshPastMeets();
      await refreshCancelledMeets();
      const top = Array.isArray(meets) && meets.length > 0 ? meets[0] : null;
      if (top?.meet_id) {
        setActiveMeet(top);
        setHomeFlowScreen('meetDetails');
      } else {
        setHomeFlowScreen('main');
      }
    } catch {
      // Keep notification open path non-blocking.
    }
  };

  const buildSmsUrls = (destination, body) => {
    const encodedBody = encodeURIComponent(body || '');
    const encodedDest = encodeURIComponent(destination || '');
    if (Platform.OS === 'ios') {
      return [
        `sms:${encodedDest}&body=${encodedBody}`,
        `sms:${encodedDest}?body=${encodedBody}`,
        `sms:&body=${encodedBody}`,
      ];
    }
    return [`sms:${encodedDest}?body=${encodedBody}`, `sms:${encodedDest}&body=${encodedBody}`];
  };

  const openSmsComposer = async (destination, body) => {
    const urls = buildSmsUrls(destination, body);
    for (const url of urls) {
      try {
        // canOpenURL can be unreliable for sms: URLs on some devices.
        await Linking.openURL(url);
        return true;
      } catch {
        // Try next URL variant.
      }
    }
    return false;
  };

  const requestOtpChallenge = async () => {
    if (FIREBASE_OTP_STRICT && !FIREBASE_PHONE_AUTH_ENABLED) {
      throw new Error(
        `Firebase OTP is not configured. ${FIREBASE_MISSING_KEYS_MESSAGE || 'Complete native Firebase setup.'} Restart app.`
      );
    }

    if (FIREBASE_PHONE_AUTH_ENABLED && FIREBASE_NATIVE_AUTH) {
      try {
        const phoneE164 = `+91${phone}`;
        const confirmation = await FIREBASE_NATIVE_AUTH().signInWithPhoneNumber(phoneE164);
        const verificationId =
          String(confirmation?.verificationId || '').trim() || `native-${Date.now()}`;
        const now = Date.now();
        setFirebaseConfirmation(confirmation || null);
        setVerificationRequestId(verificationId);
        setVerificationExpiresAt(new Date(now + 5 * 60 * 1000).toISOString());
        setOtpResendAvailableAt(
          new Date(now + OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString()
        );
        setOtpCode('');
        return {
          request_id: verificationId,
        };
      } catch (error) {
        setFirebaseConfirmation(null);
        const code = String(error?.code || '');
        const message = String(error?.message || '');
        const isTooManyRequests =
          code.includes('too-many-requests') ||
          message.toLowerCase().includes('too many requests');
        const isConfigIssue =
          code.includes('invalid-api-key') ||
          code.includes('app-not-authorized') ||
          message.toLowerCase().includes('api key');
        if (isConfigIssue) {
          throw new Error('Firebase OTP setup is invalid. Please check Firebase keys.');
        }
        if (isTooManyRequests) {
          throw new Error('Too many OTP attempts. Wait a bit and try again.');
        }
        if (FIREBASE_OTP_STRICT) {
          throw new Error(message || 'Could not send OTP via Firebase. Please try again.');
        }
      }
    }

    const requestData = await apiRequest('/api/v1/auth/otp/request', {
      method: 'POST',
      body: {
        country_code: '+91',
        phone,
      },
    });

    const requestId = requestData?.request_id || null;
    if (!requestId) {
      throw new Error('Could not send OTP. Please try again.');
    }
    setVerificationRequestId(requestId);
    setVerificationExpiresAt(requestData?.expires_at || null);
    setOtpResendAvailableAt(
      new Date(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString()
    );
    setOtpCode('');
    return requestData;
  };

  const verifyOtpAndCreateSession = async (requestId, code) => {
    if (FIREBASE_OTP_STRICT && !FIREBASE_PHONE_AUTH_ENABLED) {
      throw new Error(
        `Firebase OTP is not configured. ${FIREBASE_MISSING_KEYS_MESSAGE || 'Complete native Firebase setup.'} Restart app.`
      );
    }

    if (FIREBASE_PHONE_AUTH_ENABLED && FIREBASE_NATIVE_AUTH) {
      if (!firebaseConfirmation?.confirm) {
        throw new Error('OTP session expired. Please request OTP again.');
      }
      const authResult = await firebaseConfirmation.confirm(code);
      const idToken = await authResult.user.getIdToken(true);
      const tokenData = await apiRequest('/api/v1/auth/firebase/token', {
        method: 'POST',
        timeoutMs: 30000,
        body: {
          id_token: idToken,
        },
      });
      const token = tokenData?.access_token || null;
      setAccessToken(token);
      await persistAccessToken(token);
      return token;
    }

    if (FIREBASE_OTP_STRICT) {
      throw new Error('Firebase OTP is required. Please request OTP again.');
    }

    const tokenData = await apiRequest('/api/v1/auth/otp/verify', {
      method: 'POST',
      timeoutMs: 30000,
      body: {
        request_id: requestId,
        otp: code,
      },
    });

    const token = tokenData?.access_token || null;
    setAccessToken(token);
    await persistAccessToken(token);
    return token;
  };

  const requestSimVerification = async () => {
    const requestData = await apiRequest('/api/v1/auth/sim/request', {
      method: 'POST',
      body: {
        country_code: '+91',
        phone,
      },
    });

    const requestId = requestData?.request_id || null;
    if (!requestId) {
      throw new Error('Could not start verification. Please try again.');
    }

    setVerificationRequestId(requestId);
    setVerificationSmsBody(String(requestData?.sms_body || '').trim());
    setVerificationSmsDestination(String(requestData?.sms_destination || '').trim());
    setVerificationExpiresAt(requestData?.expires_at || null);
    verificationInboundAutoTriggeredRef.current = false;

    const opened = await openSmsComposer(
      String(requestData?.sms_destination || ''),
      String(requestData?.sms_body || '')
    );
    if (!opened) {
      showToast('Could not open SMS app. Please send SMS manually and continue.');
    }

    return requestData;
  };

  const pollSimStatusUntilVerified = async (requestId, flowId) => {
    const maxWaitMs = 120000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWaitMs) {
      if (verificationFlowIdRef.current !== flowId) {
        throw new Error('Verification cancelled');
      }
      const statusData = await apiRequest(
        `/api/v1/auth/sim/status?request_id=${encodeURIComponent(requestId)}`,
        { method: 'GET', timeoutMs: 10000 }
      );
      const status = String(statusData?.status || '').toUpperCase();
      if (statusData?.expires_at) {
        setVerificationExpiresAt(statusData.expires_at);
      }
      if (status === 'VERIFIED') return;
      if (status === 'EXPIRED') {
        throw new Error('Verification request expired. Please resend.');
      }
      await delay(2000);
    }
    throw new Error('Verification timed out. Please resend.');
  };

  const refreshActiveMeet = async (tokenOverride) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      setActiveMeet(null);
      setIsUpcomingMeetConfirmed(false);
      setIsVenueShared(false);
      return null;
    }
    const data = await apiRequest('/api/v1/meets/active', {
      method: 'GET',
      token,
    });
    const nextMeet = data?.meet || null;
    setActiveMeet(nextMeet);
    const confirmed =
      nextMeet?.status === 'CONFIRMED' || nextMeet?.status === 'VENUE_SHARED';
    setIsUpcomingMeetConfirmed(confirmed);
    const venueShared = nextMeet?.status === 'VENUE_SHARED' || !nextMeet?.venue?.is_hidden;
    setIsVenueShared(!!venueShared);
    return nextMeet;
  };

  const refreshOpenMeets = async (tokenOverride) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      setOpenMeets([]);
      return [];
    }
    const data = await apiRequest('/api/v1/meets/open', {
      method: 'GET',
      token,
    });
    const nextMeets = Array.isArray(data?.meets) ? data.meets : [];
    setOpenMeets(nextMeets);
    return nextMeets;
  };

  const refreshCancelledMeets = async (tokenOverride) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      setCancelledMeets([]);
      setSelectedCancelledMeetId(null);
      return [];
    }
    const data = await apiRequest('/api/v1/meets/cancelled', {
      method: 'GET',
      token,
    });
    const nextMeets = Array.isArray(data?.meets) ? data.meets : [];
    setCancelledMeets(nextMeets);
    setSelectedCancelledMeetId((prev) => prev || nextMeets?.[0]?.meet_id || null);
    return nextMeets;
  };

  const refreshPastMeets = async (tokenOverride) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      setPastMeets([]);
      setSelectedPastMeetId(null);
      return [];
    }
    const data = await apiRequest('/api/v1/meets/past', {
      method: 'GET',
      token,
    });
    const nextMeets = Array.isArray(data?.meets) ? data.meets : [];
    setPastMeets(nextMeets);
    setSelectedPastMeetId((prev) => prev || nextMeets?.[0]?.meet_id || null);
    return nextMeets;
  };

  const fetchFoundMeet = async () => {
    if (!accessToken) {
      showToast('Session expired. Please verify number again.');
      setActiveScreen('onboarding');
      return null;
    }
    const data = await apiRequest('/api/v1/meets/found', {
      method: 'GET',
      token: accessToken,
    });
    const nextMeet = data?.meet || null;
    setFoundMeet(nextMeet);
    return nextMeet;
  };

  const fetchActiveMatchRequest = async (tokenOverride) => {
    const token = tokenOverride || accessToken;
    if (!token) {
      setActiveMatchRequest(null);
      return null;
    }
    const data = await apiRequest('/api/v1/match-requests/active', {
      method: 'GET',
      token,
    });
    const nextRequest = data?.request || null;
    setActiveMatchRequest(nextRequest);
    return nextRequest;
  };

  const createMatchRequest = async (options = {}) => {
    const lookForAnother = Boolean(options.lookForAnother);
    const skipCreate = Boolean(options.skipCreate);
    const reusePreviousPreference = Boolean(lookForAnother && activeMatchRequest);
    if (!accessToken) {
      showToast('Session expired. Please verify number again.');
      setActiveScreen('onboarding');
      return null;
    }
    let locationLat = null;
    let locationLng = null;
    let intro = null;
    if (!skipCreate) {
      locationLat =
        typeof options?.location?.lat === 'number'
          ? options.location.lat
          : typeof userLocation.lat === 'number'
            ? userLocation.lat
            : activeMatchRequest?.lat;
      locationLng =
        typeof options?.location?.lng === 'number'
          ? options.location.lng
          : typeof userLocation.lng === 'number'
            ? userLocation.lng
            : activeMatchRequest?.lng;

      if (typeof locationLat !== 'number' || typeof locationLng !== 'number') {
        const error = new Error('Location is required to continue.');
        error.code = 'LOCATION_REQUIRED';
        throw error;
      }

      const currentVoiceValid = !!voiceFileUri && voiceSeconds >= MIN_VOICE_SECONDS;
      const previousVoiceDuration =
        Number(activeMatchRequest?.voice_duration_sec ?? activeMatchRequest?.voiceDurationSec ?? 0) || 0;
      const hasReusableVoice = reusePreviousPreference && previousVoiceDuration >= MIN_VOICE_SECONDS;

      // For "look for another", backend can reuse previous voice metadata from prior requests.
      const requiresLocalVoiceCapture = !lookForAnother;
      if (requiresLocalVoiceCapture && !currentVoiceValid && !hasReusableVoice) {
        const error = new Error('Please record at least 15 seconds voice intro.');
        error.code = 'VOICE_INTRO_REQUIRED';
        throw error;
      }

      intro = voiceIntroRef;
      if (
        currentVoiceValid &&
        !intro ||
        (currentVoiceValid && intro?.source_uri !== voiceFileUri) ||
        (currentVoiceValid && Number(intro?.duration_sec || 0) !== Number(voiceSeconds || 0))
      ) {
        const persisted = await apiRequest('/api/v1/voice-intros', {
          method: 'POST',
          token: accessToken,
          body: {
            voice_duration_sec: voiceSeconds,
            local_uri: voiceFileUri,
            mime_type: 'audio/m4a',
            size_bytes: null,
            recorded_at: new Date().toISOString(),
          },
        });
        intro = {
          ...(persisted?.voice_intro || {}),
          source_uri: voiceFileUri,
        };
        setVoiceIntroRef(intro);
      }
    }

    const fallbackVoiceDuration =
      Number(activeMatchRequest?.voice_duration_sec ?? activeMatchRequest?.voiceDurationSec ?? 0) || 0;
    const fallbackVoiceIntroId =
      activeMatchRequest?.voice_intro_id ?? activeMatchRequest?.voiceIntroId ?? null;
    const fallbackVoiceStorageUrl =
      activeMatchRequest?.voice_storage_url ?? activeMatchRequest?.voiceStorageUrl ?? null;
    const fallbackVoiceMimeType =
      activeMatchRequest?.voice_mime_type ?? activeMatchRequest?.voiceMimeType ?? null;
    const fallbackVoiceSizeBytes =
      activeMatchRequest?.voice_size_bytes ?? activeMatchRequest?.voiceSizeBytes ?? null;
    const fallbackVoiceRecordedAt =
      activeMatchRequest?.voice_recorded_at ?? activeMatchRequest?.voiceRecordedAt ?? null;

    const data = await apiRequest('/api/v1/match-requests', {
      method: 'POST',
      token: accessToken,
      body: {
        availability_date: null,
        availability_slot: availability || null,
        vibe: vibe || null,
        age_min: Number(agePrefMin),
        age_max: Number(agePrefMax),
        lat: typeof locationLat === 'number' ? locationLat : null,
        lng: typeof locationLng === 'number' ? locationLng : null,
        radius_km: 12,
        voice_duration_sec: voiceSeconds || fallbackVoiceDuration || 0,
        voice_intro_id: intro?.voice_intro_id || fallbackVoiceIntroId,
        voice_storage_url: intro?.storage_url || fallbackVoiceStorageUrl,
        voice_mime_type: intro?.mime_type || fallbackVoiceMimeType,
        voice_size_bytes: intro?.size_bytes ?? fallbackVoiceSizeBytes,
        voice_recorded_at: intro?.recorded_at || fallbackVoiceRecordedAt,
        look_for_another: lookForAnother,
        skip_create: skipCreate,
      },
    });
    const nextRequest = data?.request || null;
    setFoundMeetNotified(false);
    setActiveMatchRequest(nextRequest);
    return nextRequest;
  };

  const cancelActiveMatchRequest = async () => {
    if (!accessToken) return null;
    const data = await apiRequest('/api/v1/match-requests/cancel-active', {
      method: 'POST',
      token: accessToken,
    });
    const nextRequest = data?.request || null;
    setActiveMatchRequest(nextRequest);
    return nextRequest;
  };

  const seedDevMatchForCurrentUser = async () => {
    if (!accessToken) {
      showToast('Session expired. Please verify number again.');
      return;
    }
    if (isSeedingDevMatch) return;
    setIsSeedingDevMatch(true);
    try {
      await apiRequest('/api/v1/dev/matcher/seed-self', {
        method: 'POST',
        token: accessToken,
        body: {
          availability_slot: availability || 'Today',
          vibe: vibe || 'Coffee',
        },
      });
      showToast('Demo match seeded. Loading your match...');
      let opened = false;
      for (let i = 0; i < 10; i += 1) {
        const meet = await fetchFoundMeet();
        if (meet?.meet_id) {
          setHomeTab('home');
          setIsEditingHomeProfile(false);
          setHomeFlowScreen('matchFound');
          opened = true;
          break;
        }
        await delay(700);
      }
      if (!opened) {
        showToast('Match is syncing. Please wait a few seconds.');
      }
    } catch (error) {
      showToast(error.message || 'Could not seed demo match');
    } finally {
      setIsSeedingDevMatch(false);
    }
  };

  const handleDevInstantMatchPress = () => {
    devAllowFindingAutoOpenRef.current = true;
    if (!expoPushToken) {
      showToast('Push token not ready yet. Keep app open for a few seconds.');
    }
    showToast('Starting instant match in 5 seconds...');
    setTimeout(() => {
      void seedDevMatchForCurrentUser();
    }, DEV_INSTANT_MATCH_DELAY_MS);
  };

  const persistAccessToken = async (token) => {
    if (!token) return;
    try {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    } catch {
      // Non-blocking: app will still work for current runtime.
    }
  };

  const clearPersistedAccessToken = async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    } catch {
      // Non-blocking cleanup.
    }
  };

  const showToast = (message) => {
    setToastText(message);
    setToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const applyExistingProfile = (profile) => {
    if (!profile) {
      return;
    }

    const nextFullName = toNameCase(profile.full_name);
    const nextGender = String(profile.gender || '').trim();
    const nextAge = String(profile.age || '').trim();
    const nextProfession = String(profile.profession || '').trim();

    setFullName(nextFullName);
    setGender(nextGender);
    setAge(nextAge);
    setProfession(nextProfession);
    setDraftFullName(nextFullName);
    setDraftGender(nextGender);
    setDraftAge(nextAge);
    setDraftProfession(nextProfession);
  };

  const hasCompleteProfile = (profile) => {
    if (!profile?.onboarding_completed) {
      return false;
    }
    return (
      String(profile.full_name || '').trim().length > 1 &&
      String(profile.gender || '').trim().length > 0 &&
      String(profile.age || '').trim().length > 0 &&
      String(profile.profession || '').trim().length > 1
    );
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
        if (!storedToken) {
          setPhone('');
          setIsSessionBootstrapping(false);
          return;
        }

        const meData = await apiRequest('/api/v1/auth/me', {
          method: 'GET',
          token: storedToken,
        });

        setAccessToken(storedToken);
        if (meData?.phone) {
          setPhone(String(meData.phone).replace(/\D/g, '').slice(0, 10));
        }

        const backendProfile = meData?.profile || null;
        if (hasCompleteProfile(backendProfile)) {
          applyExistingProfile(backendProfile);
          await refreshActiveMeet(storedToken);
          await refreshOpenMeets(storedToken);
          await refreshPastMeets(storedToken);
          await refreshCancelledMeets(storedToken);
          void registerPushTokenIfPossible(storedToken);
          setHomeTab('home');
          setHomeFlowScreen('main');
          setIsEditingHomeProfile(false);
          setActiveScreen('home');
        } else {
          void registerPushTokenIfPossible(storedToken);
          setActiveScreen('profile');
        }
      } catch {
        setAccessToken(null);
        setPhone('');
        await clearPersistedAccessToken();
        setActiveScreen('onboarding');
      } finally {
        setIsSessionBootstrapping(false);
      }
    };

    bootstrapSession();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev !== 'active' && nextState === 'active') {
        if (
          !USE_OTP_AUTH &&
          activeScreen === 'verifying' &&
          verificationState === 'loading' &&
          verificationRequestId &&
          verificationSmsBody &&
          phone &&
          !verificationInboundAutoTriggeredRef.current
        ) {
          verificationInboundAutoTriggeredRef.current = true;
          void apiRequest('/api/v1/auth/sim/inbound-sms', {
            method: 'POST',
            body: {
              from: `+91${phone}`,
              message: verificationSmsBody,
            },
          }).catch(() => {
            verificationInboundAutoTriggeredRef.current = false;
          });
        }

        if (activeScreen === 'home' && accessToken) {
          void (async () => {
            try {
              await registerPushTokenIfPossible(accessToken);
              const meet = await fetchFoundMeet();
              if (meet?.meet_id) {
                setFoundMeetNotified(true);
                setHomeTab('home');
                setIsEditingHomeProfile(false);
                setHomeFlowScreen('matchFound');
              }
            } catch {
              // Keep resume path resilient.
            }
          })();
        }
      }
    });
    return () => sub.remove();
  }, [
    accessToken,
    activeScreen,
    phone,
    verificationRequestId,
    verificationSmsBody,
    verificationState,
    USE_OTP_AUTH,
  ]);

  useEffect(() => {
    if (activeScreen === 'onboarding') {
      scrollToTop(onboardingScrollRef);
      return;
    }
    if (activeScreen === 'profile') {
      scrollToTop(profileScrollRef);
      return;
    }
    if (activeScreen === 'home') {
      scrollToTop(homeProfileScrollRef);
    }
  }, [activeScreen, homeFlowScreen, homeTab, isEditingHomeProfile]);

  const completeVerification = async (flowId) => {
    if (USE_OTP_AUTH) {
      const requestData = await requestOtpChallenge();
      if (verificationFlowIdRef.current !== flowId) {
        throw new Error('Verification cancelled');
      }
      return { mode: 'otp', requestData };
    }

    const requestData = await requestSimVerification();
    const requestId = requestData?.request_id;
    await pollSimStatusUntilVerified(requestId, flowId);

    const tokenData = await apiRequest('/api/v1/auth/token', {
      method: 'POST',
      body: { request_id: requestId },
    });

    const token = tokenData?.access_token || null;
    setAccessToken(token);
    await persistAccessToken(token);
    return { mode: 'sim', token };
  };

  const routeAfterVerification = async (token) => {
    if (!token) {
      setActiveScreen('profile');
      return;
    }

    try {
      void registerPushTokenIfPossible(token);
      const meData = await apiRequest('/api/v1/auth/me', {
        method: 'GET',
        token,
      });
      const backendProfile = meData?.profile || null;
      if (hasCompleteProfile(backendProfile)) {
        applyExistingProfile(backendProfile);
        await refreshActiveMeet(token);
        await refreshOpenMeets(token);
        await refreshPastMeets(token);
        await refreshCancelledMeets(token);
        void registerPushTokenIfPossible(token);
        setHomeTab('home');
        setHomeFlowScreen('main');
        setIsEditingHomeProfile(false);
        setActiveScreen('home');
        return;
      }
    } catch {
      // If profile fetch fails, fallback to onboarding form.
    }

    void registerPushTokenIfPossible(token);
    setActiveScreen('profile');
  };

  const startVerification = async () => {
    if (!isPhoneValid) {
      return;
    }
    if (otpBlockSecondsRemaining > 0) {
      const mins = Math.floor(otpBlockSecondsRemaining / 60);
      const secs = otpBlockSecondsRemaining % 60;
      showToast(`OTP temporarily blocked. Try again in ${mins}:${String(secs).padStart(2, '0')}`);
      return;
    }

    setFullName('');
    setGender('');
    setAge('');
    setProfession('');
    setDraftFullName('');
    setDraftGender('');
    setDraftAge('');
    setDraftProfession('');

    setActiveScreen('verifying');
    setVerificationState('loading');
    setVerificationErrorText('');
    setOtpResendCount(0);
    verificationFlowIdRef.current += 1;
    const flowId = verificationFlowIdRef.current;
    try {
      const result = await completeVerification(flowId);
      if (result?.mode === 'otp') {
        setVerificationState('otp_pending');
        showToast('OTP sent');
        return;
      }
      setVerificationState('success');
      await routeAfterVerification(result?.token || null);
      showToast('Verified successfully');
    } catch (error) {
      if (String(error?.message || '') === 'Verification cancelled') {
        return;
      }
      setVerificationState('failed');
      setVerificationErrorText(error?.message || 'Verification failed');
      showToast(error.message || 'Verification failed');
    }
  };

  const retryVerification = async () => {
    if (otpBlockSecondsRemaining > 0) {
      const mins = Math.floor(otpBlockSecondsRemaining / 60);
      const secs = otpBlockSecondsRemaining % 60;
      showToast(`OTP temporarily blocked. Try again in ${mins}:${String(secs).padStart(2, '0')}`);
      return;
    }
    if (otpResendCount >= OTP_RESEND_MAX_ATTEMPTS) {
      const blockUntil = new Date(Date.now() + OTP_RESEND_BLOCK_MINUTES * 60 * 1000).toISOString();
      setOtpBlockedPhone(phone);
      setOtpBlockedUntil(blockUntil);
      setOtpResendAvailableAt(blockUntil);
      showToast(`Too many resends. Try again in ${OTP_RESEND_BLOCK_MINUTES} minutes.`);
      return;
    }

    setVerificationState('loading');
    setVerificationErrorText('');
    setIsVerificationResending(true);
    verificationFlowIdRef.current += 1;
    const flowId = verificationFlowIdRef.current;
    try {
      const result = await completeVerification(flowId);
      if (result?.mode === 'otp') {
        const nextResendCount = otpResendCount + 1;
        setOtpResendCount(nextResendCount);
        if (nextResendCount >= OTP_RESEND_MAX_ATTEMPTS) {
          const blockUntil = new Date(Date.now() + OTP_RESEND_BLOCK_MINUTES * 60 * 1000).toISOString();
          setOtpBlockedPhone(phone);
          setOtpBlockedUntil(blockUntil);
          setOtpResendAvailableAt(blockUntil);
          showToast(`Resend limit reached. Try again in ${OTP_RESEND_BLOCK_MINUTES} minutes.`);
          setVerificationState('otp_pending');
          return;
        }
        setVerificationState('otp_pending');
        showToast('OTP resent');
        return;
      }
      setVerificationState('success');
      await routeAfterVerification(result?.token || null);
      showToast('Verified successfully');
    } catch (error) {
      if (String(error?.message || '') === 'Verification cancelled') {
        return;
      }
      setVerificationState('failed');
      setVerificationErrorText(error?.message || 'Verification failed');
      showToast(error.message || 'Verification failed');
    } finally {
      setIsVerificationResending(false);
    }
  };

  const submitOtpVerification = async () => {
    if (!verificationRequestId) {
      showToast('Please request OTP again');
      return;
    }
    const code = String(otpCode || '').replace(/\D/g, '');
    if (code.length !== ACTIVE_OTP_LENGTH) {
      showToast(`Enter ${ACTIVE_OTP_LENGTH}-digit OTP`);
      return;
    }
    setVerificationState('verifying_otp');
    setVerificationErrorText('');
    try {
      const token = await verifyOtpAndCreateSession(verificationRequestId, code);
      setVerificationState('success');
      await routeAfterVerification(token);
      showToast('Verified successfully');
    } catch (error) {
      const rawCode = String(error?.code || '').toLowerCase();
      const rawMessage = String(error?.message || '').toLowerCase();
      const isCodeExpired =
        rawCode.includes('code-expired') ||
        rawCode.includes('session-expired') ||
        rawMessage.includes('code has expired') ||
        rawMessage.includes('session has expired');
      const isInvalidCode =
        rawCode.includes('invalid-verification-code') ||
        rawCode.includes('invalid-code') ||
        rawMessage.includes('invalid verification code') ||
        rawMessage.includes('invalid code');

      if (isCodeExpired) {
        setOtpCode('');
        setOtpResendAvailableAt(new Date().toISOString());
        setVerificationErrorText('');
        setVerificationState('otp_pending');
        showToast('Code expired. Tap Resend OTP.');
        return;
      }

      setVerificationState('otp_pending');
      setVerificationErrorText(isInvalidCode ? '' : error?.message || 'OTP verification failed');
      showToast(isInvalidCode ? 'Invalid OTP. Try again.' : error?.message || 'OTP verification failed');
    }
  };

  const goBackToPhone = () => {
    verificationFlowIdRef.current += 1;
    setActiveScreen('onboarding');
    setVerificationState('idle');
    setVerificationRequestId(null);
    setVerificationSmsBody('');
    setVerificationSmsDestination('');
    setVerificationExpiresAt(null);
    setOtpResendAvailableAt(null);
    setOtpResendCount(0);
    setOtpCode('');
    setFirebaseConfirmation(null);
    setVerificationErrorText('');
    setIsVerificationResending(false);
  };

  const goToHome = async () => {
    if (!isProfileValid) {
      return;
    }

    if (!accessToken) {
      showToast('Session expired. Please verify number again.');
      setActiveScreen('onboarding');
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiRequest('/api/v1/onboarding/profile', {
        method: 'POST',
        token: accessToken,
        body: {
          full_name: toNameCase(fullName),
          gender,
          age: Number(age),
          profession: profession.trim(),
        },
      });
      await refreshActiveMeet(accessToken);
      await refreshOpenMeets(accessToken);
      await refreshPastMeets(accessToken);
      await refreshCancelledMeets(accessToken);
      setActiveScreen('home');
      setHomeTab('home');
      setHomeFlowScreen('main');
      setIsEditingHomeProfile(false);
      
    } catch (error) {
      showToast(error.message || 'Could not save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const transitionHomePanel = (afterTransition) => {
    Animated.parallel([
      Animated.timing(homePanelOpacity, {
        toValue: 0,
        duration: DS.motion.fast,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(homePanelTranslateY, {
        toValue: 8,
        duration: DS.motion.fast,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      afterTransition();
      homePanelOpacity.setValue(0);
      homePanelTranslateY.setValue(8);
      Animated.parallel([
        Animated.timing(homePanelOpacity, {
          toValue: 1,
          duration: DS.motion.normal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(homePanelTranslateY, {
          toValue: 0,
          duration: DS.motion.normal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleHomeTabSelect = (tab) => {
    if (tab === homeTab) {
      return;
    }
    transitionHomePanel(() => {
      setHomeTab(tab);
      if (tab !== 'profile') {
        setIsEditingHomeProfile(false);
      }
      if (tab !== 'home') {
        setHomeFlowScreen('main');
      }
    });
    
  };

  const startVoiceRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showToast('Microphone permission is required');
        return;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      isStoppingRecordingRef.current = false;
      await releasePlaybackSound();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.setProgressUpdateInterval(300);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status?.isRecording) {
          const elapsed = Math.floor((status.durationMillis || 0) / 1000);
          setVoiceSeconds(elapsed);
        }
      });

      recordingRef.current = recording;
      setVoiceFileUri(null);
      setVoiceIntroRef(null);
      setVoiceMode('recording');
      setVoiceSeconds(0);
      
    } catch {
      showToast('Could not start recording');
      setVoiceMode('idle');
    }
  };

  const stopVoiceRecording = async () => {
    const recording = recordingRef.current;
    if (!recording || isStoppingRecordingRef.current) {
      return;
    }
    isStoppingRecordingRef.current = true;

    try {
      recording.setOnRecordingStatusUpdate(null);
      const stopStatus = await recording.stopAndUnloadAsync();
      const durationSeconds = Math.floor(
        (stopStatus?.durationMillis || voiceSeconds * 1000 || 0) / 1000
      );
      const uri = recording.getURI();

      recordingRef.current = null;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setVoiceSeconds(durationSeconds);
      if (durationSeconds < MIN_VOICE_SECONDS) {
        setVoiceFileUri(null);
        setVoiceIntroRef(null);
        setVoiceMode('idle');
        showToast('Please record at least 15 seconds');
        return;
      }

      setVoiceFileUri(uri || null);
      setVoiceIntroRef(null);
      setVoiceMode('recorded');
      showToast('Voice intro saved');
      
    } catch {
      recordingRef.current = null;
      setVoiceMode('idle');
      showToast('Could not stop recording');
    } finally {
      isStoppingRecordingRef.current = false;
    }
  };

  const toggleVoicePlayback = async () => {
    if (!voiceFileUri) {
      return;
    }
    try {
      if (!playbackRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: voiceFileUri },
          { shouldPlay: true }
        );
        playbackRef.current = sound;
        setIsPlayingVoice(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status?.isLoaded) {
            return;
          }
          if (status.didJustFinish) {
            setIsPlayingVoice(false);
          }
        });
        return;
      }

      if (isPlayingVoice) {
        await playbackRef.current.pauseAsync();
        setIsPlayingVoice(false);
      } else {
        await playbackRef.current.replayAsync();
        setIsPlayingVoice(true);
      }
    } catch {
      showToast('Could not play recording');
      await releasePlaybackSound();
    }
  };

  const retryVoiceRecording = async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    isStoppingRecordingRef.current = false;
    await releasePlaybackSound();
    setVoiceMode('idle');
    setVoiceSeconds(0);
    setVoiceFileUri(null);
    setVoiceIntroRef(null);
  };

  const openPreferencesFlow = () => {
    transitionHomePanel(() => {
      setHomeFlowScreen('preferences');
    });
    
  };

  const backFromPreferences = async () => {
    if (voiceMode === 'recording') {
      await stopVoiceRecording();
    }
    await releasePlaybackSound();
    transitionHomePanel(() => setHomeFlowScreen('main'));
  };

  const continueFromPreferences = async () => {
    if (!canContinuePreferences) {
      return;
    }
    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      if (currentPermission?.status === 'granted') {
        await handleAllowLocation();
        return;
      }
    } catch {
      // Fall back to permission modal.
    }
    setLocationPromptVisible(true);
  };

  const showLocationBlockedModal = (message) => {
    setLocationPromptVisible(false);
    setLocationBlockedMessage(message || 'Location access is required to continue.');
    setLocationBlockedVisible(true);
  };

  const requestAndCaptureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setUserLocation((prev) => ({
        ...prev,
        permission: permission.status || 'denied',
      }));
      return { granted: false };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy:
        Platform.OS === 'ios' ? Location.Accuracy.Balanced : Location.Accuracy.High,
    });
    const coords = position?.coords || {};
    const lat =
      typeof coords.latitude === 'number'
        ? Number(coords.latitude.toFixed(6))
        : null;
    const lng =
      typeof coords.longitude === 'number'
        ? Number(coords.longitude.toFixed(6))
        : null;
    const accuracy =
      typeof coords.accuracy === 'number' ? Number(coords.accuracy) : null;
    const capturedAt = new Date().toISOString();

    setUserLocation({
      lat,
      lng,
      accuracy,
      permission: 'granted',
      capturedAt,
    });

    return { granted: true, lat, lng, accuracy };
  };

  const handleAllowLocation = async () => {
    setLocationPromptVisible(false);
    void releasePlaybackSound();
    devAllowFindingAutoOpenRef.current = false;
    let nextLocation = null;
    try {
      const result = await requestAndCaptureLocation();
      if (result?.granted) {
        nextLocation = {
          lat: result.lat,
          lng: result.lng,
        };
      } else {
        showLocationBlockedModal(
          'Location access is required to find nearby groups. Please enable it to continue.'
        );
        return;
      }
    } catch {
      showLocationBlockedModal(
        'Location seems unavailable right now. Turn on location services and try again.'
      );
      return;
    }

    if (
      !nextLocation ||
      typeof nextLocation.lat !== 'number' ||
      typeof nextLocation.lng !== 'number'
    ) {
      showLocationBlockedModal(
        'Location access is required to find nearby groups. Please enable it to continue.'
      );
      return;
    }

    try {
      await createMatchRequest({ location: nextLocation });
    } catch (error) {
      if (error?.code === 'OPEN_MEET_EXISTS') {
        try {
          const existingFoundMeet = await fetchFoundMeet();
          if (existingFoundMeet?.meet_id) {
            transitionHomePanel(() => setHomeFlowScreen('matchFound'));
            return;
          }
        } catch {
          // Ignore and continue to finding screen.
        }
      } else if (error?.code === 'RETRY_COOLDOWN') {
        // Do not block user flow for short cooldowns; finding screen will retry in background.
      } else {
        showToast(error.message || 'Could not start matching request');
        return;
      }
    }
    transitionHomePanel(() => setHomeFlowScreen('finding'));
    
  };

  const handleNotNowLocation = () => {
    setLocationPromptVisible(false);
    showLocationBlockedModal(
      'Location is mandatory for matching nearby groups. Enable it to continue.'
    );
  };

  const closeLocationBlockedModal = () => {
    setLocationBlockedVisible(false);
  };

  const openLocationSettings = async () => {
    setLocationBlockedVisible(false);
    try {
      await Linking.openSettings();
    } catch {
      showToast('Please open Settings and enable location for Hushh.');
    }
  };

  const requestStopFinding = () => {
    setStopFindingConfirmVisible(true);
  };

  const cancelStopFinding = () => {
    setStopFindingConfirmVisible(false);
  };

  const confirmStopFinding = async () => {
    setStopFindingConfirmVisible(false);
    setSecureSpotModalVisible(false);
    setIsConfirmingPayment(false);
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    try {
      await cancelActiveMatchRequest();
      setFoundMeetNotified(false);
    } catch (error) {
      showToast(error.message || 'Could not cancel active search');
    }
    transitionHomePanel(() => setHomeFlowScreen('main'));
  };

  const backFromFinding = async () => {
    setStopFindingConfirmVisible(false);
    let latest = activeMatchRequest;
    try {
      // Ensure Home reflects current search status immediately after leaving Finding screen.
      latest = await fetchActiveMatchRequest();
    } catch {
      // Non-blocking: keep local state fallback.
    }
    const status = String(latest?.status || '').toUpperCase();
    if (status === 'QUEUED' || status === 'MATCHED') {
      showToast("We're still looking in the background.");
    }
    transitionHomePanel(() => setHomeFlowScreen('main'));
  };

  const openMatchFoundPreview = async () => {
    if (isLoadingFoundMeet || matchPollingBusyRef.current) {
      return;
    }
    matchPollingBusyRef.current = true;
    setIsLoadingFoundMeet(true);
    try {
      const activeReq = await fetchActiveMatchRequest();
      const meet = await fetchFoundMeet();
      if (!meet?.meet_id) {
        if (activeReq?.sla_state === 'NO_MATCH_RETRYING' || activeReq?.status === 'QUEUED') {
          showToast('No meet yet. We are still finding your group.');
        } else {
          showToast('Finalizing your match. Please wait...');
        }
        return;
      }
      setHomeTab('home');
      setIsEditingHomeProfile(false);
      setHomeFlowScreen('matchFound');
    } catch (error) {
      showToast(error.message || 'Could not load match');
    } finally {
      matchPollingBusyRef.current = false;
      setIsLoadingFoundMeet(false);
    }
  };

  useEffect(() => {
    if (homeTab !== 'home' || homeFlowScreen !== 'finding' || !accessToken) {
      findingEnsureRequestRef.current = false;
      return undefined;
    }
    let cancelled = false;
    const poll = async () => {
      if (cancelled || matchPollingBusyRef.current) {
        return;
      }
      matchPollingBusyRef.current = true;
      try {
        const activeReq = await fetchActiveMatchRequest();
        const meet = await fetchFoundMeet();
        const canAutoOpenFound = !DEV_MATCH_REQUIRES_TAP || devAllowFindingAutoOpenRef.current;
        if (!cancelled && meet?.meet_id && canAutoOpenFound) {
          setHomeTab('home');
          setIsEditingHomeProfile(false);
          setHomeFlowScreen('matchFound');
        } else if (!cancelled && !activeReq && !findingEnsureRequestRef.current) {
          findingEnsureRequestRef.current = true;
          try {
            await createMatchRequest();
          } catch (error) {
            if (error?.code !== 'OPEN_MEET_EXISTS' && error?.code !== 'RETRY_COOLDOWN') {
              showToast(error.message || 'Could not start matching request');
            }
          }
        } else if (!cancelled && activeReq?.status === 'MATCHED') {
          // Matched request detected but meet payload is still syncing.
          // Stay on finding screen until real meet_id is available.
        }
      } catch {
        // Keep polling silently in background for resilience.
      } finally {
        matchPollingBusyRef.current = false;
      }
    };

    void poll();
    const id = setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [accessToken, homeFlowScreen, homeTab]);

  useEffect(() => {
    if (activeScreen !== 'home' || homeTab !== 'home' || !accessToken) {
      return undefined;
    }

    let cancelled = false;
    const pollBackgroundSearch = async () => {
      if (cancelled || matchPollingBusyRef.current) return;
      if (homeFlowScreen === 'finding') return;
      matchPollingBusyRef.current = true;
      try {
        const activeReq = await fetchActiveMatchRequest();
        const meet = await fetchFoundMeet();
        if (cancelled) return;

        if (meet?.meet_id) {
          if (!foundMeetNotified) {
            setFoundMeetNotified(true);
            showToast('Match found. Review and secure your spot.');
          }
          setHomeTab('home');
          setIsEditingHomeProfile(false);
          setHomeFlowScreen('matchFound');
          return;
        }

        if (!activeReq) {
          setFoundMeetNotified(false);
        }
      } catch {
        // Keep polling quietly.
      } finally {
        matchPollingBusyRef.current = false;
      }
    };

    void pollBackgroundSearch();
    const id = setInterval(() => {
      void pollBackgroundSearch();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [accessToken, activeScreen, homeFlowScreen, homeTab, foundMeetNotified]);

  useEffect(() => {
    if (homeTab !== 'home' || homeFlowScreen !== 'matchFound') {
      return undefined;
    }
    const id = setInterval(() => {
      setMeetNowTs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [homeFlowScreen, homeTab]);

  useEffect(() => {
    if (homeFlowScreen !== 'matchFound') return;
    const meetId = String(effectiveFoundMeet?.meet_id || '');
    if (!meetId || matchFoundVibratedMeetIdRef.current === meetId) return;
    matchFoundVibratedMeetIdRef.current = meetId;
    try {
      Vibration.vibrate(80);
    } catch {
      // No-op on devices where vibration is unavailable.
    }
  }, [homeFlowScreen, effectiveFoundMeet?.meet_id]);

  useEffect(() => {
    if (activeScreen !== 'home' || homeTab !== 'home' || homeFlowScreen !== 'main' || !accessToken) {
      return undefined;
    }
    let cancelled = false;
    const sync = async () => {
      try {
        const meets = await refreshOpenMeets();
        await refreshPastMeets();
        await refreshCancelledMeets();
        if (!cancelled) {
          const top = Array.isArray(meets) && meets.length > 0 ? meets[0] : null;
          if (top) {
            setActiveMeet(top);
            setIsUpcomingMeetConfirmed(
              top?.status === 'CONFIRMED' || top?.status === 'VENUE_SHARED'
            );
            setIsVenueShared(
              top?.status === 'VENUE_SHARED' || !top?.venue?.is_hidden
            );
          } else {
            setActiveMeet(null);
            setIsUpcomingMeetConfirmed(false);
            setIsVenueShared(false);
          }
        }
      } catch {
        // Keep last successful state.
      }
    };
    void sync();
    const id = setInterval(() => void sync(), 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeScreen, homeFlowScreen, homeTab, accessToken]);

  useEffect(() => {
    if (!accessToken) return undefined;
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await registerPushTokenIfPossible(accessToken);
    };

    void run();
    const id = setInterval(() => {
      if (cancelled || expoPushToken) return;
      void run();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(id);
      pushRegisteringRef.current = false;
    };
  }, [accessToken, expoPushToken]);

  useEffect(() => {
    void (async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        const data = lastResponse?.notification?.request?.content?.data || null;
        const notificationId =
          String(lastResponse?.notification?.request?.identifier || '').trim() || null;
        if (data) {
          void openFromNotificationIntent(data, notificationId);
        }
      } catch {
        // Ignore startup notification recovery issues.
      }
    })();

    notificationReceivedSubRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification?.request?.content?.data || null;
        const notificationId = String(notification?.request?.identifier || '').trim() || null;
        const intent = parseNotificationIntent(data);
        if (!intent) return;
        if (intent === 'MATCH_FOUND') {
          showToast('Match found. Review and secure your spot.');
        } else if (intent === 'MEET_CONFIRMED') {
          showToast('Meet confirmed. Venue will be shared soon.');
        } else if (intent === 'MEET_CANCELLED') {
          showToast('Meet cancelled. Check cancelled meets.');
        } else if (intent === 'VENUE_SHARED') {
          showToast('Venue shared. Open meet details.');
        }
        void openFromNotificationIntent(data, notificationId);
      }
    );

    notificationResponseSubRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data || null;
        const notificationId =
          String(response?.notification?.request?.identifier || '').trim() || null;
        if (!parseNotificationIntent(data)) return;
        void openFromNotificationIntent(data, notificationId);
      });

    return () => {
      notificationReceivedSubRef.current?.remove?.();
      notificationResponseSubRef.current?.remove?.();
      notificationReceivedSubRef.current = null;
      notificationResponseSubRef.current = null;
    };
  }, [accessToken]);

  const backFromMatchFound = async () => {
    setSecureSpotModalVisible(false);
    setIsConfirmingPayment(false);
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    let startedAnotherSearch = false;
    try {
      devAllowFindingAutoOpenRef.current = false;
      await createMatchRequest({ lookForAnother: true });
      showToast('Looking for another meet...');
      setFoundMeetNotified(false);
      setFoundMeet(null);
      startedAnotherSearch = true;
      await refreshOpenMeets();
      await refreshPastMeets();
      await refreshCancelledMeets();
    } catch (error) {
      showToast(error.message || 'Could not request another meet');
    }
    if (startedAnotherSearch) {
      transitionHomePanel(() => setHomeFlowScreen('finding'));
    }
  };

  const openSecureSpotModal = () => {
    setIsConfirmingPayment(false);
    setSecureSpotModalVisible(true);
  };

  const closeSecureSpotModal = () => {
    if (isConfirmingPayment) {
      return;
    }
    setSecureSpotModalVisible(false);
  };

  const confirmSecureSpot = async () => {
    if (isConfirmingPayment) {
      return;
    }
    if (!effectiveFoundMeet?.meet_id || !accessToken) {
      showToast('Meet not ready. Try again.');
      return;
    }
    if (effectiveFoundMeet?.commitment?.is_expired) {
      showToast('Response window expired. Please look for another meet.');
      return;
    }
    setSecureSpotModalVisible(false);
    setIsConfirmingPayment(true);
    try {
      let nextMeet = null;
      try {
        const intentData = await apiRequest(
          `/api/v1/meets/${effectiveFoundMeet.meet_id}/payment-intent`,
          {
            method: 'POST',
            token: accessToken,
            timeoutMs: 15000,
          }
        );

        const paymentId = intentData?.payment?.payment_id;
        if (!paymentId) {
          throw new Error('Could not initialize payment');
        }

        const data = await apiRequest('/api/v1/payments/callback', {
          method: 'POST',
          token: accessToken,
          body: {
            payment_id: paymentId,
            status: 'CONFIRMED',
          },
          timeoutMs: 15000,
        });
        nextMeet = data?.meet || null;
      } catch (error) {
        if (!/route not found/i.test(String(error?.message || ''))) {
          throw error;
        }
        const fallbackData = await apiRequest(
          `/api/v1/meets/${effectiveFoundMeet.meet_id}/confirm`,
          {
            method: 'POST',
            token: accessToken,
            timeoutMs: 15000,
          }
        );
        nextMeet = fallbackData?.meet || null;
      }
      setActiveMeet(nextMeet);
      setFoundMeet(nextMeet);
      setFoundMeetNotified(false);
      setActiveMatchRequest(null);
      setIsUpcomingMeetConfirmed(true);
      setIsVenueShared(false);
      await refreshOpenMeets();
      await refreshPastMeets();
      await refreshCancelledMeets();
      transitionHomePanel(() => setHomeFlowScreen('main'));
      showToast('Spot confirmed');
    } catch (error) {
      showToast(error.message || 'Payment confirmation failed');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const openMeetDetails = (meetItem = null) => {
    if (meetItem) {
      setActiveMeet(meetItem);
      setSelectedCancelledMeetId(null);
      setIsUpcomingMeetConfirmed(
        String(meetItem?.status || '').toUpperCase() === 'VENUE_SHARED' ||
          getUpcomingMeetState(meetItem).isConfirmed
      );
    }
    transitionHomePanel(() => setHomeFlowScreen('meetDetails'));
  };

  const backFromMeetDetails = () => {
    setSecureSpotModalVisible(false);
    transitionHomePanel(() => setHomeFlowScreen('main'));
  };

  const openPastMeet = () => {
    setSelectedPastMeetId((prev) => prev || pastMeets?.[0]?.meet_id || null);
    transitionHomePanel(() => setHomeFlowScreen('pastMeet'));
  };

  const openCancelledMeet = (meetItem = null) => {
    const nextMeet = meetItem || effectiveCancelledMeet;
    if (!nextMeet) return;
    setSelectedCancelledMeetId(nextMeet?.meet_id || null);
    setActiveMeet(nextMeet);
    setIsUpcomingMeetConfirmed(false);
    transitionHomePanel(() => setHomeFlowScreen('meetDetails'));
  };

  const backFromPastMeet = () => {
    setFeedbackModalVisible(false);
    setFeedbackTargetMeetId(null);
    setBlockModalVisible(false);
    setBlockedPersonName('');
    setBlockedPersonUserId('');
    transitionHomePanel(() => setHomeFlowScreen('main'));
  };

  const openFeedbackModal = (meetId = null) => {
    setFeedbackRating(0);
    setFeedbackNote('');
    setFeedbackTargetMeetId(meetId || effectivePastMeet?.meet_id || effectiveActiveMeet?.meet_id || null);
    setFeedbackModalVisible(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackModalVisible(false);
  };

  const submitFeedback = async () => {
    if (!feedbackRating) {
      return;
    }
    const meetId = feedbackTargetMeetId || effectivePastMeet?.meet_id || effectiveActiveMeet?.meet_id;
    if (!meetId || !accessToken) {
      showToast('No meet found for feedback');
      return;
    }
    try {
      await apiRequest(`/api/v1/meets/${meetId}/feedback`, {
        method: 'POST',
        token: accessToken,
        body: {
          rating: feedbackRating,
          note: feedbackNote.trim() || undefined,
        },
      });
      setFeedbackModalVisible(false);
      setFeedbackRating(0);
      setFeedbackNote('');
      setFeedbackTargetMeetId(null);
      await refreshPastMeets();
      await refreshCancelledMeets();
      showToast('Thanks for the feedback');
    } catch (error) {
      showToast(error.message || 'Could not submit feedback');
    }
  };

  const requestBlockPerson = (person, isCurrentlyBlocked = false) => {
    setBlockedPersonName(person?.name || '');
    setBlockedPersonUserId(person?.user_id || person?.participant_id || '');
    setBlockActionMode(isCurrentlyBlocked ? 'unblock' : 'block');
    setBlockModalVisible(true);
  };

  const closeBlockModal = () => {
    setBlockModalVisible(false);
    setBlockedPersonName('');
    setBlockedPersonUserId('');
    setBlockActionMode('block');
  };

  const confirmBlockPerson = async () => {
    if (!blockedPersonName) {
      return;
    }
    if (!accessToken) {
      showToast('Session expired. Please verify number again.');
      setActiveScreen('onboarding');
      return;
    }
    try {
      const fallbackId = `guest_${blockedPersonName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const blockedUserId = blockedPersonUserId || fallbackId;
      if (blockActionMode === 'unblock') {
        await apiRequest('/api/v1/users/unblock', {
          method: 'POST',
          token: accessToken,
          body: { blocked_user_id: blockedUserId },
        });
        setBlockedUserIds((prev) => prev.filter((id) => id !== blockedUserId));
      } else {
        await apiRequest('/api/v1/users/block', {
          method: 'POST',
          token: accessToken,
          body: {
            blocked_user_id: blockedUserId,
            reason: 'user_blocked_from_past_meet',
          },
        });
        setBlockedUserIds((prev) =>
          prev.includes(blockedUserId) ? prev : [...prev, blockedUserId]
        );
      }
      setBlockModalVisible(false);
      setBlockedPersonName('');
      setBlockedPersonUserId('');
      setBlockActionMode('block');
      showToast(
        blockActionMode === 'unblock'
          ? `${blockedPersonName.split(',')[0]} unblocked`
          : `${blockedPersonName.split(',')[0]} blocked`
      );
    } catch (error) {
      showToast(
        error.message ||
          (blockActionMode === 'unblock'
            ? 'Could not unblock user'
            : 'Could not block user')
      );
    }
  };

  const formatVoiceTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const openHomeProfileEdit = () => {
    setDraftFullName(fullName);
    setDraftGender(gender);
    setDraftAge(age);
    setDraftProfession(profession);
    transitionHomePanel(() => setIsEditingHomeProfile(true));
    
  };

  const cancelHomeProfileEdit = () => {
    transitionHomePanel(() => setIsEditingHomeProfile(false));
  };

  const saveHomeProfileEdit = async () => {
    if (!isEditProfileValid) {
      return;
    }
    const nextFullName = toNameCase(draftFullName);
    const nextGender = draftGender;
    const nextAge = draftAge.trim();
    const nextProfession = draftProfession.trim();

    setFullName(nextFullName);
    setGender(nextGender);
    setAge(nextAge);
    setProfession(nextProfession);
    transitionHomePanel(() => setIsEditingHomeProfile(false));

    if (accessToken) {
      try {
        await apiRequest('/api/v1/onboarding/profile', {
          method: 'POST',
          token: accessToken,
          body: {
            full_name: nextFullName,
            gender: nextGender,
            age: Number(nextAge),
            profession: nextProfession,
          },
        });
      } catch (error) {
        showToast(error.message || 'Profile updated locally');
        return;
      }
    }

    showToast('Profile updated');
    
  };

  const requestLogout = () => {
    setLogoutConfirmVisible(true);
    
  };

  const cancelLogout = () => {
    setLogoutConfirmVisible(false);
  };

  const confirmLogout = async () => {
    const token = accessToken;
    if (token) {
      try {
        if (expoPushToken) {
          await apiRequest('/api/v1/notifications/push-token', {
            method: 'DELETE',
            token,
            body: { push_token: expoPushToken },
          });
        }
      } catch {
        // Continue local logout even if push token cleanup fails.
      }
      try {
        await apiRequest('/api/v1/auth/logout', {
          method: 'POST',
          token,
        });
      } catch {
        // Continue local logout even if backend call fails.
      }
    }
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setLogoutConfirmVisible(false);
    setHomeTab('home');
    setHomeFlowScreen('main');
    setIsEditingHomeProfile(false);
    setVerificationState('idle');
    setVerificationRequestId(null);
    setVerificationSmsBody('');
    setVerificationSmsDestination('');
    setVerificationExpiresAt(null);
    setOtpResendAvailableAt(null);
    setOtpCode('');
    setFirebaseConfirmation(null);
    setVerificationErrorText('');
    setPhone('');
    setFullName('');
    setGender('');
    setAge('');
    setProfession('');
    setDraftFullName('');
    setDraftGender('');
    setDraftAge('');
    setDraftProfession('');
    setVoiceMode('idle');
    setVoiceSeconds(0);
    setVoiceFileUri(null);
    setLocationPromptVisible(false);
    setStopFindingConfirmVisible(false);
    setSecureSpotModalVisible(false);
    setIsConfirmingPayment(false);
    setIsUpcomingMeetConfirmed(false);
    setIsVenueShared(false);
    setFoundMeet(null);
    setActiveMeet(null);
    setOpenMeets([]);
    setActiveMatchRequest(null);
    setPastMeets([]);
    setSelectedPastMeetId(null);
    setCancelledMeets([]);
    setSelectedCancelledMeetId(null);
    setExpoPushToken('');
    setFeedbackModalVisible(false);
    setFeedbackRating(0);
    setFeedbackNote('');
    setFeedbackTargetMeetId(null);
    setBlockModalVisible(false);
    setBlockedPersonName('');
    setBlockedPersonUserId('');
    setBlockActionMode('block');
    setBlockedUserIds([]);
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    setAccessToken(null);
    await clearPersistedAccessToken();
    setActiveScreen('onboarding');
    showToast('Logged out');
    
  };

  const renderOnboarding = () => (
    <ScrollView
      ref={onboardingScrollRef}
      style={styles.scrollWrap}
      contentContainerStyle={styles.onboardingScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={styles.brand}>Hushh</Text>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Real conversations.</Text>
          <Text style={styles.title}>Real people.</Text>
          <Text style={styles.subtitle}>
            Meet real people nearby for coffee, a walk, or a meal. No small talk.
            No judgment. Just honest connection.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile number</Text>
          <TextInput
            ref={phoneInputRef}
            accessibilityLabel="Mobile number"
            value={phone}
            onChangeText={handlePhoneChange}
            onFocus={() => scrollFieldIntoView(onboardingScrollRef, phoneInputRef)}
            placeholder="(555) 123-4567"
            placeholderTextColor={DS.color.textDisabled}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={10}
            style={styles.input}
          />

          <View style={styles.buttonWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send verification"
              accessibilityState={{ disabled: !isPhoneValid }}
              disabled={!isPhoneValid}
              onPress={startVerification}
              style={({ pressed }) => [
                styles.button,
                isPhoneValid ? styles.buttonActive : styles.buttonDisabled,
                pressed && isPhoneValid ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  isPhoneValid ? styles.buttonTextActive : styles.buttonTextDisabled,
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>

          <Text style={styles.helper}>You'll be asked to confirm this number is yours.</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderVerifying = () => {
    if (USE_OTP_AUTH) {
      const isVerifyingOtp = verificationState === 'verifying_otp';
      const isOtpBlocked = otpBlockSecondsRemaining > 0;
      const hasResendCooldownStarted = Boolean(otpResendAvailableAt);
      const effectiveResendSecondsRemaining = hasResendCooldownStarted
        ? otpResendSecondsRemaining
        : OTP_RESEND_COOLDOWN_SECONDS;
      const canResend =
        hasResendCooldownStarted &&
        effectiveResendSecondsRemaining <= 0 &&
        !isVerificationResending &&
        !isOtpBlocked &&
        otpResendCount < OTP_RESEND_MAX_ATTEMPTS;
      const resendMins = Math.floor(effectiveResendSecondsRemaining / 60);
      const resendSecs = effectiveResendSecondsRemaining % 60;
      const resendLabel = `${resendMins}:${String(resendSecs).padStart(2, '0')}`;
      const blockMins = Math.floor(otpBlockSecondsRemaining / 60);
      const blockSecs = otpBlockSecondsRemaining % 60;
      const blockLabel = `${blockMins}:${String(blockSecs).padStart(2, '0')}`;
      const otpDigits = Array.from({ length: ACTIVE_OTP_LENGTH }, (_, index) => otpCode[index] || '');

      return (
        <View style={[styles.content, styles.verificationContainer]}>
          <View style={styles.otpVisualWrap}>
            <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
              <Circle cx="32" cy="32" r="31" stroke="#e2e2e2" />
              <Path
                d="M23.5 28V22.5C23.5 17.2 27.2 13.5 32 13.5C36.8 13.5 40.5 17.2 40.5 22.5V28"
                stroke="#6f6f6f"
                strokeWidth="2.3"
                strokeLinecap="round"
              />
              <Path
                d="M20.5 30.3C20.5 29 21.6 27.9 22.9 27.9H41.1C42.4 27.9 43.5 29 43.5 30.3V40.7C43.5 42 42.4 43.1 41.1 43.1H22.9C21.6 43.1 20.5 42 20.5 40.7V30.3Z"
                stroke="#6f6f6f"
                strokeWidth="2.3"
              />
              <Circle cx="32" cy="35.4" r="2.2" fill="#171717" />
            </Svg>
          </View>
          <Text style={styles.verificationTitle}>Enter OTP</Text>
          <Text style={styles.verificationSubtitle}>Code sent to mobile number +91 {phone}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => otpInputRef.current?.focus?.()}
            style={styles.otpBoxesRow}
          >
            {otpDigits.map((digit, index) => (
              <View
                key={`otp-box-${index}`}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  otpCode.length === index ? styles.otpBoxActive : null,
                ]}
              >
                <Text style={styles.otpBoxText}>{digit || ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={otpInputRef}
            accessibilityLabel="OTP code"
            value={otpCode}
            onChangeText={(value) =>
              setOtpCode(String(value || '').replace(/\D/g, '').slice(0, ACTIVE_OTP_LENGTH))
            }
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={ACTIVE_OTP_LENGTH}
            style={styles.otpHiddenInput}
            autoFocus
          />
          <View style={styles.verificationActions}>
            <Pressable
              accessibilityRole="button"
              onPress={retryVerification}
              disabled={!canResend}
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.secondaryButtonPriority,
                !canResend ? styles.secondaryDisabled : null,
                pressed && canResend ? styles.secondaryPressed : null,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {isVerificationResending
                  ? 'Resending...'
                  : isOtpBlocked
                    ? `Retry in ${blockLabel}`
                  : canResend
                    ? 'Resend OTP'
                    : `Resend in ${resendLabel}`}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={submitOtpVerification}
              disabled={isVerifyingOtp || String(otpCode || '').length !== ACTIVE_OTP_LENGTH}
              style={({ pressed }) => [
                styles.button,
                String(otpCode || '').length === ACTIVE_OTP_LENGTH ? styles.buttonActive : styles.buttonDisabled,
                pressed && String(otpCode || '').length === ACTIVE_OTP_LENGTH ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  String(otpCode || '').length === ACTIVE_OTP_LENGTH
                    ? styles.buttonTextActive
                    : styles.buttonTextDisabled,
                ]}
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goBackToPhone}
              style={({ pressed }) => [styles.ghostAction, pressed ? styles.ghostActionPressed : null]}
            >
              <Text style={styles.ghostActionText}>Edit number</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    const isFailed = verificationState === 'failed';
    const canResend = verificationSecondsRemaining <= 0;
    const mins = Math.floor(verificationSecondsRemaining / 60);
    const secs = verificationSecondsRemaining % 60;
    const remainingLabel = `${mins}:${String(secs).padStart(2, '0')}`;

    return (
      <View style={[styles.content, styles.verificationContainer]}>
        <View style={styles.verificationIndicatorWrap}>
          {isFailed ? (
            <Text style={styles.errorGlyph}>!</Text>
          ) : (
            <ActivityIndicator size="small" color={DS.color.textMuted} />
          )}
        </View>

        <Text style={styles.verificationTitle}>
          {isFailed ? "Couldn't verify your number" : "Confirming it's you"}
        </Text>
        <Text style={styles.verificationSubtitle}>
          {isFailed
            ? verificationErrorText || 'Network or OTP verification failed. Please try again.'
            : 'This will only take a moment'}
        </Text>
        {!isFailed && verificationRequestId ? (
          <Text style={styles.verificationMeta}>
            {verificationSecondsRemaining > 0
              ? `Waiting for verification SMS • expires in ${remainingLabel}`
              : 'Verification window expired. Please resend verification.'}
          </Text>
        ) : null}
        {isFailed ? (
          <View style={styles.verificationActions}>
            <Pressable
              accessibilityRole="button"
              onPress={retryVerification}
              disabled={isVerificationResending}
              style={({ pressed }) => [styles.button, styles.buttonActive, pressed ? styles.buttonPressed : null]}
            >
              <Text style={[styles.buttonText, styles.buttonTextActive]}>
                {isVerificationResending ? 'Resending...' : 'Retry verification'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goBackToPhone}
              style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryPressed : null]}
            >
              <Text style={styles.secondaryButtonText}>Edit number</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.verificationActions}>
            <Pressable
              accessibilityRole="button"
              onPress={retryVerification}
              disabled={!canResend || isVerificationResending}
              style={({ pressed }) => [
                styles.button,
                canResend ? styles.buttonActive : styles.buttonDisabled,
                pressed && canResend ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  canResend ? styles.buttonTextActive : styles.buttonTextDisabled,
                ]}
              >
                {isVerificationResending ? 'Resending...' : 'Resend verification'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderSessionBootstrapping = () => (
    <View style={[styles.content, styles.verificationContainer]}>
      <View style={styles.verificationIndicatorWrap}>
        <ActivityIndicator size="small" color={DS.color.textMuted} />
      </View>
      <Text style={styles.verificationTitle}>Checking your session</Text>
      <Text style={styles.verificationSubtitle}>Getting things ready...</Text>
    </View>
  );

  const renderProfile = () => (
    <ScrollView
      ref={profileScrollRef}
      style={styles.scrollWrap}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>Let's get to know you</Text>
          <Text style={styles.profileSubtitle}>
            Share a few details so we can find great meets for you
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            ref={fullNameInputRef}
            accessibilityLabel="Full Name"
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => scrollFieldIntoView(profileScrollRef, fullNameInputRef)}
            placeholder="Enter your full name"
            placeholderTextColor={DS.color.textDisabled}
            style={styles.input}
          />

          <Text style={styles.labelSection}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: gender === item }}
                onPress={() => setGender(item)}
                style={({ pressed }) => [
                  styles.genderChip,
                  gender === item ? styles.genderChipSelected : null,
                  pressed ? styles.genderChipPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    gender === item ? styles.genderChipTextSelected : null,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.labelSection}>Age</Text>
          <TextInput
            ref={ageInputRef}
            accessibilityLabel="Age"
            value={age}
            onChangeText={handleAgeChange}
            onFocus={() => scrollFieldIntoView(profileScrollRef, ageInputRef)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="Enter your age"
            placeholderTextColor={DS.color.textDisabled}
            style={styles.input}
          />

          <Text style={styles.labelSection}>Profession</Text>
          <TextInput
            ref={professionInputRef}
            accessibilityLabel="Profession"
            value={profession}
            onChangeText={setProfession}
            onFocus={() => scrollFieldIntoView(profileScrollRef, professionInputRef)}
            placeholder="e.g. Product Designer, Student"
            placeholderTextColor={DS.color.textDisabled}
            style={styles.input}
          />

          <View style={styles.buttonWrapLarge}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !isProfileValid || isSavingProfile }}
              disabled={!isProfileValid || isSavingProfile}
              onPress={goToHome}
              style={({ pressed }) => [
                styles.button,
                isProfileValid && !isSavingProfile ? styles.buttonActive : styles.buttonDisabled,
                pressed && isProfileValid && !isSavingProfile ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  isProfileValid && !isSavingProfile
                    ? styles.buttonTextActive
                    : styles.buttonTextDisabled,
                ]}
              >
                {isSavingProfile ? 'Saving...' : 'Continue'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              You're about to join a community of genuine people looking for real
              conversations
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderHome = () => {
    const searchStatus = String(activeMatchRequest?.status || '').toUpperCase();
    const hasOpenFoundMeet = Boolean(effectiveFoundMeet?.meet_id);
    const isSearchActive =
      (searchStatus === 'QUEUED' ||
        searchStatus === 'MATCHED' ||
        String(activeMatchRequest?.sla_state || '').toUpperCase() === 'NO_MATCH_RETRYING') &&
      !hasOpenFoundMeet;

    const renderWhyIcon = (kind) => {
      if (kind === 'authentic') {
        return (
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Path d="M10 3l1.8 3.6L16 8l-3.1 2.9.7 4.1L10 13l-3.6 2 .7-4.1L4 8l4.2-1.4L10 3z" fill="#f4b400" />
          </Svg>
        );
      }
      if (kind === 'serendipity') {
        return (
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Circle cx="10" cy="10" r="6.5" stroke="#ef4444" strokeWidth="1.6" fill="#fee2e2" />
            <Circle cx="13.5" cy="6.5" r="2.1" fill="#3b82f6" />
          </Svg>
        );
      }
      return (
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Path d="M10 3l6 2v4.3c0 3.5-2.3 5.9-6 7.7-3.7-1.8-6-4.2-6-7.7V5l6-2z" fill="#fde68a" />
          <Path d="M10 7.2l1 2h2.2l-1.8 1.5.7 2-2-1.1-2 1.1.7-2-1.8-1.5H9l1-2z" fill="#ca8a04" />
        </Svg>
      );
    };

    const renderHomeMain = () => (
      <>
        {(() => {
          const filteredOpenMeets = openMeets.filter((meet) =>
            ['FOUND', 'CONFIRMED', 'VENUE_SHARED'].includes(String(meet?.status || '').toUpperCase())
          );
          const upcomingMeets = filteredOpenMeets.length > 0
            ? filteredOpenMeets
            : isUpcomingMeetConfirmed && activeMeet
              ? [activeMeet]
              : [];

          if (upcomingMeets.length === 0) return null;

          return (
            <View style={styles.homeSection}>
              <Text style={styles.upcomingSectionTitle}>Upcoming Meets</Text>
              {upcomingMeets.map((meetItem, index) => {
          const state = getUpcomingMeetState(meetItem);
          const isShared = state.isVenueShared;
          return (
          <Pressable
            key={meetItem?.meet_id || `meet-${index}`}
            accessibilityRole="button"
            onPress={() => openMeetDetails(meetItem)}
            style={({ pressed }) => [
              styles.upcomingMeetCard,
              pressed ? styles.secondaryPressed : null,
            ]}
          >
            <View style={styles.upcomingBadgeRow}>
                <Text style={styles.upcomingBadge}>{state.statusLabel}</Text>
            </View>
            <View style={styles.upcomingMeetRow}>
              <View style={styles.upcomingMeetMain}>
                <Text style={styles.upcomingMeetTitle}>
                    {meetItem?.topic_label || 'Matched Group'}
                </Text>
                <Text style={styles.upcomingMeetMeta}>
                    {meetItem?.match_time_label || 'Tomorrow, 6 PM'}
                </Text>
                <Text style={styles.upcomingMeetVenue}>
                    {isShared
                      ? `${meetItem?.venue?.name || 'The Social'}, ${meetItem?.venue?.address || 'Indiranagar'}${meetItem?.venue?.manager_name ? ` • ${meetItem.venue.manager_name}` : ''}${meetItem?.venue?.phone ? ` • ${meetItem.venue.phone}` : ''}`
                      : state.isConfirmed
                        ? `${state.committed}/${state.total} committed • group confirmed`
                      : state.cancelled > 0
                        ? `${state.committed}/${state.total} committed • ${state.cancelled} cancelled`
                        : `${state.committed}/${state.total} committed • waiting for everyone`}
                </Text>
              </View>
              <View style={styles.upcomingMeetIconWrap}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Circle cx="7.2" cy="8.2" r="2.1" fill="#f59e0b" />
                  <Circle cx="16.8" cy="8.2" r="2.1" fill="#f59e0b" />
                  <Circle cx="12" cy="12.2" r="2.4" fill="#f59e0b" />
                  <Path d="M3.8 19.1c.5-2.6 2.6-4.3 5.3-4.3s4.8 1.7 5.3 4.3" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  <Path d="M9.6 20.2c.6-3 2.8-4.9 5.7-4.9s5.1 1.9 5.7 4.9" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </Svg>
              </View>
            </View>
          </Pressable>
          );
              })}
            </View>
          );
        })()}

        <ReadyToMeetCard
          title={
            isSearchActive
              ? "We're looking for people nearby"
              : 'Ready to meet?'
          }
          ctaLabel={isSearchActive ? 'View search status' : 'Yes, start looking'}
          onStartLooking={() => {
            if (isSearchActive) {
              transitionHomePanel(() => setHomeFlowScreen('finding'));
              return;
            }
            openPreferencesFlow();
          }}
        />

        {pastMeets.length > 0 ? (
          <View style={styles.homeSection}>
            <Text style={styles.sectionTitle}>Recent Meets</Text>
            {pastMeets.map((meetItem, index) => (
              <Pressable
                key={meetItem?.meet_id || `past-${index}`}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedPastMeetId(meetItem?.meet_id || null);
                  openPastMeet();
                }}
                style={({ pressed }) => [
                  styles.recentMeetCard,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <View style={styles.recentMeetAvatar}>
                  <Text style={styles.recentMeetAvatarText}>
                    {String((meetItem?.topic_label || 'M').charAt(0)).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recentMeetBody}>
                  <Text style={styles.recentMeetTitle}>{meetItem?.topic_label || 'Past meet'}</Text>
                  <Text style={styles.recentMeetMeta}>
                    {`${formatPastMeetDateLabel(meetItem)}${meetItem?.venue?.name ? ` • ${meetItem.venue.name}` : ''}`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {cancelledMeets.length > 0 ? (
          <View style={styles.homeSection}>
            <Text style={styles.sectionTitle}>Cancelled Meets</Text>
            {cancelledMeets.map((meetItem, index) => (
              <Pressable
                key={meetItem?.meet_id || `cancelled-${index}`}
                accessibilityRole="button"
                onPress={() => openCancelledMeet(meetItem)}
                style={({ pressed }) => [
                  styles.recentMeetCard,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <View style={styles.recentMeetAvatar}>
                  <Text style={styles.recentMeetAvatarText}>
                    {String((meetItem?.topic_label || 'C').charAt(0)).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recentMeetBody}>
                  <Text style={styles.recentMeetTitle}>{meetItem?.topic_label || 'Cancelled meet'}</Text>
                  <Text style={styles.recentMeetMeta}>
                    {`${formatPastMeetDateLabel(meetItem)} • Cancelled`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.homeSection}>
          <Text style={styles.sectionTitle}>Why Hushh?</Text>
          <View style={styles.whyCard}>
            <View style={styles.whyIconBadge}>{renderWhyIcon('authentic')}</View>
            <Text style={styles.whyTitle}>Authentic moments</Text>
            <Text style={styles.whyBody}>
              No profiles, no algorithms. Just real people seeking genuine
              conversations nearby
            </Text>
          </View>
          <View style={styles.whyCard}>
            <View style={styles.whyIconBadge}>{renderWhyIcon('serendipity')}</View>
            <Text style={styles.whyTitle}>Serendipity by design</Text>
            <Text style={styles.whyBody}>
              The best connections happen by chance. We help those moments find
              you
            </Text>
          </View>
          <View style={styles.whyCard}>
            <View style={styles.whyIconBadge}>{renderWhyIcon('silent')}</View>
            <Text style={styles.whyTitle}>Silent understanding</Text>
            <Text style={styles.whyBody}>
              A minimal, respectful space where every interaction feels
              intentional and safe
            </Text>
          </View>
        </View>
      </>
    );

    const renderFlowHeader = (title, onBackPress, rightAction = null) => (
      <View style={styles.fixedFlowHeader}>
        <View style={styles.fixedFlowHeaderInner}>
          <Pressable
            accessibilityRole="button"
            onPress={onBackPress}
            style={({ pressed }) => [styles.backChip, pressed ? styles.backChipPressed : null]}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={DS.color.textPrimary}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.fixedFlowTitle}>{title}</Text>
          {rightAction ? rightAction : <View style={styles.flowHeaderRightSpacer} />}
        </View>
      </View>
    );

    const renderPreferencesFlow = () => (
      <View style={[styles.homeFlowSection, styles.flowScreenRoot]}>
        <View style={styles.prefSection}>
          <Text style={styles.prefLabel}>When are you available?</Text>
          <View style={styles.prefChipRow}>
            {['Today', 'Tomorrow', 'This Weekend'].map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setAvailability(item)}
                style={({ pressed }) => [
                  styles.prefChip,
                  availability === item ? styles.prefChipActive : null,
                  pressed ? styles.prefChipPressed : null,
                ]}
              >
                <Text style={availability === item ? styles.prefChipTextActive : styles.prefChipText}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.prefSection}>
          <Text style={styles.prefLabel}>What's the vibe?</Text>
          <View style={styles.vibeGrid}>
            {[
              { key: 'Coffee', iconXml: VIBE_ICON_COFFEE },
              { key: 'Meal', iconXml: VIBE_ICON_MEAL },
              { key: 'Party', iconXml: VIBE_ICON_PARTY },
            ].map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => setVibe(item.key)}
                style={({ pressed }) => [
                  styles.vibeCard,
                  vibe === item.key ? styles.vibeCardActive : null,
                  pressed ? styles.prefChipPressed : null,
                ]}
              >
                <SvgXml xml={item.iconXml} width={28} height={28} />
                <Text style={styles.vibeText}>{item.key}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.prefSection}>
          <Text style={styles.prefLabel}>Age preference</Text>
          <View style={styles.ageRow}>
            <View style={styles.ageFieldWrap}>
              <Text style={styles.ageFieldLabel}>Min</Text>
              <TextInput
                value={agePrefMin}
                onChangeText={(text) => setAgePrefMin(text.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                style={styles.ageInput}
              />
            </View>
            <Text style={styles.ageDash}>-</Text>
            <View style={styles.ageFieldWrap}>
              <Text style={styles.ageFieldLabel}>Max</Text>
              <TextInput
                value={agePrefMax}
                onChangeText={(text) => setAgePrefMax(text.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                style={styles.ageInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.prefSection}>
          <Text style={styles.prefLabel}>Introduce yourself</Text>
          <Text style={styles.voiceSubtitle}>
            Record a 15-second voice intro to help others feel your vibe
          </Text>
          <View style={styles.voiceCard}>
            {voiceMode === 'idle' ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={startVoiceRecording}
                  style={({ pressed }) => [styles.voiceCircle, pressed ? styles.voicePressed : null]}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Path d="M12 4a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3z M6 11a6 6 0 0012 0 M12 17v3" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
                <Text style={styles.voicePrimary}>Tap to record</Text>
                <Text style={styles.voiceHint}>Minimum 15 seconds</Text>
              </>
            ) : null}

            {voiceMode === 'recording' ? (
              <>
                <View style={styles.voicePulseWrap}>
                  <Animated.View
                    style={[
                      styles.voicePulseRing,
                      {
                        opacity: recordPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.22, 0.02],
                        }),
                        transform: [
                          {
                            scale: recordPulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.34],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={stopVoiceRecording}
                    style={({ pressed }) => [styles.voiceStopCircle, pressed ? styles.voicePressed : null]}
                  >
                    <View style={styles.voiceStopSquare} />
                  </Pressable>
                </View>
                <Text style={styles.voiceRecordingText}>Recording</Text>
                <Text style={styles.voiceTimerText}>{formatVoiceTime(voiceSeconds)}</Text>
                <Text style={styles.voiceHint}>
                  Stop after {MIN_VOICE_SECONDS}s to save
                </Text>
              </>
            ) : null}

            {voiceMode === 'recorded' ? (
              <View style={styles.voiceRecordedRow}>
                <View style={styles.voiceRecordedLeft}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPlayingVoice ? 'Pause voice intro' : 'Play voice intro'}
                    onPress={toggleVoicePlayback}
                    style={({ pressed }) => [
                      styles.voicePlayCircle,
                      isPlayingVoice ? styles.voicePlayCircleActive : null,
                      pressed ? styles.voicePressed : null,
                    ]}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      {isPlayingVoice ? (
                        <>
                          <Path d="M8 7h3v10H8z" fill="#ffffff" />
                          <Path d="M13 7h3v10h-3z" fill="#ffffff" />
                        </>
                      ) : (
                        <Path d="M9 7l8 5-8 5V7z" fill="#ffffff" />
                      )}
                    </Svg>
                  </Pressable>
                  <View>
                    <Text style={styles.voiceIntroTitle}>Voice intro</Text>
                    <Text style={styles.voiceHint}>
                      {formatVoiceTime(voiceSeconds)}{voiceFileUri ? ' • saved' : ''}{isPlayingVoice ? ' • playing' : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={retryVoiceRecording}
                  style={({ pressed }) => [styles.retryButton, pressed ? styles.secondaryPressed : null]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );

    const renderFindingFlow = () => (
      <View style={[styles.homeFlowSection, styles.flowScreenRoot]}>
        <View style={styles.findingMapCard}>
          <StaticCityMapVisual />
        </View>

        <Text style={styles.findingTitle}>We're on it</Text>
        <Text style={styles.findingBody}>
          Looking for people nearby who match your vibe. We'll notify you when we
          find a group-feel free to close the app and continue your day.
        </Text>
        <Text style={styles.findingEstimate}>Estimated: 6 hours</Text>

        <View style={styles.findingInfoCard}>
          <View style={styles.whyIconBadge}>{renderWhyIcon('authentic')}</View>
          <Text style={styles.findingInfoTitle}>While you wait</Text>
          <Text style={styles.findingInfoBody}>
            Close the app and go about your day. We'll send you a notification
            when your meet is ready.
          </Text>
        </View>
        <View style={styles.findingInfoCard}>
          <View style={styles.whyIconBadge}>{renderWhyIcon('silent')}</View>
          <Text style={styles.findingInfoTitle}>Safe & private</Text>
          <Text style={styles.findingInfoBody}>
            Your exact location stays private. We only share approximate distance
            to keep everyone safe.
          </Text>
        </View>

        <Text style={styles.findingHelperText}>
          We will automatically open your match screen as soon as your group is ready.
        </Text>

        <Pressable onPress={requestStopFinding} style={({ pressed }) => [styles.stopFindingButton, pressed ? styles.secondaryPressed : null]}>
          <Text style={styles.stopFindingText}>Stop finding</Text>
        </Pressable>

        {DEV_MATCH_HELPER_ENABLED ? (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            onPress={handleDevInstantMatchPress}
            style={({ pressed }) => [
              styles.findingDemoButton,
              (pressed || isSeedingDevMatch) ? styles.secondaryPressed : null,
            ]}
          >
            <Text style={styles.findingDemoButtonText}>
              {isSeedingDevMatch ? 'Seeding match...' : 'Dev: Instant match'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );

    const renderMatchFoundFlow = () => (
      <MatchFoundScreen
        styles={styles}
        matchTimeLabel={effectiveFoundMeet?.match_time_label || MATCH_TIME_LABEL}
        responseWindowLabel={responseWindowLabel}
        isVenueShared={!effectiveFoundMeet?.venue?.is_hidden}
        matchedPeople={(effectiveFoundMeet?.participants || MATCHED_PEOPLE).map((person, index) => ({
          id: person.participant_id || person.id || `p-${index}`,
          name: person.name,
          subtitle: person.subtitle,
          initial: person.initial,
        }))}
        venueTitle={effectiveFoundMeet?.venue?.is_hidden ? 'Hidden Venue' : `${effectiveFoundMeet?.venue?.name || ''}${effectiveFoundMeet?.venue?.address ? `, ${effectiveFoundMeet.venue.address}` : ''}`}
        venueBody={
          effectiveFoundMeet?.venue?.is_hidden
            ? `We'll reveal the exact spot once everyone commits. Sharing venue in ${effectiveFoundMeet?.venue?.share_eta_mins || 30} mins.`
            : 'Venue shared. Check details and reach 10 minutes early.'
        }
      />
    );

    const renderMeetDetailsFlow = () => (
      (() => {
        const rawPeople = (effectiveActiveMeet?.participants || MATCHED_PEOPLE).map((person, index) => ({
          id: person.participant_id || person.id || `d-${index}`,
          name: person.name,
          subtitle: person.subtitle,
          initial: person.initial,
          status: person.status || 'PENDING',
        }));
        return (
      <MeetDetailsScreen
        styles={styles}
        matchedPeople={rawPeople}
        meetData={effectiveActiveMeet}
        onActionFeedback={showToast}
      />
        );
      })()
    );

    const renderPastMeetFlow = () => (
      <PastMeetScreen
        styles={styles}
        pastMeet={effectivePastMeet}
        blockedUserIds={blockedUserIds}
        onRequestBlock={requestBlockPerson}
        onOpenFeedback={() => openFeedbackModal(effectivePastMeet?.meet_id)}
      />
    );

    const renderProfileTab = () => {
      if (isEditingHomeProfile) {
        return (
          <View style={styles.homeSection}>
            <Text style={styles.profileScreenHeader}>Profile</Text>

            <View style={styles.profileEditHeader}>
              <Text style={styles.profileEditTitle}>Edit profile</Text>
              <Text style={styles.profileEditSubtitle}>
                Update your details to help us find great meets for you
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                ref={editFullNameInputRef}
                accessibilityLabel="Edit full name"
                value={draftFullName}
                onChangeText={setDraftFullName}
                onFocus={() => scrollFieldIntoView(homeProfileScrollRef, editFullNameInputRef)}
                placeholder="Enter your full name"
                placeholderTextColor={DS.color.textDisabled}
                style={styles.input}
              />

              <Text style={styles.labelSection}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: draftGender === item }}
                    onPress={() => setDraftGender(item)}
                    style={({ pressed }) => [
                      styles.genderChip,
                      draftGender === item ? styles.genderChipSelected : null,
                      pressed ? styles.genderChipPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        draftGender === item ? styles.genderChipTextSelected : null,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.labelSection}>Age</Text>
              <TextInput
                ref={editAgeInputRef}
                accessibilityLabel="Edit age"
                value={draftAge}
                onChangeText={handleDraftAgeChange}
                onFocus={() => scrollFieldIntoView(homeProfileScrollRef, editAgeInputRef)}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Enter your age"
                placeholderTextColor={DS.color.textDisabled}
                style={styles.input}
              />

              <Text style={styles.labelSection}>Profession</Text>
              <TextInput
                ref={editProfessionInputRef}
                accessibilityLabel="Edit profession"
                value={draftProfession}
                onChangeText={setDraftProfession}
                onFocus={() => scrollFieldIntoView(homeProfileScrollRef, editProfessionInputRef)}
                placeholder="e.g. Product Designer, Student"
                placeholderTextColor={DS.color.textDisabled}
                style={styles.input}
              />

              <View style={styles.editActionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={cancelHomeProfileEdit}
                  style={({ pressed }) => [
                    styles.editActionButton,
                    styles.editActionButtonSecondary,
                    pressed ? styles.secondaryPressed : null,
                  ]}
                >
                  <Text style={styles.editActionSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isEditProfileValid }}
                  disabled={!isEditProfileValid}
                  onPress={saveHomeProfileEdit}
                  style={({ pressed }) => [
                    styles.editActionButton,
                    isEditProfileValid ? styles.buttonActive : styles.buttonDisabled,
                    pressed && isEditProfileValid ? styles.buttonPressed : null,
                  ]}
                >
                  <View style={styles.saveCtaInner}>
                    <Svg width={14} height={14} viewBox="0 0 24 24">
                      <Path
                        d="M5 4h10l4 4v12H5V4z M8 4v6h8V4"
                        stroke="#ffffff"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.editActionPrimaryText}>Save Changes</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.homeSection}>
          <View style={styles.profileTopRow}>
            <Text style={styles.profileScreenHeader}>Profile</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={openHomeProfileEdit}
              style={({ pressed }) => [styles.editIconButton, pressed ? styles.editIconPressed : null]}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M12 20h9 M16.5 3.5a2.1 2.1 0 113 3L8 18l-4 1 1-4 11.5-11.5z"
                  stroke={DS.color.textMuted}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>

          <View style={styles.profileDivider} />

          <Text style={styles.profileNameDisplay}>
            {fullName?.trim()?.length ? toNameCase(fullName) : 'your name'}
          </Text>
          <Text style={styles.profileProfessionDisplay}>
            {profession?.trim()?.length ? profession.trim().toUpperCase() : 'PROFESSION'}
          </Text>

          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Age</Text>
            <Text style={styles.profileInfoValue}>{age || '-'}</Text>
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.profileInfoRow}>
            <Text style={styles.profileInfoLabel}>Gender</Text>
            <Text style={styles.profileInfoValue}>{gender || '-'}</Text>
          </View>
          <View style={styles.profileDivider} />

          <Text style={styles.profilePrivacyText}>
            Your details are private until{'\n'}matched
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={requestLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed ? styles.secondaryPressed : null,
            ]}
          >
            <View style={styles.logoutInner}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path
                  d="M14 16l4-4-4-4 M18 12H9 M11 20H6a2 2 0 01-2-2V6a2 2 0 012-2h5"
                  stroke={DS.color.textPrimary}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.logoutText}>Log out</Text>
            </View>
          </Pressable>
        </View>
      );
    };

    const isFlowScreen =
      homeTab === 'home' &&
      (
        homeFlowScreen === 'preferences' ||
        homeFlowScreen === 'finding' ||
        homeFlowScreen === 'matchFound' ||
        homeFlowScreen === 'meetDetails' ||
        homeFlowScreen === 'pastMeet'
      );

    return (
      <View style={styles.homeFlowContainer}>
        {isFlowScreen
          ? homeFlowScreen === 'preferences'
            ? renderFlowHeader('Meet Preferences', backFromPreferences)
            : homeFlowScreen === 'finding'
              ? renderFlowHeader('Finding your meet', backFromFinding)
              : homeFlowScreen === 'matchFound'
                ? null
                : homeFlowScreen === 'meetDetails'
                  ? renderFlowHeader('Meet Details', backFromMeetDetails)
                  : renderFlowHeader('Past Meet', backFromPastMeet)
          : null}

        <ScrollView
          ref={homeProfileScrollRef}
          style={styles.scrollWrap}
          contentContainerStyle={[
            styles.scrollContentHome,
            homeTab === 'home' && homeFlowScreen === 'preferences'
              ? styles.scrollContentHomeFlowPreferences
              : homeTab === 'home' && homeFlowScreen === 'matchFound'
                ? styles.scrollContentHomeFlowMatchFound
              : isFlowScreen
                ? styles.scrollContentHomeFlowStandard
                : null,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Animated.View
              style={{
                opacity: homePanelOpacity,
                transform: [{ translateY: homePanelTranslateY }],
              }}
            >
              {homeTab === 'home' && homeFlowScreen === 'main' ? <Text style={styles.brand}>Hushh</Text> : null}
              {homeTab === 'home'
                ? homeFlowScreen === 'preferences'
                  ? renderPreferencesFlow()
                  : homeFlowScreen === 'finding'
                    ? renderFindingFlow()
                    : homeFlowScreen === 'matchFound'
                      ? renderMatchFoundFlow()
                      : homeFlowScreen === 'meetDetails'
                        ? renderMeetDetailsFlow()
                        : homeFlowScreen === 'pastMeet'
                          ? renderPastMeetFlow()
                    : renderHomeMain()
                : renderProfileTab()}
            </Animated.View>
          </View>
        </ScrollView>

        {homeTab === 'home' && homeFlowScreen === 'preferences' ? (
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,1)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.prefBottomCtaWrap}
          >
            <Pressable
              accessibilityRole="button"
              disabled={!canContinuePreferences}
              onPress={continueFromPreferences}
              style={({ pressed }) => [
                styles.button,
                canContinuePreferences ? styles.buttonActive : styles.buttonDisabled,
                canContinuePreferences && pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  canContinuePreferences ? styles.buttonTextActive : styles.buttonTextDisabled,
                ]}
              >
                Continue
              </Text>
            </Pressable>
            <Text style={styles.prefLocationHint}>
              Location access is required to continue
            </Text>
          </LinearGradient>
        ) : null}

        {homeTab === 'home' && homeFlowScreen === 'matchFound' ? (
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.94)', 'rgba(255,255,255,1)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.matchBottomCtaWrap}
          >
            <Pressable
              accessibilityRole="button"
              onPress={openSecureSpotModal}
              style={({ pressed }) => [
                styles.button,
                styles.buttonActive,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={[styles.buttonText, styles.buttonTextActive]}>Secure your spot</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={backFromMatchFound}
              style={({ pressed }) => [styles.matchBottomSecondary, pressed ? styles.secondaryPressed : null]}
            >
              <Text style={styles.matchBottomSecondaryText}>Look for another meet</Text>
            </Pressable>
          </LinearGradient>
        ) : null}
      </View>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style={splashDone ? 'dark' : 'light'} />

      <Animated.View pointerEvents="none" style={[styles.splashContainer, { opacity: splashOpacity }]}>
        <LinearGradient
          colors={['#0b0b0b', '#161616', '#0b0b0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View
          style={[
            styles.splashAura,
            {
              transform: [
                {
                  translateX: splashBgShiftA.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-28, 26],
                  }),
                },
                {
                  translateY: splashBgShiftA.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 14],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(79,70,229,0.20)', 'rgba(236,72,153,0.14)', 'rgba(245,158,11,0.10)']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.splashAuraFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.splashAuraTwo,
            {
              transform: [
                {
                  translateX: splashBgShiftB.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, -24],
                  }),
                },
                {
                  translateY: splashBgShiftB.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, -18],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(59,130,246,0.10)', 'rgba(255,255,255,0.03)', 'rgba(79,70,229,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.splashAuraFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.gradientOverlay,
            {
              transform: [{ translateY: overlayShift }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlayFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ translateY: logoTranslate }, { scale: logoScale }] },
          ]}
        >
          <SvgXml xml={HUSHH_LOGO_SVG} width={120} height={34} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[styles.onboardingContainer, { opacity: onboardingOpacity }]}
        pointerEvents="auto"
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? DS.keyboard.iosVerticalOffset : 0}
        >
          <SafeAreaView style={styles.onboardingInner}>
            {toastVisible ? (
              <View style={[styles.toast, activeScreen === 'home' ? styles.toastHome : styles.toastDefault]}>
                <Text style={styles.toastText} numberOfLines={2} ellipsizeMode="tail">
                  {toastText}
                </Text>
              </View>
            ) : null}

            <Animated.View
              style={[
                styles.screenViewport,
                {
                  opacity: screenOpacity,
                  transform: [{ translateY: screenTranslateY }, { scale: screenScale }],
                },
              ]}
            >
              {isSessionBootstrapping ? renderSessionBootstrapping() : null}
              {!isSessionBootstrapping && activeScreen === 'onboarding' ? renderOnboarding() : null}
              {!isSessionBootstrapping && activeScreen === 'verifying' ? renderVerifying() : null}
              {!isSessionBootstrapping && activeScreen === 'profile' ? renderProfile() : null}
              {!isSessionBootstrapping && activeScreen === 'home' ? renderHome() : null}
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Animated.View>

      {splashDone && !isSessionBootstrapping && activeScreen === 'home' && homeFlowScreen === 'main' ? (
        <HomeBottomNav homeTab={homeTab} onSelectTab={handleHomeTabSelect} />
      ) : null}

      <Modal
        visible={locationPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={handleNotNowLocation}
      >
        <View style={styles.locationModalBackdrop}>
          <View style={styles.locationBackdropFrost} />
          <View style={styles.locationModalCard}>
            <View style={styles.locationIconWrap}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M12 21s7-5.8 7-11a7 7 0 10-14 0c0 5.2 7 11 7 11z M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke={DS.color.textPrimary} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.locationModalTitle}>Enable Location</Text>
            <Text style={styles.locationModalBody}>
              We need your location to find people nearby. Your exact location is
              never shared-only approximate distance.
            </Text>
            <View style={styles.locationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleNotNowLocation}
                style={({ pressed }) => [
                  styles.locationSecondaryButton,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <Text style={styles.locationSecondaryText}>Not now</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleAllowLocation}
                style={({ pressed }) => [
                  styles.locationPrimaryButton,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.locationPrimaryText}>Allow</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={locationBlockedVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLocationBlockedModal}
      >
        <View style={styles.locationModalBackdrop}>
          <View style={styles.locationBackdropFrost} />
          <View style={styles.locationModalCard}>
            <View style={styles.locationIconWrap}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path
                  d="M12 9v4 M12 17h.01 M10.29 3.86l-8.2 14.2A2 2 0 003.82 21h16.36a2 2 0 001.73-2.94l-8.2-14.2a2 2 0 00-3.46 0z"
                  stroke={DS.color.textPrimary}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.locationBlockedTitle}>Location Required</Text>
            <Text style={styles.locationModalBody}>{locationBlockedMessage}</Text>
            <View style={styles.locationActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeLocationBlockedModal}
                style={({ pressed }) => [
                  styles.locationSecondaryButton,
                  pressed ? styles.secondaryPressed : null,
                ]}
              >
                <Text style={styles.locationSecondaryText}>Not now</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={openLocationSettings}
                style={({ pressed }) => [
                  styles.locationPrimaryButton,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.locationPrimaryText}>Open Settings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {isConfirmingPayment ? (
        <View style={styles.globalPaymentOverlay} pointerEvents="auto">
          <View style={styles.globalPaymentBackdrop}>
            <View style={styles.globalPaymentLoader}>
              <ActivityIndicator size="large" color="#d4d4d4" />
            </View>
            <Text style={styles.globalPaymentText}>Confirming payment...</Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={stopFindingConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelStopFinding}
      >
        <View style={styles.stopModalBackdrop}>
          <View style={styles.stopModalCard}>
            <View style={styles.stopModalIconWrap}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M6 6l12 12 M18 6L6 18"
                  stroke={DS.color.textPrimary}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.stopModalTitle}>Stop finding?</Text>
            <Text style={styles.stopModalBody}>
              We will pause your current search and return you to Home.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={confirmStopFinding}
              style={({ pressed }) => [
                styles.stopModalPrimaryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.stopModalPrimaryText}>Yes, stop now</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={cancelStopFinding}
              style={({ pressed }) => [
                styles.stopModalSecondaryButton,
                pressed ? styles.secondaryPressed : null,
              ]}
            >
              <Text style={styles.stopModalSecondaryText}>Keep finding</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SecureSpotModal
        visible={secureSpotModalVisible}
        styles={styles}
        isConfirmingPayment={isConfirmingPayment}
        feeAmountLabel="₹0.00"
        responseWindowLabel={responseWindowLabel}
        onClose={closeSecureSpotModal}
        onConfirm={confirmSecureSpot}
      />

      <FeedbackModal
        visible={feedbackModalVisible}
        styles={styles}
        feedbackRating={feedbackRating}
        feedbackNote={feedbackNote}
        onClose={closeFeedbackModal}
        onSetRating={setFeedbackRating}
        onSetNote={setFeedbackNote}
        onSubmit={submitFeedback}
      />

      <BlockUserModal
        visible={blockModalVisible}
        styles={styles}
        blockedPersonName={blockedPersonName}
        mode={blockActionMode}
        onClose={closeBlockModal}
        onConfirm={confirmBlockPerson}
      />

      <Modal
        visible={logoutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.logoutModalBackdrop}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutModalIconWrap}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M14 16l4-4-4-4 M18 12H9 M11 20H6a2 2 0 01-2-2V6a2 2 0 012-2h5"
                  stroke="#ff2d3d"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <Text style={styles.logoutModalTitle}>Log out?</Text>
            <Text style={styles.logoutModalBody}>
              Are you sure you want to log out of{'\n'}your account?
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={confirmLogout}
              style={({ pressed }) => [
                styles.logoutConfirmButton,
                pressed ? styles.logoutConfirmPressed : null,
              ]}
            >
              <Text style={styles.logoutConfirmText}>Yes, log out</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={cancelLogout}
              style={({ pressed }) => [
                styles.logoutCancelButton,
                pressed ? styles.secondaryPressed : null,
              ]}
            >
              <Text style={styles.logoutCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DS.color.white,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlayFill: {
    flex: 1,
  },
  splashAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: '22%',
    left: '18%',
    opacity: 0.72,
  },
  splashAuraTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: '14%',
    right: '8%',
    opacity: 0.6,
  },
  splashAuraFill: {
    flex: 1,
    borderRadius: 999,
  },
  onboardingContainer: {
    flex: 1,
    zIndex: 1,
  },
  keyboardAvoidingRoot: {
    flex: 1,
  },
  onboardingInner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: DS.layout.topPaddingBreathable,
  },
  screenViewport: {
    flex: 1,
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: SIDE_GUTTER,
    paddingTop: DS.space.md,
  },
  brand: {
    fontSize: DS.type.brand,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  copyBlock: {
    marginTop: DS.space.s56,
  },
  title: {
    fontSize: DS.type.heading,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    lineHeight: 38,
  },
  subtitle: {
    marginTop: DS.space.s16,
    fontSize: DS.type.body,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
    lineHeight: 24,
  },
  form: {
    marginTop: 36,
  },
  label: {
    fontSize: DS.type.label,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    marginBottom: DS.space.s8,
  },
  labelSection: {
    fontSize: DS.type.label,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    marginTop: DS.space.s32,
    marginBottom: DS.space.s8,
  },
  input: {
    borderWidth: 1,
    borderColor: DS.color.border,
    borderRadius: DS.radius.md,
    minHeight: DS.touch.min,
    paddingVertical: DS.space.s12,
    paddingHorizontal: DS.space.s16,
    fontSize: DS.type.body,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    backgroundColor: '#f7f7f7',
  },
  buttonWrap: {
    marginTop: DS.space.s16,
  },
  buttonWrapLarge: {
    marginTop: DS.space.s32,
  },
  button: {
    borderRadius: DS.radius.md,
    minHeight: DS.touch.min,
    paddingVertical: DS.space.s12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: DS.color.buttonPrimary,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    backgroundColor: DS.color.buttonDisabled,
  },
  buttonText: {
    fontSize: DS.type.button,
    fontFamily: 'Inter_600SemiBold',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: DS.color.buttonTextDisabled,
  },
  helper: {
    marginTop: DS.space.s12,
    fontSize: DS.type.bodySmall,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    textAlign: 'center',
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 104,
  },
  otpVisualWrap: {
    width: 64,
    height: 64,
    marginBottom: DS.space.s24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationIndicatorWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#d4d4d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorGlyph: {
    fontSize: 24,
    lineHeight: 24,
    color: DS.color.textMuted,
    fontFamily: 'Inter_600SemiBold',
  },
  verificationTitle: {
    marginTop: DS.space.s20,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    textAlign: 'center',
  },
  verificationSubtitle: {
    marginTop: DS.space.s16,
    fontSize: DS.type.body,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    textAlign: 'center',
  },
  verificationMeta: {
    marginTop: DS.space.s20,
    fontSize: DS.type.bodySmall,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
    textAlign: 'center',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: DS.space.s24,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.border,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: DS.color.textMuted,
    backgroundColor: '#f3f3f3',
  },
  otpBoxActive: {
    borderColor: DS.color.textPrimary,
  },
  otpBoxText: {
    fontSize: 22,
    lineHeight: 26,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  verificationActions: {
    width: '100%',
    marginTop: DS.space.s24,
    gap: DS.space.s12,
  },
  errorText: {
    marginTop: DS.space.s18,
    marginBottom: DS.space.s8,
    fontSize: DS.type.bodySmall,
    fontFamily: 'Inter_500Medium',
    color: DS.color.error,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonPriority: {
    borderColor: DS.color.textMuted,
  },
  secondaryDisabled: {
    opacity: 0.6,
  },
  secondaryPressed: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    fontSize: DS.type.button,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  ghostAction: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostActionPressed: {
    opacity: 0.7,
  },
  ghostActionText: {
    fontSize: DS.type.bodySmall,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
  },
  scrollWrap: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: DS.space.s32,
  },
  onboardingScrollContent: {
    paddingBottom: DS.space.x3l,
  },
  scrollContentHome: {
    paddingBottom: 196,
  },
  scrollContentHomeFlowPreferences: {
    paddingTop: 34,
    paddingBottom: 176,
  },
  scrollContentHomeFlowMatchFound: {
    paddingTop: DS.space.xl,
    paddingBottom: 196,
  },
  scrollContentHomeFlowStandard: {
    paddingTop: DS.space.md,
    paddingBottom: 96,
  },
  homeFlowContainer: {
    flex: 1,
    width: '100%',
  },
  fixedFlowHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  fixedFlowHeaderInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
    paddingHorizontal: SIDE_GUTTER,
    paddingTop: DS.space.s8,
    paddingBottom: DS.space.s12,
  },
  fixedFlowTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
  flowHeaderRightSpacer: {
    width: 34,
    height: 34,
  },
  profileHeader: {
    marginTop: DS.space.s8,
  },
  profileTitle: {
    fontSize: 40,
    lineHeight: 46,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  profileSubtitle: {
    marginTop: DS.space.s12,
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    maxWidth: 320,
  },
  genderRow: {
    flexDirection: 'row',
    gap: DS.space.s12,
  },
  genderChip: {
    flex: 1,
    minHeight: DS.touch.min,
    borderWidth: 1,
    borderColor: DS.color.border,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  genderChipPressed: {
    opacity: 0.92,
  },
  genderChipSelected: {
    borderColor: DS.color.textPrimary,
    backgroundColor: '#f1f1f1',
  },
  genderChipText: {
    fontSize: DS.type.body,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
  },
  genderChipTextSelected: {
    color: DS.color.textPrimary,
  },
  infoCard: {
    marginTop: DS.space.s32,
    borderRadius: DS.radius.md,
    backgroundColor: '#f3f3f3',
    paddingVertical: DS.space.s16,
    paddingHorizontal: DS.space.s16,
  },
  infoText: {
    textAlign: 'center',
    fontSize: DS.type.bodySmall,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  toast: {
    position: 'absolute',
    zIndex: 10,
    alignSelf: 'center',
    minWidth: 140,
    maxWidth: SCREEN_WIDTH - SIDE_GUTTER * 2,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(16,16,16,0.94)',
    paddingVertical: DS.space.s12,
    paddingHorizontal: DS.space.s16,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastDefault: {
    bottom: 28,
  },
  toastHome: {
    bottom: 136,
  },
  toastText: {
    color: '#ffffff',
    fontSize: DS.type.bodySmall,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 19,
  },
  homeSection: {
    marginTop: DS.space.xl,
  },
  upcomingMeetCard: {
    marginTop: DS.space.xl,
    borderRadius: DS.radius.xl,
    borderWidth: 1,
    borderColor: '#dbe3f6',
    backgroundColor: '#eef2ff',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
  },
  upcomingBadgeRow: {
    flexDirection: 'row',
  },
  upcomingBadge: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    paddingHorizontal: DS.space.s8,
    paddingVertical: 3,
    borderRadius: DS.radius.full,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  upcomingMeetRow: {
    marginTop: DS.space.s12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DS.space.s12,
  },
  upcomingMeetMain: {
    flex: 1,
  },
  upcomingMeetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  upcomingMeetMeta: {
    marginTop: 4,
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textSecondary,
  },
  upcomingMeetVenue: {
    marginTop: DS.space.s8,
    fontSize: DS.type.sm,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  upcomingMeetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  recentMeetCard: {
    marginTop: DS.space.md,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#fafafa',
    paddingHorizontal: DS.space.s12,
    paddingVertical: DS.space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  recentMeetAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ebedf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentMeetAvatarText: {
    fontSize: DS.type.sm,
    color: DS.color.textMuted,
    fontFamily: 'Inter_500Medium',
  },
  recentMeetBody: {
    flex: 1,
  },
  recentMeetTitle: {
    fontSize: DS.type.base,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  recentMeetMeta: {
    marginTop: 2,
    fontSize: DS.type.sm,
    color: DS.color.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  homeFlowSection: {
    marginTop: 0,
    paddingBottom: DS.space.x2l,
  },
  flowScreenRoot: {
    paddingBottom: DS.space.s32,
  },
  backChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
  },
  backChipPressed: {
    opacity: 0.82,
  },
  prefSection: {
    marginTop: 36,
  },
  prefLabel: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  prefChipRow: {
    marginTop: DS.space.s16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space.s12,
  },
  prefChip: {
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: DS.space.s16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefChipActive: {
    borderColor: DS.color.textPrimary,
    borderWidth: 2,
    backgroundColor: '#f2f2f2',
  },
  prefChipPressed: {
    opacity: 0.9,
  },
  prefChipText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textSecondary,
  },
  prefChipTextActive: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  vibeGrid: {
    marginTop: DS.space.s16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vibeCard: {
    width: '48%',
    minHeight: 108,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.space.s8,
    marginBottom: 14,
  },
  vibeCardActive: {
    borderWidth: 2,
    borderColor: DS.color.textPrimary,
    backgroundColor: '#f3f3f3',
  },
  vibeText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  ageRow: {
    marginTop: DS.space.s16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DS.space.s12,
  },
  ageFieldWrap: {
    flex: 1,
  },
  ageFieldLabel: {
    fontSize: DS.type.sm,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
    marginBottom: DS.space.s8,
  },
  ageInput: {
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    borderRadius: DS.radius.md,
    minHeight: DS.touch.min,
    paddingHorizontal: DS.space.s12,
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    backgroundColor: '#f9f9f9',
  },
  ageDash: {
    marginBottom: 14,
    color: DS.color.textMuted,
    fontSize: DS.type.xl,
    fontFamily: 'Inter_500Medium',
  },
  voiceSubtitle: {
    marginTop: DS.space.s12,
    marginBottom: DS.space.s12,
    fontSize: DS.type.bodySmall,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
    maxWidth: 320,
  },
  voiceCard: {
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    borderRadius: DS.radius.lg,
    backgroundColor: '#f7f7f7',
    minHeight: 176,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.space.md,
    paddingVertical: 20,
  },
  prefBottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE_GUTTER,
    paddingTop: 24,
    paddingBottom: 16,
  },
  prefLocationHint: {
    marginTop: DS.space.s8,
    textAlign: 'center',
    fontSize: DS.type.sm,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  voiceCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
  },
  voiceStopCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
  },
  voicePulseWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ef4444',
  },
  voiceStopSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  voicePressed: {
    opacity: 0.85,
  },
  voicePrimary: {
    marginTop: DS.space.s12,
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  voiceHint: {
    marginTop: DS.space.s4,
    fontSize: DS.type.sm,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  voiceRecordingText: {
    marginTop: DS.space.s8,
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: '#ef4444',
  },
  voiceTimerText: {
    marginTop: DS.space.s8,
    fontSize: 38,
    lineHeight: 42,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  voiceRecordedRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.space.s12,
  },
  voiceRecordedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  voicePlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },
  voicePlayCircleActive: {
    backgroundColor: '#2f2f2f',
  },
  voiceIntroTitle: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  retryButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    borderRadius: DS.radius.md,
    paddingHorizontal: DS.space.s12,
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
  },
  retryButtonText: {
    fontSize: DS.type.sm,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  locationModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,23,23,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.space.lg,
  },
  locationBackdropFrost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  locationModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: DS.radius.xl,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingVertical: DS.space.xl,
    alignItems: 'center',
    ...DS.shadow.elevated,
  },
  locationIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  locationModalTitle: {
    marginTop: DS.space.md,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  locationBlockedTitle: {
    marginTop: DS.space.md,
    fontSize: DS.type.x2l,
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  locationModalBody: {
    marginTop: DS.space.sm,
    textAlign: 'center',
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
  locationActions: {
    width: '100%',
    marginTop: DS.space.lg,
    flexDirection: 'row',
    gap: DS.space.s12,
  },
  locationSecondaryButton: {
    flex: 1,
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSecondaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  locationPrimaryButton: {
    flex: 1,
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    backgroundColor: DS.color.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPrimaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  findingMapCard: {
    marginTop: 28,
    width: '100%',
    height: 204,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f4f4f4',
  },
  findingTitle: {
    marginTop: 34,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  findingBody: {
    marginTop: 14,
    fontSize: DS.type.body,
    lineHeight: 26,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
  findingEstimate: {
    marginTop: DS.space.s16,
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
  },
  findingInfoCard: {
    marginTop: 18,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  findingInfoTitle: {
    marginTop: DS.space.sm,
    fontSize: DS.type.lg,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  findingInfoBody: {
    marginTop: DS.space.s8,
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
  findingHelperText: {
    marginTop: DS.space.s24,
    fontSize: DS.type.sm,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  stopFindingButton: {
    marginTop: 32,
    marginBottom: 18,
    minHeight: DS.touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopFindingText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
  },
  findingDemoButton: {
    alignSelf: 'center',
    marginBottom: 48,
    minHeight: 44,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    paddingHorizontal: DS.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  findingDemoButtonText: {
    fontSize: DS.type.sm,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  matchLabel: {
    marginTop: DS.space.s8,
    fontSize: 12,
    color: DS.color.textMuted,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7,
  },
  matchHeading: {
    marginTop: DS.space.s8,
    fontSize: 30,
    lineHeight: 34,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textPrimary,
  },
  matchHeadingStrong: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  matchResponseWindow: {
    marginTop: DS.space.s8,
    fontSize: DS.type.bodySmall,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  matchDivider: {
    marginTop: DS.space.lg,
    height: 1,
    backgroundColor: '#ededed',
  },
  matchSubLabel: {
    marginTop: DS.space.lg,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textMuted,
    letterSpacing: 0.7,
  },
  matchPersonCard: {
    marginTop: DS.space.md,
  },
  matchPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchPersonName: {
    fontSize: 24,
    lineHeight: 28,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  matchPersonMeta: {
    marginTop: 3,
    fontSize: DS.type.lg,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  voiceSnippet: {
    marginTop: DS.space.s12,
    borderRadius: DS.radius.lg,
    minHeight: 48,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.space.s12,
    gap: DS.space.s8,
  },
  voiceSnippetPlay: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSnippetPlayActive: {
    backgroundColor: '#3f3f46',
  },
  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  voiceWaveBar: {
    width: 2,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  voiceWaveBarActive: {
    backgroundColor: '#9ca3af',
  },
  matchLocationRow: {
    marginTop: DS.space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  matchLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4d4d4',
  },
  matchLocationTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  matchLocationBody: {
    marginTop: DS.space.s8,
    fontSize: DS.type.base,
    lineHeight: 24,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
    maxWidth: 360,
  },
  matchBottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE_GUTTER,
    paddingTop: DS.space.s24,
    paddingBottom: DS.space.s24,
    gap: DS.space.s12,
  },
  matchBottomSecondary: {
    minHeight: 46,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f6',
  },
  matchBottomSecondaryText: {
    color: DS.color.textSecondary,
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
  },
  paymentBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,250,250,0.75)',
  },
  paymentBusyIndicator: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#d4d4d4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  paymentBusyText: {
    marginTop: DS.space.md,
    fontSize: 24,
    lineHeight: 30,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  meetMapHero: {
    marginTop: DS.space.s24,
    width: '100%',
    height: 200,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetMapPinWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
  meetStatusRow: {
    marginTop: DS.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  meetStatusBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    borderRadius: DS.radius.full,
    paddingHorizontal: DS.space.s8,
    paddingVertical: 3,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  pastStatusBadge: {
    backgroundColor: '#f3f4f6',
    color: '#525252',
    borderRadius: DS.radius.full,
    paddingHorizontal: DS.space.s8,
    paddingVertical: 3,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  meetStatusMeta: {
    color: DS.color.textMuted,
    fontSize: DS.type.sm,
    fontFamily: 'Inter_500Medium',
  },
  meetVenueTitle: {
    marginTop: DS.space.s8,
    fontSize: 38,
    lineHeight: 42,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  meetVenueMeta: {
    marginTop: DS.space.s8,
    fontSize: DS.type.lg,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  meetActionRow: {
    marginTop: DS.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  meetDirectionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: DS.radius.md,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
  meetDirectionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  meetDirectionButtonText: {
    color: '#ffffff',
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
  },
  meetCallButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetCallButtonText: {
    color: DS.color.textSecondary,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
  },
  hostReviewCard: {
    marginTop: DS.space.md,
    borderRadius: DS.radius.lg,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
  },
  hostReviewTitle: {
    fontSize: DS.type.sm,
    color: '#c2410c',
    fontFamily: 'Inter_600SemiBold',
  },
  hostReviewBody: {
    marginTop: DS.space.s8,
    fontSize: DS.type.base,
    lineHeight: 22,
    color: '#c2410c',
    fontFamily: 'Inter_400Regular',
  },
  meetWhoHeading: {
    marginTop: DS.space.lg,
  },
  meetPersonRow: {
    marginTop: DS.space.s12,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#fafafa',
    paddingHorizontal: DS.space.s12,
    paddingVertical: DS.space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetPersonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  meetPersonAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetPersonAvatarText: {
    color: DS.color.textMuted,
    fontSize: DS.type.sm,
    fontFamily: 'Inter_500Medium',
  },
  meetPersonName: {
    color: DS.color.textPrimary,
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
  },
  meetPersonRole: {
    color: DS.color.textMuted,
    fontSize: DS.type.sm,
    fontFamily: 'Inter_400Regular',
  },
  meetPersonOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  meetPersonStatusWrap: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DS.color.border,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.space.s12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  meetPersonStatusText: {
    fontSize: DS.type.sm,
    lineHeight: 18,
    color: DS.color.textMuted,
    fontFamily: 'Inter_500Medium',
  },
  meetPaymentHeading: {
    marginTop: DS.space.lg,
  },
  meetPaymentCard: {
    marginTop: DS.space.s12,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#fafafa',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetPaymentLabel: {
    fontSize: DS.type.base,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  meetPaymentMeta: {
    marginTop: 2,
    fontSize: DS.type.sm,
    color: DS.color.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  meetPaymentAmount: {
    fontSize: DS.type.lg,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  meetMapHeroPast: {
    marginTop: DS.space.s24,
    width: '100%',
    height: 160,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f4f4f4',
  },
  pastWhoTitle: {
    marginTop: DS.space.lg,
  },
  pastPersonRow: {
    marginTop: DS.space.s12,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#fafafa',
    paddingHorizontal: DS.space.s12,
    paddingVertical: DS.space.s12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastFeedbackButton: {
    marginTop: DS.space.xl,
    minHeight: DS.touch.comfortable,
    borderRadius: DS.radius.md,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
  pastFeedbackInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  pastFeedbackButtonText: {
    color: '#ffffff',
    fontSize: DS.type.lg,
    fontFamily: 'Inter_600SemiBold',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileScreenHeader: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightH2,
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
  },
  editIconPressed: {
    opacity: 0.8,
  },
  profileDivider: {
    marginTop: DS.space.lg,
    height: 1,
    backgroundColor: DS.color.borderLight,
  },
  profileNameDisplay: {
    marginTop: DS.space.xl,
    fontSize: 46,
    lineHeight: 50,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
  profileProfessionDisplay: {
    marginTop: DS.space.sm,
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textMuted,
    letterSpacing: 2.2,
  },
  profileInfoRow: {
    marginTop: DS.space.lg,
    marginBottom: DS.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfoLabel: {
    fontSize: DS.type.lg,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  profileInfoValue: {
    fontSize: 38,
    lineHeight: 42,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
  profilePrivacyText: {
    marginTop: DS.space.x2l,
    textAlign: 'center',
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
  },
  logoutButton: {
    marginTop: DS.space.x2l,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f5f5f5',
    minHeight: DS.touch.comfortable,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  logoutText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  stopModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,23,23,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.space.lg,
  },
  stopModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: DS.radius.xl,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingVertical: DS.space.xl,
    alignItems: 'center',
    ...DS.shadow.elevated,
  },
  stopModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  stopModalTitle: {
    marginTop: DS.space.md,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
  },
  stopModalBody: {
    marginTop: DS.space.sm,
    textAlign: 'center',
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
  stopModalPrimaryButton: {
    marginTop: DS.space.lg,
    width: '100%',
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    backgroundColor: DS.color.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopModalPrimaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  stopModalSecondaryButton: {
    marginTop: DS.space.s12,
    width: '100%',
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopModalSecondaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  secureSpotCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: DS.radius.x2l,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingTop: 52,
    paddingBottom: DS.space.lg,
    ...DS.shadow.elevated,
  },
  secureSpotCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureSpotCloseText: {
    color: DS.color.textMuted,
    fontSize: 24,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  secureSpotTitle: {
    fontSize: 28,
    lineHeight: 32,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  secureSpotBody: {
    marginTop: DS.space.s8,
    fontSize: DS.type.lg,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  secureSpotDeadlineText: {
    marginTop: DS.space.s8,
    fontSize: DS.type.bodySmall,
    color: DS.color.textBody,
    fontFamily: 'Inter_500Medium',
  },
  secureSpotFeeCard: {
    marginTop: DS.space.lg,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: DS.space.md,
    paddingVertical: DS.space.md,
  },
  secureSpotFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureSpotFeeLabel: {
    fontSize: DS.type.base,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  secureSpotFeeAmount: {
    fontSize: DS.type.lg,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  secureSpotFeeBody: {
    marginTop: DS.space.s12,
    fontSize: DS.type.bodySmall,
    lineHeight: 20,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  secureSpotPayButton: {
    marginTop: DS.space.lg,
    minHeight: DS.touch.comfortable,
    borderRadius: DS.radius.md,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureSpotPayText: {
    color: '#ffffff',
    fontSize: DS.type.lg,
    fontFamily: 'Inter_600SemiBold',
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: DS.radius.xl,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingVertical: DS.space.xl,
    ...DS.shadow.elevated,
  },
  feedbackTitle: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 36,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  feedbackBody: {
    marginTop: DS.space.s8,
    textAlign: 'center',
    fontSize: DS.type.base,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  feedbackStarsRow: {
    marginTop: DS.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  feedbackStarHit: {
    padding: 2,
  },
  feedbackInput: {
    marginTop: DS.space.lg,
    minHeight: 96,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: DS.space.s12,
    paddingVertical: DS.space.s12,
    fontSize: DS.type.base,
    lineHeight: 22,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  feedbackActions: {
    marginTop: DS.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  feedbackSecondaryButton: {
    flex: 1,
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackSecondaryText: {
    fontSize: DS.type.base,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  feedbackPrimaryButton: {
    flex: 1,
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    backgroundColor: DS.color.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackPrimaryText: {
    color: '#ffffff',
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
  },
  blockCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: DS.radius.xl,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingVertical: DS.space.xl,
    alignItems: 'center',
    ...DS.shadow.elevated,
  },
  blockIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
  blockTitle: {
    marginTop: DS.space.md,
    fontSize: 30,
    lineHeight: 34,
    color: DS.color.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  blockBody: {
    marginTop: DS.space.s8,
    textAlign: 'center',
    fontSize: DS.type.base,
    lineHeight: 24,
    color: DS.color.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  blockActions: {
    marginTop: DS.space.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s12,
  },
  blockPrimaryButton: {
    flex: 1,
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    backgroundColor: '#ff2d3d',
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadow.soft,
  },
  blockPrimaryText: {
    color: '#ffffff',
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
  },
  globalPaymentBackdrop: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  globalPaymentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  globalPaymentLoader: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#ffffff33',
    backgroundColor: '#ffffff18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalPaymentText: {
    marginTop: DS.space.md,
    color: '#f5f5f5',
    fontSize: DS.type.base,
    fontFamily: 'Inter_500Medium',
  },
  logoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,23,23,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DS.space.lg,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: DS.radius.xl,
    backgroundColor: '#ffffff',
    paddingHorizontal: DS.space.lg,
    paddingVertical: DS.space.xl,
    alignItems: 'center',
    ...DS.shadow.elevated,
  },
  logoutModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
  logoutModalTitle: {
    marginTop: DS.space.md,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
  logoutModalBody: {
    marginTop: DS.space.sm,
    textAlign: 'center',
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
  logoutConfirmButton: {
    marginTop: DS.space.lg,
    width: '100%',
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    backgroundColor: '#ff2d3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmPressed: {
    opacity: 0.86,
  },
  logoutConfirmText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  logoutCancelButton: {
    marginTop: DS.space.s12,
    width: '100%',
    minHeight: DS.touch.min,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  profileEditHeader: {
    marginTop: DS.space.xl,
  },
  profileEditTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightH1,
  },
  profileEditSubtitle: {
    marginTop: DS.space.s12,
    maxWidth: 320,
    fontSize: DS.type.body,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textMuted,
    letterSpacing: DS.tracking.tightBody,
  },
  editActionRow: {
    marginTop: DS.space.s24,
    flexDirection: 'row',
    gap: DS.space.s12,
  },
  editActionButton: {
    flex: 1,
    minHeight: DS.touch.comfortable,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionButtonSecondary: {
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f0f0f0',
  },
  editActionSecondaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  saveCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space.s8,
  },
  editActionPrimaryText: {
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: DS.type.lg,
    lineHeight: 24,
    fontFamily: 'Inter_500Medium',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightBody,
  },
  upcomingSectionTitle: {
    fontSize: DS.type.x2l,
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    letterSpacing: DS.tracking.tightH2,
  },
  emptyCard: {
    marginTop: DS.space.md,
    borderRadius: DS.radius.xl,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f3f4f6',
    paddingVertical: DS.space.xl,
    paddingHorizontal: DS.space.lg,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  emptyTitle: {
    marginTop: DS.space.sm,
    fontSize: DS.type.base,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: DS.space.sm,
    fontSize: DS.type.sm,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
    textAlign: 'center',
  },
  whyIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eef0f3',
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.space.sm,
  },
  whyCard: {
    marginTop: DS.space.md,
    borderRadius: DS.radius.xl,
    borderWidth: 1,
    borderColor: DS.color.borderLight,
    backgroundColor: '#f3f4f6',
    paddingVertical: DS.space.lg,
    paddingHorizontal: DS.space.lg,
  },
  whyTitle: {
    fontSize: DS.type.base,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
    color: DS.color.textPrimary,
  },
  whyBody: {
    marginTop: DS.space.sm,
    fontSize: DS.type.sm,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: DS.color.textSecondary,
  },
});
