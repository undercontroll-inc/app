import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { displayContact } from "../../utils/orderForm";
import { formatUserName } from "../../utils/orders";
import { Section, formStyles } from "./OrderFormParts";

export default function OrderCustomerSection({ client, editable, onSelect }) {
  return (
    <Section title="Cliente">
      {client ? (
        <View style={styles.clientCard}>
          <View style={styles.clientCopy}>
            <Text style={styles.clientName}>{formatUserName(client)}</Text>
            <Text style={styles.clientMeta}>{displayContact(client.phone)}</Text>
            <Text style={styles.clientMeta}>
              {displayContact(client.cpf, "CPF não informado")}
              {client.email ? ` · ${client.email}` : ""}
            </Text>
          </View>
          {editable ? (
            <Pressable onPress={onSelect} style={({ pressed }) => [styles.changeClient, pressed && formStyles.pressed]}>
              <Text style={styles.changeClientText}>Trocar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={onSelect} style={({ pressed }) => [styles.selectButton, pressed && formStyles.pressed]}>
          <Feather color="#ef7f19" name="search" size={18} />
          <Text style={styles.selectButtonText}>Selecionar cliente</Text>
        </Pressable>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  clientCard: {
    alignItems: "flex-start",
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    flexDirection: "row",
    padding: 12,
  },
  clientCopy: { flex: 1, paddingRight: 8 },
  clientName: { color: "#092542", fontSize: 16, fontWeight: "800" },
  clientMeta: { color: "#667994", fontSize: 13, marginTop: 4 },
  changeClient: { paddingVertical: 4 },
  changeClientText: { color: "#ef7f19", fontSize: 14, fontWeight: "700" },
  selectButton: {
    alignItems: "center",
    borderColor: "#ef7f19",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  selectButtonText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
});
