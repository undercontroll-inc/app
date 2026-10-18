import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarVisibility } from "../contexts/TabBarVisibilityContext";
import { useComponents } from "../hooks/queries/useComponents";
import { useCustomers } from "../hooks/queries/useCustomers";
import { queryKeys } from "../hooks/queries/keys";
import { useOrder, useOrderDemands, useSaveOrder, useUpdateOrderStatus } from "../hooks/queries/useOrders";
import useOrderForm from "../hooks/useOrderForm";
import useVoiceNote from "../hooks/useVoiceNote";
import { getErrorMessage } from "../providers/api";
import { orderService } from "../services/OrderService";
import { bottomDockPadding } from "../utils/layout";
import { displayContact, matchesClient, matchesComponent } from "../utils/orderForm";
import { ORDER_STATUS_API, formatCurrency, formatUserName, isOrderCompleted } from "../utils/orders";
import AppShell from "./AppShell";
import ScreenHeader from "./ScreenHeader";
import SearchSheet from "./SearchSheet";
import OrderCustomerSection from "./order/OrderCustomerSection";
import OrderDevicesSection from "./order/OrderDevicesSection";
import { Section } from "./order/OrderFormParts";
import OrderNotesSection from "./order/OrderNotesSection";
import OrderPartsSection from "./order/OrderPartsSection";
import OrderTotals from "./order/OrderTotals";

const STEP_COUNT = 3;

const VOICE_PATCH_KEYS = {
  customer: "customerDescription",
  technical: "technicalDescription",
};

