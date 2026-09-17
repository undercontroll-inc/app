import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "../../../components/AppShell";
import ScreenHeader from "../../../components/ScreenHeader";
import { useTabBarVisibility } from "../../../contexts/TabBarVisibilityContext";
import { bottomDockPadding } from "../../../utils/layout";

export function StockItemForm({ edit = false }) {
  const insets = useSafeAreaInsets();
  const { setHidden } = useTabBarVisibility();
  const params = useLocalSearchParams();
  const [form, setForm] = useState(() => {
    const categoryParts = String(params.category || "").split(" · ");
    return {
      name: params.name || "",
      brand: params.brand || (categoryParts.length > 1 ? categoryParts[0] : ""),
      category: params.formCategory || (categoryParts.length > 1 ? categoryParts.slice(1).join(" · ") : params.category || ""),
      quantity: params.quantity || "",
      price: params.price || "",
      supplier: params.supplier || "",
      description: params.description || "",
    };
  });

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.price.trim()) return;
    router.replace({
      pathname: "/stock",
      params: {
        ...(edit ? { updatedId: params.id } : { addedId: String(Date.now()) }),
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: `${form.brand.trim()}${form.brand.trim() && form.category.trim() ? " · " : ""}${form.category.trim()}`,
        formCategory: form.category.trim(),
        price: form.price.trim(),
        quantity: form.quantity.trim() || "0",
        supplier: form.supplier.trim() || "Não informado",
        description: form.description.trim(),
      },
    });
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Dados do Item</Text>
            <Field label="Item" value={form.name} onChangeText={(value) => updateField("name", value)} placeholder="Nome do item" />
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Marca" value={form.brand} onChangeText={(value) => updateField("brand", value)} placeholder="Marca" />
              </View>
              <View style={styles.half}>
                <Field label="Categoria" value={form.category} onChangeText={(value) => updateField("category", value)} placeholder="Categoria" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Quantidade" value={form.quantity} onChangeText={(value) => updateField("quantity", value)} placeholder="0" keyboardType="numeric" />
              </View>
              <View style={styles.half}>
                <Field label="Preço Unitário (R$)" value={form.price} onChangeText={(value) => updateField("price", value)} placeholder="R$ 0,00" />
              </View>
            </View>
            <Field label="Fornecedor" value={form.supplier} onChangeText={(value) => updateField("supplier", value)} placeholder="Fornecedor" />
            <Field label="Descrição (opcional)" value={form.description} onChangeText={(value) => updateField("description", value)} placeholder="Insira uma descrição" multiline />
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: bottomDockPadding(insets) }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
            <Text style={styles.submitText}>{edit ? "Salvar Alterações" : "Cadastrar Item"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

export default function NewStockItemScreen() {
  return <StockItemForm />;
}

function Field({ label, multiline, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholderTextColor="#9aaac0"
        style={[styles.input, multiline && styles.descriptionInput]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#ffffff", flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  formCard: { borderColor: "#dce4ee", borderRadius: 16, borderWidth: 2, marginBottom: 18, padding: 20, paddingBottom: 36 },
  sectionTitle: { color: "#092542", fontSize: 23, fontWeight: "800", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  field: { flex: 1, marginBottom: 18, minWidth: 125 },
  label: { color: "#667994", fontSize: 14, marginBottom: 8 },
  input: { borderColor: "#dce4ee", borderRadius: 11, borderWidth: 2, color: "#092542", fontSize: 15, minHeight: 54, paddingHorizontal: 14, paddingVertical: 10 },
  descriptionInput: { minHeight: 108, paddingTop: 10, textAlignVertical: "top" },
  footer: { backgroundColor: "#ffffff", borderColor: "#dce4ee", borderTopWidth: 1, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  cancelButton: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 30, borderWidth: 2, flex: 1, justifyContent: "center", paddingVertical: 16 },
  cancelText: { color: "#667994", fontSize: 16, fontWeight: "800" },
  submitButton: { alignItems: "center", backgroundColor: "#ef7f19", borderRadius: 30, flex: 1, justifyContent: "center", paddingVertical: 16 },
  submitText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
