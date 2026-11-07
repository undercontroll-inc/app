import { useState } from "react";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import Button from "./ui/Button";
import Field from "./ui/Field";
import FormCard, { FieldRow } from "./ui/FormCard";
import FormScreen from "./ui/FormScreen";
import Text from "./ui/Text";
import { useComponent, useSaveComponent } from "../hooks/queries/useComponents";
import { getErrorMessage } from "../providers/api";
import { haptics } from "../utils/haptics";
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
      <FormCard title="Item">
        <Field
          label="Nome do item"
          onChangeText={(value) => updateField("item", value)}
          placeholder="Nome do item"
          returnKeyType="next"
          value={form.item}
        />
        <FieldRow>
          <Field
            label="Marca"
            onChangeText={(value) => updateField("brand", value)}
            placeholder="Marca"
            style={styles.half}
            value={form.brand}
          />
          <Field
            label="Categoria"
            onChangeText={(value) => updateField("category", value)}
            placeholder="Categoria"
            style={styles.half}
            value={form.category}
          />
        </FieldRow>
      </FormCard>
      <FormCard title="Estoque e preço">
        <FieldRow>
          <Field
            editable={!edit}
            keyboardType="number-pad"
            label="Quantidade"
            onChangeText={(value) => updateField("quantity", value)}
            placeholder="0"
            style={styles.half}
            value={form.quantity}
          />
          <Field
            keyboardType="decimal-pad"
            label="Preço (R$)"
            onChangeText={(value) => updateField("price", value)}
            placeholder="0,00"
            style={styles.half}
            value={form.price}
          />
        </FieldRow>
        {edit ? (
          <Text tone="muted" variant="footnote">
            A quantidade muda pelas peças usadas nas ordens e pelas notas importadas.
          </Text>
        ) : null}
        <Field
          label="Fornecedor"
          onChangeText={(value) => updateField("supplier", value)}
          placeholder="Fornecedor"
          value={form.supplier}
        />
      </FormCard>
      <FormCard title="Descrição" subtitle="Opcional">
        <Field
          multiline
          onChangeText={(value) => updateField("description", value)}
          placeholder="Detalhes, modelo, observações"
          value={form.description}
        />
      </FormCard>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1 },
});
