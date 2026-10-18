import { StyleSheet, Text, View } from "react-native";
import DateField from "../DateField";
import NativeSelect from "../NativeSelect";
import { formatCurrency } from "../../utils/orders";
import { Field, Section, Summary } from "./OrderFormParts";

export default function OrderTotals({ edit, form, totals, onChange }) {
  return (
    <>
      <Section title={edit ? "Desconto" : "Garantia e desconto"}>
        {!edit ? (
          <NativeSelect
            label="Garantia"
            onSelect={(value) => onChange("warranty", value)}
            options={["30 dias", "60 dias", "90 dias"]}
            value={form.warranty}
          />
        ) : null}
        <Field
          editable={!edit}
          keyboardType="decimal-pad"
          label="Desconto"
          onChangeText={(value) => onChange("discount", value)}
          value={form.discount}
        />
      </Section>
      <Section title="Datas">
        <DateField
          disabled={edit}
          label="Data de recebimento"
          onChange={(value) => onChange("receivedAt", value)}
          value={form.receivedAt}
        />
        <DateField
          disabled={edit}
          label="Data de retirada"
          onChange={(value) => onChange("deadline", value)}
          value={form.deadline}
        />
        {edit ? <Text style={styles.hint}>Desconto e datas não podem ser alterados após a criação da OS.</Text> : null}
      </Section>
      <Section highlight title="Resumo">
        <Summary label="Mão de obra" value={formatCurrency(totals.labor)} />
        <Summary label="Peças" value={formatCurrency(totals.parts)} />
        <Summary label="Desconto" red value={`- ${formatCurrency(totals.discount)}`} />
        <View style={styles.rule} />
        <Summary label="Total da OS" total value={formatCurrency(totals.total)} />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { color: "#667994", fontSize: 13 },
  rule: { backgroundColor: "#dce4ee", height: 1, marginTop: 12 },
});
