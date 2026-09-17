import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../../components/AppHeader";
import AppShell from "../../../components/AppShell";
import SearchField from "../../../components/SearchField";

const initialItems = [
  { id: "1", name: "Placa Principal", category: "Electrolux · Placas", price: "R$ 150,00", quantity: "10", supplier: "TechParts" },
  { id: "2", name: "Capacitor 25uF", category: "Nichicon · Capacitores", price: "R$ 18,00", quantity: "80", supplier: "ElecSupply" },
  { id: "3", name: "Motor 1/2HP", category: "WEG · Motores", price: "R$ 220,00", quantity: "8", supplier: "MotorBras" },
  { id: "4", name: "Resistência", category: "Thermex · Resistências", price: "R$ 45,00", quantity: "30", supplier: "ThermoSupply" },
];

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (params.updatedId && params.name) {
      setItems((current) => current.map((item) => item.id === params.updatedId ? {
        ...item,
        name: params.name,
        category: params.category || item.category,
        price: params.price || item.price,
        quantity: params.quantity || item.quantity,
        supplier: params.supplier || item.supplier,
      } : item));
      return;
    }
    if (!params.addedId || !params.name) return;
    setItems((current) => {
      if (current.some((item) => item.id === params.addedId)) return current;
      return [...current, {
        id: params.addedId,
        name: params.name,
        category: params.category || "Sem categoria",
        price: params.price || "R$ 0,00",
        quantity: params.quantity || "0",
        supplier: params.supplier || "Não informado",
      }];
    });
  }, [params.addedId, params.category, params.name, params.price, params.quantity, params.supplier, params.updatedId]);

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.category} ${item.supplier}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <AppHeader />
      <View style={styles.scrollWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Controle de Estoque</Text>
          <SearchField onChangeText={setSearch} placeholder="Buscar peça ou item..." value={search} />
          {visibleItems.length === 0 ? (
            <Text style={styles.empty}>Nenhum item encontrado.</Text>
          ) : visibleItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: "/stock/edit", params: item })}
              style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
            >
              <View style={styles.itemHeading}>
                <View style={styles.itemNameWrap}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
                <Text style={styles.price}>{item.price}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.itemDetails}>
                <Text style={styles.detail}>Qtd: <Text style={styles.detailStrong}>{item.quantity} un</Text></Text>
                <Text style={styles.detail}>Fornecedor: <Text style={styles.detailStrong}>{item.supplier}</Text></Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <Pressable onPress={() => router.push("/stock/new")} style={({ pressed }) => [styles.newButton, { bottom: Platform.OS === "ios" ? 16 + Math.max(insets.bottom, 8) : 22 }, pressed && styles.pressed]}>
        <Feather color="#ffffff" name="plus" size={20} />
        <Text style={styles.newButtonText}>Novo Item</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollWrap: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },
  title: { color: "#092542", fontSize: 32, fontWeight: "800", marginBottom: 26 },
  itemCard: { borderColor: "#dce4ee", borderRadius: 16, borderWidth: 2, marginTop: 18, padding: 22 },
  itemHeading: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  itemNameWrap: { flex: 1, paddingRight: 8 },
  itemName: { color: "#092542", fontSize: 18, fontWeight: "800" },
  category: { color: "#667994", fontSize: 16, marginTop: 10 },
  price: { color: "#ef6f10", fontSize: 18, fontWeight: "800" },
  divider: { backgroundColor: "#dce4ee", height: 1, marginVertical: 20 },
  itemDetails: { flexDirection: "row", justifyContent: "space-between" },
  detail: { color: "#667994", fontSize: 14 },
  detailStrong: { color: "#092542", fontWeight: "800" },
  empty: { color: "#667994", fontSize: 15, marginTop: 28, textAlign: "center" },
  newButton: { alignItems: "center", alignSelf: "flex-end", backgroundColor: "#ef7f19", borderRadius: 28, elevation: 8, flexDirection: "row", gap: 8, paddingHorizontal: 22, paddingVertical: 16, position: "absolute", right: 22, shadowColor: "#092542", shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8 },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
});
