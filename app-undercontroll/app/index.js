import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';

export default function LoginScreen() {
  const passwordInput = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');

  function login() {
    const value = email.trim();
    if (!value || !password) return setFeedback('Preencha seu e-mail e sua senha.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setFeedback('Digite um e-mail válido.');
    router.replace('/orders');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Image source={require('../assets/logo_pelluci.png')} resizeMode="contain" style={styles.logo} />
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>Insira seus dados para entrar</Text>
            <View style={styles.form}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => { setEmail(value); setFeedback(''); }} onSubmitEditing={() => passwordInput.current?.focus()} placeholder="Digite seu e-mail" placeholderTextColor="#9caec0" returnKeyType="next" style={styles.input} value={email} />
              <Text style={[styles.label, styles.passwordLabel]}>Senha</Text>
              <View style={styles.passwordBox}>
                <TextInput onChangeText={(value) => { setPassword(value); setFeedback(''); }} onSubmitEditing={login} placeholder="Digite sua senha" placeholderTextColor="#9caec0" ref={passwordInput} returnKeyType="done" secureTextEntry={!showPassword} style={styles.passwordInput} value={password} />
                <Pressable accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((value) => !value)} style={styles.visibility}><Feather color="#dbe6ef" name={showPassword ? 'eye-off' : 'eye'} size={20} /></Pressable>
              </View>
              {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
              <Pressable onPress={login} style={styles.button}><Text style={styles.buttonText}>Entrar</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { backgroundColor: '#061d2d', flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 32 }, content: { alignSelf: 'center', maxWidth: 420, width: '100%' }, logo: { alignSelf: 'center', height: 75, marginBottom: 28, width: 150 }, title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' }, subtitle: { color: '#c5d0da', fontSize: 12, marginTop: 7, textAlign: 'center' }, form: { marginTop: 34 }, label: { color: '#fff', fontSize: 12, marginBottom: 7 }, passwordLabel: { marginTop: 20 }, input: { backgroundColor: '#102f4c', borderColor: '#2b5c88', borderRadius: 7, borderWidth: 1, color: '#fff', height: 45, paddingHorizontal: 14 }, passwordBox: { alignItems: 'center', backgroundColor: '#102f4c', borderColor: '#2b5c88', borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 45 }, passwordInput: { color: '#fff', flex: 1, height: '100%', paddingHorizontal: 14 }, visibility: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 }, feedback: { color: '#ffb0a8', fontSize: 12, marginTop: 12 }, button: { alignItems: 'center', backgroundColor: '#ef7f19', borderRadius: 8, height: 45, justifyContent: 'center', marginTop: 22 }, buttonText: { color: '#fff', fontWeight: '700' },
});
