import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useComponents } from "../hooks/queries/useComponents";
import { useCustomers } from "../hooks/queries/useCustomers";
import { queryKeys } from "../hooks/queries/keys";
import { useOrder, useOrderDemands, useSaveOrder, useUpdateOrderStatus } from "../hooks/queries/useOrders";
import useOrderForm from "../hooks/useOrderForm";
import useVoiceNote from "../hooks/useVoiceNote";
import { getErrorMessage } from "../providers/api";
import { orderService } from "../services/OrderService";
import { haptics } from "../utils/haptics";
import { displayContact, matchesClient, matchesComponent } from "../utils/orderForm";
import { ORDER_STATUS_API, formatCurrency, formatUserName, isOrderCompleted } from "../utils/orders";
import SearchSheet from "./SearchSheet";
import Button from "./ui/Button";
import FormScreen from "./ui/FormScreen";
import StepIndicator from "./ui/StepIndicator";
import SwitchRow from "./ui/SwitchRow";
import Text from "./ui/Text";
import { colors, radius, shadowStrong } from "../theme";
import OrderCustomerSection from "./order/OrderCustomerSection";
import OrderDevicesSection from "./order/OrderDevicesSection";
import OrderNotesSection from "./order/OrderNotesSection";
import OrderPartsSection from "./order/OrderPartsSection";
import OrderTotals from "./order/OrderTotals";

const STEPS = ["Cliente e aparelho", "Observações", "Orçamento"];
const STEP_COUNT = STEPS.length;

const VOICE_PATCH_KEYS = {
  customer: "customerDescription",
  technical: "technicalDescription",
};

export default function OrderForm({ edit, orderId }) {
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
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: (err) => {
          haptics.error();
          setFeedback(getErrorMessage(err));
        },
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
        haptics.warning();
        setFeedback(error);
        return;
      }
      haptics.light();
      setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
      return;
    }
    handleSave();
  }

  const showIntake = edit || step === 0;
  const showNotes = edit || step === 1;
  const showBudget = edit || step === 2;
  const showBack = !edit && step > 0;
  const primaryLabel = saving
    ? "Salvando..."
    : edit
      ? "Salvar alterações"
      : step === STEP_COUNT - 1
        ? "Criar OS"
        : "Continuar";

  return (
    <>
      <FormScreen
        footer={
          <View style={styles.footerRow}>
            {showBack ? <Button label="Voltar" onPress={onSecondary} style={styles.back} variant="secondary" /> : null}
            <Button
              disabled={saving || loading}
              label={primaryLabel}
              loading={saving}
              onPress={onPrimary}
              style={styles.primary}
            />
          </View>
        }
        loadError={loadError}
        loading={loading}
        loadingText="Carregando ordem..."
        onCancel={() => router.back()}
        onRetry={orderQuery.refetch}
        title={edit ? `OS #${orderId}` : "Nova ordem"}
      >
        {!edit ? <StepIndicator step={step} steps={STEPS} /> : null}
        {edit ? (
          <View style={styles.completeCard}>
            <SwitchRow
              description="Ative quando o conserto estiver pronto"
              label="OS concluída"
              onValueChange={setCompleted}
              value={isOrderCompleted(form.status)}
            />
          </View>
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
      </FormScreen>
      {feedback ? (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} pointerEvents="none" style={styles.toast}>
          <Text align="center" tone="inverse" variant="subhead" weight="600">
            {feedback}
          </Text>
        </Animated.View>
      ) : null}
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
        emptyText={componentsQuery.isError ? getErrorMessage(componentsQuery.error) : "Nenhuma peça encontrada."}
        onChangeQuery={setPartQuery}
        onClose={() => {
          setPartSheetOpen(false);
          setPartQuery("");
        }}
        onSelect={addComponent}
        placeholder="Buscar peça"
        query={partQuery}
        results={partResults}
        title="Peças do estoque"
        visible={partSheetOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: "row", gap: 10 },
  back: { flex: 0.8 },
  primary: { flex: 1.2 },
  completeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  toast: {
    ...shadowStrong,
    alignSelf: "center",
    backgroundColor: colors.navy,
    borderRadius: 999,
    left: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: "absolute",
    right: 24,
    top: 12,
  },
});
