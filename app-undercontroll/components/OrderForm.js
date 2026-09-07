import { useEffect, useState } from "react";
import {
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
  return (
    <View style={styles.chevronBox}>
      <View
        style={[styles.chevronLeft, direction === "up" && styles.chevronUpLeft]}
      />
      <View
        style={[
          styles.chevronRight,
          direction === "up" && styles.chevronUpRight,
        ]}
      />
    </View>
  );
}

function getStatusColor(status) {
  return status === "Concluído" ? "#25cf79" : status === "Pendente" ? "#f2c94c" : "#f2994a";
}

function SelectField({ label, value, options, onSelect, dark, statusIndicator }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.fieldBox, dark && styles.darkSelect]}
      >
        <View style={styles.selectValueRow}>
          {statusIndicator && <View style={[styles.statusDot, { backgroundColor: getStatusColor(value) }]} />}
          <Text style={[styles.fieldValue, dark && styles.darkSelectValue]}>{value}</Text>
        </View>
        <Chevron direction={open ? "up" : "down"} />
      </Pressable>
      {open && (
        <View style={[styles.options, dark && styles.darkOptions]}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.optionContent}>
                {statusIndicator && <View style={[styles.statusDot, { backgroundColor: getStatusColor(option) }]} />}
                <Text style={[styles.optionText, dark && styles.darkOptionText]}>{option}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  editable = true,
  select,
  options,
  onSelect,
  audio,
  onAudioPress,
}) {
  if (select)
    return (
      <SelectField
        label={label}
        onSelect={onSelect || (() => {})}
        options={options}
        value={value}
      />
    );
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, multiline && styles.multiline, audio && styles.audioFieldBox]}>
        <TextInput
          editable={editable}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#667994"
          style={[styles.fieldValue, audio && styles.audioFieldValue]}
          value={value}
        />
        {audio && <Pressable accessibilityLabel="Gravar áudio" onPress={onAudioPress} style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}><Feather color="#667994" name="mic" size={18} /></Pressable>}
      </View>
    </View>
  );
}

function Summary({ label, value, total, red }) {
  return (
    <View style={styles.summary}>
      <Text style={[styles.summaryLabel, total && styles.strong]}>{label}</Text>
      <Text
        style={[styles.summaryValue, total && styles.total, red && styles.red]}
      >
        {value}
      </Text>
    </View>
  );
}

function createDevice(id) {
  return { id, appliance: "Cafeteira", brand: "Dolce Gusto", model: "Genio II", voltage: "127V", serial: "428731904BRG", labor: 40 };
}

function createPart(id) {
  return { id, name: "Placa eletrônica", quantity: 1, price: "R$ 89,90" };
}

