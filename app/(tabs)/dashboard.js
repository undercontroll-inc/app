import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppShell from "../../components/AppShell";
import AppHeader from "../../components/AppHeader";

const brands = [
  { name: "Electrolux", value: 23 },
  { name: "Brastemp", value: 19 },
  { name: "LG", value: 16 },
  { name: "Consul", value: 14 },
  { name: "Mondial", value: 11 },
  { name: "Outros", value: 9 },
];

const categories = [
  ["Micro-ondas", "10.500"],
  ["Tostadeiras", "10.632"],
  ["Cafeteira Elétrica", "9.807"],
  ["Geladeiras", "9.655"],
  ["Air Fryers", "8998"],
];

const insights = [
  { color: "#ef7f19", icon: "briefcase", title: "TENDÊNCIA DE ALTA", text: "Ar-condicionado apresenta crescimento consistente em vendas (+12,4%). Considere ampliar o estoque de peças como compressores, placas eletrônicas e filtros para atender a demanda crescente de reparos." },
  { color: "#08b77a", icon: "box", title: "OPORTUNIDADE DE ESTOQUE", text: "Lava-louças registram aumento de 23% nas vendas. Como é uma categoria com alto índice de manutenção, vale preparar peças de reposição como bombas d'água e resistências." },
  { color: "#367ff1", icon: "lightbulb", title: "ALERTA DE PREÇO", text: "Micro-ondas tiveram alta de 18,3% nos últimos 30 dias. Preços elevados podem levar consumidores a optar pelo reparo ao invés da troca - oportunidade direta para seu negócio." },
  { color: "#ef7f19", icon: "briefcase", title: "OPORTUNIDADE DE REPARO", text: "Air Fryers têm a maior queda de preço (-5,8%), mas continuam entre os mais vendidos. Equipamentos populares com preço acessível geram alto volume de manutenção após a garantia." },
  { color: "#8b5cf6", icon: "award", title: "DESTAQUE DE MARCA", text: "Electrolux representa a maior fatia dos produtos monitorados (32%). Priorize treinamento técnico e estoque de peças para esta marca - ela domina a base instalada dos seus potenciais clientes." },
  { color: "#ed3d4d", icon: "star", title: "ALERTA DE MERCADO", text: "Categoria de Aspiradores de Pó apresentou queda de 15% em disponibilidade nos marketplaces. Isso pode indicar problemas na cadeia de suprimentos - antecipe compras de peças antes de possível escassez." },
  { color: "#f59e0b", icon: "award", title: "RECOMENDAÇÃO", text: "Com base nos dados, as 3 categorias com maior potencial de reparo este mês são: Ar-condicionado, Micro-ondas e Lava-louças. Considere criar pacotes promocionais de manutenção preventiva para esses itens." },
];

function SectionCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function InsightCard({ insight }) {
  return (
    <SectionCard style={styles.insightCard}>
      <View style={[styles.insightRule, { backgroundColor: insight.color }]} />
      <View style={styles.insightContent}>
        <View style={styles.insightTitleRow}>
          <Feather color={insight.color} name={insight.icon} size={14} />
          <Text style={[styles.insightTitle, { color: insight.color }]}>{insight.title}</Text>
        </View>
        <Text style={styles.insightText}>{insight.text}</Text>
      </View>
    </SectionCard>
  );
}