export default function OrderForm({ edit, orderId }) {
  const insets = useSafeAreaInsets();
  const { setHidden } = useTabBarVisibility();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [partSheetOpen, setPartSheetOpen] = useState(false);
  const [partQuery, setPartQuery] = useState("");
  const customersQuery = useCustomers();
  const componentsQuery = useComponents();
  const orderQuery = useOrder(orderId, { enabled: !!edit });
  const demandsQuery = useOrderDemands(orderId, { enabled: !!edit });
  const saveOrder = useSaveOrder();
  const updateStatus = useUpdateOrderStatus();
  const orderForm = useOrderForm({ edit: !!edit, order: orderQuery.data, demands: demandsQuery.data });
  const { form, totals, setField } = orderForm;

  const persistVoiceNote = useCallback(
    async (field, value) => {
      await orderService.update(orderId, { [VOICE_PATCH_KEYS[field]]: value });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    [orderId, queryClient],
  );

  const voice = useVoiceNote({
    onApply: orderForm.applyVoiceText,
    persist: edit && orderId ? persistVoiceNote : undefined,
    onWarning: setFeedback,
  });

  const saving = saveOrder.isPending;
  const loading = !!edit && !orderForm.hydrated && !orderQuery.isError;
  const loadError = edit && orderQuery.isError ? getErrorMessage(orderQuery.error) : "";

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const clientResults = useMemo(
    () =>
      (customersQuery.data ?? [])
        .filter((client) => matchesClient(client, clientQuery))
        .slice(0, 20)
        .map((client) => ({
          key: String(client.id),
          title: formatUserName(client),
          meta: `${displayContact(client.cpf, "CPF não informado")} · ${displayContact(client.phone)}`,
          client,
        })),
    [clientQuery, customersQuery.data],
  );

  const partResults = useMemo(
    () =>
      (componentsQuery.data ?? [])
        .filter((component) => matchesComponent(component, partQuery))
        .slice(0, 20)
        .map((component) => ({
          key: String(component.id),
          title: component.item,
          meta: `${formatCurrency(component.price)} · Estoque: ${component.quantity ?? 0}`,
          component,
        })),
    [partQuery, componentsQuery.data],
  );

  function addDevice() {
    orderForm.addDevice();
    setFeedback("Novo aparelho adicionado.");
  }

  function addComponent(item) {
    orderForm.addPart(item.component);
    setPartSheetOpen(false);
    setPartQuery("");
    setFeedback("Peça adicionada ao orçamento.");
  }

  function selectClient(item) {
    setField("client", item.client);
    setClientSheetOpen(false);
    setClientQuery("");
  }

  function handleSave() {
    if (saving) return;
    const error = orderForm.validate();
    if (error) {
      setFeedback(error);
      return;
    }
    saveOrder.mutate(
      { orderId: edit ? orderId : null, payload: orderForm.buildPayload() },
      {
        onSuccess: () => router.replace("/orders"),
        onError: (err) => setFeedback(getErrorMessage(err)),
      },
    );
  }

  function setCompleted(next) {
    const previous = form.status;
    const nextStatus = next ? "Concluído" : "Pendente";
    setField("status", nextStatus);
    if (!edit || !orderId) return;
    updateStatus.mutate(
      { orderId, status: ORDER_STATUS_API[nextStatus] },
      {
        onError: (error) => {
          setField("status", previous);
          setFeedback(getErrorMessage(error));
        },
      },
    );
  }

  function onSecondary() {
    if (!edit && step > 0) {
      setStep((current) => current - 1);
      return;
    }
    router.back();
  }

  function onPrimary() {
    if (!edit && step < STEP_COUNT - 1) {
      const error = step === 0 ? orderForm.validate() : "";
      if (error) {
        setFeedback(error);
        return;
      }
      setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
      return;
    }
    handleSave();
  }

  const showIntake = edit || step === 0;
  const showNotes = edit || step === 1;
  const showBudget = edit || step === 2;
  const secondaryLabel = edit || step === 0 ? "Cancelar" : "Voltar";
  const primaryLabel = saving
    ? "Salvando..."
    : edit
      ? "Salvar alterações"
      : step === STEP_COUNT - 1
        ? "Criar OS"
        : "Continuar";

  return (
    <AppShell>
      <ScreenHeader
        badge={edit ? "Edição" : `${step + 1}/${STEP_COUNT}`}
        closeLabel="Fechar ordem de serviço"
        onClose={() => router.back()}
        title={edit ? `OS #${orderId}` : "Nova OS"}
      />
      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.loadingText}>Carregando ordem...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => orderQuery.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {edit ? (
            <Section>
              <View style={styles.completeRow}>
                <View style={styles.completeCopy}>
                  <Text style={styles.completeTitle}>OS concluída</Text>
                  <Text style={styles.completeMeta}>Marque quando o conserto estiver pronto</Text>
                </View>
                <Switch
                  onValueChange={setCompleted}
                  thumbColor="#ffffff"
                  trackColor={{ false: "#dce4ee", true: "#25cf79" }}
                  value={isOrderCompleted(form.status)}
                />
              </View>
            </Section>
          ) : null}
          {showIntake ? (
            <>
              <OrderCustomerSection client={form.client} editable={!edit} onSelect={() => setClientSheetOpen(true)} />
              <OrderDevicesSection
                collapsed={orderForm.collapsedDevices}
                devices={form.devices}
                laborTotal={totals.labor}
                onAdd={addDevice}
                onChange={orderForm.updateDevice}
                onRemove={orderForm.removeDevice}
                onToggle={orderForm.toggleDevice}
              />
            </>
          ) : null}
          {showNotes ? (
            <OrderNotesSection note={form.note} onChange={setField} technicalNote={form.technicalNote} voice={voice} />
          ) : null}
          {showBudget ? (
            <>
              <OrderPartsSection
                onAdd={() => setPartSheetOpen(true)}
                onChangeQuantity={orderForm.changePartQuantity}
                onRemove={orderForm.removePart}
                parts={form.parts}
                partsTotal={totals.parts}
              />
              <OrderTotals edit={!!edit} form={form} onChange={setField} totals={totals} />
            </>
          ) : null}
        </ScrollView>
      )}
      {!!feedback && (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}
      <View style={[styles.footer, { paddingBottom: bottomDockPadding(insets) }]}>
        <Pressable onPress={onSecondary} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
          <Text style={styles.cancelText}>{secondaryLabel}</Text>
        </Pressable>
        <Pressable
          disabled={saving || loading}
          onPress={onPrimary}
          style={({ pressed }) => [
            styles.saveButton,
            (saving || loading) && styles.saveDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveText}>{primaryLabel}</Text>
        </Pressable>
      </View>
      <SearchSheet
        emptyText={customersQuery.isError ? getErrorMessage(customersQuery.error) : "Nenhum cliente encontrado."}
        onChangeQuery={setClientQuery}
        onClose={() => setClientSheetOpen(false)}
        onSelect={selectClient}
        placeholder="Nome, CPF ou telefone"
        query={clientQuery}
        results={clientResults}
        title="Selecionar cliente"
        visible={clientSheetOpen}
      />
      <SearchSheet
        emptyText={componentsQuery.isError ? getErrorMessage(componentsQuery.error) : "Nenhum componente encontrado."}
        onChangeQuery={setPartQuery}
        onClose={() => {
          setPartSheetOpen(false);
          setPartQuery("");
        }}
        onSelect={addComponent}
        placeholder="Pesquise o componente"
        query={partQuery}
        results={partResults}
        title="Peças do estoque"
        visible={partSheetOpen}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28 },
  stateBox: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#667994", fontSize: 15, marginTop: 12 },
  errorText: { color: "#d71929", fontSize: 15, paddingHorizontal: 24, textAlign: "center" },
  retry: { marginTop: 12, padding: 10 },
  retryText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  toast: {
    alignSelf: "center",
    backgroundColor: "#092542",
    borderRadius: 12,
    elevation: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    position: "absolute",
    top: 64,
    shadowColor: "#092542",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  completeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  completeCopy: { flex: 1 },
  completeTitle: { color: "#092542", fontSize: 16, fontWeight: "800" },
  completeMeta: { color: "#667994", fontSize: 13, marginTop: 4 },
  footer: {
    backgroundColor: "#fff",
    borderTopColor: "#dce4ee",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 30,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  cancelText: { color: "#667994", fontSize: 16, fontWeight: "800" },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 30,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  saveDisabled: { opacity: 0.65 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
