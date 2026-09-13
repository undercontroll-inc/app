import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const displayName = user?.name || "Admin";

  async function handleLogout() {
    setProfileVisible(false);
    await logout();
    router.replace("/");
  }

  return (
    <>
      <View style={styles.header}>
        <Image source={require("../assets/logo_pelluci.png")} resizeMode="contain" style={styles.logo} />
        <Pressable accessibilityLabel="Abrir opções do perfil" onPress={() => setProfileMenuVisible((visible) => !visible)} style={styles.admin}>
          <Text style={styles.adminName}>{displayName}</Text>
          <View style={styles.avatar}>
            <Feather color="#ffffff" name="user" size={22} />
          </View>
        </Pressable>
        {profileMenuVisible && (
          <View style={styles.profileMenu}>
            <Pressable
              onPress={() => {
                setProfileMenuVisible(false);
                setProfileVisible(true);
              }}
              style={({ pressed }) => [styles.profileMenuButton, pressed && styles.pressed]}
            >
              <Feather color="#ffffff" name="log-out" size={17} />
              <Text style={styles.profileMenuText}>Sair</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Modal animationType="fade" transparent visible={profileVisible} onRequestClose={() => setProfileVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeading}>
              <View style={styles.logoutIcon}>
                <Feather color="#ef4b43" name="log-out" size={24} />
              </View>
              <Text style={styles.profileTitle}>Sair da conta?</Text>
            </View>
            <Text style={styles.profileMessage}>Sua sessão será encerrada. Deseja continuar?</Text>
            <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
              <Text style={styles.logoutText}>Sair da conta</Text>
            </Pressable>
            <Pressable onPress={() => setProfileVisible(false)} style={({ pressed }) => [styles.cancelProfileButton, pressed && styles.pressed]}>
              <Text style={styles.cancelProfileText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", backgroundColor: "#092542", flexDirection: "row", justifyContent: "space-between", padding: 26, position: "relative", zIndex: 2 },
  logo: { height: 54, width: 105 },
  admin: { alignItems: "center", flexDirection: "row", gap: 12 },
  adminName: { color: "#fff", fontSize: 16 },
  avatar: { alignItems: "center", backgroundColor: "#ef7f19", borderColor: "#ffad65", borderRadius: 28, borderWidth: 2, height: 56, justifyContent: "center", width: 56 },
  profileMenu: { backgroundColor: "#123b5e", borderColor: "#2d638d", borderRadius: 8, borderWidth: 1, elevation: 6, position: "absolute", right: 26, top: 86, shadowColor: "#000", shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.25, shadowRadius: 6, width: 116 },
  profileMenuButton: { alignItems: "center", flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  profileMenuText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modalOverlay: { alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.72)", flex: 1, justifyContent: "center", padding: 24 },
  profileCard: { backgroundColor: "#092542", borderColor: "#174a79", borderRadius: 14, borderWidth: 1, maxWidth: 380, padding: 22, width: "100%" },
  profileHeading: { alignItems: "center", flexDirection: "row" },
  logoutIcon: { alignItems: "center", backgroundColor: "#632d43", borderRadius: 24, height: 48, justifyContent: "center", marginRight: 14, width: 48 },
  profileTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileMessage: { color: "#9fb0c5", fontSize: 15, lineHeight: 21, marginBottom: 20, marginTop: 12 },
  logoutButton: { alignItems: "center", backgroundColor: "#d71929", borderRadius: 7, justifyContent: "center", paddingVertical: 14 },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  cancelProfileButton: { alignItems: "center", borderColor: "#174a79", borderRadius: 7, borderWidth: 1, justifyContent: "center", marginTop: 8, paddingVertical: 13 },
  cancelProfileText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.8 },
});
