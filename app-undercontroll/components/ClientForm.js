import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "./AppShell";
import ScreenHeader from "./ScreenHeader";
import { getAxiosErrorMessage } from "../providers/api";
import { userService } from "../services/UserService";

const emptyForm = {
  name: "",
  lastName: "",
  phone: "",
  email: "",
  cpf: "",
  CEP: "",
  address: "",
  number: "",
  hasWhatsApp: false,
};

export default function ClientForm({ edit = false, clientId }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    if (!edit) return undefined;

    async function loadClient() {
      try {
        const client = await userService.getById(clientId);
        if (!active) return;
        setForm({ ...emptyForm, ...client, number: "" });
      } catch (err) {
        if (active) setFeedback(getAxiosErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadClient();
    return () => {
      active = false;
    };
  }, [clientId, edit]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setFeedback("Preencha nome, sobrenome e telefone.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
      CEP: form.CEP.trim(),
      address: [form.address.trim(), form.number.trim()].filter(Boolean).join(", "),
      hasWhatsApp: form.hasWhatsApp,
      userType: "CUSTOMER",
    };

    try {
      setSaving(true);
      setFeedback("");
      if (edit) await userService.update(clientId, payload);
      else await userService.create(payload);
      router.replace("/clients");
    } catch (err) {
      setFeedback(getAxiosErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScreenHeader badge={edit ? "Edição" : undefined} closeLabel={edit ? "Fechar edição de cliente" : "Fechar cadastro de cliente"} onClose={() => router.back()} title={edit ? "Editar Dados do Cliente" : "Cadastrar Novo Cliente"} />
        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color="#ef7f19" /><Text style={styles.loadingText}>Carregando cliente...</Text></View>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 130 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Identificação &amp; Contato</Text>
              <View style={styles.row}>
                <View style={styles.half}><Field label="Nome" value={form.name} onChangeText={(value) => updateField("name", value)} placeholder="Nome" /></View>
                <View style={styles.half}><Field label="Sobrenome" value={form.lastName} onChangeText={(value) => updateField("lastName", value)} placeholder="Sobrenome" /></View>
              </View>
              <Field label="Telefone" value={form.phone} onChangeText={(value) => updateField("phone", value)} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
              <Field label="E-mail" value={form.email} onChangeText={(value) => updateField("email", value)} placeholder="cliente@email.com" keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.whatsappField}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: form.hasWhatsApp }}
                  accessibilityLabel="Cliente possui WhatsApp"
                  onPress={() => updateField("hasWhatsApp", !form.hasWhatsApp)}
                  style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
                >
                  <View style={[styles.checkbox, form.hasWhatsApp && styles.checkboxChecked]}>
                    {form.hasWhatsApp && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>Possui WhatsApp</Text>
                </Pressable>
              </View>
              <Field label="CPF (opcional)" value={form.cpf} onChangeText={(value) => updateField("cpf", value)} placeholder="000.000.000-00" keyboardType="numeric" />
            </View>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Endereço</Text>
              <View style={styles.row}>
                <View style={styles.half}><Field label="CEP" value={form.CEP} onChangeText={(value) => updateField("CEP", value)} placeholder="00000-000" keyboardType="numeric" /></View>
                <View style={styles.number}><Field label="Número" value={form.number} onChangeText={(value) => updateField("number", value)} placeholder="Nº" keyboardType="numeric" /></View>
              </View>
              <Field label="Endereço" value={form.address} onChangeText={(value) => updateField("address", value)} placeholder="Rua, avenida ou logradouro" />
            </View>
            {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
          </ScrollView>
        )}
        <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
          <Pressable accessibilityLabel="Cancelar e voltar" disabled={saving} onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
          <Pressable accessibilityLabel={edit ? "Salvar alterações do cliente" : "Cadastrar cliente"} disabled={saving || loading} onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, (saving || loading) && styles.disabled]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{edit ? "Salvar Alterações" : "Cadastrar Cliente"}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

function Field({ label, multiline, ...props }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} numberOfLines={multiline ? 4 : 1} placeholderTextColor="#9aaac0" style={[styles.input, multiline && styles.descriptionInput]} textAlignVertical={multiline ? "top" : "center"} /></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#fff", flex: 1 },
  content: { padding: 20 },
  formCard: { borderColor: "#dce4ee", borderRadius: 16, borderWidth: 2, marginBottom: 18, padding: 20 },
  sectionTitle: { color: "#092542", fontSize: 22, fontWeight: "800", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1, minWidth: 0 },
  number: { flex: 0.55, minWidth: 82 },
  field: { flex: 1, marginBottom: 18, minWidth: 0 },
  label: { color: "#667994", fontSize: 14, marginBottom: 8 },
  input: { borderColor: "#dce4ee", borderRadius: 11, borderWidth: 2, color: "#092542", fontSize: 15, minHeight: 54, paddingHorizontal: 14, paddingVertical: 10 },
  descriptionInput: { minHeight: 108, paddingTop: 10 },
  whatsappField: { flex: 1, justifyContent: "flex-start", minWidth: 0 },
  checkboxRow: { alignItems: "center", flexDirection: "row", minHeight: 54, paddingVertical: 8 },
  checkbox: { alignItems: "center", borderColor: "#b8c6d6", borderRadius: 5, borderWidth: 2, height: 24, justifyContent: "center", marginRight: 10, width: 24 },
  checkboxChecked: { backgroundColor: "#ef7f19", borderColor: "#ef7f19" },
  checkmark: { color: "#fff", fontSize: 17, fontWeight: "800", lineHeight: 19 },
  checkboxText: { color: "#092542", flexShrink: 1, fontSize: 15 },
  loadingBox: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#667994", fontSize: 15, marginTop: 12 },
  feedback: { color: "#d71929", fontSize: 14, marginBottom: 12, textAlign: "center" },
  footer: { backgroundColor: "#fff", borderColor: "#dce4ee", borderTopWidth: 1, flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 20 },
  cancelButton: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 30, borderWidth: 2, flex: 1, justifyContent: "center", paddingVertical: 16 },
  cancelText: { color: "#667994", fontSize: 16, fontWeight: "800" },
  submitButton: { alignItems: "center", backgroundColor: "#ef7f19", borderRadius: 30, flex: 1, justifyContent: "center", paddingVertical: 16 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
});