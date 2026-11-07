import { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Banner from "../../../components/ui/Banner";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Icon from "../../../components/ui/Icon";
import Segmented from "../../../components/ui/Segmented";
import StateView from "../../../components/ui/StateView";
import Text from "../../../components/ui/Text";
import { colors, radius } from "../../../theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useDashboardMetrics } from "../../../hooks/queries/useDashboardMetrics";
import { useInsights, useRequestInsightsJob } from "../../../hooks/queries/useInsights";
import { getErrorMessage } from "../../../providers/api";
import { PeriodFilter } from "../../../services/DashboardService";
import {
  describeInsightsState,
  formatMedianPrice,
  hasInsightsContent,
  insightJobErrorMessage,
  insightTypeInfo,
} from "../../../utils/insights";
import { formatCurrency, formatDateBR } from "../../../utils/orders";

const PERIODS = [
  { label: "7 dias", value: PeriodFilter.SEVEN_DAYS },
  { label: "30 dias", value: PeriodFilter.THIRTY_DAYS },
  { label: "90 dias", value: PeriodFilter.NINETY_DAYS },
];

const TONE_BANNER = { ok: "success", info: "neutral", warning: "warning", error: "danger" };

const SF_FOR_FEATHER = {
  "trending-up": "chart.line.uptrend.xyaxis",
  box: "shippingbox.fill",
  "dollar-sign": "brazilianrealsign.circle.fill",
  tool: "wrench.and.screwdriver.fill",
  award: "rosette",
  "alert-triangle": "exclamationmark.triangle.fill",
  star: "star.fill",
  info: "info.circle.fill",
};

function formatHours(value) {
  const hours = Number(value) || 0;
  if (hours >= 48) return `${(hours / 24).toFixed(1).replace(".", ",")} dias`;
  return `${hours.toFixed(1).replace(".", ",")} h`;
}

function MetricCard({ icon, label, value }) {
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Icon color={colors.orange} name={icon} size={20} />
      </View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue} variant="title2">
        {value}
      </Text>
      <Text tone="muted" variant="subhead">
        {label}
      </Text>
    </Card>
  );
}

function InsightCard({ insight }) {
  const info = insightTypeInfo(insight.type);
  return (
    <Card style={styles.insightCard}>
      <View style={styles.insightTitleRow}>
        <View style={[styles.insightIcon, { backgroundColor: `${info.color}1f` }]}>
          <Icon color={info.color} feather={info.icon} sf={SF_FOR_FEATHER[info.icon]} size={16} />
        </View>
        <View style={styles.insightTitleText}>
          <Text style={{ color: info.color }} variant="footnote" weight="700">
            {info.title}
          </Text>
          {insight.categoryName ? (
            <Text tone="muted" variant="footnote">
              {insight.categoryName}
            </Text>
          ) : null}
        </View>
      </View>
      <Text variant="callout">{insight.text}</Text>
      {insight.suggestedAction ? (
        <Text tone="muted" variant="subhead">
          {insight.suggestedAction}
        </Text>
      ) : null}
    </Card>
  );
}

function StateBanner({ tone, message }) {
  if (!message) return null;
  return <Banner message={message} tone={TONE_BANNER[tone] ?? "neutral"} />;
}

function SectionTitle({ children, icon }) {
  return (
    <View style={styles.sectionTitleRow}>
      {icon ? <Icon color={colors.navy} name={icon} size={18} /> : null}
      <Text variant="title2">{children}</Text>
    </View>
  );
}

