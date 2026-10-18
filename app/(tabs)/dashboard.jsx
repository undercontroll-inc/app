import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import AppShell from "../../components/AppShell";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboardMetrics } from "../../hooks/queries/useDashboardMetrics";
import { useInsights, useRequestInsightsJob } from "../../hooks/queries/useInsights";
import { getErrorMessage } from "../../providers/api";
import { PeriodFilter } from "../../services/DashboardService";
import {
  describeInsightsState,
  formatMedianPrice,
  hasInsightsContent,
  insightJobErrorMessage,
  insightTypeInfo,
} from "../../utils/insights";
import { formatCurrency, formatDateBR } from "../../utils/orders";

const PERIODS = [
  { label: "7 dias", value: PeriodFilter.SEVEN_DAYS },
  { label: "30 dias", value: PeriodFilter.THIRTY_DAYS },
  { label: "90 dias", value: PeriodFilter.NINETY_DAYS },
];

const TONE_COLORS = {
  ok: { background: "#def4ed", color: "#0b9f76", icon: "check-circle" },
  info: { background: "#e8f1fe", color: "#367ff1", icon: "info" },
  warning: { background: "#fff7de", color: "#a77a00", icon: "clock" },
  error: { background: "#fdecee", color: "#d71929", icon: "alert-circle" },
};

function formatHours(value) {
  const hours = Number(value) || 0;
  if (hours >= 48) return `${(hours / 24).toFixed(1).replace(".", ",")} dias`;
  return `${hours.toFixed(1).replace(".", ",")} h`;
}

function SectionCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function MetricCard({ icon, label, value }) {
  return (
    <SectionCard style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Feather color="#ef7f19" name={icon} size={19} />
      </View>
      <Text numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </SectionCard>
  );
}

function InsightCard({ insight }) {
  const info = insightTypeInfo(insight.type);
  return (
    <SectionCard style={styles.insightCard}>
      <View style={[styles.insightRule, { backgroundColor: info.color }]} />
      <View style={styles.insightContent}>
        <View style={styles.insightTitleRow}>
          <Feather color={info.color} name={info.icon} size={14} />
          <Text style={[styles.insightTitle, { color: info.color }]}>{info.title}</Text>
          {insight.categoryName ? <Text style={styles.insightCategory}>· {insight.categoryName}</Text> : null}
        </View>
        <Text style={styles.insightText}>{insight.text}</Text>
        {insight.suggestedAction ? <Text style={styles.insightAction}>{insight.suggestedAction}</Text> : null}
      </View>
    </SectionCard>
  );
}

function StateBanner({ tone, message }) {
  if (!message) return null;
  const colors = TONE_COLORS[tone] || TONE_COLORS.info;
  return (
    <View style={[styles.banner, { backgroundColor: colors.background }]}>
      <Feather color={colors.color} name={colors.icon} size={16} />
      <Text style={[styles.bannerText, { color: colors.color }]}>{message}</Text>
    </View>
  );
}