export default function DashboardScreen() {
  const [period, setPeriod] = useState("30 dias");

  return (
    <AppShell>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard Analytics</Text>
        <Text style={styles.subtitle}>Dados filtrados obtidos via API do Mercado Livre</Text>

        <View style={styles.periods}>
          {["30 dias", "60 dias"].map((option) => (
            <Pressable accessibilityRole="button" accessibilityState={{ selected: period === option }} key={option} onPress={() => setPeriod(option)} style={[styles.period, period === option && styles.periodSelected]}>
              <Text style={[styles.periodText, period === option && styles.periodTextSelected]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metrics}>
          <SectionCard style={styles.metricCard}>
            <View style={styles.metricIcon}><Feather color="#ef7f19" name="search" size={19} /></View>
            <Text style={styles.metricValue}>1.247</Text>
            <Text style={styles.metricLabel}>Produtos Analisados</Text>
          </SectionCard>
          <SectionCard style={styles.metricCard}>
            <View style={styles.metricIcon}><Feather color="#ef7f19" name="layers" size={19} /></View>
            <Text style={styles.metricValue}>34</Text>
            <Text style={styles.metricLabel}>Marcas Analisadas</Text>
          </SectionCard>
        </View>

        <SectionCard style={styles.brandsCard}>
          <Text style={styles.sectionTitle}>Marcas Mais Vendidas (% das Vendas)</Text>
          {brands.map((brand) => (
            <View key={brand.name} style={styles.brandRow}>
              <Text style={styles.brandName}>{brand.name}</Text>
              <View style={styles.barTrack}><View style={[styles.bar, { width: `${(brand.value / 23) * 100}%` }]} /></View>
              <Text style={styles.percent}>{brand.value}%</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard style={styles.categoriesCard}>
          <Text style={styles.sectionTitle}>Categorias Mais vendidas (Unidades)</Text>
          {categories.map(([name, value]) => (
            <View key={name} style={styles.categoryRow}><Text style={styles.categoryName}>{name}</Text><Text style={styles.categoryValue}>{value}</Text></View>
          ))}
        </SectionCard>

        <View style={styles.insightsHeading}>
          <Text style={styles.sectionTitle}>Insights de Mercado</Text>
          <Feather color="#092542" name="star" size={21} />
        </View>
        {insights.map((insight) => <InsightCard insight={insight} key={insight.title} />)}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: "#f4f6fa", padding: 16, paddingBottom: 24 },
  title: { color: "#092542", fontSize: 23, fontWeight: "800", letterSpacing: 0, marginTop: 2 },
  subtitle: { color: "#667994", fontSize: 13, marginTop: 4 },
  periods: { flexDirection: "row", gap: 8, marginBottom: 19, marginTop: 14 },
  period: { borderColor: "#dce4ee", borderRadius: 22, borderWidth: 1, paddingHorizontal: 19, paddingVertical: 8 },
  periodSelected: { backgroundColor: "#ef7f19", borderColor: "#ef7f19" },
  periodText: { color: "#667994", fontSize: 14 },
  periodTextSelected: { color: "#fff", fontWeight: "700" },
  metrics: { flexDirection: "row", gap: 10, marginBottom: 20 },
  card: { backgroundColor: "#fff", borderColor: "#dce4ee", borderRadius: 12, borderWidth: 1 },
  metricCard: { flex: 1, minHeight: 107, padding: 10 },
  metricIcon: { alignItems: "center", backgroundColor: "#fff4e9", borderRadius: 8, height: 30, justifyContent: "center", width: 30 },
  metricValue: { color: "#092542", fontSize: 20, fontWeight: "800", marginTop: 7 },
  metricLabel: { color: "#667994", fontSize: 13, marginTop: 2 },
  brandsCard: { padding: 15 },
  sectionTitle: { color: "#092542", fontSize: 17, fontWeight: "800" },
  brandRow: { alignItems: "center", flexDirection: "row", marginTop: 14 },
  brandName: { color: "#092542", fontSize: 14, width: 92 },
  barTrack: { backgroundColor: "#e1e7ef", borderRadius: 4, flex: 1, height: 12, overflow: "hidden" },
  bar: { backgroundColor: "#ef7f19", borderRadius: 4, height: "100%" },
  percent: { color: "#ef7f19", fontSize: 12, fontWeight: "800", textAlign: "right", width: 45 },
  categoriesCard: { marginTop: 20, padding: 15 },
  categoryRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  categoryName: { color: "#092542", fontSize: 14 },
  categoryValue: { color: "#092542", fontSize: 14, fontWeight: "800" },
  insightsHeading: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12, marginTop: 22 },
  insightCard: { flexDirection: "row", marginBottom: 12, minHeight: 120, padding: 13 },
  insightRule: { borderRadius: 2, width: 4 },
  insightContent: { flex: 1, paddingLeft: 11 },
  insightTitleRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  insightTitle: { fontSize: 12, fontWeight: "800" },
  insightText: { color: "#092542", fontSize: 14, lineHeight: 18, marginTop: 7 },
});
