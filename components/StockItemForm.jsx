import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import Button from "./ui/Button";
import FormScreen from "./ui/FormScreen";
import { FormMultilineRow, FormRow, FormSection, FormTextRow, FormValueRow, Stepper } from "./ui/FormRows";
import Text from "./ui/Text";
import { useComponent, useSaveComponent } from "../hooks/queries/useComponents";
import { getErrorMessage } from "../providers/api";
import { haptics } from "../utils/haptics";
import { colors, MAX_FONT_SCALE } from "../theme";
import {
  buildRegisterComponentPayload,
  buildUpdateComponentPayload,
  componentToForm,
  emptyStockForm,
  validateStockForm,
} from "../utils/stock";

export default function StockItemForm({ edit = false, componentId }) {
  const [form, setForm] = useState(emptyStockForm);
  const [hydrated, setHydrated] = useState(!edit);
  const [feedback, setFeedback] = useState("");
  const componentQuery = useComponent(componentId, { enabled: edit });
  const saveComponent = useSaveComponent();
  const loading = edit && !hydrated && !componentQuery.isError;
  const loadError = edit && componentQuery.isError ? getErrorMessage(componentQuery.error) : "";

  if (!hydrated && componentQuery.data) {
    setHydrated(true);
    setForm(componentToForm(componentQuery.data));
  }

  const quantityValue = Number.parseInt(form.quantity, 10) || 0;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  function handleSubmit() {
    const error = validateStockForm(form);
    if (error) {
      haptics.warning();
      setFeedback(error);
      return;
    }
    saveComponent.mutate(
      {
        componentId: edit ? componentId : null,
        payload: edit ? buildUpdateComponentPayload(form) : buildRegisterComponentPayload(form),
      },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: (err) => {
          haptics.error();
          setFeedback(getErrorMessage(err));
        },
      },
    );
  }

  return (
    <FormScreen
      feedback={feedback}
      footer={
        <Button
          disabled={loading}
          label={edit ? "Salvar alterações" : "Cadastrar item"}
          loading={saveComponent.isPending}
          onPress={handleSubmit}
        />
      }
      loadError={loadError}
      loading={loading}
      loadingText="Carregando item..."
      onCancel={() => router.back()}
      onRetry={componentQuery.refetch}
    >
      <FormSection title="Peça">
        <FormTextRow
          autoFocus={!edit}
          label="Nome"
          onChangeText={(value) => updateField("item", value)}
          placeholder="Nome do item"
          returnKeyType="next"
          value={form.item}
        />
        <FormTextRow
          label="Marca"
          onChangeText={(value) => updateField("brand", value)}
          placeholder="Marca"
          value={form.brand}
        />
        <FormTextRow
          label="Categoria"
          onChangeText={(value) => updateField("category", value)}
          placeholder="Categoria"
          value={form.category}
        />
      </FormSection>
      <FormSection
        footer={
          edit
            ? "A quantidade muda pelas peças usadas nas ordens e pelas notas importadas."
            : "Quantas unidades você tem agora."
        }
        title="Estoque e preço"
      >
        {edit ? (
          <FormValueRow label="Quantidade" value={`${form.quantity || 0} un.`} />
        ) : (
          <FormRow>
            <Text style={styles.flex} variant="body">
              Quantidade
            </Text>
            <Stepper
              label="quantidade"
              min={0}
              onDecrement={() => updateField("quantity", String(Math.max(0, quantityValue - 1)))}
              onIncrement={() => updateField("quantity", String(quantityValue + 1))}
              value={
                <TextInput
                  accessibilityLabel="Quantidade"
                  keyboardType="number-pad"
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                  onChangeText={(value) => updateField("quantity", value.replace(/\D/g, ""))}
                  placeholder="0"
                  placeholderTextColor={colors.subtle}
                  selectTextOnFocus
                  style={styles.quantityInput}
                  value={form.quantity}
                />
              }
            />
          </FormRow>
        )}
        <FormTextRow
          keyboardType="decimal-pad"
          label="Preço"
          onChangeText={(value) => updateField("price", value)}
          placeholder="0,00"
          prefix="R$"
          value={form.price}
        />
        <FormTextRow
          label="Fornecedor"
          onChangeText={(value) => updateField("supplier", value)}
          placeholder="Opcional"
          value={form.supplier}
        />
      </FormSection>
      <FormSection title="Descrição">
        <FormMultilineRow
          onChangeText={(value) => updateField("description", value)}
          placeholder="Modelo, compatibilidade, observações (opcional)"
          value={form.description}
        />
      </FormSection>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  quantityInput: {
    color: colors.text,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    minWidth: 36,
    paddingVertical: 6,
    textAlign: "center",
  },
});
