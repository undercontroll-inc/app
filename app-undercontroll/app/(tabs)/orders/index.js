import { useCallback, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppShell from "../../../components/AppShell";
import OrderCard from "../../../components/OrderCard";
import { useAuth } from "../../../contexts/AuthContext";
import { getAxiosErrorMessage } from "../../../providers/api";
import { orderService } from "../../../services/OrderService";
import { toOrderCard } from "../../../utils/orders";

const filters = ["Todos", "Pendentes", "Em análise", "Concluídos"];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      const response = await orderService.list({ page: 0, size: 50 });
      setOrders((response.data ?? []).map(toOrderCard));
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [loadOrders]),
  );

  const visibleOrders = orders.filter((order) => {
    const matchesSearch = `${order.id} ${order.client} ${order.device}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      selectedFilter === "Todos" ||
      (selectedFilter === "Pendentes" && order.status === "Pendente") ||
      (selectedFilter === "Concluídos" && order.status === "Concluído") ||
      order.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const displayName = user?.name || "Admin";
  const fabBottom = Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22;

  async function handleLogout() {
    setProfileVisible(false);
    await logout();
    router.replace("/");
  }

  return (
    <AppShell>
      <View style={styles.header}>
        <Image source={require("../../../assets/logo_pelluci.png")} resizeMode="contain" style={styles.logo} />
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
      <View collapsable={false} style={styles.scrollWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Ordens de Serviço</Text>
          <View style={styles.search}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput onChangeText={setSearch} placeholder="Pesquise por OS ou cliente..." placeholderTextColor="#667994" style={styles.searchInput} value={search} />
          </View>
          <View style={styles.filters}>
            {filters.map((item) => (
              <Pressable key={item} onPress={() => setSelectedFilter(item)} style={[styles.filter, selectedFilter === item && styles.activeFilter]}>
                <Text style={[styles.filterText, selectedFilter === item && styles.activeFilterText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {loading && (
            <View style={styles.state}>
              <ActivityIndicator color="#ef7f19" />
              <Text style={styles.stateText}>Carregando ordens...</Text>
            </View>
          )}
          {!loading && !!error && (
            <View style={styles.state}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={loadOrders} style={styles.retry}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}
          {!loading && !error && visibleOrders.length === 0 && (
            <Text style={styles.empty}>Nenhuma ordem de serviço encontrada.</Text>
          )}
          {!loading && !error && visibleOrders.map((order) => (
            <OrderCard key={order.id} order={order} onPress={() => router.push(`/orders/${order.id}`)} />
          ))}
        </ScrollView>
      </View>
      <Pressable
        onPress={() => router.push("/orders/new")}
        style={({ pressed }) => [styles.newButton, { bottom: fabBottom }, pressed && styles.pressed]}
      >
        <Text style={styles.newButtonText}>＋ Nova O.S.</Text>
      </Pressable>
    </AppShell>
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
  scrollWrap: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 32, fontWeight: "800", marginBottom: 26 },
  search: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 14, borderWidth: 2, flexDirection: "row", height: 62, paddingHorizontal: 16 },
  searchIcon: { color: "#667994", fontSize: 30 },
  searchInput: { color: "#092542", flex: 1, fontSize: 16, marginLeft: 8 },
  filters: { flexDirection: "row", gap: 6, marginVertical: 24 },
  filter: { alignItems: "center", borderColor: "#dce4ee", borderRadius: 22, borderWidth: 2, flex: 1, justifyContent: "center", minWidth: 0, paddingHorizontal: 4, paddingVertical: 10 },
  filterText: { color: "#667994", fontSize: 13, textAlign: "center" },
  activeFilter: { backgroundColor: "#ef7f19", borderColor: "#ef7f19" },
  activeFilterText: { color: "#fff", fontWeight: "700" },
  newButton: { alignSelf: "flex-end", backgroundColor: "#ef7f19", borderRadius: 28, elevation: 8, paddingHorizontal: 22, paddingVertical: 16, position: "absolute", right: 22, shadowColor: "#092542", shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8 },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
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
  state: { alignItems: "center", paddingVertical: 32 },
  stateText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  empty: { color: "#667994", fontSize: 16, marginTop: 12, textAlign: "center" },
});
