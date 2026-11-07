import { Pressable, StyleSheet, View } from "react-native";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Text from "../ui/Text";
import { displayContact } from "../../utils/orderForm";
import { formatUserName } from "../../utils/orders";
import { colors, radius } from "../../theme";
import { Section, formStyles } from "./OrderFormParts";

export default function OrderCustomerSection({ client, editable, onSelect }) {
  return (
    <Section title="Cliente">
      {client ? (
        <View style={styles.clientCard}>
          <Avatar name={formatUserName(client)} size={48} />
          <View style={styles.clientCopy}>
            <Text variant="headline">{formatUserName(client)}</Text>
            <Text tone="muted" variant="subhead">
              {displayContact(client.phone)}
            </Text>
            <Text tone="muted" variant="footnote">
              {displayContact(client.cpf, "CPF não informado")}
              {client.email ? ` · ${client.email}` : ""}
            </Text>
          </View>
          {editable ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onSelect}
              style={({ pressed }) => [styles.change, pressed && formStyles.pressed]}
            >
              <Text tone="accent" variant="subhead" weight="700">
                Trocar
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Button icon="search" label="Selecionar cliente" onPress={onSelect} size="md" variant="tinted" />
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  clientCard: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.control,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  clientCopy: { flex: 1, gap: 2 },
  change: { justifyContent: "center", minHeight: 44, paddingHorizontal: 6 },
});
