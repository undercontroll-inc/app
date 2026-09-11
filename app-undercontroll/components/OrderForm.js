import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import AppShell from "./AppShell";
import DateField from "./DateField";
import NativeSelect from "./NativeSelect";
import ScreenHeader from "./ScreenHeader";
import { getAxiosErrorMessage } from "../providers/api";
import { componentService } from "../services/ComponentService";
import { demandService } from "../services/DemandService";
import { orderService } from "../services/OrderService";
import { userService } from "../services/UserService";
import {
  ORDER_STATUS_API,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_OPTIONS,
  formatCurrency,
  formatDateBR,
  formatUserName,
} from "../utils/orders";

function Section({ title, action, onAction, children, highlight }) {
  return (
    <View style={[styles.section, highlight && styles.highlight]}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>{action}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function Chevron({ direction = "down" }) {
  return <Feather color="#667994" name={direction === "up" ? "chevron-up" : "chevron-down"} size={22} />;
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  editable = true,
  audio,
  onAudioPress,
  keyboardType,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, multiline && styles.multiline, audio && styles.audioFieldBox, !editable && styles.readonlyBox]}>
        <TextInput
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667994"
          style={[styles.fieldValue, audio && styles.audioFieldValue]}
          value={value}
        />
        {audio && (
          <Pressable
            accessibilityLabel="Gravar áudio"
            onPress={onAudioPress}
            style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}
          >
            <Feather color="#667994" name="mic" size={18} />
          </Pressable>
        )}
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

function emptyPart() {
  return {
    key: `part-${Date.now()}-${Math.random()}`,
    componentId: null,
    name: "",
    search: "",
    quantity: 1,
    price: 0,
  };
}

function todayBR(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateBR(date);
}

