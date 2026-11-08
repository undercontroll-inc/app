import { Alert, Linking } from "react-native";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";

export const MAX_RECORDING_SECONDS = 60;

export const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function showMicPermissionAlert(
  message = "A transcrição precisa do microfone. Ative a permissão nos Ajustes para gravar.",
) {
  Alert.alert("Microfone bloqueado", message, [
    { text: "Agora não", style: "cancel" },
    { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
  ]);
}

export async function prepareRecording(recorder) {
  const permission = await requestRecordingPermissionsAsync();
  if (!permission.granted) return false;
  await setAudioModeAsync({ allowsRecording: true, interruptionMode: "doNotMix", playsInSilentMode: true });
  await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
  return true;
}

export async function releaseRecordingMode() {
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

export function recordingUri(recorder) {
  return recorder.uri || recorder.getStatus?.()?.url || null;
}