function formatCurrency(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export default function OrderForm({ edit, orderId }) {
  const [status, setStatus] = useState("Concluído");
  const [collapsedDevices, setCollapsedDevices] = useState({});
  const [feedback, setFeedback] = useState("");
  const [client, setClient] = useState("Otávio Silva");
  const [note, setNote] = useState("");
  const [technicalNote, setTechnicalNote] = useState("");
  const [devices, setDevices] = useState([createDevice(1)]);
  const [parts, setParts] = useState([createPart(1)]);
  const laborSubtotal = devices.reduce((total, device) => total + device.labor, 0);
  const partsSubtotal = parts.length * 89.9;
  const orderTotal = laborSubtotal + partsSubtotal;

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  function addDevice() {
    setDevices((current) => [...current, createDevice(current.length + 1)]);
    setFeedback("Novo aparelho adicionado.");
  }

  function addPart() {
    setParts((current) => [...current, createPart(current.length + 1)]);
    setFeedback("Nova peça adicionada ao orçamento.");
  }

  function toggleDevice(id) {
    setCollapsedDevices((current) => ({ ...current, [id]: !current[id] }));
  }

  function recordNote(setter) {
    setter((value) => value || "Áudio gravado: descreva os detalhes aqui.");
  }

  return (
    <AppShell>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {edit
            ? `Editar Ordem de Serviço #${orderId}`
            : "Nova Ordem de Serviço"}
        </Text>
        {edit && <Text style={styles.badge}>Edição</Text>}
        <Pressable
          accessibilityLabel="Fechar ordem de serviço"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {edit && (
          <Section title="Status da Ordem">
            <SelectField
              dark
              label=""
              onSelect={setStatus}
              options={["Pendente", "Em análise", "Concluído"]}
              statusIndicator
              value={status}
            />
          </Section>
        )}
        <Section title={edit ? "Dados do Cliente" : "Cliente"}>
          <Field
            label={edit ? "Nome" : "Cliente"}
            onChangeText={setClient}
            value={client}
          />
          <View style={styles.columns}>
            <Field label="CPF" value="Não Informado" />
            <Field label="Telefone" value="(11) 98765-3224" />
          </View>
          <Field label="Email" value="otavio.silva@email.com" />
        </Section>
        <Section action="＋ Adicionar" onAction={addDevice} title="Aparelhos">
          {devices.map((device, index) => {
            const isCollapsed = collapsedDevices[device.id];
            return <View key={device.id} style={styles.deviceCard}>
              <Pressable onPress={() => toggleDevice(device.id)} style={styles.deviceHeading}>
                <Text style={styles.deviceTitle}>Aparelho {index + 1}</Text>
                <Chevron direction={isCollapsed ? "down" : "up"} />
              </Pressable>
              {!isCollapsed && <>
                <Field label="Aparelho" options={["Cafeteira", "Liquidificador", "Batedeira", "Microondas"]} select value={device.appliance} />
                <View style={styles.columns}><Field label="Marca" value={device.brand} /><Field label="Modelo" value={device.model} /></View>
                <View style={styles.columns}><Field label="Voltagem" options={["127V", "220V"]} select value={device.voltage} /><Field label="Nº de Série" value={device.serial} /></View>
                <Field label="Valor Mão de Obra (R$)" value={formatCurrency(device.labor)} />
                <Field label="Problema Relatado pelo Cliente" multiline value="Máquina não liga e apresenta luz vermelha piscando. Cliente relata que o problema começou após queda de energia." />
              </>}
            </View>;
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
        <Section
          action="＋ Adicionar"
          onAction={addPart}
          title="Peças Utilizadas"
        >
          <Text style={styles.subheading}>Peças do Estoque</Text>
          {parts.map((part, index) => <View key={part.id} style={styles.part}>
            <View style={styles.partTop}><Text style={styles.partName}>{part.name} {index + 1}</Text><Text style={styles.quantity}>Qtd: {part.quantity}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Valor Unitário</Text><Text style={styles.price}>{part.price}</Text></View>
          </View>)}
          <Summary label="Subtotal de Peças" value={formatCurrency(partsSubtotal)} />
        </Section>
        <Section title="Garantia e Desconto">
          <View style={styles.columns}>
            <Field
              label="Garantia"
              options={["30 dias", "60 dias", "90 dias"]}
              select
              value="90 dias"
            />
            <Field label="Desconto" value="R$ 0,00" />
          </View>
        </Section>
        <Section highlight title="Resumo Financeiro">
          <Summary label="Valor da Mão de Obra" value={formatCurrency(laborSubtotal)} />
          <Summary label="Valor das Peças" value={formatCurrency(partsSubtotal)} />
          <Summary label="Desconto" value="- R$ 0,00" red />
          <View style={styles.rule} />
          <Summary label="Valor Total da OS" value={formatCurrency(orderTotal)} total />
        </Section>
        <Section title="Datas">
          <Field label="Data de Recebimento" value="26/08/2026" />
          <Field label="Data de Retirada" value="05/09/2026" />
        </Section>
      </ScrollView>
      {!!feedback && (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/orders")}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveText}>
            {edit ? "Salvar Alterações" : "Criar OS"}
          </Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: "#092542",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 76,
    paddingHorizontal: 58,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  closeButton: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    width: 56,
  },
  close: { color: "#fff", fontSize: 40, lineHeight: 44 },
  badge: {
    backgroundColor: "#0645b4",
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 16,
    padding: 8,
  },
  content: { padding: 20, paddingBottom: 125 },
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
  fieldValue: { color: "#092542", flex: 1, fontSize: 15, paddingVertical: 10 },
  audioFieldBox: { backgroundColor: "#f4f7fb", borderColor: "#dce4ee", minHeight: 112, paddingBottom: 0, paddingTop: 10 },
  audioFieldValue: { color: "#667994", minHeight: 80, textAlignVertical: "top" },
  audioButton: { alignItems: "center", backgroundColor: "#ffffff", borderColor: "#dce4ee", borderRadius: 14, borderWidth: 2, height: 56, justifyContent: "center", marginLeft: 10, marginTop: 2, width: 56 },
  selectValueRow: { alignItems: "center", flex: 1, flexDirection: "row" },
  statusDot: { borderRadius: 6, height: 12, marginRight: 10, width: 12 },
  multiline: { alignItems: "flex-start", minHeight: 108 },
  options: {
    backgroundColor: "#fff",
    borderColor: "#dce4ee",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 4,
    marginTop: 4,
    overflow: "hidden",
    shadowColor: "#092542",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  option: {
    borderBottomColor: "#eef2f6",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  optionContent: { alignItems: "center", flexDirection: "row" },
  optionPressed: { backgroundColor: "#f4f7fb" },
  optionText: { color: "#092542", fontSize: 15 },
  darkSelect: { backgroundColor: "#092542", borderColor: "#092542" },
  darkSelectValue: { color: "#fff", fontWeight: "800" },
  darkOptions: { backgroundColor: "#092542", borderColor: "#274563" },
  darkOptionText: { color: "#fff" },
  chevronBox: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 28,
  },
  chevronLeft: {
    backgroundColor: "#667994",
    height: 3,
    left: 4,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    width: 13,
  },
  chevronRight: {
    backgroundColor: "#667994",
    height: 3,
    position: "absolute",
    right: 2,
    transform: [{ rotate: "-45deg" }],
    width: 13,
  },
  chevronUpLeft: { transform: [{ rotate: "-45deg" }] },
  chevronUpRight: { transform: [{ rotate: "45deg" }] },
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
  status: {
    alignItems: "center",
    backgroundColor: "#092542",
    borderRadius: 14,
    flexDirection: "row",
    padding: 18,
  },
  dot: { color: "#25cf79", fontSize: 18, marginRight: 12 },
  statusText: { color: "#fff", flex: 1, fontSize: 17, fontWeight: "800" },
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
  },
  partName: { color: "#092542", fontSize: 16, fontWeight: "800" },
  quantity: {
    backgroundColor: "#092542",
    borderRadius: 6,
    color: "#fff",
    fontWeight: "800",
    padding: 8,
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
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