function matchesClient(client, query) {
  const text = query.trim().toLowerCase();
  if (!text) return false;
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

export default function OrderForm({ edit, orderId }) {
  const [status, setStatus] = useState("Pendente");
  const [collapsedDevices, setCollapsedDevices] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(!!edit);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [components, setComponents] = useState([]);
  const [activePartIndex, setActivePartIndex] = useState(null);
  const [note, setNote] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [devices, setDevices] = useState([emptyDevice()]);
  const [parts, setParts] = useState([]);
  const [warranty, setWarranty] = useState("90 dias");
  const [discount, setDiscount] = useState("0");
  const [receivedAt, setReceivedAt] = useState(todayBR());
  const [deadline, setDeadline] = useState(todayBR(7));

  const laborSubtotal = devices.reduce((total, device) => total + parseNumber(device.labor), 0);
  const partsSubtotal = parts.reduce((total, part) => total + parseNumber(part.price) * (Number(part.quantity) || 0), 0);
  const discountValue = parseNumber(discount);
  const orderTotal = laborSubtotal + partsSubtotal - discountValue;

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim() || selectedClient) return [];
    return clients.filter((client) => matchesClient(client, clientSearch)).slice(0, 8);
  }, [clientSearch, clients, selectedClient]);

  const partSuggestions = useMemo(() => {
    if (activePartIndex == null) return [];
    const query = parts[activePartIndex]?.search || "";
    return components.filter((component) => matchesComponent(component, query)).slice(0, 8);
  }, [activePartIndex, parts, components]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    let active = true;

    async function loadLookups() {
      try {
        const [customers, stock] = await Promise.all([
          userService.getCustomers(),
          componentService.list(),
        ]);
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
        setClientSearch(formatUserName(client));
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
        setDevices(loadedDevices.length ? loadedDevices : [emptyDevice()]);

        const quantityByComponent = Object.fromEntries(
          (demands ?? []).map((demand) => [String(demand.componentId), demand.quantity]),
        );
        setParts(
          (order.parts ?? []).map((part) => ({
            key: `part-${part.id}`,
            componentId: part.id,
            name: part.item || part.description || "",
            search: part.item || "",
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

  function updatePart(key, patch) {
    setParts((current) => current.map((part) => (part.key === key ? { ...part, ...patch } : part)));
  }

  function addDevice() {
    setDevices((current) => [...current, emptyDevice()]);
    setFeedback("Novo aparelho adicionado.");
  }

  function addPart() {
    setParts((current) => {
      setActivePartIndex(current.length);
      return [...current, emptyPart()];
    });
    setFeedback("Nova peça adicionada ao orçamento.");
  }

  function toggleDevice(key) {
    setCollapsedDevices((current) => ({ ...current, [key]: !current[key] }));
  }

  function recordNote(setter) {
    setter((value) => value || "Áudio gravado: descreva os detalhes aqui.");
  }

  function selectClient(client) {
    setSelectedClient(client);
    setClientSearch(formatUserName(client));
    setShowClientSuggestions(false);
  }

  function selectComponent(partKey, component, index) {
    updatePart(partKey, {
      componentId: component.id,
      name: component.item || "",
      search: component.item || "",
      price: component.price ?? 0,
    });
    setActivePartIndex(null);
    setFeedback(`Peça ${index + 1} selecionada do estoque.`);
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

  return (
    <AppShell>
      <ScreenHeader
        badge={edit ? "Edição" : undefined}
        closeLabel="Fechar ordem de serviço"
        onClose={() => router.back()}
        title={edit ? `Editar Ordem de Serviço #${orderId}` : "Nova Ordem de Serviço"}
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
          {edit && (
            <Section title="Status da Ordem">
              <NativeSelect
                dark
                onSelect={setStatus}
                options={ORDER_STATUS_OPTIONS}
                statusIndicator
                value={status}
              />
            </Section>
          )}
          <Section title={edit ? "Dados do Cliente" : "Cliente"}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{edit ? "Nome" : "Cliente"}</Text>
              <View style={[styles.fieldBox, edit && styles.readonlyBox]}>
                <TextInput
                  editable={!edit}
                  onChangeText={(value) => {
                    setClientSearch(value);
                    setSelectedClient(null);
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => !edit && setShowClientSuggestions(true)}
                  placeholder="Pesquisar por nome, CPF ou telefone"
                  placeholderTextColor="#667994"
                  style={styles.fieldValue}
                  value={clientSearch}
                />
              </View>
              {showClientSuggestions && filteredClients.length > 0 && (
                <View style={styles.suggestions}>
                  {filteredClients.map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => selectClient(client)}
                      style={({ pressed }) => [styles.suggestion, pressed && styles.optionPressed]}
                    >
                      <Text style={styles.suggestionTitle}>{formatUserName(client)}</Text>
                      <Text style={styles.suggestionMeta}>
                        {displayContact(client.cpf, "CPF não informado")} · {displayContact(client.phone)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.columns}>
              <Field editable={false} label="CPF" value={displayContact(selectedClient?.cpf)} />
              <Field editable={false} label="Telefone" value={displayContact(selectedClient?.phone)} />
            </View>
            <Field editable={false} label="Email" value={displayContact(selectedClient?.email)} />
          </Section>
          <Section action="＋ Adicionar" onAction={addDevice} title="Aparelhos">
            {devices.map((device, index) => {
              const isCollapsed = collapsedDevices[device.key];
              return (
                <View key={device.key} style={styles.deviceCard}>
                  <Pressable onPress={() => toggleDevice(device.key)} style={styles.deviceHeading}>
                    <Text style={styles.deviceTitle}>Aparelho {index + 1}</Text>
                    <Chevron direction={isCollapsed ? "down" : "up"} />
                  </Pressable>
                  {!isCollapsed && (
                    <>
                      <Field
                        label="Aparelho"
                        onChangeText={(value) => updateDevice(device.key, "appliance", value)}
                        placeholder="Tipo do aparelho"
                        value={device.appliance}
                      />
                      <View style={styles.columns}>
                        <Field label="Marca" onChangeText={(value) => updateDevice(device.key, "brand", value)} value={device.brand} />
                        <Field label="Modelo" onChangeText={(value) => updateDevice(device.key, "model", value)} value={device.model} />
                      </View>
                      <View style={styles.columns}>
                        <NativeSelect
                          label="Voltagem"
                          onSelect={(value) => updateDevice(device.key, "voltage", value)}
                          options={["127V", "220V"]}
                          value={device.voltage}
                        />
                        <Field label="Nº de Série" onChangeText={(value) => updateDevice(device.key, "serial", value)} value={device.serial} />
                      </View>
                      <Field
                        keyboardType="decimal-pad"
                        label="Valor Mão de Obra (R$)"
                        onChangeText={(value) => updateDevice(device.key, "labor", value)}
                        value={String(device.labor ?? "")}
                      />
                    </>
                  )}
                </View>
              );
            })}
            <Summary label="Subtotal de Mão-de-Obra" value={formatCurrency(laborSubtotal)} />
          </Section>
          <Section title="Observações do Cliente">
            <Field
              audio
              label="Informações Adicionais"
              multiline
              onChangeText={setNote}
              onAudioPress={() => recordNote(setNote)}
              placeholder="Digite a observação do cliente ou grave um áudio"
              value={note}
            />
          </Section>
          <Section title="Observações Técnicas">
            <Field
              audio
              label="Laudo / Instruções Internas"
              multiline
              onChangeText={setTechnicalNote}
              onAudioPress={() => recordNote(setTechnicalNote)}
              placeholder="Digite uma observação técnica ou grave um áudio"
              value={technicalNote}
            />
          </Section>
          <Section action="＋ Adicionar" onAction={addPart} title="Peças Utilizadas">
            <Text style={styles.subheading}>Peças do Estoque</Text>
            {parts.length === 0 && <Text style={styles.emptyParts}>Nenhuma peça selecionada.</Text>}
            {parts.map((part, index) => (
              <View key={part.key} style={styles.part}>
                <Text style={styles.fieldLabel}>Componente</Text>
                <View style={styles.fieldBox}>
                  <TextInput
                    onChangeText={(value) => {
                      updatePart(part.key, {
                        search: value,
                        name: value,
                        componentId: null,
                      });
                      setActivePartIndex(index);
                    }}
                    onFocus={() => setActivePartIndex(index)}
                    placeholder="Pesquise o componente"
                    placeholderTextColor="#667994"
                    style={styles.fieldValue}
                    value={part.search || part.name}
                  />
                </View>
                {activePartIndex === index && partSuggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    {partSuggestions.map((component) => (
                      <Pressable
                        key={component.id}
                        onPress={() => selectComponent(part.key, component, index)}
                        style={({ pressed }) => [styles.suggestion, pressed && styles.optionPressed]}
                      >
                        <Text style={styles.suggestionTitle}>{component.item}</Text>
                        <Text style={styles.suggestionMeta}>
                          {formatCurrency(component.price)} · Estoque: {component.quantity ?? 0}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {activePartIndex === index && partSuggestions.length === 0 && (
                  <Text style={styles.emptyParts}>Nenhum componente encontrado.</Text>
                )}
                <View style={styles.partTop}>
                  <Text style={styles.quantityLabel}>Qtd</Text>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updatePart(part.key, { quantity: value.replace(/\D/g, "") })}
                    style={styles.quantityInput}
                    value={String(part.quantity ?? "")}
                  />
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Valor Unitário</Text>
                  <Text style={styles.price}>{formatCurrency(part.price)}</Text>
                </View>
              </View>
            ))}
            <Summary label="Subtotal de Peças" value={formatCurrency(partsSubtotal)} />
          </Section>
          <Section title="Garantia e Desconto">
            <View style={styles.columns}>
              <NativeSelect
                label="Garantia"
                onSelect={setWarranty}
                options={["30 dias", "60 dias", "90 dias"]}
                value={warranty}
              />
              <Field
                keyboardType="decimal-pad"
                label="Desconto"
                onChangeText={setDiscount}
                value={discount}
              />
            </View>
          </Section>
          <Section title="Datas">
            <DateField label="Data de Recebimento" onChange={setReceivedAt} value={receivedAt} />
            <DateField label="Data de Retirada" onChange={setDeadline} value={deadline} />
          </Section>
          <Section highlight title="Resumo Financeiro">
            <Summary label="Valor da Mão de Obra" value={formatCurrency(laborSubtotal)} />
            <Summary label="Valor das Peças" value={formatCurrency(partsSubtotal)} />
            <Summary label="Desconto" red value={`- ${formatCurrency(discountValue)}`} />
            <View style={styles.rule} />
            <Summary label="Valor Total da OS" total value={formatCurrency(orderTotal)} />
          </Section>
        </ScrollView>
      )}
      {!!feedback && (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          disabled={saving || loading}
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, (saving || loading) && styles.saveDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>
            {saving ? "Salvando..." : edit ? "Salvar Alterações" : "Criar OS"}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
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
    top: 88,
    shadowColor: "#092542",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  section: {
    borderColor: "#dce4ee",
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 18,
    padding: 20,
  },
  highlight: { borderColor: "#ef7f19", borderLeftWidth: 8 },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#092542",
    flexShrink: 1,
    fontSize: 23,
    fontWeight: "800",
  },
  action: { backgroundColor: "#fff0e6", borderRadius: 10, padding: 10 },
  actionText: { color: "#ef7f19", fontSize: 14, fontWeight: "700" },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  field: { flex: 1, minWidth: 125, marginBottom: 18 },
  fieldLabel: { color: "#667994", fontSize: 14, marginBottom: 8 },
  fieldBox: {
    alignItems: "center",
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 2,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  readonlyBox: { backgroundColor: "#f4f7fb" },
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
  audioFieldBox: { backgroundColor: "#f4f7fb", borderColor: "#dce4ee", minHeight: 112, paddingBottom: 0, paddingTop: 10 },
  audioFieldValue: { color: "#667994", minHeight: 80, textAlignVertical: "top" },
  audioButton: { alignItems: "center", backgroundColor: "#ffffff", borderColor: "#dce4ee", borderRadius: 14, borderWidth: 2, height: 56, justifyContent: "center", marginLeft: 10, marginTop: 2, width: 56 },
  multiline: { alignItems: "flex-start", minHeight: 108 },
  optionPressed: { backgroundColor: "#f4f7fb" },
  suggestions: {
    backgroundColor: "#fff",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 4,
    marginTop: 6,
    overflow: "hidden",
    zIndex: 4,
  },
  suggestion: {
    borderBottomColor: "#eef2f6",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionTitle: { color: "#092542", fontSize: 15, fontWeight: "700" },
  suggestionMeta: { color: "#667994", fontSize: 12, marginTop: 4 },
  deviceCard: { borderBottomColor: "#dce4ee", borderBottomWidth: 1, marginBottom: 18, paddingBottom: 4 },
  deviceHeading: {
    alignItems: "center",
    borderBottomColor: "#dce4ee",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    paddingBottom: 18,
  },
  deviceTitle: { color: "#0841ad", fontSize: 18, fontWeight: "700" },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  summaryLabel: {
    color: "#667994",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryValue: { color: "#ef7f19", fontSize: 16, fontWeight: "800" },
  strong: { color: "#092542", fontWeight: "800" },
  total: { color: "#092542", fontSize: 20 },
  red: { color: "#ef4b43" },
  subheading: {
    color: "#667994",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
  },
  emptyParts: { color: "#667994", fontSize: 14, marginBottom: 8, marginTop: 8 },
  part: {
    backgroundColor: "#f4f7fb",
    borderColor: "#dce4ee",
    borderRadius: 11,
    borderWidth: 2,
    marginBottom: 14,
    padding: 16,
  },
  partTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  quantityLabel: { color: "#667994", fontSize: 15, fontWeight: "700" },
  quantityInput: {
    backgroundColor: "#092542",
    borderRadius: 6,
    color: "#fff",
    fontWeight: "800",
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "center",
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  priceLabel: { color: "#667994", fontSize: 15 },
  price: { color: "#092542", fontSize: 16, fontWeight: "800" },
  rule: { backgroundColor: "#dce4ee", height: 1, marginTop: 18 },
  footer: {
    backgroundColor: "#fff",
    borderTopColor: "#dce4ee",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 20,
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
