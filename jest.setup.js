jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("react-native-keyboard-controller", () => require("react-native-keyboard-controller/jest"));
jest.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setAudioModeAsync: jest.fn(async () => {}),
  useAudioRecorder: () => ({
    stop: jest.fn(async () => {}),
    record: jest.fn(),
    prepareToRecordAsync: jest.fn(async () => {}),
    getStatus: () => ({}),
    uri: null,
  }),
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
jest.mock("expo-symbols", () => ({ SymbolView: ({ fallback }) => fallback ?? null }));
jest.mock("react-native-reanimated", () => {
  const { View } = jest.requireActual("react-native");
  const layoutAnimation = new Proxy({}, { get: () => () => layoutAnimation });
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial) => {
      const shared = { value: initial };
      shared.get = () => shared.value;
      shared.set = (next) => {
        shared.value = next;
      };
      return shared;
    },
    useAnimatedStyle: (fn) => fn(),
    withTiming: (value) => value,
    withRepeat: (value) => value,
    withDelay: (_delay, value) => value,
    withSequence: (...values) => values[values.length - 1],
    cancelAnimation: () => {},
    Easing: { inOut: () => () => 0, quad: () => 0 },
    FadeIn: layoutAnimation,
    FadeInDown: layoutAnimation,
    FadeInUp: layoutAnimation,
    FadeOut: layoutAnimation,
    FadeOutDown: layoutAnimation,
    FadeOutUp: layoutAnimation,
    ZoomIn: layoutAnimation,
    withSpring: (value) => value,
  };
});
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn(),
      renderAsync: jest.fn(async () => ({ saveAsync: jest.fn(async () => ({ uri: "file:///cache/nota.jpg" })) })),
    })),
  },
}));
jest.mock("expo-glass-effect", () => {
  const { View } = jest.requireActual("react-native");
  return {
    GlassView: View,
    GlassContainer: View,
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => true) }));
