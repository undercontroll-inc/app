import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Avatar from "./Avatar";
import { ActionMenuSheet, useActionMenu } from "../ActionMenu";
import { useAuth } from "../../contexts/AuthContext";

export default function HeaderAvatar() {
  const { user, logout } = useAuth();
  const menu = useActionMenu();
  const displayName = user?.name || "Admin";

  function openProfile() {
    menu.show({
      title: displayName,
      message: user?.email || "Sua conta",
      options: [
        {
          label: "Sair da conta",
          destructive: true,
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
        { label: "Cancelar", cancel: true },
      ],
    });
  }

  return (
    <>
      <Pressable
        accessibilityLabel={`Conta de ${displayName}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={openProfile}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Avatar name={displayName} size={36} tone="brand" />
      </Pressable>
      <ActionMenuSheet config={menu.config} onClose={menu.close} />
    </>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  pressed: { opacity: 0.7 },
});
