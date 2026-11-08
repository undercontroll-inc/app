import { StyleSheet, View } from "react-native";
import { FormDateRow, FormSection, FormSegmentedRow, FormTextRow, FormValueRow } from "../ui/FormRows";
import { formatCurrency } from "../../utils/orders";

const WARRANTIES = ["30 dias", "60 dias", "90 dias"];

export default function OrderTotals({ edit, form, totals, onChange }) {
  return (
    <View style={styles.root}>
      <FormSection
        footer={edit ? "Garantia, desconto e datas não podem ser alterados depois da OS criada." : undefined}
        title="Orçamento"
      >
        {!edit ? (
          <FormSegmentedRow
            label="Garantia"
            onChange={(value) => onChange("warranty", value)}
            options={WARRANTIES}
            value={form.warranty}
          />
        ) : null}
        <FormTextRow
          editable={!edit}
          keyboardType="decimal-pad"
          label="Desconto"
          onChangeText={(value) => onChange("discount", value)}
          placeholder="0,00"
          prefix="R$"
          value={form.discount}
        />
        <FormDateRow
          disabled={edit}
          label="Recebimento"
          onChange={(value) => onChange("receivedAt", value)}
          value={form.receivedAt}
        />
        <FormDateRow
          disabled={edit}
          label="Retirada"
          onChange={(value) => onChange("deadline", value)}
          value={form.deadline}
        />
      </FormSection>
      <FormSection title="Resumo">
        <FormValueRow label="Mão de obra" value={formatCurrency(totals.labor)} />
        <FormValueRow label="Peças" value={formatCurrency(totals.parts)} />
        <FormValueRow label="Desconto" tone="danger" value={`- ${formatCurrency(totals.discount)}`} />
        <FormValueRow label="Total da OS" strong tone="accent" value={formatCurrency(totals.total)} />
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20 },
});
