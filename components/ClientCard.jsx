import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Avatar from "./ui/Avatar";
import Card from "./ui/Card";
import Icon from "./ui/Icon";
import SwipeRow from "./ui/SwipeRow";
import Text from "./ui/Text";
import { formatUserName } from "../utils/orders";
import { colors } from "../theme";

function ClientCard({ client, onPress, onLongPress, actions = [] }) {
  const name = formatUserName(client);
  return (
    <SwipeRow actions={actions} style={styles.wrap}>
      <Card
        accessibilityLabel={name}
        onLongPress={Platform.OS === "ios" ? undefined : () => onLongPress?.(client)}
        onPress={() => onPress?.(client)}
        style={styles.card}
      >
        <Avatar name={name} size={48} uri={client.avatarUrl} />
        <View style={styles.copy}>
          <Text numberOfLines={1} variant="headline">
            {name}
          </Text>
          <Text numberOfLines={1} tone="muted" variant="subhead">
            {client.phone || "Telefone não informado"}
          </Text>
        </View>
        {client.hasWhatsApp ? <Icon color={colors.success} name="whatsapp" size={16} /> : null}
        <Icon color={colors.subtle} name="chevronRight" size={14} />
      </Card>
    </SwipeRow>
  );
}

export default memo(ClientCard);

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  card: { alignItems: "center", flexDirection: "row", gap: 14, paddingVertical: 14 },
  copy: { flex: 1, gap: 2 },
});
