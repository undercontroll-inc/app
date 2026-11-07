import { useState } from "react";
import { router } from "expo-router";
import Button from "./ui/Button";
import FormScreen from "./ui/FormScreen";
import { FormSection, FormSwitchRow, FormTextRow } from "./ui/FormRows";
import { useCustomer, useSaveCustomer } from "../hooks/queries/useCustomers";
import { getErrorMessage } from "../providers/api";
import { haptics } from "../utils/haptics";

const emptyForm = {
  name: "",
  lastName: "",
  phone: "",
  email: "",
  cpf: "",
  CEP: "",
  address: "",
  number: "",
  hasWhatsApp: false,
};

function toForm(client) {
  return Object.fromEntries(
    Object.entries(emptyForm).map(([field, fallback]) => [
      field,
      field === "number" ? "" : (client?.[field] ?? fallback),
    ]),
  );
}

export default function ClientForm({ edit = false, clientId }) {
  const [form, setForm] = useState(emptyForm);
  const [hydrated, setHydrated] = useState(!edit);
  const [feedback, setFeedback] = useState("");
  const customerQuery = useCustomer(clientId, { enabled: edit });
  const saveCustomer = useSaveCustomer();
  const loading = edit && customerQuery.isPending;
  const loadError = edit && customerQuery.isError ? getErrorMessage(customerQuery.error) : "";

  if (!hydrated && customerQuery.data) {
    setHydrated(true);
    setForm(toForm(customerQuery.data));
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.lastName.trim() || !form.phone.trim()) {
      haptics.warning();
      setFeedback("Preencha nome, sobrenome e telefone.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
      CEP: form.CEP.trim(),
      address: [form.address.trim(), form.number.trim()].filter(Boolean).join(", "),
      hasWhatsApp: form.hasWhatsApp,
      userType: "CUSTOMER",
    };

    setFeedback("");
    saveCustomer.mutate(
      { customerId: edit ? clientId : null, payload },
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

  return (
    <FormScreen
      feedback={feedback}
      footer={
        <Button
          disabled={loading}
          label={edit ? "Salvar alterações" : "Cadastrar cliente"}
          loading={saveCustomer.isPending}
          onPress={handleSubmit}
        />
      }
      loadError={loadError}
      loading={loading}
      loadingText="Carregando cliente..."
      onCancel={() => router.back()}
      onRetry={customerQuery.refetch}
    >
      <FormSection title="Contato">
        <FormTextRow
          autoComplete="given-name"
          autoFocus={!edit}
          label="Nome"
          onChangeText={(value) => updateField("name", value)}
          placeholder="Nome"
          textContentType="givenName"
          value={form.name}
        />
        <FormTextRow
          autoComplete="family-name"
          label="Sobrenome"
          onChangeText={(value) => updateField("lastName", value)}
          placeholder="Sobrenome"
          textContentType="familyName"
          value={form.lastName}
        />
        <FormTextRow
          autoComplete="tel"
          keyboardType="phone-pad"
          label="Telefone"
          onChangeText={(value) => updateField("phone", value)}
          placeholder="(00) 00000-0000"
          textContentType="telephoneNumber"
          value={form.phone}
        />
        <FormSwitchRow
          description="Mostra o atalho para conversar pelo WhatsApp"
          label="Possui WhatsApp"
          onValueChange={(value) => updateField("hasWhatsApp", value)}
          value={form.hasWhatsApp}
        />
      </FormSection>
      <FormSection footer="Opcional" title="Documentos e e-mail">
        <FormTextRow
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="E-mail"
          onChangeText={(value) => updateField("email", value)}
          placeholder="cliente@email.com"
          textContentType="emailAddress"
          value={form.email}
        />
        <FormTextRow
          keyboardType="number-pad"
          label="CPF"
          onChangeText={(value) => updateField("cpf", value)}
          placeholder="000.000.000-00"
          value={form.cpf}
        />
      </FormSection>
      <FormSection footer="Opcional" title="Endereço">
        <FormTextRow
          keyboardType="number-pad"
          label="CEP"
          onChangeText={(value) => updateField("CEP", value)}
          placeholder="00000-000"
          textContentType="postalCode"
          value={form.CEP}
        />
        <FormTextRow
          label="Rua"
          onChangeText={(value) => updateField("address", value)}
          placeholder="Rua ou avenida"
          textContentType="fullStreetAddress"
          value={form.address}
        />
        <FormTextRow
          keyboardType="number-pad"
          label="Número"
          onChangeText={(value) => updateField("number", value)}
          placeholder="Nº"
          value={form.number}
        />
      </FormSection>
    </FormScreen>
  );
}