function MetricsSection({ period }) {
  const metricsQuery = useDashboardMetrics(period);
  const metrics = metricsQuery.data;

  if (metricsQuery.isPending) {
    return (
      <View style={styles.inlineState}>
        <ActivityIndicator color="#ef7f19" />
      </View>
    );
  }
  if (metricsQuery.isError) {
    return (
      <SectionCard style={styles.errorCard}>
        <Text style={styles.errorText}>{getErrorMessage(metricsQuery.error)}</Text>
        <Pressable onPress={() => metricsQuery.refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </SectionCard>
    );
  }

  const maxCount = Math.max(1, ...metrics.topAppliances.map((item) => item.count || 0));

  return (
    <>
      <View style={styles.metrics}>
        <MetricCard icon="dollar-sign" label="Faturamento" value={formatCurrency(metrics.revenue)} />
        <MetricCard icon="tool" label="OS em andamento" value={String(Math.round(metrics.ongoingOrders))} />
      </View>
      <View style={styles.metrics}>
        <MetricCard icon="file-text" label="Ticket médio" value={formatCurrency(metrics.averageOrderPrice)} />
        <MetricCard icon="clock" label="Tempo médio de reparo" value={formatHours(metrics.averageRepairTime)} />
      </View>
      <SectionCard style={styles.listCard}>
        <Text style={styles.sectionTitle}>Aparelhos mais atendidos</Text>
        {metrics.topAppliances.length === 0 ? (
          <Text style={styles.muted}>Nenhum conserto no período.</Text>
        ) : (
          metrics.topAppliances.slice(0, 6).map((item) => (
            <View key={`${item.type}-${item.brand}`} style={styles.barRow}>
              <Text numberOfLines={1} style={styles.barLabel}>
                {[item.type, item.brand].filter(Boolean).join(" · ") || "Não informado"}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${((item.count || 0) / maxCount) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

function InsightsSection() {
  const { user } = useAuth();
  const insightsQuery = useInsights();
  const requestJob = useRequestInsightsJob();
  const data = insightsQuery.data;
  const isAdmin = user?.userType === "ADMINISTRATOR";
  const status = describeInsightsState(data);

  if (insightsQuery.isPending) {
    return (
      <View style={styles.inlineState}>
        <ActivityIndicator color="#ef7f19" />
        <Text style={styles.muted}>Carregando insights...</Text>
      </View>
    );
  }
  if (insightsQuery.isError) {
    return (
      <SectionCard style={styles.errorCard}>
        <Text style={styles.errorText}>{getErrorMessage(insightsQuery.error)}</Text>
        <Pressable onPress={() => insightsQuery.refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </SectionCard>
    );
  }

  return (
    <>
      <StateBanner message={status.message} tone={status.tone} />
      {status.polling ? <ActivityIndicator color="#367ff1" style={styles.polling} /> : null}
      {isAdmin && status.canGenerate ? (
        <Pressable
          disabled={requestJob.isPending}
          onPress={() => requestJob.mutate()}
          style={({ pressed }) => [styles.generate, (pressed || requestJob.isPending) && styles.pressed]}
        >
          <Feather color="#ffffff" name="zap" size={16} />
          <Text style={styles.generateText}>{requestJob.isPending ? "Solicitando..." : "Gerar insights"}</Text>
        </Pressable>
      ) : null}
      {requestJob.isError ? <Text style={styles.errorText}>{insightJobErrorMessage(requestJob.error)}</Text> : null}
      {hasInsightsContent(data) ? (
        <>
          {data.insights.map((insight, index) => (
            <InsightCard insight={insight} key={insight.id || String(index)} />
          ))}
          {data.risingProducts.length ? (
            <SectionCard style={styles.listCard}>
              <Text style={styles.sectionTitle}>Produtos em alta</Text>
              {data.risingProducts.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.productRow}>
                  <Text style={styles.productRank}>{product.rank ?? index + 1}</Text>
                  <View style={styles.productCopy}>
                    <Text numberOfLines={2} style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text style={styles.productMeta}>
                      {[product.brand, product.category].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Text style={styles.productPrice}>{formatMedianPrice(product)}</Text>
                </View>
              ))}
            </SectionCard>
          ) : null}
        </>
      ) : data?.state === "READY" ? (
        <Text style={styles.muted}>Nenhum insight disponível para este mês.</Text>
      ) : null}
      {data?.limitations?.length ? (
        <View style={styles.limitations}>
          <Text style={styles.limitationsTitle}>Limitações da análise</Text>
          {data.limitations.map((item) => (
            <Text key={item} style={styles.limitationItem}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}
      {data?.generatedAt ? <Text style={styles.generatedAt}>Gerado em {formatDateBR(data.generatedAt)}</Text> : null}
    </>
  );
}

export default function DashboardScreen() {
  const [period, setPeriod] = useState(PeriodFilter.THIRTY_DAYS);
  const metricsQuery = useDashboardMetrics(period);
  const insightsQuery = useInsights();
  const [pulling, setPulling] = useState(false);

  async function onRefresh() {
    setPulling(true);
    await Promise.all([metricsQuery.refetch(), insightsQuery.refetch()]);
    setPulling(false);
  }

  return (
    <AppShell>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={pulling} tintColor="#ef7f19" />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Desempenho da oficina e insights de mercado</Text>

        <View style={styles.periods}>
          {PERIODS.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: period === option.value }}
              key={option.value}
              onPress={() => setPeriod(option.value)}
              style={[styles.period, period === option.value && styles.periodSelected]}
            >
              <Text style={[styles.periodText, period === option.value && styles.periodTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <MetricsSection period={period} />

        <View style={styles.insightsHeading}>
          <Text style={styles.sectionTitle}>Insights de Mercado</Text>
          <Feather color="#092542" name="star" size={21} />
        </View>
        <InsightsSection />
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
  metrics: { flexDirection: "row", gap: 10, marginBottom: 10 },
  card: { backgroundColor: "#fff", borderColor: "#dce4ee", borderRadius: 12, borderWidth: 1 },
  metricCard: { flex: 1, minHeight: 107, padding: 10 },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "#fff4e9",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  metricValue: { color: "#092542", fontSize: 20, fontWeight: "800", marginTop: 7 },
  metricLabel: { color: "#667994", fontSize: 13, marginTop: 2 },
  listCard: { marginBottom: 12, marginTop: 10, padding: 15 },
  sectionTitle: { color: "#092542", fontSize: 17, fontWeight: "800" },
  barRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 14 },
  barLabel: { color: "#092542", fontSize: 14, width: 120 },
  barTrack: { backgroundColor: "#e1e7ef", borderRadius: 4, flex: 1, height: 12, overflow: "hidden" },
  bar: { backgroundColor: "#ef7f19", borderRadius: 4, height: "100%" },
  barValue: { color: "#ef7f19", fontSize: 12, fontWeight: "800", textAlign: "right", width: 32 },
  insightsHeading: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12, marginTop: 22 },
  insightCard: { flexDirection: "row", marginBottom: 12, padding: 13 },
  insightRule: { borderRadius: 2, width: 4 },
  insightContent: { flex: 1, paddingLeft: 11 },
  insightTitleRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7 },
  insightTitle: { fontSize: 12, fontWeight: "800" },
  insightCategory: { color: "#667994", fontSize: 12 },
  insightText: { color: "#092542", fontSize: 14, lineHeight: 18, marginTop: 7 },
  insightAction: { color: "#667994", fontSize: 13, fontStyle: "italic", lineHeight: 18, marginTop: 6 },
  banner: { alignItems: "flex-start", borderRadius: 10, flexDirection: "row", gap: 8, marginBottom: 12, padding: 12 },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  polling: { marginBottom: 12 },
  generate: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ef7f19",
    borderRadius: 22,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  generateText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  productRow: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 14 },
  productRank: { color: "#ef7f19", fontSize: 14, fontWeight: "800", width: 20 },
  productCopy: { flex: 1 },
  productName: { color: "#092542", fontSize: 14, fontWeight: "700" },
  productMeta: { color: "#667994", fontSize: 12, marginTop: 2 },
  productPrice: { color: "#092542", fontSize: 12, fontWeight: "700", maxWidth: 120, textAlign: "right" },
  limitations: { marginTop: 4 },
  limitationsTitle: { color: "#667994", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  limitationItem: { color: "#667994", fontSize: 12, lineHeight: 17 },
  generatedAt: { color: "#9aaac0", fontSize: 12, marginTop: 12 },
  inlineState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  muted: { color: "#667994", fontSize: 14, marginTop: 8 },
  errorCard: { alignItems: "center", marginBottom: 12, padding: 16 },
  errorText: { color: "#d71929", fontSize: 14, marginBottom: 8, textAlign: "center" },
  retry: { padding: 8 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
