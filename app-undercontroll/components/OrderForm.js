import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router, useFocusEffect } from "expo-router";
import { useTabBarVisibility } from "../contexts/TabBarVisibilityContext";
import useVoiceNote from "../hooks/useVoiceNote";
import AppShell from "./AppShell";
import DateField from "./DateField";
import NativeSelect from "./NativeSelect";
import ScreenHeader from "./ScreenHeader";
import SearchSheet from "./SearchSheet";
import VoiceNoteField from "./VoiceNoteField";
import { getAxiosErrorMessage } from "../providers/api";
import { componentService } from "../services/ComponentService";
import { demandService } from "../services/DemandService";
import { orderService } from "../services/OrderService";
import { userService } from "../services/UserService";
import {
  ORDER_STATUS_API,
  ORDER_STATUS_LABEL,
  formatCurrency,
  formatDateBR,
  formatUserName,
} from "../utils/orders";

const STEP_COUNT = 3;

function Section({ title, action, onAction, children, highlight }) {
  return (
    <View style={[styles.section, highlight && styles.highlight]}>
      {title ? (
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {action ? (
            <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, editable = true, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, !editable && styles.readonlyBox]}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667994"
          style={styles.fieldValue}
          value={value}
        />
      </View>
    </View>
  );
}

function Summary({ label, value, total, red }) {
  return (
    <View style={styles.summary}>
      <Text style={[styles.summaryLabel, total && styles.strong]}>{label}</Text>
      <Text style={[styles.summaryValue, total && styles.total, red && styles.red]}>{value}</Text>
    </View>
  );
}

function emptyDevice() {
  return {
    key: `device-${Date.now()}-${Math.random()}`,
    appliance: "",
    brand: "",
    model: "",
    voltage: "127V",
    serial: "",
    labor: 0,
  };
}

function todayBR(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateBR(date);
}

function matchesClient(client, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const digits = query.replace(/\D/g, "");
  const fullName = `${client.name || ""} ${client.lastName || ""}`.toLowerCase();
  const email = (client.email || "").toLowerCase();
  const phone = (client.phone || "").replace(/\D/g, "");
  const cpf = (client.cpf || "").replace(/\D/g, "");
  return (
    fullName.includes(text) ||
    email.includes(text) ||
    (!!digits && (phone.includes(digits) || cpf.includes(digits)))
  );
}

function matchesComponent(component, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const haystack = `${component.item || ""} ${component.description || ""} ${component.brand || ""}`.toLowerCase();
  return haystack.includes(text);
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(",", ".").replace(/[^\d.]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function displayContact(value, fallback = "Não informado") {
  return value?.trim() ? value : fallback;
}

function deviceSummary(device) {
  const label = [device.appliance, device.brand, device.model].filter(Boolean).join(" ");
  if (!label) return "Novo aparelho";
  return device.voltage ? `${label} · ${device.voltage}` : label;
}

export default function OrderForm({ edit, orderId }) {
  const { setHidden } = useTabBarVisibility();
  const voice = useVoiceNote({ edit, orderId });
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("Pendente");
  const [collapsedDevices, setCollapsedDevices] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(!!edit);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [components, setComponents] = useState([]);
  const [partSheetOpen, setPartSheetOpen] = useState(false);
  const [partQuery, setPartQuery] = useState("");
  const [note, setNote] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [devices, setDevices] = useState([emptyDevice()]);
  const [parts, setParts] = useState([]);
  const [warranty, setWarranty] = useState("90 dias");
  const [discount, setDiscount] = useState("0");
  const [receivedAt, setReceivedAt] = useState(todayBR());
  const [deadline, setDeadline] = useState(todayBR(7));

  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );

  const laborSubtotal = devices.reduce((total, device) => total + parseNumber(device.labor), 0);
  const partsSubtotal = parts.reduce((total, part) => total + parseNumber(part.price) * (Number(part.quantity) || 0), 0);
  const discountValue = parseNumber(discount);
  const orderTotal = laborSubtotal + partsSubtotal - discountValue;

  const clientResults = useMemo(
    () =>
      clients
        .filter((client) => matchesClient(client, clientQuery))
        .slice(0, 20)
        .map((client) => ({
          key: String(client.id),
          title: formatUserName(client),
          meta: `${displayContact(client.cpf, "CPF não informado")} · ${displayContact(client.phone)}`,
          client,
        })),
    [clientQuery, clients],
  );

  const partResults = useMemo(
    () =>
      components
        .filter((component) => matchesComponent(component, partQuery))
        .slice(0, 20)
        .map((component) => ({
          key: String(component.id),
          title: component.item,
          meta: `${formatCurrency(component.price)} · Estoque: ${component.quantity ?? 0}`,
          component,
        })),
    [partQuery, components],
  );

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (voice.patchWarning) setFeedback(voice.patchWarning);
  }, [voice.patchWarning]);

  useEffect(() => {
    let active = true;

    async function loadLookups() {
      try {
        const [customers, stock] = await Promise.all([userService.getCustomers(), componentService.list()]);
        if (!active) return;
        setClients(customers);
        setComponents(stock);
      } catch (error) {
        if (active) setFeedback(getAxiosErrorMessage(error));
      }
    }

    loadLookups();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!edit || !orderId) return undefined;
    let active = true;

    async function loadOrder() {
      try {
        setLoading(true);
        const [order, demands] = await Promise.all([
          orderService.getById(orderId),
          demandService.list(orderId).catch(() => []),
        ]);
        if (!active) return;

        const client = order.user ?? null;
        setSelectedClient(client);
        setStatus(ORDER_STATUS_LABEL[order.status] || "Pendente");
        setNote(order.customerDescription || "");
        setTechnicalNote(order.technicalDescription || "");
        setDiscount(String(order.discount ?? 0));
        setReceivedAt(formatDateBR(order.receivedAt) || todayBR());
        setDeadline(formatDateBR(order.deadline) || todayBR(7));

        const loadedDevices = (order.appliances ?? []).map((item) => ({
          key: `device-${item.id ?? Date.now()}`,
          id: item.id,
          appliance: item.type || "",
          brand: item.brand || "",
          model: item.model || "",
          voltage: item.volt || "127V",
          serial: item.series || "",
          labor: item.laborValue ?? 0,
        }));
        const nextDevices = loadedDevices.length ? loadedDevices : [emptyDevice()];
        setDevices(nextDevices);
        setCollapsedDevices(Object.fromEntries(nextDevices.map((device) => [device.key, true])));

        const quantityByComponent = Object.fromEntries(
          (demands ?? []).map((demand) => [String(demand.componentId), demand.quantity]),
        );
        setParts(
          (order.parts ?? []).map((part) => ({
            key: `part-${part.id}`,
            componentId: part.id,
            name: part.item || part.description || "",
            quantity: Number(quantityByComponent[String(part.id)] ?? 1),
            price: part.price ?? 0,
          })),
        );
      } catch (error) {
        if (active) setFeedback(getAxiosErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      active = false;
    };
  }, [edit, orderId]);

  function updateDevice(key, field, value) {
    setDevices((current) => current.map((device) => (device.key === key ? { ...device, [field]: value } : device)));
  }

  function addDevice() {
    const next = emptyDevice();
    setDevices((current) => {
      setCollapsedDevices(Object.fromEntries([...current.map((device) => [device.key, true]), [next.key, false]]));
      return [...current, next];
    });
    setFeedback("Novo aparelho adicionado.");
  }

  function addComponent(item) {
    const component = item.component;
    setParts((current) => {
      const existing = current.find((part) => part.componentId === component.id);
      if (existing) {
        return current.map((part) =>
          part.componentId === component.id
            ? { ...part, quantity: Number(part.quantity || 1) + 1 }
            : part,
        );
      }
      return [
        ...current,
        {
          key: `part-${component.id}-${Date.now()}`,
          componentId: component.id,
          name: component.item || "",
          quantity: 1,
          price: component.price ?? 0,
        },
      ];
    });
    setPartSheetOpen(false);
    setPartQuery("");
    setFeedback("Peça adicionada ao orçamento.");
  }

  function changePartQuantity(key, delta) {
    setParts((current) =>
      current.map((part) => {
        if (part.key !== key) return part;
        return { ...part, quantity: Math.max(1, Number(part.quantity || 1) + delta) };
      }),
    );
  }

  function removePart(key) {
    setParts((current) => current.filter((part) => part.key !== key));
  }

  function removeDevice(key) {
    setDevices((current) => {
      const remaining = current.filter((device) => device.key !== key);
      const next = remaining.length ? remaining : [emptyDevice()];
      setCollapsedDevices((collapsed) => {
        const copy = { ...collapsed };
        delete copy[key];
        if (!remaining.length) copy[next[0].key] = false;
        return copy;
      });
      return next;
    });
  }

  function toggleDevice(key) {
    setCollapsedDevices((current) => ({ ...current, [key]: !current[key] }));
  }

  function selectClient(item) {
    setSelectedClient(item.client);
    setClientSheetOpen(false);
    setClientQuery("");
  }

  function canAdvance() {
    if (step === 0 && !selectedClient?.id) {
      setFeedback("Selecione um cliente da lista.");
      return false;
    }
    if (step === 0 && !devices.some((device) => device.appliance.trim())) {
      setFeedback("Adicione pelo menos um aparelho.");
      return false;
    }
    return true;
  }

  function goNext() {
    if (!canAdvance()) return;
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }

  async function handleSave() {
    if (saving) return;
    if (!selectedClient?.id) {
      setFeedback("Selecione um cliente da lista.");
      return;
    }
    const validDevices = devices.filter((device) => device.appliance.trim());
    if (!validDevices.length) {
      setFeedback("Adicione pelo menos um aparelho.");
      return;
    }

    const partsPayload = parts
      .filter((part) => part.componentId && Number(part.quantity) > 0)
      .map((part) => ({
        componentId: part.componentId,
        quantity: Number(part.quantity) || 1,
      }));

    setSaving(true);
    try {
      if (edit) {
        await orderService.update(orderId, {
          status: ORDER_STATUS_API[status] || "PENDING",
          appliances: validDevices.map((device) => ({
            id: device.id,
            type: device.appliance,
            brand: device.brand,
            model: device.model,
            volt: device.voltage,
            series: device.serial,
            laborValue: parseNumber(device.labor),
          })),
          parts: partsPayload,
          customerDescription: note,
          technicalDescription: technicalNote,
        });
      } else {
        await orderService.create({
          userId: selectedClient.id,
          appliances: validDevices.map((device) => ({
            type: device.appliance,
            brand: device.brand,
            model: device.model,
            voltage: device.voltage,
            serial: device.serial,
            laborValue: parseNumber(device.labor),
          })),
          parts: partsPayload,
          discount: discountValue,
          receivedAt,
          deadline,
          customerDescription: note,
          technicalDescription: technicalNote,
          status: "PENDING",
          returnGuarantee: Boolean(warranty),
          fabricGuarantee: false,
        });
      }
      router.replace("/orders");
    } catch (error) {
      setFeedback(getAxiosErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function setCompleted(next) {
    const previous = status;
    const nextStatus = next ? "Concluído" : "Pendente";
    setStatus(nextStatus);
    if (!edit || !orderId) return;
    try {
      await orderService.update(orderId, { status: ORDER_STATUS_API[nextStatus] });
    } catch (error) {
      setStatus(previous);
      setFeedback(getAxiosErrorMessage(error));
    }
  }

  const completed = status === "Concluído" || status === "Entregue";
  const showIntake = edit || step === 0;
  const showNotes = edit || step === 1;
  const showBudget = edit || step === 2;

  const clientSection = (
    <Section title={edit ? "Cliente" : "Cliente"}>
      {selectedClient ? (
        <View style={styles.clientCard}>
          <View style={styles.clientCopy}>
            <Text style={styles.clientName}>{formatUserName(selectedClient)}</Text>
            <Text style={styles.clientMeta}>{displayContact(selectedClient.phone)}</Text>
            <Text style={styles.clientMeta}>
              {displayContact(selectedClient.cpf, "CPF não informado")}
              {selectedClient.email ? ` · ${selectedClient.email}` : ""}
            </Text>
          </View>
          {!edit ? (
            <Pressable onPress={() => setClientSheetOpen(true)} style={({ pressed }) => [styles.changeClient, pressed && styles.pressed]}>
              <Text style={styles.changeClientText}>Trocar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={() => setClientSheetOpen(true)} style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}>
          <Feather color="#ef7f19" name="search" size={18} />
          <Text style={styles.selectButtonText}>Selecionar cliente</Text>
        </Pressable>
      )}
    </Section>
  );

  const devicesSection = (
    <Section action="Adicionar" onAction={addDevice} title="Aparelhos">
      {devices.map((device) => {
        const isCollapsed = Boolean(collapsedDevices[device.key]);
        return (
          <View key={device.key} style={styles.deviceCard}>
            <View style={styles.deviceHeading}>
              <Pressable onPress={() => toggleDevice(device.key)} style={styles.deviceToggle}>
                <Text style={styles.deviceTitle}>{deviceSummary(device)}</Text>
                <Feather color="#667994" name={isCollapsed ? "chevron-down" : "chevron-up"} size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="Remover aparelho"
                hitSlop={8}
                onPress={() => removeDevice(device.key)}
                style={styles.iconButton}
              >
                <Feather color="#d71929" name="trash-2" size={18} />
              </Pressable>
            </View>
            {!isCollapsed ? (
              <>
                <Field
                  label="Aparelho"
                  onChangeText={(value) => updateDevice(device.key, "appliance", value)}
                  placeholder="Tipo do aparelho"
                  value={device.appliance}
                />
                <Field label="Marca" onChangeText={(value) => updateDevice(device.key, "brand", value)} value={device.brand} />
                <Field label="Modelo" onChangeText={(value) => updateDevice(device.key, "model", value)} value={device.model} />
                <NativeSelect
                  label="Voltagem"
                  onSelect={(value) => updateDevice(device.key, "voltage", value)}
                  options={["127V", "220V"]}
                  value={device.voltage}
                />
                <Field label="Nº de Série" onChangeText={(value) => updateDevice(device.key, "serial", value)} value={device.serial} />
                <Field
                  keyboardType="decimal-pad"
                  label="Valor Mão de Obra (R$)"
                  onChangeText={(value) => updateDevice(device.key, "labor", value)}
                  value={String(device.labor ?? "")}
                />
              </>
            ) : null}
          </View>
        );
      })}
      <Summary label="Subtotal de mão de obra" value={formatCurrency(laborSubtotal)} />
    </Section>
  );

  const notesSection = (
    <>
      <Section title="Observações do cliente">
        <VoiceNoteField
          label="Informações adicionais"
          onCancel={voice.cancel}
          onChangeText={setNote}
          onDraftChange={voice.setDraftText}
          onInsert={voice.applyInsert}
          onRecord={() => voice.start("customer", { patchKey: "customerDescription", setValue: setNote })}
          onReplace={voice.applyReplace}
          onRerecord={voice.rerecord}
          onStart={voice.record}
          onStop={voice.stop}
          onTranscribe={voice.transcribe}
          onUse={voice.applyUse}
          placeholder="Digite ou grave um áudio"
          state={voice.stateFor("customer")}
          value={note}
        />
      </Section>
      <Section title="Observações técnicas">
        <VoiceNoteField
          label="Laudo / instruções internas"
          onCancel={voice.cancel}
          onChangeText={setTechnicalNote}
          onDraftChange={voice.setDraftText}
          onInsert={voice.applyInsert}
          onRecord={() => voice.start("technical", { patchKey: "technicalDescription", setValue: setTechnicalNote })}
          onReplace={voice.applyReplace}
          onRerecord={voice.rerecord}
          onStart={voice.record}
          onStop={voice.stop}
          onTranscribe={voice.transcribe}
          onUse={voice.applyUse}
          placeholder="Digite ou grave um áudio"
          state={voice.stateFor("technical")}
          value={technicalNote}
        />
      </Section>
    </>
  );

  const budgetSection = (
    <>
      <Section action="Adicionar" onAction={() => setPartSheetOpen(true)} title="Peças">
        {parts.length === 0 ? <Text style={styles.emptyParts}>Nenhuma peça selecionada.</Text> : null}
        {parts.map((part) => (
          <View key={part.key} style={styles.part}>
            <View style={styles.partHead}>
              <Text style={styles.partName}>{part.name}</Text>
              <Pressable accessibilityLabel="Remover peça" hitSlop={8} onPress={() => removePart(part.key)}>
                <Feather color="#d71929" name="trash-2" size={18} />
              </Pressable>
            </View>
            <View style={styles.partRow}>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityLabel="Diminuir quantidade"
                  onPress={() => changePartQuantity(part.key, -1)}
                  style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                >
                  <Feather color="#092542" name="minus" size={16} />
                </Pressable>
                <Text style={styles.stepperValue}>{part.quantity}</Text>
                <Pressable
                  accessibilityLabel="Aumentar quantidade"
                  onPress={() => changePartQuantity(part.key, 1)}
                  style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                >
                  <Feather color="#092542" name="plus" size={16} />
                </Pressable>
              </View>
              <Text style={styles.price}>{formatCurrency(part.price)}</Text>
            </View>
          </View>
        ))}
        <Summary label="Subtotal de peças" value={formatCurrency(partsSubtotal)} />
      </Section>
      <Section title="Garantia e desconto">
        <NativeSelect label="Garantia" onSelect={setWarranty} options={["30 dias", "60 dias", "90 dias"]} value={warranty} />
        <Field keyboardType="decimal-pad" label="Desconto" onChangeText={setDiscount} value={discount} />
      </Section>
      <Section title="Datas">
        <DateField label="Data de recebimento" onChange={setReceivedAt} value={receivedAt} />
        <DateField label="Data de retirada" onChange={setDeadline} value={deadline} />
      </Section>
      <Section highlight title="Resumo">
        <Summary label="Mão de obra" value={formatCurrency(laborSubtotal)} />
        <Summary label="Peças" value={formatCurrency(partsSubtotal)} />
        <Summary label="Desconto" red value={`- ${formatCurrency(discountValue)}`} />
        <View style={styles.rule} />
        <Summary label="Total da OS" total value={formatCurrency(orderTotal)} />
      </Section>
    </>
  );

  const secondaryLabel = edit || step === 0 ? "Cancelar" : "Voltar";
  const primaryLabel = saving
    ? "Salvando..."
    : edit
      ? "Salvar alterações"
      : step === STEP_COUNT - 1
        ? "Criar OS"
        : "Continuar";

  function onSecondary() {
    if (!edit && step > 0) {
      setStep((current) => current - 1);
      return;
    }
    router.back();
  }

  function onPrimary() {
    if (!edit && step < STEP_COUNT - 1) {
      goNext();
      return;
    }
    handleSave();
  }

  return (
    <AppShell>
      <ScreenHeader
        badge={edit ? "Edição" : `${step + 1}/${STEP_COUNT}`}
        closeLabel="Fechar ordem de serviço"
        onClose={() => router.back()}
        title={edit ? `OS #${orderId}` : "Nova OS"}
      />
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#ef7f19" />
          <Text style={styles.loadingText}>Carregando ordem...</Text>
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
                  value={completed}
                />
              </View>
            </Section>
          ) : null}
          {showIntake ? (
            <>
              {clientSection}
              {devicesSection}
            </>
          ) : null}
          {showNotes ? notesSection : null}
          {showBudget ? budgetSection : null}
        </ScrollView>
      )}
      {!!feedback && (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Pressable onPress={onSecondary} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
          <Text style={styles.cancelText}>{secondaryLabel}</Text>
        </Pressable>
        <Pressable
          disabled={saving || loading}
          onPress={onPrimary}
          style={({ pressed }) => [styles.saveButton, (saving || loading) && styles.saveDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>{primaryLabel}</Text>
        </Pressable>
      </View>
      <SearchSheet
        emptyText="Nenhum cliente encontrado."
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
        emptyText="Nenhum componente encontrado."
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
  loadingBox: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: { color: "#667994", fontSize: 15, marginTop: 12 },
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
  section: {
    borderColor: "#dce4ee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  highlight: { borderColor: "#ef7f19", borderLeftWidth: 6 },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#092542",
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  action: { backgroundColor: "#fff0e6", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionText: { color: "#ef7f19", fontSize: 13, fontWeight: "700" },
  field: { marginBottom: 12 },
  fieldLabel: { color: "#667994", fontSize: 13, marginBottom: 6 },
  fieldBox: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  readonlyBox: { backgroundColor: "#f4f7fb" },
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
  clientCard: {
    alignItems: "flex-start",
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    flexDirection: "row",
    padding: 12,
  },
  clientCopy: { flex: 1, paddingRight: 8 },
  clientName: { color: "#092542", fontSize: 16, fontWeight: "800" },
  clientMeta: { color: "#667994", fontSize: 13, marginTop: 4 },
  changeClient: { paddingVertical: 4 },
  changeClientText: { color: "#ef7f19", fontSize: 14, fontWeight: "700" },
  selectButton: {
    alignItems: "center",
    borderColor: "#ef7f19",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  selectButtonText: { color: "#ef7f19", fontSize: 15, fontWeight: "700" },
  deviceCard: { borderBottomColor: "#eef2f6", borderBottomWidth: 1, marginBottom: 12, paddingBottom: 4 },
  deviceHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  deviceToggle: { alignItems: "center", flex: 1, flexDirection: "row", paddingRight: 8 },
  deviceTitle: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "700", paddingRight: 8 },
  completeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  completeCopy: { flex: 1 },
  completeTitle: { color: "#092542", fontSize: 16, fontWeight: "800" },
  completeMeta: { color: "#667994", fontSize: 13, marginTop: 4 },
  iconButton: { padding: 4 },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  summaryLabel: { color: "#667994", flexShrink: 1, fontSize: 14, fontWeight: "700" },
  summaryValue: { color: "#ef7f19", fontSize: 15, fontWeight: "800" },
  strong: { color: "#092542", fontWeight: "800" },
  total: { color: "#092542", fontSize: 18 },
  red: { color: "#ef4b43" },
  emptyParts: { color: "#667994", fontSize: 14, marginBottom: 8 },
  part: {
    backgroundColor: "#f4f7fb",
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
  },
  partName: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "700", paddingRight: 8 },
  partHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  partRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  stepper: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
  },
  stepperButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepperValue: {
    color: "#092542",
    fontSize: 16,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
  price: { color: "#092542", flex: 1, fontSize: 15, fontWeight: "800", textAlign: "right" },
  rule: { backgroundColor: "#dce4ee", height: 1, marginTop: 12 },
  footer: {
    backgroundColor: "#fff",
    borderTopColor: "#dce4ee",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 14,
  },
  cancelText: { color: "#667994", fontSize: 15, fontWeight: "800" },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#ef7f19",
    borderRadius: 24,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 14,
  },
  saveDisabled: { opacity: 0.65 },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
