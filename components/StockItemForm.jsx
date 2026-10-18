import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "./AppShell";
import ScreenHeader from "./ScreenHeader";
import { useTabBarVisibility } from "../contexts/TabBarVisibilityContext";
import { useComponent, useSaveComponent } from "../hooks/queries/useComponents";
import { getErrorMessage } from "../providers/api";
import { bottomDockPadding } from "../utils/layout";
import {
  buildRegisterComponentPayload,
  buildUpdateComponentPayload,
  componentToForm,
  emptyStockForm,
  validateStockForm,
} from "../utils/stock";

export default function StockItemForm({ edit = false, componentId }) {
  const insets = useSafeAreaInsets();
  const { setHidden } = useTabBarVisibility();
  const [form, setForm] = useState(emptyStockForm);
  const [hydrated, setHydrated] = useState(!edit);
  const [feedback, setFeedback] = useState("");
  const componentQuery = useComponent(componentId, { enabled: edit });
  const saveComponent = useSaveComponent();
  const saving = saveComponent.isPending;
  const loading = edit && !hydrated && !componentQuery.isError;
  const loadError = edit && componentQuery.isError ? getErrorMessage(componentQuery.error) : "";

  if (!hydrated && componentQuery.data) {
    setHydrated(true);
    setForm(componentToForm(componentQuery.data));
  }

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  function handleSubmit() {
    const error = validateStockForm(form);
    if (error) {
      setFeedback(error);
      return;
    }
    saveComponent.mutate(
      {
        componentId: edit ? componentId : null,
        payload: edit ? buildUpdateComponentPayload(form) : buildRegisterComponentPayload(form),
      },
      {
        onSuccess: () => router.replace("/stock"),
        onError: (err) => setFeedback(getErrorMessage(err)),
      },
    );
  }

  return (
    <AppShell>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScreenHeader
          badge={edit ? "Edição" : undefined}
          closeLabel={edit ? "Fechar edição de item" : "Fechar cadastro de item"}
          onClose={() => router.back()}
          title={edit ? "Editar Item" : "Cadastrar Novo Item"}
        />
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#ef7f19" />
            <Text style={styles.stateText}>Carregando item...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateBox}>
            <Text style={styles.feedback}>{loadError}</Text>
            <Pressable onPress={() => componentQuery.refetch()} style={styles.retry}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Dados do Item</Text>
              <Field
                label="Item"
                value={form.item}
                onChangeText={(value) => updateField("item", value)}
                placeholder="Nome do item"
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Field
                    label="Marca"
                    value={form.brand}
                    onChangeText={(value) => updateField("brand", value)}
                    placeholder="Marca"
                  />
                </View>
                <View style={styles.half}>
                  <Field
                    label="Categoria"
                    value={form.category}
                    onChangeText={(value) => updateField("category", value)}
                    placeholder="Categoria"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Field
                    editable={!edit}
                    label="Quantidade"
                    value={form.quantity}
                    onChangeText={(value) => updateField("quantity", value)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <Field
                    label="Preço Unitário (R$)"
                    value={form.price}
                    onChangeText={(value) => updateField("price", value)}
                    placeholder="0,00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Field
                label="Fornecedor"
                value={form.supplier}
                onChangeText={(value) => updateField("supplier", value)}
                placeholder="Fornecedor"
              />
              <Field
                label="Descrição (opcional)"
                value={form.description}
                onChangeText={(value) => updateField("description", value)}
                placeholder="Insira uma descrição"
                multiline
              />
              {edit ? (
                <Text style={styles.hint}>A quantidade em estoque é atualizada pelas peças usadas nas OS.</Text>
              ) : null}
            </View>
            {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
          </ScrollView>
        )}
        <View style={[styles.footer, { paddingBottom: bottomDockPadding(insets) }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            disabled={saving || loading}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              (saving || loading) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{edit ? "Salvar Alterações" : "Cadastrar Item"}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

function Field({ label, multiline, editable = true, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholderTextColor="#9aaac0"
        style={[styles.input, multiline && styles.descriptionInput, !editable && styles.readonly]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#ffffff", flex: 1 },
  stateBox: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  feedback: { color: "#d71929", fontSize: 14, marginBottom: 12, textAlign: "center" },
  hint: { color: "#667994", fontSize: 13 },
  readonly: { backgroundColor: "#f4f7fb" },
  disabled: { opacity: 0.6 },
  content: { padding: 20, paddingBottom: 36 },
  formCard: {
    borderColor: "#dce4ee",
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 18,
    padding: 20,
    paddingBottom: 36,
  },
  sectionTitle: { color: "#092542", fontSize: 23, fontWeight: "800", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  field: { flex: 1, marginBottom: 18, minWidth: 125 },
  label: { color: "#667994", fontSize: 14, marginBottom: 8 },
  input: {
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 2,
    color: "#092542",
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  descriptionInput: { minHeight: 108, paddingTop: 10, textAlignVertical: "top" },
  footer: {
    backgroundColor: "#ffffff",
    borderColor: "#dce4ee",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 30,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  cancelText: { color: "#667994", fontSize: 16, fontWeight: "800" },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 30,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
