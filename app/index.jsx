import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Text from "../components/ui/Text";
import { useAuth } from "../contexts/AuthContext";
import { haptics } from "../utils/haptics";
import { colors, MAX_FONT_SCALE, radius } from "../theme";

const INPUT_BG = "rgba(255,255,255,0.08)";
const INPUT_BORDER = "rgba(255,255,255,0.16)";
const PLACEHOLDER = "rgba(255,255,255,0.45)";

function LoginField({ icon, label, trailing, inputRef, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} variant="subhead" weight="600">
        {label}
      </Text>
      <View style={styles.inputBox}>
        <Icon color="rgba(255,255,255,0.6)" name={icon} size={18} />
        <TextInput
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          placeholderTextColor={PLACEHOLDER}
          ref={inputRef}
          selectionColor={colors.orange}
          style={styles.input}
          {...props}
        />
        {trailing}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const passwordInput = useRef(null);
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    const value = email.trim();
    if (!value || !password) {
      haptics.warning();
      return setFeedback("Preencha seu e-mail e sua senha.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      haptics.warning();
      return setFeedback("Digite um e-mail válido.");
    }

    setSubmitting(true);
    const result = await login(value, password);
    setSubmitting(false);

    if (!result.success) {
      haptics.error();
      setFeedback(result.error || "Não foi possível entrar.");
      return;
    }

    haptics.success();
    router.replace("/orders");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image resizeMode="contain" source={require("../assets/logo_pelluci.png")} style={styles.logo} />
          <Text align="center" tone="inverse" variant="title">
            Bem-vindo de volta
          </Text>
          <Text align="center" style={styles.subtitle} variant="callout">
            Entre com seu e-mail e senha
          </Text>
          <View style={styles.form}>
            <LoginField
              autoCapitalize="none"
              autoComplete="email"
              icon="mail"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={(value) => {
                setEmail(value);
                setFeedback("");
              }}
              onSubmitEditing={() => passwordInput.current?.focus()}
              placeholder="seu@email.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <LoginField
              autoComplete="current-password"
              icon="lock"
              inputRef={passwordInput}
              label="Senha"
              onChangeText={(value) => {
                setPassword(value);
                setFeedback("");
              }}
              onSubmitEditing={handleLogin}
              placeholder="Sua senha"
              returnKeyType="done"
              secureTextEntry={!showPassword}
              textContentType="password"
              trailing={
                <Pressable
                  accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.visibility}
                >
                  <Icon color="rgba(255,255,255,0.75)" name={showPassword ? "eyeOff" : "eye"} size={20} />
                </Pressable>
              }
              value={password}
            />
            {feedback ? (
              <View style={styles.feedback}>
                <Icon color="#ffb0a8" name="alert" size={16} />
                <Text style={styles.feedbackText} variant="subhead" weight="600">
                  {feedback}
                </Text>
              </View>
            ) : null}
            <Button label={submitting ? "Entrando..." : "Entrar"} loading={submitting} onPress={handleLogin} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.navyDeep, flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 28 },
  content: { alignSelf: "center", maxWidth: 440, width: "100%" },
  logo: { alignSelf: "center", height: 80, marginBottom: 32, width: 160 },
  subtitle: { color: "rgba(255,255,255,0.7)", marginTop: 6 },
  form: { gap: 18, marginTop: 36 },
  field: { gap: 8 },
  label: { color: "rgba(255,255,255,0.85)" },
  inputBox: {
    alignItems: "center",
    backgroundColor: INPUT_BG,
    borderColor: INPUT_BORDER,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingLeft: 16,
  },
  input: { color: "#ffffff", flex: 1, fontSize: 17, paddingRight: 16, paddingVertical: 14 },
  visibility: { alignItems: "center", height: 56, justifyContent: "center", width: 52 },
  feedback: {
    alignItems: "center",
    backgroundColor: "rgba(215,25,41,0.18)",
    borderRadius: radius.control,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  feedbackText: { color: "#ffd2cd", flex: 1 },
});