function MetricsSection({ period }) {
  const metricsQuery = useDashboardMetrics(period);
  const metrics = metricsQuery.data;

  if (metricsQuery.isPending || metricsQuery.isError) {
    return (
      <StateView
        error={metricsQuery.isError ? getErrorMessage(metricsQuery.error) : null}
        loading={metricsQuery.isPending}
        onRetry={metricsQuery.refetch}
      />
    );
  }

  const maxCount = Math.max(1, ...metrics.topAppliances.map((item) => item.count || 0));

  return (
    <>
      <View style={styles.metrics}>
        <MetricCard icon="money" label="Faturamento" value={formatCurrency(metrics.revenue)} />
        <MetricCard icon="wrench" label="OS em andamento" value={String(Math.round(metrics.ongoingOrders))} />
      </View>
      <View style={styles.metrics}>
        <MetricCard icon="tag" label="Ticket médio" value={formatCurrency(metrics.averageOrderPrice)} />
        <MetricCard icon="clock" label="Tempo médio de reparo" value={formatHours(metrics.averageRepairTime)} />
      </View>
      <Card style={styles.listCard}>
        <Text variant="headline">Aparelhos mais atendidos</Text>
        {metrics.topAppliances.length === 0 ? (
          <Text tone="muted" variant="callout">
            Nenhum conserto no período.
          </Text>
        ) : (
          metrics.topAppliances.slice(0, 6).map((item) => (
            <View key={`${item.type}-${item.brand}`} style={styles.barRow}>
              <View style={styles.barHead}>
                <Text numberOfLines={1} style={styles.barLabel} variant="subhead" weight="600">
                  {[item.type, item.brand].filter(Boolean).join(" · ") || "Não informado"}
                </Text>
                <Text tone="accent" variant="subhead" weight="700">
                  {item.count}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${((item.count || 0) / maxCount) * 100}%` }]} />
              </View>
            </View>
          ))
        )}
      </Card>
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

  if (insightsQuery.isPending || insightsQuery.isError) {
    return (
      <StateView
        error={insightsQuery.isError ? getErrorMessage(insightsQuery.error) : null}
        loading={insightsQuery.isPending}
        loadingText="Carregando insights..."
        onRetry={insightsQuery.refetch}
      />
    );
  }

  return (
    <>
      <StateBanner message={status.message} tone={status.tone} />
      {status.polling ? <ActivityIndicator color={colors.orange} /> : null}
      {isAdmin && status.canGenerate ? (
        <Button
          icon="sparkles"
          label={requestJob.isPending ? "Solicitando..." : "Gerar insights"}
          loading={false}
          disabled={requestJob.isPending}
          onPress={() => requestJob.mutate()}
          size="md"
          variant="tinted"
        />
      ) : null}
      {requestJob.isError ? <Banner message={insightJobErrorMessage(requestJob.error)} tone="danger" /> : null}
      {hasInsightsContent(data) ? (
        <>
          {data.insights.map((insight, index) => (
            <InsightCard insight={insight} key={insight.id || String(index)} />
          ))}
          {data.risingProducts.length ? (
            <Card style={styles.listCard}>
              <Text variant="headline">Produtos em alta</Text>
              {data.risingProducts.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.productRow}>
                  <View style={styles.rank}>
                    <Text tone="accent" variant="subhead" weight="700">
                      {product.rank ?? index + 1}
                    </Text>
                  </View>
                  <View style={styles.productCopy}>
                    <Text numberOfLines={2} variant="subhead" weight="600">
                      {product.name}
                    </Text>
                    <Text tone="muted" variant="footnote">
                      {[product.brand, product.category].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Text align="right" style={styles.productPrice} variant="footnote" weight="700">
                    {formatMedianPrice(product)}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : data?.state === "READY" ? (
        <Text tone="muted" variant="callout">
          Nenhum insight disponível para este mês.
        </Text>
      ) : null}
      {data?.limitations?.length ? (
        <View style={styles.limitations}>
          <Text tone="muted" variant="footnote" weight="700">
            Limitações da análise
          </Text>
          {data.limitations.map((item) => (
            <Text key={item} tone="muted" variant="footnote">
              • {item}
            </Text>
          ))}
        </View>
      ) : null}
      {data?.generatedAt ? (
        <Text tone="subtle" variant="footnote">
          Gerado em {formatDateBR(data.generatedAt)}
        </Text>
      ) : null}
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

  const periodIndex = Math.max(
    0,
    PERIODS.findIndex((option) => option.value === period),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={pulling} tintColor={colors.orange} />}
      style={styles.screen}
    >
      <Text tone="muted" variant="callout">
        Desempenho da oficina e insights de mercado
      </Text>
      <Segmented
        onChange={(index) => setPeriod(PERIODS[index].value)}
        selectedIndex={periodIndex}
        values={PERIODS.map((option) => option.label)}
      />
      <MetricsSection period={period} />
      <SectionTitle icon="sparkles">Insights de mercado</SectionTitle>
      <InsightsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 20, paddingBottom: 48 },
  metrics: { flexDirection: "row", gap: 12 },
  metricCard: { flex: 1, gap: 6, minHeight: 128 },
  metricIcon: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.control,
    height: 40,
    justifyContent: "center",
    marginBottom: 4,
    width: 40,
  },
  metricValue: { fontVariant: ["tabular-nums"] },
  listCard: { gap: 14 },
  barRow: { gap: 6 },
  barHead: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  barLabel: { flex: 1 },
  barTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 6, height: 12, overflow: "hidden" },
  bar: { backgroundColor: colors.orange, borderRadius: 6, height: "100%" },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 10 },
  insightCard: { gap: 10 },
  insightTitleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  insightIcon: { alignItems: "center", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  insightTitleText: { flex: 1 },
  productRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  rank: {
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  productCopy: { flex: 1, gap: 2 },
  productPrice: { maxWidth: 130 },
  limitations: { gap: 4 },
});
