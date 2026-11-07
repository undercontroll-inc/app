import Avatar from "../ui/Avatar";
import { FormNavRow, FormSection } from "../ui/FormRows";
import { displayContact } from "../../utils/orderForm";
import { formatUserName } from "../../utils/orders";

export default function OrderCustomerSection({ client, editable, onSelect }) {
  const name = client ? formatUserName(client) : null;
  const subtitle = client
    ? [displayContact(client.phone), client.cpf ? displayContact(client.cpf) : null].filter(Boolean).join(" · ")
    : null;
  return (
    <FormSection
      footer={client && !editable ? "O cliente não pode ser trocado depois da OS criada." : undefined}
      title="Cliente"
    >
      <FormNavRow
        label="Cliente"
        leading={client ? <Avatar name={name} size={40} /> : null}
        onPress={editable ? onSelect : undefined}
        placeholder="Selecionar cliente"
        subtitle={subtitle}
        testID="order-client"
        value={name}
      />
    </FormSection>
  );
}
